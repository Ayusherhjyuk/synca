import { z } from "zod";
import { ROLES, MAX_SYNC_PAYLOAD_BYTES } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(300).default("Untitled document"),
});

export const renameDocumentSchema = z.object({
  title: z.string().trim().min(1).max(300),
});

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["editor", "viewer"]),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
});

export const createVersionSchema = z.object({
  label: z.string().trim().max(200).optional().default(""),
});

export const syncPushSchema = z.object({
  update: z
    .string()
    .max(Math.ceil((MAX_SYNC_PAYLOAD_BYTES * 4) / 3) + 16, "Payload too large")
    .refine((s) => /^[A-Za-z0-9+/]*={0,2}$/.test(s), "Invalid base64"),
});

export const aiActionSchema = z.object({
  action: z.enum(["summarize", "improve", "continue"]),
  text: z.string().min(1).max(20_000),
});
