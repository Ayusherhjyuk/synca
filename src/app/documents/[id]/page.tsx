import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel } from "@/lib/db/models";
import { getUserRole } from "@/lib/authz";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const role = await getUserRole(id, session.user.id);
  if (!role) notFound();

  await connectDB();
  const doc = await DocumentModel.findById(id).select("title").lean();
  if (!doc) notFound();

  return (
    <EditorWorkspace
      documentId={id}
      initialTitle={doc.title}
      role={role}
      userName={session.user.name ?? session.user.email ?? "Anonymous"}
    />
  );
}
