import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyRegistrationLinks } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
  }

  try {
    const [link] = await db
      .select()
      .from(companyRegistrationLinks)
      .where(
        and(
          eq(companyRegistrationLinks.token, token),
          eq(companyRegistrationLinks.isUsed, false),
          gt(companyRegistrationLinks.expiresAt, new Date())
        )
      )
      .limit(1);

    return NextResponse.json({ valid: !!link });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
