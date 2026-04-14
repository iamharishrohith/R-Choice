"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  studentProfiles,
  jobPostings,
  companyRegistrations,
  internshipRequests,
  notifications,
  auditLogs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = ["dean", "placement_officer", "principal"];

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!ADMIN_ROLES.includes(session.user.role)) throw new Error("Unauthorized");
  return session;
}

export async function deleteUser(userId: string) {
  const session = await assertAdmin();

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account." };
  }

  try {
    // Check user exists
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return { error: "User not found." };

    // Prevent deleting other admins
    if (ADMIN_ROLES.includes(target.role) && target.role !== "company") {
      return { error: "Cannot delete administrative accounts." };
    }

    // Cascade delete handled by DB constraints (onDelete: cascade)
    await db.delete(users).where(eq(users.id, userId));

    // Audit log
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_user",
      entityType: "user",
      entityId: userId,
      details: { deletedEmail: target.email, deletedRole: target.role },
    });

    revalidatePath("/students");
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { error: `Failed to delete user: ${error?.message || String(error)}` };
  }
}

export async function deleteJob(jobId: string) {
  const session = await assertAdmin();

  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found." };

    await db.delete(jobPostings).where(eq(jobPostings.id, jobId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_job",
      entityType: "job_posting",
      entityId: jobId,
      details: { deletedTitle: job.title },
    });

    revalidatePath("/jobs");
    revalidatePath("/approvals/jobs");
    return { success: true };
  } catch (error: any) {
    console.error("Delete job error:", error);
    return { error: `Failed to delete job: ${error?.message || String(error)}` };
  }
}

export async function deleteCompany(companyRegId: string) {
  const session = await assertAdmin();

  try {
    const [reg] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, companyRegId))
      .limit(1);
    if (!reg) return { error: "Company registration not found." };

    // Delete the registration entry
    await db.delete(companyRegistrations).where(eq(companyRegistrations.id, companyRegId));

    // If a user account exists for this company, delete it too
    if (reg.userId) {
      await db.delete(users).where(eq(users.id, reg.userId));
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_company",
      entityType: "company_registration",
      entityId: companyRegId,
      details: { deletedCompany: reg.companyLegalName },
    });

    revalidatePath("/companies/review");
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete company error:", error);
    return { error: `Failed to delete company: ${error?.message || String(error)}` };
  }
}
