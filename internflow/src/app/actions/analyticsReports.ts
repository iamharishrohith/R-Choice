"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, studentProfiles, internshipRequests, jobPostings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type ReportFilterParams = {
  type: "all" | "internship" | "full-time";
  school?: string;
  department?: string;
  section?: string;
  batchStartYear?: number;
  batchEndYear?: number;
  course?: string;
};

export async function fetchPlacementReport(filters: ReportFilterParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const allowedRoles = ["dean", "placement_officer", "coe", "placement_head", "management_corporation", "principal"];
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  // Build the base query joining all necessary tables
  const query = db
    .select({
      studentId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      registerNo: studentProfiles.registerNo,
      school: studentProfiles.school,
      department: studentProfiles.department,
      section: studentProfiles.section,
      batchStartYear: studentProfiles.batchStartYear,
      batchEndYear: studentProfiles.batchEndYear,
      course: studentProfiles.course,
      companyName: internshipRequests.companyName,
      role: internshipRequests.role,
      status: internshipRequests.status,
      applicationType: internshipRequests.applicationType,
      jobType: jobPostings.jobType,
      stipend: internshipRequests.stipend,
      submittedAt: internshipRequests.submittedAt,
    })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .leftJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
    .orderBy(desc(internshipRequests.submittedAt));

  const results = await query;

  // Process and filter in memory for complex text matches and fallbacks
  const filteredResults = results.filter(row => {
    // 1. Filter by Type (Internship vs Full-Time)
    const derivedType = (row.jobType || 
      (row.role?.toLowerCase().includes("full time") || row.role?.toLowerCase().includes("full-time") ? "full-time" : "internship")).toLowerCase();
    
    if (filters.type === "internship" && !derivedType.includes("intern")) return false;
    if (filters.type === "full-time" && !derivedType.includes("full-time") && !derivedType.includes("full time")) return false;

    // 2. Filter by School
    if (filters.school && row.school !== filters.school) return false;

    // 3. Filter by Department
    if (filters.department && row.department !== filters.department) return false;

    // 4. Filter by Section
    if (filters.section && row.section !== filters.section) return false;

    // 5. Filter by Batch
    if (filters.batchStartYear && row.batchStartYear !== filters.batchStartYear) return false;
    if (filters.batchEndYear && row.batchEndYear !== filters.batchEndYear) return false;

    // 6. Filter by Course
    if (filters.course && row.course !== filters.course) return false;

    return true;
  });

  return filteredResults;
}

export async function fetchReportFilterOptions() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const [schoolsRes, departmentsRes, sectionsRes, coursesRes, batchesRes] = await Promise.all([
    db.selectDistinct({ school: studentProfiles.school }).from(studentProfiles),
    db.selectDistinct({ department: studentProfiles.department }).from(studentProfiles),
    db.selectDistinct({ section: studentProfiles.section }).from(studentProfiles),
    db.selectDistinct({ course: studentProfiles.course }).from(studentProfiles),
    db.selectDistinct({ 
      start: studentProfiles.batchStartYear, 
      end: studentProfiles.batchEndYear 
    }).from(studentProfiles)
  ]);

  return {
    schools: schoolsRes.map(s => s.school).filter(Boolean) as string[],
    departments: departmentsRes.map(d => d.department).filter(Boolean) as string[],
    sections: sectionsRes.map(s => s.section).filter(Boolean) as string[],
    courses: coursesRes.map(c => c.course).filter(Boolean) as string[],
    batches: batchesRes.map(b => ({ start: b.start, end: b.end })).filter(b => b.start && b.end) as {start: number, end: number}[]
  };
}
