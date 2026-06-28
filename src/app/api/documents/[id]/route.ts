import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, Permission, Version, DocUpdate } from "@/lib/db/models";
import { renameDocumentSchema } from "@/lib/validation/schemas";
import { getUserRole, requireRole } from "@/lib/authz";
import { ok, fail, route, requireUser, readJson } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;

  const role = await getUserRole(id, user.id);
  if (!role) return fail("Not found", 404);

  await connectDB();
  const doc = await DocumentModel.findById(id).select("title ownerId updatedAt").lean();
  if (!doc) return fail("Not found", 404);

  return ok({
    id,
    title: doc.title,
    role,
    isOwner: role === "owner",
    updatedAt: doc.updatedAt,
  });
});

export const PATCH = route(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner", "editor"]);

  const body = renameDocumentSchema.parse(await readJson(req, 4096));
  await connectDB();
  await DocumentModel.updateOne({ _id: id }, { $set: { title: body.title } });

  return ok({ id, title: body.title });
});

export const DELETE = route(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner"]);

  await connectDB();
  await Promise.all([
    DocumentModel.deleteOne({ _id: id }),
    Permission.deleteMany({ documentId: id }),
    Version.deleteMany({ documentId: id }),
    DocUpdate.deleteMany({ documentId: id }),
  ]);

  return ok({ deleted: true });
});
