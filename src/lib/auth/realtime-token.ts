import { SignJWT, jwtVerify } from "jose";
import { REALTIME_TOKEN_TTL_SECONDS } from "@/lib/constants";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type RealtimeClaims = { sub: string; name: string; email: string };

export async function signRealtimeToken(claims: RealtimeClaims): Promise<string> {
  return new SignJWT({ name: claims.name, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${REALTIME_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyRealtimeToken(token: string): Promise<RealtimeClaims> {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (!payload.sub) throw new Error("Missing subject");
  return {
    sub: payload.sub,
    name: (payload.name as string) ?? "",
    email: (payload.email as string) ?? "",
  };
}
