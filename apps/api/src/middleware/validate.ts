import type { output, ZodType } from "zod";

import { AppError } from "./errors.js";

export const parseInput = <Schema extends ZodType>(
  schema: Schema,
  input: unknown,
): output<Schema> => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new AppError(
      400,
      "VALIDATION_FAILED",
      issue?.message ?? "The request is invalid.",
    );
  }
  return result.data;
};
