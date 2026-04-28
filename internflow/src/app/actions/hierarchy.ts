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
  // Allow Dean, HOD, placement_officer, principal
  if (!["placement_officer", "principal", "dean", "hod"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string | null;
  const school = formData.get("school") as string;
  const section = formData.get("section") as string;
  const course = formData.get("course") as string;
  const programType = formData.get("programType") as string;
  const department = formData.get("department") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const tutorId = (formData.get("tutorId") as string) || null;
  
  // If HOD, they can only edit PC/Tutor, Dean/HOD remains unchanged
  // In frontend we disable the inputs, but here we can rely on existing if present
  let hodId = (formData.get("hodId") as string) || null;
  let deanId = (formData.get("deanId") as string) || null;
  const coordinatorId = (formData.get("coordinatorId") as string) || null;

  if (session.user.role === "hod") {
    // If updating, preserve old HOD and Dean
    if (id) {
      const [existing] = await db.select().from(authorityMappings).where(eq(authorityMappings.id, id)).limit(1);
      if (existing) {
        hodId = existing.hodId;
        deanId = existing.deanId;
      }
    }
  }

  if (!school || !section || !course || !programType || !department || !year) {
    return { error: "All hierarchy fields (School, Section, Course, Program, Dept, Year) are required." };
  }

  try {
    if (id) {
      // Update by ID
      await db
        .update(authorityMappings)
        .set({
          school,
          section,
          course,
          programType,
          department,
          year,
          tutorId,
          hodId,
          deanId,
          placementCoordinatorId: coordinatorId,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(authorityMappings.id, id));
    } else {
      // Insert
      await db.insert(authorityMappings).values({
        school,
        section,
        course,
        programType,
        department,
        year,
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
  if (!["placement_officer", "principal", "dean"].includes(session.user.role)) {
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

import { systemSettings } from "@/lib/db/schema";
import { COLLEGE_HIERARCHY as DEFAULT_HIERARCHY, type SchoolNode } from "@/lib/constants/hierarchy";

export async function getCollegeHierarchy(): Promise<SchoolNode[]> {
  try {
    const [record] = await db.select().from(systemSettings).where(eq(systemSettings.key, "COLLEGE_HIERARCHY")).limit(1);
    if (record && record.value && Array.isArray(record.value)) {
      return record.value as SchoolNode[];
    }
    return DEFAULT_HIERARCHY;
  } catch (e) {
    console.error("Failed to fetch dynamic hierarchy:", e);
    return DEFAULT_HIERARCHY;
  }
}

export async function saveCollegeHierarchy(newHierarchy: any) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "dean") {
    return { error: "Unauthorized. Only Deans can edit the college structure." };
  }

  try {
    await db.insert(systemSettings)
      .values({
        key: "COLLEGE_HIERARCHY",
        value: newHierarchy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: newHierarchy, updatedAt: new Date() },
      });
      
    revalidatePath("/", "layout"); // Revalidate entire app to reflect structural changes
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save hierarchy:", error);
    return { error: "Failed to save college structure." };
  }
}
