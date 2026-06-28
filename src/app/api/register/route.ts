import { connectDB } from "@/lib/db/mongoose";
import { User, DocumentModel } from "@/lib/db/models";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/schemas";
import { buildWelcomeState, WELCOME_TITLE } from "@/lib/yjs/welcome";
import { ok, fail, route, readJson } from "@/lib/api";

export const POST = route(async (req: Request) => {
  const body = registerSchema.parse(await readJson(req, 4096));

  await connectDB();
  const existing = await User.findOne({ email: body.email }).select("_id").lean();
  if (existing) return fail("An account with this email already exists", 409);

  const passwordHash = await hashPassword(body.password);
  const user = await User.create({ name: body.name, email: body.email, passwordHash });

  try {
    await DocumentModel.create({
      title: WELCOME_TITLE,
      ownerId: user._id,
      state: buildWelcomeState(),
    });
  } catch (err) {
    console.error("[register] failed to seed welcome doc:", err);
  }

  return ok({ id: String(user._id), email: user.email }, { status: 201 });
});
