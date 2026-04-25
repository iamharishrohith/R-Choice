"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users, auditLogs, companyRegistrations } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sanitize, sanitizeOptional, validateDate, ValidationError } from "@/lib/validation";

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const role = session.user.role;
  if (role !== "company" && role !== "company_staff") {
    return { error: "Only companies can post jobs." };
  }

  try {
    const rawData = Object.fromEntries(formData.entries());

    const title = String(rawData.title || "");
    const domain = String(rawData.domain || "");
    const jobType = String(rawData.jobType || "Internship");
    const internshipType = String(rawData.internshipType || "");
    const mode = String(rawData.mode || "");
    const location = String(rawData.location || "");
    const duration = String(rawData.duration || "");
    const description = String(rawData.description || "");
    const rolesAndResp = String(rawData.rolesAndResponsibilities || "");
    const learnings = String(rawData.learnings || "");
    
    const requiredSkills = String(rawData.requiredSkills || "").split(',').map(s => s.trim()).filter(Boolean);
    const preferredQualifications = String(rawData.preferredQualifications || "");
    const tools = String(rawData.tools || "").split(',').map(s => s.trim()).filter(Boolean);
    
    const eligibilityDegree = String(rawData.eligibilityDegree || "").split(',').map(s => s.trim()).filter(Boolean);
    const departmentEligibility = String(rawData.departmentEligibility || "").split(',').map(s => s.trim()).filter(Boolean);
    const yearEligibility = String(rawData.yearEligibility || "").split(',').map(s => parseInt(s.trim())).filter(y => !isNaN(y));
    const minCgpaString = String(rawData.minCgpa || "");
    const minCgpa = minCgpaString ? parseFloat(minCgpaString) : null;

    const applicationDeadline = String(rawData.applicationDeadline || "");
    const startDate = rawData.startDate ? String(rawData.startDate) : null;

    const isPaid = rawData.isPaid === "true";
    const stipendSalary = String(rawData.stipendSalary || "Unpaid");

    const perksBenefits = formData.getAll("perksBenefits").map(String);
    const selectionProcess = formData.getAll("selectionProcess").map(String);
    
    let faq = [];
    try { faq = JSON.parse(String(rawData.faq || "[]")); } catch {}
    
    let contactPersons = [];
    try { contactPersons = JSON.parse(String(rawData.contactPersons || "[]")); } catch {}

    const openingsCount = parseInt(String(rawData.openingsCount || "1"), 10);

    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    const companyId = user?.companyId || null;

    await db.insert(jobPostings).values({
      postedBy: session.user.id,
      postedByRole: role,
      companyId,
      title,
      domain,
      jobType,
      internshipType,
      mode,
      location,
      duration,
      description,
      rolesAndResponsibilities: rolesAndResp,
      learnings,
      requiredSkills,
      preferredQualifications,
      tools,
      departmentEligibility,
      eligibilityDegree,
      minCgpa: minCgpa ? String(minCgpa) : null,
      yearEligibility,
      applicationDeadline,
      startDate,
      isPaid,
      stipendSalary,
      openingsCount,
      perksBenefits,
      selectionProcess,
      faq,
      contactPersons,
      workMode: internshipType || "Hybrid",
      status: "pending_review",
    });

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    revalidatePath("/approvals/jobs");

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    console.error("Job creation error:", error);
    return { error: "Failed to post job." };
  }
}


import { notifications } from "@/lib/db/schema";
import { sendMobilePush } from "@/lib/notifications";

export async function updateJobStatus(jobId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  
  const role = session.user.role;
  if (!["placement_officer", "dean", "coe", "principal", "mcr"].includes(role)) {
    return { error: "Only admins and MCR can approve company jobs." };
  }

  try {
    const newStatus = action === "approve" ? "approved" : "rejected";
    
    await db.transaction(async (tx) => {
      await tx.update(jobPostings)
        .set({ 
          status: newStatus,
          verifiedBy: session.user.id,
          verifiedByRole: role,
          verifiedAt: new Date()
        })
        .where(eq(jobPostings.id, jobId));

      if (newStatus === "approved") {
        const [job] = await tx.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
        
        // 1. Notify Admins
        const notifyRoles = ["placement_officer", "dean", "hod", "coe", "principal"] as const;
        const targetAdmins = await tx.select().from(users).where(inArray(users.role, notifyRoles));
        
        if (targetAdmins.length > 0) {
          await tx.insert(notifications).values(
            targetAdmins.map(admin => ({
              userId: admin.id,
              type: "system",
              title: "New Job Approved",
              message: `Job ${job?.title} is now active.`,
              linkUrl: `/jobs`,
            }))
          );
        }

        // 2. Notify ALL Active Students via Push
        const students = await tx.select({ id: users.id }).from(users).where(eq(users.role, "student"));
        if (students.length > 0) {
           await sendMobilePush(
             "New Internship Available!",
             `${job?.title} is now accepting applications. Check your dashboard!`,
             students.map(s => s.id)
           );
        }
      }

      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: `review_job_${action}`,
        entityType: "job_posting",
        entityId: jobId,
        details: { newStatus },
      });
    });

    revalidatePath("/approvals/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job status:", error);
    return { error: "Database error occurred" };
  }
}

