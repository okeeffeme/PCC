import { z } from "zod";

/** The four states a device can be in — exactly the values in devices.json. */
export const DEVICE_STATUSES = ["online", "inMeeting", "offline", "deactivated"] as const;

export const DeviceStatusSchema = z.enum(DEVICE_STATUSES);
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;

/** The five hardware models present in the seed data. */
export const DEVICE_MODELS = [
  "Neat Bar Pro",
  "Logitech Rally Bar",
  "Cisco Webex Room Kit",
  "Poly Studio X50",
  "Crestron Flex",
] as const;

/** A device as served by the API. */
export const DeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1),
  description: z.string(),
  status: DeviceStatusSchema,
});
export type Device = z.infer<typeof DeviceSchema>;

/** Payload for creating a device. The client form and the server validate with this exact schema. */
export const CreateDeviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(60, "Model must be 60 characters or fewer"),
  description: z.string().trim().max(280, "Description must be 280 characters or fewer"),
  status: DeviceStatusSchema,
});
export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;

export const UpdateDeviceSchema = CreateDeviceSchema.partial();
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;

/** Bounds that keep every response a bounded payload. */
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const MAX_CURSOR_LIMIT = 500;
export const PAGE_SIZES = [25, 50, 100] as const;

export const DeviceSortSchema = z.enum(["name", "model", "status"]);
export type DeviceSort = z.infer<typeof DeviceSortSchema>;

export const SortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof SortOrderSchema>;

/** Filters shared by the list, the cursor mode, the summary and the export. */
const filterShape = {
  q: z.string().trim().max(100).optional(),
  status: DeviceStatusSchema.optional(),
  model: z.string().trim().max(60).optional(),
  sort: DeviceSortSchema.default("name"),
  order: SortOrderSchema.default("asc"),
};

/** Offset pagination — what the dashboard uses: jump to a page, show totals. */
export const DeviceListQuerySchema = z.object({
  ...filterShape,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type DeviceListQuery = z.infer<typeof DeviceListQuerySchema>;

/**
 * Cursor (keyset) pagination — what exports/integrations use. The cursor is an
 * opaque token that records the sort, the filters and the last row, so the
 * next page can be found with an index range instead of an offset scan.
 */
export const DeviceCursorQuerySchema = z.object({
  ...filterShape,
  /** Omitted on the first request — the first page is just "start at the beginning". */
  cursor: z.string().min(1).max(2_000).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_CURSOR_LIMIT).default(100),
});
export type DeviceCursorQuery = z.infer<typeof DeviceCursorQuerySchema>;

/** A flat export accepts the same filters as the list, without paging. */
export const DeviceExportQuerySchema = z.object({ ...filterShape });
export type DeviceExportQuery = z.infer<typeof DeviceExportQuerySchema>;

/** Facet counts deliberately ignore `status` — see D-019. */
export const DeviceSummaryQuerySchema = z.object({
  q: filterShape.q,
  model: filterShape.model,
});
export type DeviceSummaryQuery = z.infer<typeof DeviceSummaryQuerySchema>;

/** The offset-mode response: a window plus the facts about the whole result. */
export const PaginatedDevicesSchema = z.object({
  items: z.array(DeviceSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginatedDevices = z.infer<typeof PaginatedDevicesSchema>;

/** The cursor-mode response: no total (counting is the expensive half). */
export const CursorDevicesSchema = z.object({
  items: z.array(DeviceSchema),
  nextCursor: z.string().nullable(),
});
export type CursorDevices = z.infer<typeof CursorDevicesSchema>;

/** Counts derived from the device list — never a separate source of truth. */
export const DeviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  online: z.number().int().nonnegative(),
  inMeeting: z.number().int().nonnegative(),
  offline: z.number().int().nonnegative(),
  deactivated: z.number().int().nonnegative(),
});
export type DeviceSummary = z.infer<typeof DeviceSummarySchema>;
