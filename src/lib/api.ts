import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth/auth";
import { AuthorizationError } from "@/lib/authz";

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function requireUser(): Promise<{ id: string; name: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError("forbidden");
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(err.issues[0]?.message ?? "Invalid input", 400);
      }
      if (err instanceof AuthorizationError) {
        return err.kind === "not_found"
          ? fail("Not found", 404)
          : fail("Forbidden", 403);
      }
      console.error("[api] unhandled error:", err);
      return fail("Internal server error", 500);
    }
  };
}

export async function readJson(req: Request, maxBytes = 1_048_576): Promise<unknown> {
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > maxBytes) {
    throw new AuthorizationError("forbidden");
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new AuthorizationError("forbidden");
  return text ? JSON.parse(text) : {};
}
