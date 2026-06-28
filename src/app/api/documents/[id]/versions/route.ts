import { connectDB } from "@/lib/db/mongoose";
import { Version } from "@/lib/db/models";
import { createVersionSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/authz";
import { loadDoc, encodeSnapshot } from "@/lib/yjs/persistence";
import { previewFromState } from "@/lib/yjs/preview";
import { ok, route, requireUser, readJson } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner", "editor", "viewer"]);

  await connectDB();
  const versions = await Version.find({ documentId: id })
    .select("label summary createdByName createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return ok({
    versions: versions.map((v) => ({
      id: String(v._id),
      label: v.label,
      summary: v.summary,
      author: v.createdByName,
      createdAt: v.createdAt,
    })),
  });
});

export const POST = route(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;
  await requireRole(id, user.id, ["owner", "editor"]);

  const body = createVersionSchema.parse(await readJson(req, 4096));

  const doc = await loadDoc(id);
  const state = encodeSnapshot(doc);
  const preview = previewFromState(state);
  doc.destroy();

  await connectDB();
  const version = await Version.create({
    documentId: id,
    label: body.label,
    summary: preview,
    state,
    createdBy: user.id,
    createdByName: user.name,
  });

  return ok(
    {
      id: String(version._id),
      label: version.label,
      summary: version.summary,
      author: user.name,
      createdAt: version.createdAt,
    },
    { status: 201 },
  );
});
