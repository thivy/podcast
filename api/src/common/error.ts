import { ZodError } from "zod";

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: ZodError,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      error: "Validation Error",
      message: this.message,
      details:
        this.zodError?.issues?.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })) || [],
    };
  }
}
