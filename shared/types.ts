/**
 * The public type surface of the domain. Everything the client and the server
 * exchange is inferred from the zod schemas in ./schemas.
 */
export type {
  CreateDeviceInput,
  Device,
  DeviceListQuery,
  DeviceStatus,
  DeviceSummary,
  UpdateDeviceInput,
} from "./schemas/device";
export type { HistoryPoint } from "./schemas/history";
export type { ApiErrorBody } from "./schemas/api";
