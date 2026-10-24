import type { ZodType } from "zod";

export interface ApiIssue {
  path: string;
  message: string;
}

export interface ValidationFailure {
  error: "validation_failed";
  issues: ApiIssue[];
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; failure: ValidationFailure };

/**
 * One place where an unknown payload becomes either typed data or a 400.
 * The schemas come from `shared/`, so the form and the API cannot disagree.
 */
export function validate<T>(schema: ZodType<T>, value: unknown): ValidationResult<T> {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };

  return {
    ok: false,
    failure: {
      error: "validation_failed",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
  };
}
