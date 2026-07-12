import { NextRequest } from "next/server";
import { getCurrentUser, type AuthUser } from "@/lib/auth/current-user";
import { can, type AccessLevel, type ModuleKey } from "@/lib/auth/rbac";
import { forbidden, unauthorized } from "./errors";
import { handleError } from "./response";

export type RouteContext<P = Record<string, string>> = {
  params: P;
  auth: AuthUser;
};

type Handler<P> = (req: NextRequest, ctx: RouteContext<P>) => Promise<Response> | Response;

type Guard = { module: ModuleKey; level?: Exclude<AccessLevel, "none"> };

/**
 * Wrap a route handler with authentication, optional RBAC, unwrapped params, and
 * centralized error handling. Keeps route files thin — no try/catch or auth
 * boilerplate leaks into business endpoints.
 */
export function withAuth<P = Record<string, string>>(handler: Handler<P>, guard?: Guard) {
  return async (req: NextRequest, routeCtx?: { params: Promise<P> }): Promise<Response> => {
    try {
      const auth = await getCurrentUser();
      if (!auth) throw unauthorized();

      if (guard && !can(auth.permissions, guard.module, guard.level ?? "view")) {
        throw forbidden(`Your role cannot ${guard.level ?? "view"} ${guard.module}.`);
      }

      const params = (routeCtx?.params ? await routeCtx.params : {}) as P;
      return await handler(req, { params, auth });
    } catch (err) {
      return handleError(err);
    }
  };
}

/** Parse a JSON body, tolerating an empty body. */
export async function readJson<T = unknown>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Safely coerce a query-string value into a known enum, or undefined. */
export function asEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string | null,
): T[keyof T] | undefined {
  if (value && Object.values(enumObj).includes(value)) {
    return value as T[keyof T];
  }
  return undefined;
}
