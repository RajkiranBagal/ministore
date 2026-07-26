import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate-limit: max 5 signups per minute per IP.
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
  // 1. Validate the JSON body (safeParse never throws).
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  // 2. Reject duplicate emails (the DB's @unique is the ultimate guard).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 } // Conflict
    );
  }

  // 3. Hash the password — never store plaintext. 10 = salt rounds (cost).
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Create the user.
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // 5. Return SAFE fields only — never the passwordHash.
  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 } // Created
  );
}
