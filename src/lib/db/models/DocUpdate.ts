import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DocUpdateSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    update: { type: Buffer, required: true },
    baseRevision: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

DocUpdateSchema.index({ documentId: 1, createdAt: 1 });

export type DocUpdateDoc = InferSchemaType<typeof DocUpdateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DocUpdate: Model<DocUpdateDoc> =
  (mongoose.models.DocUpdate as Model<DocUpdateDoc>) ||
  mongoose.model<DocUpdateDoc>("DocUpdate", DocUpdateSchema);
