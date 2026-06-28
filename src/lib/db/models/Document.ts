import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300, default: "Untitled document" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    state: { type: Buffer, default: null },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type DocumentDoc = InferSchemaType<typeof DocumentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DocumentModel: Model<DocumentDoc> =
  (mongoose.models.Document as Model<DocumentDoc>) ||
  mongoose.model<DocumentDoc>("Document", DocumentSchema);
