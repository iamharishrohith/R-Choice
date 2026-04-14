"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, externalInternshipDetails, jobApplications, jobPostings, companyRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getApproversForStudent } from "@/lib/db/queries/authority";
import { revalidatePath } from "next/cache";
import {
  sanitize,
  sanitizeOptional,
  validateEmail,
  validateUrl,
  validateUrlOptional,
  validatePhone,
  validateDate,
  validateEnum,
  ValidationError,
} from "@/lib/validation";

export async function submitInternshipRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

  if (role !== "student") {
    return { error: "Only students can submit internship applications." };
  }

  try {
    // 1. Get the authority mapping for the student
    const approvers = await getApproversForStudent(userId);

    if (!approvers.tutorId) {
      return { error: "No class tutor mapped to your department/section. Cannot submit request." };
    }

    // 2. Extract and validate form data
    const applicationType = validateEnum(
      formData.get("applicationType") || "external",
      ["portal", "external"] as const,
      "Application type"
    );
    const companyName = sanitize(formData.get("companyName"), "Company Name", 200);
    const companyAddress = sanitizeOptional(formData.get("companyAddress"), "Company Address", 500);
    const roleTitle = sanitize(formData.get("role"), "Job Role", 200);
    const startDate = validateDate(formData.get("startDate"), "Start Date");
    const endDate = validateDate(formData.get("endDate"), "End Date");
    const stipend = sanitizeOptional(formData.get("stipend"), "Stipend", 100);
    const workMode = sanitizeOptional(formData.get("workMode"), "Work Mode", 50);

    // External-specific validation
    let companyWebsite: string | null = null;
    let hrName: string | null = null;
    let hrEmail: string | null = null;
    let hrPhone: string | null = null;
    let offerLetterUrl: string | null = null;
    let companyIdProofUrl: string | null = null;
    let parentConsentUrl: string | null = null;
    let discoverySource: string | null = null;

    if (applicationType === "external") {
      companyWebsite = validateUrl(formData.get("companyWebsite"), "Company Website");
      hrName = sanitize(formData.get("hrName"), "HR Name", 200);
      hrEmail = validateEmail(formData.get("hrEmail"), "HR Email");
      hrPhone = validatePhone(formData.get("hrPhone"), "HR Phone");
      offerLetterUrl = validateUrl(formData.get("offerLetterUrl"), "Offer Letter URL");
      companyIdProofUrl = validateUrl(formData.get("companyIdProofUrl"), "Company ID Proof URL");
      parentConsentUrl = validateUrl(formData.get("parentConsentUrl"), "Parent Consent URL");
      discoverySource = sanitizeOptional(formData.get("discoverySource"), "Discovery Source", 100) || "Other";
    }

    // 3. Create the internship request
    const insertedReq = await db.insert(internshipRequests).values({
      studentId: userId,
      applicationType,
      companyName,
      companyAddress,
      role: roleTitle,
      startDate,
      endDate,
      stipend,
      workMode,
      offerLetterUrl: offerLetterUrl || null,
      status: "pending_tutor", // Starts at tier 1 automatically
      currentTier: 1,
      submittedAt: new Date(),
    }).returning({ id: internshipRequests.id });

    const reqId = insertedReq[0].id;

    // 4. Insert External Details if applicable
    if (applicationType === "external") {
      await db.insert(externalInternshipDetails).values({
        requestId: reqId,
        companyWebsite: companyWebsite || "Not provided",
        hrName: hrName!,
        hrEmail: hrEmail!,
        hrPhone: hrPhone!,
        companyIdProofUrl: companyIdProofUrl || "Not provided",
        parentConsentUrl: parentConsentUrl || "Not provided",
        workMode: workMode || "onsite",
        discoverySource: discoverySource || "Other",
      });
    }

    revalidatePath("/applications");
    revalidatePath("/dashboard/student");
    
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    console.error("Application submission error:", error);
    return { error: "Failed to submit application." };
  }
}

export async function createPortalApplication(jobId: string, companyName: string, roleTitle: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

  if (role !== "student") return { error: "Only students can apply." };

  try {
    const approvers = await getApproversForStudent(userId);
    if (!approvers.tutorId) {
      return { error: "No class tutor mapped to your department/section. Cannot apply." };
    }

    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) {
      return { error: "Job not found." };
    }

    const [company] = job.companyId
      ? await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1)
      : [null];

    const today = new Date();
    const fallbackStart = job.startDate ? new Date(job.startDate) : today;
    const fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setMonth(fallbackEnd.getMonth() + 3);

    const formatDate = (value: Date) => value.toISOString().slice(0, 10);

    await db.insert(jobApplications).values({
      jobId,
      studentId: userId,
      status: "applied",
    });

    // Keep portal applications visible in the same approval pipeline used by external requests.
    await db.insert(internshipRequests).values({
      studentId: userId,
      jobPostingId: jobId,
      applicationType: "portal",
      companyName: company?.companyLegalName || companyName,
      companyAddress: company?.address || null,
      role: job.title || roleTitle,
      startDate: formatDate(fallbackStart),
      endDate: formatDate(fallbackEnd),
      stipend: job.stipendSalary || null,
      workMode: job.workMode || "onsite",
      status: "pending_tutor",
      currentTier: 1,
      submittedAt: new Date(),
    });

    revalidatePath("/applications");
    revalidatePath("/approvals");
    revalidatePath("/jobs");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Portal apply error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit portal application.";
    return { error: msg };
  }
}

