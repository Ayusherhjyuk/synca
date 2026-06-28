import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, Permission, User } from "@/lib/db/models";
import { shareSchema, updateRoleSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/authz";
import { ok, fail, route, requireUser, readJson } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner", "editor", "viewer"]);

  await connectDB();
  const doc = await DocumentModel.findById(id).select("ownerId").lean();
  const owner = await User.findById(doc!.ownerId).select("name email").lean();
  const grants = await Permission.find({ documentId: id }).lean();
  const users = await User.find({ _id: { $in: grants.map((g) => g.userId) } })
    .select("name email")
    .lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  return ok({
    collaborators: [
      { userId: String(doc!.ownerId), name: owner?.name, email: owner?.email, role: "owner" },
      ...grants.map((g) => ({
        userId: String(g.userId),
        name: userById.get(String(g.userId))?.name,
        email: userById.get(String(g.userId))?.email,
        role: g.role,
      })),
    ],
  });
});

export const POST = route(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner"]);

  const body = shareSchema.parse(await readJson(req, 4096));
  await connectDB();

  const target = await User.findOne({ email: body.email }).select("_id").lean();
  if (!target) return fail("No user found with that email", 404);
  if (String(target._id) === user.id) return fail("You already own this document", 400);

  await Permission.updateOne(
    { documentId: id, userId: target._id },
    { $set: { role: body.role } },
    { upsert: true },
  );

  return ok({ userId: String(target._id), role: body.role });
});

export const PATCH = route(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner"]);

  const body = updateRoleSchema.parse(await readJson(req, 4096));
  if (body.role === "owner") return fail("Ownership transfer is not supported", 400);

  await connectDB();
  await Permission.updateOne(
    { documentId: id, userId: body.userId },
    { $set: { role: body.role } },
  );
  return ok({ userId: body.userId, role: body.role });
});

export const DELETE = route(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner"]);

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return fail("userId is required", 400);

  await connectDB();
  await Permission.deleteOne({ documentId: id, userId });
  return ok({ revoked: true });
});
