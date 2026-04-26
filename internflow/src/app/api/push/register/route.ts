import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/push/register
 * Registers a device FCM token for the authenticated user.
 * Body: { token: string, platform: 'android' | 'ios' | 'web' }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { token, platform } = await request.json();

    if (!token || !platform) {
      return NextResponse.json({ error: "token and platform are required" }, { status: 400 });
    }

    // Upsert: check if token already exists for this user
    const [existing] = await db
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, session.user.id), eq(deviceTokens.token, token)))
      .limit(1);

    if (existing) {
      // Update last used
      await db
        .update(deviceTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(deviceTokens.id, existing.id));
    } else {
      await db.insert(deviceTokens).values({
        userId: session.user.id,
        token,
        platform,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token registration error:", error);
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }
}
