import { z } from "zod";

/** Every non-2xx response from the API has this shape. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  issues: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
