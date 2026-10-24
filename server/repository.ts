import { encodeCursor, type CursorPayload } from "../shared/cursor";
import type {
  CreateDeviceInput,
  CursorDevices,
  Device,
  DeviceCursorQuery,
  DeviceExportQuery,
  DeviceListQuery,
  DeviceSummary,
  PaginatedDevices,
  UpdateDeviceInput,
} from "../shared/schemas/device";
import {
  facetSummary,
  filterDevices,
  keysetWindow,
  offsetWindow,
  sortDevices,
  sortKeyOf,
} from "./querying";
import { seededDevices } from "./seed/devices";

export interface DeviceRepository {
  list(): Device[];
  findById(id: string): Device | undefined;
  findByName(name: string): Device | undefined;
  create(input: CreateDeviceInput): Device;
  update(id: string, input: UpdateDeviceInput): Device | undefined;
  remove(id: string): boolean;
  reset(): void;
  /** Offset mode: a window plus the facts about the whole result. */
  query(query: DeviceListQuery): PaginatedDevices;
  /** Cursor mode: no offset scan and no `COUNT(*)` unless asked. */
  queryAfter(query: DeviceCursorQuery, cursor: CursorPayload | null): CursorDevices;
  /** Facet counts for the summary cards (status is ignored by design). */
  summary(filters: { q?: string | undefined; model?: string | undefined }): DeviceSummary;
  /** Every matching row, ordered — used by the CSV export in bounded batches. */
  all(query: DeviceExportQuery): Device[];
}

/**
 * An in-memory store. The interface is the seam: swapping this for Postgres
 * later means reimplementing this file, nothing else.
 */
export function createDeviceRepository(seed: Device[]): DeviceRepository {
  let devices: Device[] = [];
  let nextId = 1;

  const load = () => {
    devices = seed.map((device) => ({ ...device }));
    nextId = devices.length + 1;
  };
  load();

  const nextDeviceId = () => `dev-${String(nextId++).padStart(3, "0")}`;

  return {
    //no sorting or pagination seperate endpoints for aggr vs result sets?
    list: () => devices.map((device) => ({ ...device })),
    findById: (id) => devices.find((device) => device.id === id),
    findByName: (name) =>
      devices.find((device) => device.name.toLowerCase() === name.trim().toLowerCase()),
    create: (input) => {
      const device: Device = {
        id: nextDeviceId(),
        name: input.name.trim(),
        model: input.model.trim(),
        description: input.description.trim(),
        status: input.status,
      };
      devices = [...devices, device];
      return device;
    },
    update: (id, input) => {
      const current = devices.find((device) => device.id === id);
      if (!current) return undefined;
      const updated: Device = {
        ...current,
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.model === undefined ? {} : { model: input.model.trim() }),
        ...(input.description === undefined ? {} : { description: input.description.trim() }),
        ...(input.status === undefined ? {} : { status: input.status }),
      };
      devices = devices.map((device) => (device.id === id ? updated : device));
      return updated;
    },
    remove: (id) => {
      const before = devices.length;
      devices = devices.filter((device) => device.id !== id);
      return devices.length < before;
    },
    reset: load,

    query: (query) => {
      const sorted = sortDevices(filterDevices(devices, query), query.sort, query.order);
      const { items, total, totalPages } = offsetWindow(sorted, query.page, query.pageSize);
      return {
        items: items.map((device) => ({ ...device })),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    },

    queryAfter: (query, cursor) => {
      const sorted = sortDevices(filterDevices(devices, query), query.sort, query.order);
      const { items, last, hasMore } = keysetWindow(sorted, cursor, query, query.limit);
      const nextCursor =
        hasMore && last
          ? encodeCursor({
              v: 1,
              sort: query.sort,
              order: query.order,
              q: query.q ?? "",
              status: query.status ?? "",
              model: query.model ?? "",
              key: sortKeyOf(last, query.sort),
              id: last.id,
            })
          : null;
      return { items: items.map((device) => ({ ...device })), nextCursor };
    },

    summary: (filters) => facetSummary(devices, filters),

    all: (query) =>
      sortDevices(filterDevices(devices, query), query.sort, query.order).map((device) => ({
        ...device,
      })),
  };
}

export const deviceRepository = createDeviceRepository(seededDevices);
