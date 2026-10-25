import type { CursorPayload } from "../shared/cursor";
import type {
  Device,
  DeviceSort,
  DeviceStatus,
  DeviceSummary,
  SortOrder,
} from "../shared/schemas/device";

/**
 * The filtering/sorting/keyset logic lives here, in pure functions, so the
 * repository is a thin in-memory stand-in for what would be a SQL `WHERE /
 * ORDER BY / LIMIT` plus a `GROUP BY status`. Keeping it out of the route is
 * what makes the "swap the repository for Postgres" seam real.
 */

export interface DeviceFilters {
  q?: string | undefined;
  status?: DeviceStatus | undefined;
  model?: string | undefined;
}

export interface OrderedDeviceQuery extends DeviceFilters {
  sort: DeviceSort;
  order: SortOrder;
}

/** `variant` matches the old `localeCompare` behaviour for accented names. */
const collator = new Intl.Collator("en", { sensitivity: "variant" });

export function sortKeyOf(device: Device, sort: DeviceSort): string {
  switch (sort) {
    case "name":
      return device.name;
    case "model":
      return device.model;
    case "status":
      return device.status;
  }
}

export function matchesFilters(device: Device, filters: DeviceFilters): boolean {
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    if (!device.name.toLowerCase().includes(needle)) return false;
  }
  if (filters.status && device.status !== filters.status) return false;
  if (filters.model && device.model !== filters.model) return false;
  return true;
}

export function filterDevices(devices: Iterable<Device>, filters: DeviceFilters): Device[] {
  const matched: Device[] = [];
  for (const device of devices) {
    if (matchesFilters(device, filters)) {
      matched.push(device);
    }
  }
  return matched;
}

/**
 * The sort ends in `id` so it is a total order — otherwise two devices with the
 * same name could swap places between requests and a row would appear on two
 * pages (or none). `id` flips with the direction for the same reason.
 */
export function compareDevices(
  left: Device,
  right: Device,
  sort: DeviceSort,
  order: SortOrder,
): number {
  const direction = order === "asc" ? 1 : -1;
  const key = collator.compare(sortKeyOf(left, sort), sortKeyOf(right, sort));
  if (key !== 0) return key * direction;
  return collator.compare(left.id, right.id) * direction;
}

export function sortDevices(devices: Device[], sort: DeviceSort, order: SortOrder): Device[] {
  return devices.sort((left, right) => compareDevices(left, right, sort, order));
}

export interface DeviceWindow {
  items: Device[];
  total: number;
  totalPages: number;
}

export function offsetWindow(sorted: Device[], page: number, pageSize: number): DeviceWindow {
  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total, totalPages };
}

/**
 * Facet counts: the status filter is deliberately **not** applied. The cards
 * are navigation — "23 online, 15 in meeting" — and they must keep describing
 * the whole matching set while one status is selected (D-019). The exact count
 * for the current view comes from the list response's `total`.
 */
export function facetSummary(devices: Iterable<Device>, filters: DeviceFilters): DeviceSummary {
  const summary: DeviceSummary = {
    total: 0,
    online: 0,
    inMeeting: 0,
    offline: 0,
    deactivated: 0,
  };
  const scopedFilters: DeviceFilters = { q: filters.q, model: filters.model };
  for (const device of devices) {
    if (matchesFilters(device, scopedFilters)) {
      summary.total += 1;
      summary[device.status] += 1;
    }
  }
  return summary;
}

function normalizeFilters(filters: OrderedDeviceQuery): {
  q: string;
  status: string;
  model: string;
} {
  return {
    q: filters.q ?? "",
    status: filters.status ?? "",
    model: filters.model ?? "",
  };
}

/** A cursor is only valid for the query that issued it. */
export function cursorMatchesQuery(payload: CursorPayload, filters: OrderedDeviceQuery): boolean {
  const normalized = normalizeFilters(filters);
  return (
    payload.sort === filters.sort &&
    payload.order === filters.order &&
    payload.q === normalized.q &&
    payload.status === normalized.status &&
    payload.model === normalized.model
  );
}

function isAfterCursor(
  device: Device,
  payload: CursorPayload,
  sort: DeviceSort,
  order: SortOrder,
): boolean {
  const key = collator.compare(sortKeyOf(device, sort), payload.key);
  if (key === 0) {
    const id = collator.compare(device.id, payload.id);
    return order === "asc" ? id > 0 : id < 0;
  }
  return order === "asc" ? key > 0 : key < 0;
}

export interface KeysetWindow {
  items: Device[];
  last: Device | undefined;
  hasMore: boolean;
}

/** `sorted` is already filtered and ordered by the caller. */
export function keysetWindow(
  sorted: Device[],
  payload: CursorPayload | null,
  filters: OrderedDeviceQuery,
  limit: number,
): KeysetWindow {
  const rest = payload
    ? sorted.filter((device) => isAfterCursor(device, payload, filters.sort, filters.order))
    : sorted;
  const items = rest.slice(0, limit);
  return { items, last: items.at(-1), hasMore: rest.length > limit };
}
