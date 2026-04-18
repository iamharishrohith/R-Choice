"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecentNotifications() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", data: [] };
  }

  try {
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(10);
      
    return { data: list };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { error: "Failed to fetch notifications", data: [] };
  }
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    // Ownership check: only mark notifications belonging to the current user
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));
      
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    return { error: "Failed to mark as read" };
  }
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.user.id));
      
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read", error);
    return { error: "Failed to update" };
  }
}
