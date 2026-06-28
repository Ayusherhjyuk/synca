import * as Y from "yjs";
import { connectDB } from "@/lib/db/mongoose";
import { DocumentModel, DocUpdate } from "@/lib/db/models";
import { toBytes } from "@/lib/binary";

export async function loadDoc(documentId: string): Promise<Y.Doc> {
  await connectDB();
  const doc = new Y.Doc();

  const record = await DocumentModel.findById(documentId).select("state").lean();
  if (record?.state) Y.applyUpdate(doc, toBytes(record.state));

  const pending = await DocUpdate.find({ documentId }).sort({ createdAt: 1 }).lean();
  for (const row of pending) Y.applyUpdate(doc, toBytes(row.update));

  return doc;
}

export async function appendUpdate(documentId: string, update: Uint8Array): Promise<void> {
  await connectDB();
  await DocUpdate.create({ documentId, update: Buffer.from(update), baseRevision: 0 });
}

export async function compact(documentId: string, doc: Y.Doc): Promise<void> {
  await connectDB();

  const cutoff = new Date();
  const state = Buffer.from(Y.encodeStateAsUpdate(doc));

  await DocumentModel.updateOne({ _id: documentId }, { $set: { state }, $inc: { revision: 1 } });
  await DocUpdate.deleteMany({ documentId, createdAt: { $lt: cutoff } });
}

export function encodeSnapshot(doc: Y.Doc): Buffer {
  return Buffer.from(Y.encodeStateAsUpdate(doc));
}
