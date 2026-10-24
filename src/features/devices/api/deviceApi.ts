import { z } from "zod";
import { ApiErrorSchema } from "../../../../shared/schemas/api";
import {
  DeviceSchema,
  DeviceSummarySchema,
  type CreateDeviceInput,
  type Device,
  type DeviceSummary,
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

export function fetchDevices(signal?: AbortSignal): Promise<Device[]> {
  return request("/devices", z.array(DeviceSchema), { signal });
}

/**
 * The summary is derived from the cached list in the UI (see `summarizeDevices`),
 * so the counts and the rows can never disagree. This endpoint stays part of the
 * public API for anything that only needs the numbers.
 */
export function fetchDeviceSummary(): Promise<DeviceSummary> {
  return request("/devices/summary", DeviceSummarySchema);
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
