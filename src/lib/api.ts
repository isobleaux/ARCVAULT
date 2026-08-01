import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { UnauthorizedError } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Wrap a route handler so auth failures and validation errors turn into the
 * right status code instead of a 500.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return fail("You need to be signed in.", 401);
      }
      if (error instanceof ZodError) {
        return fail(firstIssue(error), 422, { issues: error.issues });
      }
      console.error("[api] unhandled error", error);
      return fail("Something went wrong on our end.", 500);
    }
  };
}

function firstIssue(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "That request was not valid.";
  const field = issue.path.join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}
