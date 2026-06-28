import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, Permission } from "@/lib/db/models";
import { DashboardClient, type DocCard } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await connectDB();
  const owned = await DocumentModel.find({ ownerId: userId })
    .select("title updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const grants = await Permission.find({ userId }).select("documentId role").lean();
  const sharedDocs = await DocumentModel.find({ _id: { $in: grants.map((g) => g.documentId) } })
    .select("title updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  const roleByDoc = new Map(grants.map((g) => [String(g.documentId), g.role]));

  const documents: DocCard[] = [
    ...owned.map((d) => ({
      id: String(d._id),
      title: d.title,
      role: "owner" as const,
      updatedAt: (d.updatedAt as Date).toISOString(),
    })),
    ...sharedDocs.map((d) => ({
      id: String(d._id),
      title: d.title,
      role: (roleByDoc.get(String(d._id)) ?? "viewer") as DocCard["role"],
      updatedAt: (d.updatedAt as Date).toISOString(),
    })),
  ];

  return <DashboardClient documents={documents} userName={session.user.name ?? "You"} />;
}
