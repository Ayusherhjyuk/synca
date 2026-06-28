import { signRealtimeToken } from "@/lib/auth/realtime-token";
import { ok, route, requireUser } from "@/lib/api";

export const GET = route(async () => {
  const user = await requireUser();
  const token = await signRealtimeToken({
    sub: user.id,
    name: user.name,
    email: user.email,
  });
  return ok({ token });
});
