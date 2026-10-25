import { encodeCursor, type CursorPayload } from "../shared/cursor";
import type {
  CreateDeviceInput,
  CursorDevices,
  Device,
  DeviceCursorQuery,
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
import { loadSeedDevices } from "./seed/devices";

export interface DeviceRepository {
  findById(id: string): Device | undefined;
  findByName(name: string): Device | undefined;
  create(input: CreateDeviceInput): Device;
  update(id: string, input: UpdateDeviceInput): Device | undefined;
  remove(id: string): boolean;
  /** Offset mode: a window plus the facts about the whole result. */
  query(query: DeviceListQuery): PaginatedDevices;
  /** Cursor mode: no offset scan and no `COUNT(*)` unless asked. */
  queryAfter(query: DeviceCursorQuery, cursor: CursorPayload | null): CursorDevices;
  /** Facet counts for the summary cards (status is ignored by design). */
  summary(filters: { q?: string | undefined; model?: string | undefined }): DeviceSummary;
}

/**
 * A Map-backed in-memory store that takes direct ownership of the initial
 * seed records without duplicating the dataset or shallow-cloning rows on read.
 */
export function createDeviceRepository(initialDevices: Device[]): DeviceRepository {
  const byId = new Map<string, Readonly<Device>>();
  for (const device of initialDevices) {
    byId.set(device.id, device);
  }
  let nextId = byId.size + 1;

  const nextDeviceId = () => `dev-${String(nextId++).padStart(3, "0")}`;

  return {
    findById: (id) => byId.get(id),
    findByName: (name) => {
      const target = name.trim().toLowerCase();
      for (const device of byId.values()) {
        if (device.name.toLowerCase() === target) {
          return device;
        }
      }
      return undefined;
    },
    create: (input) => {
      const device: Device = {
        id: nextDeviceId(),
        name: input.name.trim(),
        model: input.model.trim(),
        description: input.description.trim(),
        status: input.status,
      };
      byId.set(device.id, device);
      return device;
    },
    update: (id, input) => {
      const current = byId.get(id);
      if (!current) return undefined;
      const updated: Device = {
        ...current,
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.model === undefined ? {} : { model: input.model.trim() }),
        ...(input.description === undefined ? {} : { description: input.description.trim() }),
        ...(input.status === undefined ? {} : { status: input.status }),
      };
      byId.set(id, updated);
      return updated;
    },
    remove: (id) => byId.delete(id),

    query: (query) => {
      const sorted = sortDevices(filterDevices(byId.values(), query), query.sort, query.order);
      const { items, total, totalPages } = offsetWindow(sorted, query.page, query.pageSize);
      return {
        items,
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      };
    },

    queryAfter: (query, cursor) => {
      const sorted = sortDevices(filterDevices(byId.values(), query), query.sort, query.order);
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
      return { items, nextCursor };
    },

    summary: (filters) => facetSummary(byId.values(), filters),
  };
}

export const deviceRepository = createDeviceRepository(loadSeedDevices());
