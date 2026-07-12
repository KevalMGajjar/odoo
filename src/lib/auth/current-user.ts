import "server-only";
import { readSession, type SessionPayload } from "./session";
import { ROLE_PERMISSIONS, type PermissionMap } from "./rbac";

export type AuthUser = SessionPayload & { permissions: PermissionMap };

/**
 * Resolve the current authenticated user and their permissions.
 *
 * Permissions come from the hardcoded ROLE_PERMISSIONS matrix — never from a
 * mutable DB row — so they cannot be escalated at runtime. The user's *role* is
 * what an administrator changes; what each role may do is fixed.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await readSession();
  if (!session) return null;

  return { ...session, permissions: ROLE_PERMISSIONS[session.role] };
}
