import { z } from "zod";
import { ApiErrorSchema } from "../../../../shared/schemas/api";
import {
  DeviceSchema,
  DeviceSummarySchema,
  PaginatedDevicesSchema,
  type CreateDeviceInput,
  type Device,
  type DeviceSort,
  type DeviceStatus,
  type DeviceSummary,
  type PaginatedDevices,
  type SortOrder,
  type UpdateDeviceInput,
} from "../../../../shared/schemas/device";
import { HistoryResponseSchema, type HistoryPoint } from "../../../../shared/schemas/history";

const API_BASE = "/api";

/** A failed API call, with the server's machine-readable code and field issues. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: { path: string; message: string }[] | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = ApiErrorSchema.safeParse(body);
    const code = parsed.success ? parsed.data.error : "request_failed";
    const message = parsed.success
      ? (parsed.data.message ?? `Request failed with status ${response.status}`)
      : `Request failed with status ${response.status}`;
    throw new ApiError(
      response.status,
      code,
      message,
      parsed.success ? parsed.data.issues : undefined,
    );
  }

  // Responses are validated with the same schemas the server uses — a
  // contract break fails here, loudly, instead of rendering undefined.
  return schema.parse(await response.json());
}

/** The filters/sort shared by the list and the export. */
export interface DeviceFilters {
  q?: string;
  status?: DeviceStatus;
  model?: string;
  sort: DeviceSort;
  order: SortOrder;
}

export interface DeviceListParams extends DeviceFilters {
  page: number;
  pageSize: number;
}

/** The summary is faceted: it takes the name filter, never the status filter. */
export interface DeviceSummaryFilters {
  q?: string;
  model?: string;
}

function filterParams(filters: DeviceFilters): URLSearchParams {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.status) search.set("status", filters.status);
  if (filters.model) search.set("model", filters.model);
  search.set("sort", filters.sort);
  search.set("order", filters.order);
  return search;
}

export function fetchDevices(
  params: DeviceListParams,
  signal?: AbortSignal,
): Promise<PaginatedDevices> {
  const search = filterParams(params);
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  return request(`/devices?${search.toString()}`, PaginatedDevicesSchema, { signal });
}

/**
 * The summary is a server aggregate over the same filters — one `GROUP BY`, not
 * a second copy of the list. It ignores the status filter on purpose (D-019):
 * the carts stay navigation while one status is selected.
 */
export function fetchDeviceSummary(
  filters: DeviceSummaryFilters,
  signal?: AbortSignal,
): Promise<DeviceSummary> {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.model) search.set("model", filters.model);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return request(`/devices/summary${suffix}`, DeviceSummarySchema, { signal });
}

/** The export streams from the server; the browser never has to hold the set. */
export function exportDevicesHref(filters: DeviceFilters): string {
  const search = filterParams(filters);
  search.set("format", "csv");
  return `${API_BASE}/devices?${search.toString()}`;
}

export function fetchDeviceHistory(): Promise<HistoryPoint[]> {
  return request("/devices/history", HistoryResponseSchema);
}

export function createDevice(input: CreateDeviceInput): Promise<Device> {
  return request("/devices", DeviceSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDevice(id: string, input: UpdateDeviceInput): Promise<Device> {
  return request(`/devices/${id}`, DeviceSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = ApiErrorSchema.safeParse(body);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error : "request_failed",
      parsed.success ? (parsed.data.message ?? "Delete failed") : "Delete failed",
    );
  }
}
