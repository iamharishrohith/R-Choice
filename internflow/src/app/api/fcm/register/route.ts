import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, deviceType } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Check if token already exists
    const existing = await db
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, session.user.id), eq(deviceTokens.token, token)))
      .limit(1);

    if (existing.length > 0) {
      // Update last used time
      await db
        .update(deviceTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(deviceTokens.id, existing[0].id));
      
      return NextResponse.json({ success: true, updated: true });
    }

    // Check if token exists for another user (e.g. they switched accounts on the same device)
    // Optional: we can delete it from other users if it's unique to a device, 
    // but typically tokens are unique to the app instance.
    await db.delete(deviceTokens).where(eq(deviceTokens.token, token));

    // Insert new token
    await db.insert(deviceTokens).values({
      userId: session.user.id,
      token,
      platform: deviceType || "web",
    });

    return NextResponse.json({ success: true, created: true });
  } catch (error) {
    console.error("Failed to register FCM token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
