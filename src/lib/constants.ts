export const ROLES = ["owner", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export function canWrite(role: Role | null | undefined): boolean {
  return role === "owner" || role === "editor";
}

export function canManage(role: Role | null | undefined): boolean {
  return role === "owner";
}

export const MAX_SYNC_PAYLOAD_BYTES = Number(process.env.MAX_SYNC_PAYLOAD_BYTES ?? 1_048_576);

export const PERSIST_DEBOUNCE_MS = 3_000;

export const REALTIME_TOKEN_TTL_SECONDS = 60 * 60;

export const YJS_FRAGMENT = "default";
