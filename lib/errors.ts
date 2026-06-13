import { ZodError } from "zod";

import { AppErrorCategory, AppErrorPayload } from "@/lib/types";

export class AppError extends Error {
  readonly category: AppErrorCategory;
  readonly details?: string;
  readonly statusCode: number;

  constructor(category: AppErrorCategory, message: string, statusCode = 400, details?: string) {
    super(message);
    this.name = "AppError";
    this.category = category;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON(): AppErrorPayload {
    return {
      category: this.category,
      message: this.message,
      details: this.details
    };
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      "validation",
      error.issues[0]?.message ?? "Input tidak valid.",
      400
    );
  }

  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      console.error("[internal-error]", error);
      return new AppError(
        "internal",
        "Terjadi kesalahan server. Silakan coba lagi.",
        500
      );
    }
    return new AppError("internal", error.message, 500);
  }

  return new AppError("internal", "Unexpected server error.", 500);
}
