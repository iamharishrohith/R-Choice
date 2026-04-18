import styles from "./student.module.css";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfiles, internshipRequests, jobApplications, jobPostings, companyRegistrations, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Hand, FileEdit, FileText, Briefcase, Star, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import VerificationBannerClient from "./VerificationBannerClient";
import ApprovedRequestsClient from "./ApprovedRequestsClient";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch real data
  let profileScore = 0;
  let applicationCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  
  // New verification flow
  let pendingVerificationApps: { appId: string; jobTitle: string; companyName: string | null; verificationCode: string | null }[] = [];
  let shortlistedApps: { appId: string; jobTitle: string; companyName: string | null; status: string | null }[] = [];
  let approvedRequestsData: { id: string; status: string | null; companyName: string; role: string; startDate: string; endDate: string; approvedAt: Date | null }[] = [];
  let studentFullName = "Student";

  if (userId) {
    // Current user name
    const [user] = await db.select({ first: users.firstName, last: users.lastName }).from(users).where(eq(users.id, userId)).limit(1);
    if (user) studentFullName = `${user.first} ${user.last}`;

    // Profile completion
    const [profile] = await db
      .select({ score: studentProfiles.profileCompletionScore })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    profileScore = profile?.score ?? 0;

    // OD Application counts
    const allApps = await db
      .select({ 
         id: internshipRequests.id,
         status: internshipRequests.status,
         companyName: internshipRequests.companyName,
         role: internshipRequests.role,
         startDate: internshipRequests.startDate,
         endDate: internshipRequests.endDate,
         approvedAt: internshipRequests.approvedAt
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    applicationCount = allApps.length;
    
    // Filter fully approved requests
    const approvedEntries = allApps.filter((a) => a.status === "approved");
    approvedCount = approvedEntries.length;
    approvedRequestsData = approvedEntries;
    
    pendingCount = allApps.filter(
      (a) => a.status !== "approved" && a.status !== "rejected" && a.status !== "draft"
    ).length;

    // Fetch ALL job applications for this student (shortlisted + selected)
    const myJobApps = await db
      .select({
        appId: jobApplications.id,
        status: jobApplications.status,
        verificationCode: jobApplications.verificationCode,
        isVerified: jobApplications.isVerified,
        jobTitle: jobPostings.title,
        companyName: companyRegistrations.companyLegalName,
      })
      .from(jobApplications)
      .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
      .leftJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
      .where(eq(jobApplications.studentId, userId));

    // Selected but unverified — show verification banners
    pendingVerificationApps = myJobApps
      .filter(a => a.status === "selected" && !a.isVerified)
      .map(a => ({ appId: a.appId, jobTitle: a.jobTitle, companyName: a.companyName, verificationCode: a.verificationCode }));

    // Shortlisted — show for awareness
    shortlistedApps = myJobApps
      .filter(a => a.status === "shortlisted")
      .map(a => ({ appId: a.appId, jobTitle: a.jobTitle, companyName: a.companyName, status: a.status }));
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

      {/* Verification Banners for ALL selected-but-unverified apps */}
      {pendingVerificationApps.map(app => (
        <VerificationBannerClient 
          key={app.appId}
          applicationId={app.appId}
          jobTitle={app.jobTitle}
          companyName={app.companyName || "Company"}
        />
      ))}

      {/* My Shortlists Section */}
      {(shortlistedApps.length > 0 || pendingVerificationApps.length > 0) && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Star size={20} color="#f59e0b" /> My Shortlists
          </h2>
          <div className="grid grid-3" style={{ gap: "var(--space-4)" }}>
            {shortlistedApps.map(app => (
              <div key={app.appId} className="card" style={{ borderLeft: "4px solid #f59e0b", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{app.companyName || "Company"}</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>{app.jobTitle}</p>
                </div>
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} color="#f59e0b" />
                  <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>Awaiting final results...</span>
                </div>
              </div>
            ))}
            {pendingVerificationApps.map(app => (
              <div key={app.appId} className="card" style={{ borderLeft: "4px solid #6366f1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{app.companyName || "Company"}</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>{app.jobTitle}</p>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <ShieldCheck size={14} color="#6366f1" />
                    <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>Selected! Verify to start OD</span>
                  </div>
                  {app.verificationCode && (
                    <div style={{ background: "rgba(99,102,241,0.08)", padding: "8px 12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "4px", textAlign: "center", color: "#6366f1" }}>
                      {app.verificationCode}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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

      <ApprovedRequestsClient requests={approvedRequestsData} studentName={studentFullName} />

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
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Briefcase size={18} /> Browse Internships</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Apply directly to approved internships
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