export async function postCompanyResults(jobId: string, selectedStudentIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") {
    return { error: "Unauthorized. Only companies can post results." };
  }

  try {
    const { eq, and, sql } = require("drizzle-orm");
    const { jobApplications, jobPostings, users, companyRegistrations, notifications } = require("@/lib/db/schema");
    const { sendCompanyResultEmail } = require("@/lib/mail");

    // Get Job Details
    const [job] = await db.select({
      role: jobPostings.title,
      companyId: jobPostings.companyId
    }).from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);

    const [company] = await db.select({
      name: companyRegistrations.companyLegalName
    }).from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1);

    for (const studentId of selectedStudentIds) {
      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Execute mutations within a resilient transaction boundary
      const emailTask = await db.transaction(async (tx) => {
        // Update the application status
        await tx.update(jobApplications)
          .set({ status: "selected", verificationCode: code, updatedAt: new Date() })
          .where(and(eq(jobApplications.jobId, jobId), eq(jobApplications.studentId, studentId)));

        // Build email
        const [student] = await tx.select().from(users).where(eq(users.id, studentId)).limit(1);
        
        if (student && student.email) {
          // Notify Student Directly
          await tx.insert(notifications).values({
            userId: student.id,
            type: "selection",
            title: "Internship Selection Result",
            message: `Congratulations! You have been selected by ${company?.name}. Please check your email for the verification code to start your OD request.`,
            linkUrl: "/dashboard/student"
          });
          
          return { email: student.email, name: `${student.firstName} ${student.lastName}` };
        }
        return null;
      });

      // Side-effects (Email API requests) fire only if the atomic db transaction succeeds
      if (emailTask) {
        await sendCompanyResultEmail(
          emailTask.email,
          emailTask.name,
          company?.name || "The Company",
          job?.role || "Internship",
          code
        );
      }
    }

    // Optional: Alert the hierarchy that a result was posted (can be global or mapped to selected students)
    
    revalidatePath("/dashboard/company/applicants");
    return { success: true };
  } catch (err: any) {
    console.error("Post results error:", err);
    return { error: err.message || "Failed to post results" };
  }
}

export async function verifyAndInitializeOD(applicationId: string, code: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return { error: "Unauthorized" };
  }

  try {
    const { eq, and } = require("drizzle-orm");
    const { jobApplications, internshipRequests, jobPostings, companyRegistrations } = require("@/lib/db/schema");

    // 1. Fetch application
    const [app] = await db.select({
      id: jobApplications.id,
      verificationCode: jobApplications.verificationCode,
      isVerified: jobApplications.isVerified,
      jobId: jobApplications.jobId
    })
    .from(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.studentId, session.user.id)))
    .limit(1);

    if (!app) return { error: "Application not found" };
    if (app.isVerified) return { error: "Already verified." };
    if (app.verificationCode !== code) return { error: "Invalid verification code." };

    // 2. Fetch Job/Company info to seed the OD Request
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, app.jobId)).limit(1);
    const [company] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1);

    // Execute mutations within a resilient transaction boundary
    await db.transaction(async (tx) => {
      // 3. Mark application as verified
      await tx.update(jobApplications)
        .set({ isVerified: true, updatedAt: new Date() })
        .where(eq(jobApplications.id, applicationId));

      // 4. Create the final rigorous OD Request mapping
      await tx.insert(internshipRequests).values({
        studentId: session.user.id,
        jobPostingId: app.jobId,
        applicationType: "portal",
        companyName: company?.companyLegalName || "External Company",
        companyAddress: String(company?.address || "Registered Address"),
        role: job?.title || "Intern",
        startDate: validateDate(startDate, "Start Date"),
        endDate: validateDate(endDate, "End Date"),
        stipend: job?.stipendSalary || "Unpaid",
        workMode: job?.workMode || "onsite",
        status: "pending_tutor", // Begins hierarchical approval
        currentTier: 1, 
        submittedAt: new Date(),
      });
    });

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (err: any) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error("OD Verification error:", err);
    return { error: err.message || "Failed to verify and initialize OD." };
  }
}
