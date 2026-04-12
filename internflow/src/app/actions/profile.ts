"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveBasicProfile(formData: {
  registerNo: string;
  department: string;
  year: number;
  section: string;
  cgpa: string;
  professionalSummary: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const cgpaVal = formData.cgpa ? parseFloat(formData.cgpa).toString() : null;

    // Calculate a simple mock score for basic info completion
    let score = 0;
    if (formData.registerNo) score += 10;
    if (formData.department) score += 10;
    if (formData.year) score += 5;
    if (formData.cgpa) score += 5;
    if (formData.professionalSummary && formData.professionalSummary.length > 20) score += 20;
    
    // Base score caps at 50% for basic profile. The rest comes from skills/certs later.

    if (existingProfile) {
      await db
        .update(studentProfiles)
        .set({
          registerNo: formData.registerNo,
          department: formData.department,
          year: formData.year,
          section: formData.section,
          cgpa: cgpaVal,
          professionalSummary: formData.professionalSummary,
          profileCompletionScore: score // In actual implementation, we'd add this to existing skills score
        })
        .where(eq(studentProfiles.id, existingProfile.id));
    } else {
      await db.insert(studentProfiles).values({
        userId,
        registerNo: formData.registerNo,
        department: formData.department,
        year: formData.year,
        section: formData.section,
        cgpa: cgpaVal,
        professionalSummary: formData.professionalSummary,
        profileCompletionScore: score,
      });
    }

    revalidatePath("/profile");
    return { success: true, score };
  } catch (error: any) {
    console.error("Profile save error:", error);
    if (error.code === '23505') { // unique violation
      return { error: "Register Number is already in use by another student." };
    }
    return { error: "Failed to save profile. Please try again." };
  }
}

export async function saveDeanProfile(formData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "dean") {
    return { error: "Not authorized" };
  }

  const userId = session.user.id;

  try {
    await db
      .update(users)
      .set({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        email: formData.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Dean profile save error:", error);
    if (error.code === '23505') { 
      return { error: "Email is already in use by another user." };
    }
    return { error: "Failed to save profile. Please try again." };
  }
}
