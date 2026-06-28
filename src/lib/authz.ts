import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, Permission } from "@/lib/db/models";
import { type Role } from "@/lib/constants";

export async function getUserRole(documentId: string, userId: string): Promise<Role | null> {
  await connectDB();

  const doc = await DocumentModel.findById(documentId).select("ownerId").lean();
  if (!doc) return null;

  if (String(doc.ownerId) === String(userId)) return "owner";

  const perm = await Permission.findOne({ documentId, userId }).select("role").lean();
  return (perm?.role as Role) ?? null;
}

export async function requireRole(
  documentId: string,
  userId: string,
  allowed: Role[],
): Promise<Role> {
  const role = await getUserRole(documentId, userId);
  if (!role || !allowed.includes(role)) {
    throw new AuthorizationError(role ? "forbidden" : "not_found");
  }
  return role;
}

export class AuthorizationError extends Error {
  constructor(public kind: "forbidden" | "not_found") {
    super(kind);
    this.name = "AuthorizationError";
  }
}
