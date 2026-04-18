"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, notifications, approvalLogs, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getApproversForStudent } from "@/lib/db/queries/authority";

type AppRole = "student" | "tutor" | "placement_coordinator" | "hod" | "dean" | "placement_officer" | "principal" | "company" | "alumni";

// Approval tier progression order
const TIER_CHAIN: Record<string, { nextStatus: string; nextTier: number }> = {
  "tutor:pending_tutor":          { nextStatus: "pending_coordinator", nextTier: 2 },
  "placement_coordinator:pending_coordinator": { nextStatus: "pending_hod", nextTier: 3 },
  "hod:pending_hod":              { nextStatus: "pending_dean",  nextTier: 4 },
  "dean:pending_dean":           { nextStatus: "pending_po",  nextTier: 5 },
  "placement_officer:pending_po": { nextStatus: "pending_principal", nextTier: 6 },
};

export async function advanceApproval(requestId: string, action: "approve" | "reject", comment?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const role = session.user.role;
  const approverId = session.user.id;

  if (!requestId || typeof requestId !== "string") {
    return { error: "Invalid request ID" };
  }

  // Rejection requires a reason
  if (action === "reject" && (!comment || comment.trim().length === 0)) {
    return { error: "A reason is required when rejecting an application." };
  }

  try {
    const [request] = await db
      .select()
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    // --- IDOR Mitigation: Enforce strict authority mapping ---
    if (["tutor", "placement_coordinator", "hod", "dean"].includes(role)) {
      try {
        const approvers = await getApproversForStudent(request.studentId as string);
        if (role === "tutor" && approverId !== approvers.tutorId) return { error: "Unauthorized: You are not mapped as this student's Tutor." };
        if (role === "placement_coordinator" && approverId !== approvers.placementCoordinatorId) return { error: "Unauthorized: You are not mapped as this student's PC." };
        if (role === "hod" && approverId !== approvers.hodId) return { error: "Unauthorized: You are not mapped as this student's HOD." };
        if (role === "dean" && approverId !== approvers.deanId) return { error: "Unauthorized: You are not mapped as this student's Dean." };
      } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : "An error occurred") || "Failed to verify authority mapping. Student profile might be incomplete." };
      }
    }
    // ---------------------------------------------------------

    const now = new Date();
    const trimmedComment = comment?.trim() || null;

    if (action === "reject") {
      await db
        .update(internshipRequests)
        .set({
          status: "rejected",
          lastReviewedBy: approverId,
          lastReviewedAt: now,
        })
        .where(eq(internshipRequests.id, requestId));

      // Log the rejection with reason
      await db.insert(approvalLogs).values({
        requestId,
        approverId,
        approverRole: role as AppRole,
        tier: request.currentTier || 0,
        action: "rejected",
        comment: trimmedComment,
      });

      await db.insert(auditLogs).values({
        userId: approverId,
        action: "reject_internship_application",
        entityType: "internship_request",
        entityId: requestId,
        details: { tier: request.currentTier || 0, comment: trimmedComment },
      });

      await db.insert(notifications).values({
        userId: request.studentId as string,
        type: "application_update",
        title: "Application Rejected",
        message: trimmedComment
          ? `Your internship application for ${request.companyName} was rejected. Reason: ${trimmedComment}`
          : `Your internship application for ${request.companyName} was rejected.`,
        linkUrl: `/applications/${request.id}`,
      });

      revalidatePath("/approvals");
      revalidatePath("/applications");
      return { success: true };
    }

    // Principal final approval (tier 6 → approved)
    if (role === "principal" && request.status === "pending_principal" && request.currentTier === 6) {
      await db
        .update(internshipRequests)
        .set({
          status: "approved",
          lastReviewedBy: approverId,
          lastReviewedAt: now,
        })
        .where(eq(internshipRequests.id, requestId));

      await db.insert(approvalLogs).values({
        requestId,
        approverId,
        approverRole: role as AppRole,
        tier: request.currentTier || 0,
        action: "approved",
        comment: trimmedComment,
      });

      await db.insert(auditLogs).values({
        userId: approverId,
        action: "approve_internship_final",
        entityType: "internship_request",
        entityId: requestId,
        details: { tier: 6, comment: trimmedComment },
      });

      await db.insert(notifications).values({
        userId: request.studentId as string,
        type: "application_update",
        title: "Application Approved!",
        message: trimmedComment
          ? `Your internship application for ${request.companyName} has received final approval. Note: ${trimmedComment}`
          : `Your internship application for ${request.companyName} has received final approval.`,
        linkUrl: `/applications/${request.id}`,
      });

      revalidatePath("/approvals");
      revalidatePath("/applications");
      return { success: true };
    }

    // Look up the tier chain for this role + status combination
    const chainKey = `${role}:${request.status}`;
    const next = TIER_CHAIN[chainKey];

    if (!next) {
      return { error: "You cannot approve this request at its current stage." };
    }

    await db
      .update(internshipRequests)
      .set({
        status: next.nextStatus as typeof request.status,
        currentTier: next.nextTier,
        lastReviewedBy: approverId,
        lastReviewedAt: now,
      })
      .where(eq(internshipRequests.id, requestId));

    // Log the approval with optional endorsement
    await db.insert(approvalLogs).values({
      requestId,
      approverId,
      approverRole: role as AppRole,
      tier: request.currentTier || 0,
      action: "approved",
      comment: trimmedComment,
    });

    await db.insert(auditLogs).values({
      userId: approverId,
      action: "advance_internship_tier",
      entityType: "internship_request",
      entityId: requestId,
      details: { fromTier: request.currentTier || 0, toTier: next.nextTier, comment: trimmedComment },
    });

    await db.insert(notifications).values({
      userId: request.studentId as string,
      type: "application_update",
      title: "Application Progressed",
      message: trimmedComment
        ? `Your application for ${request.companyName} advanced to tier ${next.nextTier}. Comment: ${trimmedComment}`
        : `Your application for ${request.companyName} advanced to tier ${next.nextTier} (${next.nextStatus}).`,
      linkUrl: `/applications/${request.id}`,
    });

    revalidatePath("/approvals");
    revalidatePath("/applications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Approval error:", error);
    return { error: `Failed to process approval: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getRequestDetails(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const [request] = await db
      .select({
        id: internshipRequests.id,
        role: internshipRequests.role,
        companyName: internshipRequests.companyName,
        applicationType: internshipRequests.applicationType,
        status: internshipRequests.status,
        submittedAt: internshipRequests.submittedAt,
        studentId: internshipRequests.studentId,
        jobPostingId: internshipRequests.jobPostingId,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    // Try fetching external details if present
    let externalDetails = null;
    if (request.applicationType === "external") {
      const [ext] = await db.select().from(require("@/lib/db/schema").externalInternshipDetails).where(eq(require("@/lib/db/schema").externalInternshipDetails.requestId, requestId)).limit(1);
      externalDetails = ext || null;
    }

    // Try fetching portal job details if present
    let jobDetails = null;
    let companyDetails = null;
    if (request.applicationType === "portal" && request.jobPostingId) {
       const [jobP] = await db.select().from(require("@/lib/db/schema").jobPostings).where(eq(require("@/lib/db/schema").jobPostings.id, request.jobPostingId)).limit(1);
       if (jobP) {
         jobDetails = jobP;
         const [comp] = await db.select().from(require("@/lib/db/schema").companyRegistrations).where(eq(require("@/lib/db/schema").companyRegistrations.userId, jobP.postedBy)).limit(1);
         companyDetails = comp || null;
       }
    }

    // Fetch the basic student snapshot
    const [user] = await db.select({ firstName: require("@/lib/db/schema").users.firstName, lastName: require("@/lib/db/schema").users.lastName, email: require("@/lib/db/schema").users.email, avatarUrl: require("@/lib/db/schema").users.avatarUrl }).from(require("@/lib/db/schema").users).where(eq(require("@/lib/db/schema").users.id, request.studentId as string)).limit(1);
    const [profile] = await db.select({ department: require("@/lib/db/schema").studentProfiles.department, year: require("@/lib/db/schema").studentProfiles.year, section: require("@/lib/db/schema").studentProfiles.section, cgpa: require("@/lib/db/schema").studentProfiles.cgpa }).from(require("@/lib/db/schema").studentProfiles).where(eq(require("@/lib/db/schema").studentProfiles.userId, request.studentId as string)).limit(1);

    return {
      success: true,
      data: {
        request,
        externalDetails,
        jobDetails,
        companyDetails,
        student: { user, profile }
      }
    };

  } catch (err) {
    console.error("Failed to fetch request details:", err);
    return { error: "Failed to fetch request details" };
  }
}
