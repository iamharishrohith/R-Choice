import { auth } from "@/lib/auth";
import { fetchCompanyJobs } from "@/app/actions/jobs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jobPostings, jobApplications } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export default async function DashboardCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch jobs with application count
  const jobsWithCount = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      createdAt: jobPostings.createdAt,
      applicationCount: sql<number>`count(${jobApplications.id})`
    })
    .from(jobPostings)
    .leftJoin(jobApplications, eq(jobPostings.id, jobApplications.jobId))
    .where(eq(jobPostings.postedBy, session.user.id))
    .groupBy(jobPostings.id)
    .orderBy(desc(jobPostings.createdAt));

  const postedCount = jobsWithCount.length;
  // Calculate total applications across all jobs
  const totalApplications = jobsWithCount.reduce((sum, job) => sum + Number(job.applicationCount), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Company Dashboard</h1>
        <p>Overview of your company's internship postings and applicant activity.</p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/jobs/manage" style={{ display: "block", textDecoration: "none", color: "inherit", height: "100%" }}>
          <div className="card" style={{ height: "100%", cursor: "pointer", border: "1px solid var(--border-color)", transition: "all 0.2s ease" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
              No. of Internships Posted
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: "var(--rathinam-gold)" }}>
              {postedCount}
            </p>
          </div>
        </Link>

        <div className="card">
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
            Total Applications
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: "var(--rathinam-purple)" }}>
            {totalApplications}
          </p>
        </div>
      </div>

      <h2 style={{ marginBottom: "var(--space-4)" }}>Recently Added Internships</h2>
      {jobsWithCount.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <p style={{ color: "var(--text-secondary)" }}>No internships posted yet.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Internship Title</th>
                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Date Posted</th>
                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", textAlign: "right" }}>Total Applicants</th>
              </tr>
            </thead>
            <tbody>
              {jobsWithCount.slice(0, 5).map(job => (
                <tr key={job.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "16px 12px", fontWeight: 600 }}>{job.title}</td>
                  <td style={{ padding: "16px 12px" }}>
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: "bold", color: "var(--primary-color)" }}>
                    {Number(job.applicationCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
