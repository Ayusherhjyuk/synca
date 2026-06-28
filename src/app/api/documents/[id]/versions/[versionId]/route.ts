import { connectDB } from "@/lib/db/mongoose";
import { Version } from "@/lib/db/models";
import { requireRole } from "@/lib/authz";
import { ok, fail, route, requireUser } from "@/lib/api";
import { toBuffer } from "@/lib/binary";

type Params = { params: Promise<{ id: string; versionId: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id, versionId } = await params;
  await requireRole(id, user.id, ["owner", "editor", "viewer"]);

  await connectDB();
  const version = await Version.findOne({ _id: versionId, documentId: id })
    .select("state label createdAt")
    .lean();
  if (!version) return fail("Version not found", 404);

  return ok({
    id: versionId,
    label: version.label,
    createdAt: version.createdAt,
    state: toBuffer(version.state).toString("base64"),
  });
});
