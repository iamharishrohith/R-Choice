import { db } from "@/lib/db";
import { users, jobPostings, jobApplications, companyRegistrations, studentProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import ApplicantsClient from "./ApplicantsClient";

export default async function ApplicantsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Find company record to filter only this company's applicants
  const companyRecord = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  const companyId = companyRecord[0]?.id;

  let applicants: any[] = [];
  if (companyId) {
    const rawApps = await db
      .select({
        id: users.id, // the student's user logic
        appId: jobApplications.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        jobId: jobPostings.id,
        jobTitle: jobPostings.title,
        resumeUrl: studentProfiles.resumeUrl
      })
      .from(jobApplications)
      .innerJoin(users, eq(jobApplications.studentId, users.id))
      .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(jobPostings.companyId, companyId))
      .orderBy(desc(jobApplications.appliedAt));
      
      // Remap so 'id' is standard studentId for the UI
      applicants = rawApps.map(a => ({
        ...a,
        id: a.id,
        applicationId: a.appId
      }));
  }

  return (
     <ApplicantsClient initialApplicants={applicants} />
  );
}
