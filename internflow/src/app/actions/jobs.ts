"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sanitize, sanitizeOptional, validateDate, ValidationError } from "@/lib/validation";

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const role = session.user.role;
  if (role !== "company") {
    return { error: "Only companies can post jobs." };
  }

  try {
    const title = sanitize(formData.get("title"), "Job Title", 255);
    const description = sanitize(formData.get("description"), "Job Description", 5000);
    const requirements = sanitizeOptional(formData.get("requirements"), "Requirements", 3000);
    const location = sanitize(formData.get("location"), "Location", 200);
    const stipendInfo = sanitizeOptional(formData.get("stipendInfo"), "Stipend Info", 100);
    const deadline = validateDate(formData.get("deadline"), "Application Deadline");

    // Determine the company name from the user profile
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    
    await db.insert(jobPostings).values({
      postedBy: session.user.id,
      postedByRole: "company",
      title,
      jobType: "Internship",
      description,
      location,
      workMode: "Hybrid",
      duration: "3 Months",
      stipendSalary: stipendInfo || "Unpaid",
      openingsCount: isNaN(parseInt(formData.get("openingsCount") as string, 10)) ? 1 : parseInt(formData.get("openingsCount") as string, 10),
      applicationDeadline: deadline,
      requiredSkills: requirements ? [requirements] : [],
      status: "pending_review", // Jobs now go through staff review before being visible
    });

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    console.error("Job creation error:", error);
    return { error: "Failed to post job." };
  }
}

export async function updateJobStatus(jobId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const role = session.user.role;
  if (role !== "placement_officer") {
    return { error: "Only placement officers can approve company jobs." };
  }

  try {
    const newStatus = action === "approve" ? "approved" : "rejected";
    
    await db.update(jobPostings)
      .set({ 
        status: newStatus,
        verifiedBy: session.user.id,
        verifiedByRole: role,
        verifiedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: `review_job_${action}`,
      entityType: "job_posting",
      entityId: jobId,
      details: { newStatus },
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
    const jobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        description: jobPostings.description,
        location: jobPostings.location,
        stipendInfo: jobPostings.stipendSalary,
        deadline: jobPostings.applicationDeadline,
        companyName: users.firstName,
        companyId: jobPostings.postedBy
      })
      .from(jobPostings)
      .innerJoin(users, eq(jobPostings.postedBy, users.id))
      .where(eq(jobPostings.status, "approved"))
      .orderBy(desc(jobPostings.createdAt));
      
    return jobs;
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
}

export async function fetchCompanyJobs(companyId: string) {
  try {
    const jobs = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.postedBy, companyId))
      .orderBy(desc(jobPostings.createdAt));
      
    return jobs;
  } catch (err) {
    console.error("Failed to fetch company jobs:", err);
    return [];
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

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const stipendSalary = formData.get("stipendSalary") as string;
    const deadline = formData.get("deadline") as string;
    const openingsCount = formData.get("openingsCount") as string;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title?.trim()) updatePayload.title = title.trim();
    if (description?.trim()) updatePayload.description = description.trim();
    if (location?.trim()) updatePayload.location = location.trim();
    if (stipendSalary?.trim()) updatePayload.stipendSalary = stipendSalary.trim();
    if (deadline?.trim()) updatePayload.applicationDeadline = deadline.trim();
    if (openingsCount?.trim()) updatePayload.openingsCount = parseInt(openingsCount, 10);

    await db.update(jobPostings).set(updatePayload).where(eq(jobPostings.id, jobId));

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    revalidatePath(`/approvals/jobs`);
    return { success: true };
  } catch (error: any) {
    console.error("Job update error:", error);
    return { error: `Failed to update job: ${error?.message || String(error)}` };
  }
}
