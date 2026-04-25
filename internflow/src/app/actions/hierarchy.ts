"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorityMappings, users, userRoleEnum } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function fetchAuthorityMappings() {
  try {
    return await db.select().from(authorityMappings);
  } catch {
    return [];
  }
}

export async function fetchStaffByRole(role: string) {
  try {
    const validRoles = userRoleEnum.enumValues as string[];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role");
    }
    return await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.role, role as "student" | "tutor" | "placement_coordinator" | "hod" | "dean" | "placement_officer" | "principal" | "company" | "alumni" | "coe" | "mcr"));
  } catch {
    return [];
  }
}

export async function upsertMapping(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!["placement_officer", "principal"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const department = formData.get("department") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const section = (formData.get("section") as string) || "A";
  const tutorId = (formData.get("tutorId") as string) || null;
  const hodId = (formData.get("hodId") as string) || null;
  const deanId = (formData.get("deanId") as string) || null;
  const coordinatorId = (formData.get("coordinatorId") as string) || null;

  if (!department || !year) {
    return { error: "Department and Year are required." };
  }

  try {
    // Check if a mapping for this dept+year+section exists
    const existing = await db
      .select()
      .from(authorityMappings)
      .where(
        and(
          eq(authorityMappings.department, department),
          eq(authorityMappings.year, year),
          eq(authorityMappings.section, section)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(authorityMappings)
        .set({
          tutorId,
          hodId,
          deanId,
          placementCoordinatorId: coordinatorId,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(authorityMappings.id, existing[0].id));
    } else {
      // Insert
      await db.insert(authorityMappings).values({
        department,
        year,
        section,
        tutorId,
        hodId,
        deanId,
        placementCoordinatorId: coordinatorId,
        updatedBy: session.user.id,
      });
    }

    revalidatePath("/settings/hierarchy");
    return { success: true };
  } catch (error: unknown) {
    console.error("Hierarchy mapping error:", error);
    return { error: `Failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteMapping(mappingId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!["placement_officer", "principal"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  try {
    await db.delete(authorityMappings).where(eq(authorityMappings.id, mappingId));
    revalidatePath("/settings/hierarchy");
    return { success: true };
  } catch (error: unknown) {
    return { error: `Failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}
