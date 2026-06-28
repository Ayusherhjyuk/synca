import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/lib/constants";

const PermissionSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true },
);

PermissionSchema.index({ documentId: 1, userId: 1 }, { unique: true });

export type PermissionDoc = InferSchemaType<typeof PermissionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Permission: Model<PermissionDoc> =
  (mongoose.models.Permission as Model<PermissionDoc>) ||
  mongoose.model<PermissionDoc>("Permission", PermissionSchema);
