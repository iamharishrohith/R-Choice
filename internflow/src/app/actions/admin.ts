"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  jobPostings,
  jobApplications,
  companyRegistrations,
  companyInvitations,
  auditLogs,
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sanitize, validateEmail, validateEnum } from "@/lib/validation";


const ADMIN_ROLES = ["dean", "placement_officer", "principal", "coe", "mcr", "placement_coordinator"];

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!ADMIN_ROLES.includes(session.user.role)) throw new Error("Unauthorized");
  return session;
}

export async function createUserAction(formData: FormData) {
  const session = await assertAdmin();

  try {
    const rawEmail = formData.get("email");
    const rawFirstName = formData.get("firstName");
    const rawLastName = formData.get("lastName");
    const rawPassword = formData.get("password") as string;
    const rawRole = formData.get("role");

    const validRoles = ["student", "tutor", "placement_coordinator", "hod", "dean", "placement_officer", "principal", "company", "alumni"] as const;

    const email = validateEmail(rawEmail, "Email Address");
    const firstName = sanitize(rawFirstName, "First Name", 100);
    const lastName = sanitize(rawLastName, "Last Name", 100);
    const role = validateEnum(rawRole, validRoles, "Global Role");

    if (!rawPassword || rawPassword.trim().length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(rawPassword.trim(), 12);

    await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
    });

    // Audit log
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "create_user",
      entityType: "user",
      entityId: "new_user", // Note: normally we fetch the created user ID
      details: { createdEmail: email, assignedRole: role },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ValidationError") {
      return { error: err.message };
    }
    console.error("Create user error:", err);
    return { error: "An unexpected error occurred while creating the user." };
  }
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
  } catch (error: unknown) {
    console.error("Delete user error:", error);
    return { error: `Failed to delete user: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteJob(jobId: string) {
  const session = await assertAdmin();

  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found." };

    // Check for existing applications before deleting
    const [appCount] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.jobId, jobId));
    if (appCount && appCount.value > 0) {
      return { error: `Cannot delete: ${appCount.value} student(s) have already applied to this job.` };
    }

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
  } catch (error: unknown) {
    console.error("Delete job error:", error);
    return { error: `Failed to delete job: ${error instanceof Error ? error.message : String(error)}` };
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

    // Audit then delete
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_company",
      entityType: "company_registration",
      entityId: companyRegId,
      details: { deletedCompany: reg.companyLegalName },
    });

    await db.delete(companyRegistrations).where(eq(companyRegistrations.id, companyRegId));

    // If a user account exists for this company, delete it too
    if (reg.userId) {
      await db.delete(users).where(eq(users.id, reg.userId));
    }

    revalidatePath("/companies/review");
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete company error:", error);
    return { error: `Failed to delete company: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function bulkExportDatabase() {
  const session = await assertAdmin();

  try {
    // Audit the export action
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "system_export",
      entityType: "system",
      entityId: "bulk",
      details: { requester: session.user.email },
    });

    // Fetch complete datasets for CSV arrays
    const allUsers = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      joinedAt: users.createdAt,
    }).from(users);

    return { 
      success: true, 
      payload: { 
        users: allUsers 
      } 
    };
  } catch (err: unknown) {
    console.error("Bulk export error:", err);
    return { error: "Failed to generate bulk export from secure database." };
  }
}

import { randomBytes } from "crypto";

export async function generateCompanyInvitation(formData: FormData) {
  const session = await assertAdmin();
  try {
    const rawEmail = formData.get("email");
    const email = validateEmail(rawEmail, "Company Email");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days token expiry

    await db.insert(companyInvitations).values({
      token,
      mcrId: session.user.id,
      companyEmail: email,
      expiresAt,
    });

    revalidatePath("/companies/invitations");
    const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    return { success: true, link: `${baseUrl}/company/register?token=${token}` };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ValidationError") {
      return { error: error.message };
    }
    console.error("Generate invitation error:", error);
    return { error: "Failed to generate invitation link." };
  }
}