export async function fetchActiveJobs() {
  try {
    // Alias for the verifier user (separate from the poster)
    const jobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        description: jobPostings.description,
        location: jobPostings.location,
        stipendInfo: jobPostings.stipendSalary,
        deadline: jobPostings.applicationDeadline,
        companyName: users.firstName,
        companyId: jobPostings.postedBy,
        workMode: jobPostings.workMode,
        duration: jobPostings.duration,
        openingsCount: jobPostings.openingsCount,
        verifiedBy: jobPostings.verifiedBy,
        verifiedByRole: jobPostings.verifiedByRole,
        verifiedAt: jobPostings.verifiedAt,
      })
      .from(jobPostings)
      .innerJoin(users, eq(jobPostings.postedBy, users.id))
      .where(eq(jobPostings.status, "approved"))
      .orderBy(desc(jobPostings.createdAt));

    // Fetch verifier names for the badge
    const verifierIds = [...new Set(jobs.map(j => j.verifiedBy).filter(Boolean))] as string[];
    const verifierMap: Record<string, string> = {};
    if (verifierIds.length > 0) {
      const verifiers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, verifierIds));
      verifiers.forEach(v => { verifierMap[v.id] = `${v.firstName} ${v.lastName}`; });
    }

    return jobs.map(j => ({
      ...j,
      verifierName: j.verifiedBy ? verifierMap[j.verifiedBy] || "Staff" : null,
    }));
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
}

export async function fetchCompanyJobs(userId: string, role: string, companyId?: string | null) {
  try {
    if (role === "company_staff") {
      return await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.postedBy, userId))
        .orderBy(desc(jobPostings.createdAt));
    } else if (role === "company" && companyId) {
      return await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.companyId, companyId))
        .orderBy(desc(jobPostings.createdAt));
    } else {
      return [];
    }
  } catch (err) {
    console.error("Failed to fetch company jobs:", err);
    return [];
  }
}

export async function deleteJobPosting(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found" };

    const role = session.user.role;
    const isOwner = job.postedBy === session.user.id;
    const [ceo] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    // CEO can delete any job of their company, staff can only delete their own
    if (role === "company_staff" && !isOwner) {
      return { error: "You can only delete your own jobs" };
    }
    if (role === "company" && job.companyId !== ceo?.companyId) {
       return { error: "You can only delete jobs belonging to your company" };
    }
    
    if (job.status !== "draft" && job.status !== "rejected") {
      return { error: "Only draft or rejected jobs can be deleted" };
    }

    await db.delete(jobPostings).where(eq(jobPostings.id, jobId));
    revalidatePath("/jobs/manage");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { error: "Failed to delete job" };
  }
}

export async function updateJobPosting(jobId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const role = session.user.role;
  
  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found." };

    // Only the posting company or admin roles can edit
    const isOwner = job.postedBy === session.user.id;
    const isAdmin = ["dean", "placement_officer", "principal"].includes(role);

    if (!isOwner && !isAdmin) {
      return { error: "You do not have permission to edit this job." };
    }

    const title = sanitizeOptional(formData.get("title"), "Title", 255);
    const description = sanitizeOptional(formData.get("description"), "Description", 5000);
    const location = sanitizeOptional(formData.get("location"), "Location", 200);
    const stipendSalary = sanitizeOptional(formData.get("stipendSalary"), "Stipend", 200);
    const deadline = sanitizeOptional(formData.get("deadline"), "Deadline", 10);
    const openingsCount = formData.get("openingsCount") as string;

    const updatePayload: Partial<typeof jobPostings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title) updatePayload.title = title;
    if (description) updatePayload.description = description;
    if (location) updatePayload.location = location;
    if (stipendSalary) updatePayload.stipendSalary = stipendSalary;
    if (deadline) updatePayload.applicationDeadline = deadline;
    if (openingsCount?.trim()) updatePayload.openingsCount = parseInt(openingsCount, 10);

    await db.update(jobPostings).set(updatePayload).where(eq(jobPostings.id, jobId));

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    revalidatePath(`/approvals/jobs`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Job update error:", error);
    return { error: `Failed to update job: ${error instanceof Error ? error.message : String(error)}` };
  }
}
