import { createHmac } from "node:crypto";
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const secret = process.env.JWT_SECRET!;
const now = Math.floor(Date.now() / 60000) * 60; // minute precision, like Coolify
const mk = (role: string) => {
  const h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64(JSON.stringify({ iss: "supabase", iat: now, exp: now + 100 * 365 * 24 * 3600, role }));
  const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
};
console.log(`ANON=${mk("anon")}`);
console.log(`SERVICE=${mk("service_role")}`);
