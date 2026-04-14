import styles from "./student.module.css";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfiles, internshipRequests, jobApplications, jobPostings, companyRegistrations } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Hand, FileEdit, FileText, Briefcase } from "lucide-react";
import Link from "next/link";
import VerificationBannerClient from "./VerificationBannerClient";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch real data
  let profileScore = 0;
  let applicationCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  
  // New verification flow
  let pendingVerificationApp = null;

  if (userId) {
    // Profile completion
    const [profile] = await db
      .select({ score: studentProfiles.profileCompletionScore })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    profileScore = profile?.score ?? 0;

    // OD Application counts
    const allApps = await db
      .select({ status: internshipRequests.status })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    applicationCount = allApps.length;
    approvedCount = allApps.filter((a) => a.status === "approved").length;
    pendingCount = allApps.filter(
      (a) => a.status !== "approved" && a.status !== "rejected" && a.status !== "draft"
    ).length;

    // Check for selected but unverified Job Applications
    const [unverifiedApp] = await db
      .select({
        appId: jobApplications.id,
        jobTitle: jobPostings.title,
        companyName: companyRegistrations.companyLegalName
      })
      .from(jobApplications)
      .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
      .innerJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
      .where(and(
        eq(jobApplications.studentId, userId),
        eq(jobApplications.status, "selected"),
        eq(jobApplications.isVerified, false)
      ))
      .limit(1);

    if (unverifiedApp) {
      pendingVerificationApp = unverifiedApp;
    }
  }

  // Readiness score = profile score for now (V1)
  const readinessScore = Math.min(profileScore + approvedCount * 10, 100);
  const completionPercent = Math.min(profileScore, 100);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Welcome back! <Hand size={24} style={{ display: "inline-block", verticalAlign: "middle" }} /></h1>
        <p>Here&apos;s your placement journey at a glance.</p>
      </div>

      {pendingVerificationApp && (
        <VerificationBannerClient 
          applicationId={pendingVerificationApp.appId}
          jobTitle={pendingVerificationApp.jobTitle}
          companyName={pendingVerificationApp.companyName || "Company"}
        />
      )}

      {/* Profile Completion Banner */}
      <div className={styles.completionBanner}>
        <div className={styles.completionInfo}>
          <h3>Complete Your Profile</h3>
          <p>Finish your profile to unlock job applications.</p>
        </div>
        <div className={styles.completionBar}>
          <div className={styles.completionProgress} style={{ width: `${completionPercent}%` }} />
        </div>
        <span className={styles.completionPercent}>{completionPercent}%</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "OD Requests", value: String(applicationCount), color: "var(--rathinam-purple)" },
          { label: "Approved ODs", value: String(approvedCount), color: "var(--rathinam-green)" },
          { label: "Pending ODs", value: String(pendingCount), color: "var(--rathinam-gold)" },
          { label: "Readiness Score", value: String(readinessScore), color: "var(--rathinam-blue)" },
        ].map((kpi) => (
          <div className="card" key={kpi.label}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
              {kpi.label}
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions — Wired to real routes */}
      <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
      <div className="grid grid-3">
        <Link href="/profile" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><FileEdit size={18} /> Complete Profile</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Add skills, certifications, and projects
            </p>
          </div>
        </Link>
        <Link href="/profile?tab=resume" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> Upload Resume</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Manage your Cloudinary PDF resume
            </p>
          </div>
        </Link>
        <Link href="/jobs" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Briefcase size={18} /> Browse Jobs</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              View internships matching your interests
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
