import { db } from "@/lib/db";
import { internshipRequests, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function getFilteredRequestsForStaff(userId: string, role: string, filterStatus: string = "pending", page: number = 1, pageSize: number = 25) {
  let targetStatus = "none";
  
  if (filterStatus === "approved") targetStatus = "approved";
  else if (filterStatus === "rejected") targetStatus = "rejected";
  else {
    if (role === "tutor") targetStatus = "pending_tutor";
    else if (role === "placement_coordinator") targetStatus = "pending_coordinator";
    else if (role === "hod") targetStatus = "pending_hod";
    else if (role === "dean") targetStatus = "pending_dean";
    else if (role === "placement_officer") targetStatus = "pending_po";
    else if (role === "principal") targetStatus = "pending_principal";
  }

  if (targetStatus === "none") return { data: [], totalPages: 0 };

  let condition: any = undefined;

  if (filterStatus === "pending") {
    const baseConditions = [eq(internshipRequests.status, targetStatus as "draft" | "pending_tutor" | "pending_coordinator" | "pending_hod" | "pending_dean" | "pending_po" | "pending_principal" | "approved" | "rejected" | "returned")];
    if (role === "dean" || role === "placement_officer" || role === "principal") {
      if (role === "dean") baseConditions.push(eq(internshipRequests.currentTier, 4));
      else if (role === "placement_officer") baseConditions.push(eq(internshipRequests.currentTier, 5));
      else if (role === "principal") baseConditions.push(eq(internshipRequests.currentTier, 6));
    }
    condition = and(...baseConditions);
  } else if (filterStatus === "approved") {
    condition = eq(internshipRequests.status, "approved");
  } else if (filterStatus === "rejected") {
    condition = eq(internshipRequests.status, "rejected");
  }

  const limitCount = pageSize;
  const offsetCount = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .where(condition);

  const totalRecords = countResult?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const reqs = await db
    .select({
      id: internshipRequests.id,
      role: internshipRequests.role,
      companyName: internshipRequests.companyName,
      applicationType: internshipRequests.applicationType,
      status: internshipRequests.status,
      submittedAt: internshipRequests.submittedAt,
      studentName: users.firstName,
    })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .where(condition)
    .orderBy(desc(internshipRequests.submittedAt))
    .limit(limitCount)
    .offset(offsetCount);

  return {
    data: reqs,
    totalPages
  };
}

export async function getPendingRequestsForStaff(userId: string, role: string, page = 1) {
  return getFilteredRequestsForStaff(userId, role, "pending", page);
}
