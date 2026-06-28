import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const VersionSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    label: { type: String, trim: true, maxlength: 200, default: "" },
    summary: { type: String, default: "" },
    state: { type: Buffer, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

VersionSchema.index({ documentId: 1, createdAt: -1 });

export type VersionDoc = InferSchemaType<typeof VersionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Version: Model<VersionDoc> =
  (mongoose.models.Version as Model<VersionDoc>) ||
  mongoose.model<VersionDoc>("Version", VersionSchema);
