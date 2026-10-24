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

/** Optional server-side filters. The dashboard itself filters in the client. */
export const DeviceListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: DeviceStatusSchema.optional(),
  model: z.string().trim().optional(),
  sort: z.enum(["name", "model", "status"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type DeviceListQuery = z.infer<typeof DeviceListQuerySchema>;

/** Counts derived from the device list — never a separate source of truth. */
export const DeviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  online: z.number().int().nonnegative(),
  inMeeting: z.number().int().nonnegative(),
  offline: z.number().int().nonnegative(),
  deactivated: z.number().int().nonnegative(),
});
export type DeviceSummary = z.infer<typeof DeviceSummarySchema>;
