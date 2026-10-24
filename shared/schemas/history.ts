import { z } from "zod";

/** One month of fleet status counts. */
export const HistoryPointSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "period must look like YYYY-MM"),
  online: z.number().int().nonnegative(),
  inMeeting: z.number().int().nonnegative(),
  offline: z.number().int().nonnegative(),
  deactivated: z.number().int().nonnegative(),
});
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;

export const HistoryResponseSchema = z.array(HistoryPointSchema);
