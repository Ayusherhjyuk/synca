import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, Permission } from "@/lib/db/models";
import { createDocumentSchema } from "@/lib/validation/schemas";
import { ok, route, requireUser, readJson } from "@/lib/api";

export const GET = route(async () => {
  const user = await requireUser();
  await connectDB();

  const owned = await DocumentModel.find({ ownerId: user.id })
    .select("title updatedAt revision")
    .sort({ updatedAt: -1 })
    .lean();

  const grants = await Permission.find({ userId: user.id }).select("documentId role").lean();
  const sharedIds = grants.map((g) => g.documentId);
  const sharedDocs = await DocumentModel.find({ _id: { $in: sharedIds } })
    .select("title updatedAt revision ownerId")
    .sort({ updatedAt: -1 })
    .lean();

  const roleByDoc = new Map(grants.map((g) => [String(g.documentId), g.role]));

  return ok({
    owned: owned.map((d) => ({
      id: String(d._id),
      title: d.title,
      role: "owner" as const,
      updatedAt: d.updatedAt,
    })),
    shared: sharedDocs.map((d) => ({
      id: String(d._id),
      title: d.title,
      role: roleByDoc.get(String(d._id)) ?? "viewer",
      updatedAt: d.updatedAt,
    })),
  });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = createDocumentSchema.parse(await readJson(req, 4096));

  await connectDB();
  const doc = await DocumentModel.create({ title: body.title, ownerId: user.id });

  return ok({ id: String(doc._id), title: doc.title }, { status: 201 });
});
