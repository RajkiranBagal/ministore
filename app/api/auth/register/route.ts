// ─── POST /api/auth/register — create an account ────────────────────────────
// Auth.js handles signing IN, but it has no opinion about how accounts get
// created, so registration is ours to write. The signup page calls this and
// then immediately calls signIn(), so a new user lands logged in.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // ── Rate limit FIRST ──────────────────────────────────────────────────────
  // Unlike /api/orders, this endpoint is public — there's no session to check,
  // so throttling is the outermost gate. It's what stops a script creating
  // thousands of junk accounts. Max 5 per minute per IP.
  //
  // This is the only handler that sets `Retry-After`. It's the correct HTTP
  // signal for a 429: it tells the client exactly how many seconds to wait
  // instead of leaving it to guess or hammer.
  const limit = rateLimit(`signup:${clientIp(request)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  // 1. Validate the JSON body. `.catch(() => null)` because request.json()
  //    throws on malformed input; safeParse then rejects null cleanly as a 400
  //    rather than letting an exception become a 500.
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  // 2. Reject duplicate emails. This check is for the friendly error message —
  //    it is NOT the real guarantee. Two simultaneous signups could both pass
  //    this line before either inserts (a check-then-act race). The database's
  //    `@unique` constraint on User.email is what actually prevents duplicates;
  //    the loser of that race gets a Prisma unique-violation error.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 } // Conflict — the request is valid but clashes with state
    );
  }

  // 3. Hash the password. Never store plaintext, and never use a fast hash
  //    like MD5/SHA-256 — those are built for speed, which is exactly what an
  //    attacker with a stolen database wants. bcrypt is deliberately slow and
  //    salts each hash, so identical passwords produce different hashes and
  //    rainbow tables are useless.
  //
  //    10 = the cost factor, i.e. 2^10 iterations. Raising it by 1 doubles the
  //    work for both us and an attacker; 10–12 is the usual balance.
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Create the user. Note `name` may be undefined — the column is nullable.
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // 5. Return SAFE fields only. Never echo back `passwordHash` — spreading the
  //    whole `user` object here would ship the hash to the browser. Listing
  //    fields explicitly makes that mistake impossible.
  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 } // Created
  );
}

// NOTE: this file hand-rolls NextResponse.json for its errors, while
// app/api/orders/route.ts uses the shared errorResponse() helper from
// lib/api-response.ts. The helper is the intended pattern — this route predates
// it. Worth unifying if you touch this file.
