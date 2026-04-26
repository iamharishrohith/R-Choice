"use server";

import { db } from "@/lib/db";
import { authorityMappings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Given a student's department, section, and year, look up the authority mapping
 * to resolve tutor, school, and other hierarchy fields automatically.
 */
export async function resolveHierarchy(department: string, section: string, year: number) {
  try {
    const [mapping] = await db
      .select()
      .from(authorityMappings)
      .where(
        and(
          eq(authorityMappings.department, department),
          eq(authorityMappings.section, section),
          eq(authorityMappings.year, year),
        )
      )
      .limit(1);

    if (!mapping) {
      return { found: false, tutorId: null, placementCoordinatorId: null, hodId: null, deanId: null, school: null };
    }

    return {
      found: true,
      tutorId: mapping.tutorId,
      placementCoordinatorId: mapping.placementCoordinatorId,
      hodId: mapping.hodId,
      deanId: mapping.deanId,
      school: mapping.school || null,
    };
  } catch (error) {
    console.error("Hierarchy resolution error:", error);
    return { found: false, tutorId: null, placementCoordinatorId: null, hodId: null, deanId: null, school: null };
  }
}

/**
 * Given a student's department + section + year, auto-assign the tutor and school
 * to the student profile. Returns the mapped school for use in the UI.
 */
export async function autoAssignForStudent(department: string, section: string, year: number) {
  const result = await resolveHierarchy(department, section, year);

  if (!result.found) {
    return {
      success: false,
      message: "No hierarchy mapping found for the selected department/section/year. Please contact your administrator.",
    };
  }

  return {
    success: true,
    school: result.school,
    tutorId: result.tutorId,
    placementCoordinatorId: result.placementCoordinatorId,
    hodId: result.hodId,
    deanId: result.deanId,
    message: "Hierarchy auto-assigned successfully.",
  };
}
