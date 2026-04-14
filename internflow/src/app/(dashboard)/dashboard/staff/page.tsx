import { Sparkles } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, internshipRequests } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export default async function StaffDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  // Get pending approvals count based on role
  let pendingCount = 0;
  const statusMap: Record<string, string> = {
    tutor: "pending_tutor",
    placement_coordinator: "pending_coordinator",
    hod: "pending_hod",
    dean: "pending_admin",
    placement_officer: "pending_admin",
    principal: "pending_admin",
  };
  const pendingStatus = role ? statusMap[role] : null;
  if (pendingStatus) {
    const [result] = await db
      .select({ value: count() })
      .from(internshipRequests)
      .where(eq(internshipRequests.status, pendingStatus as any));
    pendingCount = result?.value ?? 0;
  }

  // Get active students count
  const [studentsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "student"));
  const totalStudents = studentsResult?.value ?? 0;

  // Get active internships (approved requests)
  const [activeResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(eq(internshipRequests.status, "approved"));
  const activeInternships = activeResult?.value ?? 0;

  // Fetch recent pending requests (latest 5)
  const recentPending = pendingStatus
    ? await db
        .select({
          id: internshipRequests.id,
          studentId: internshipRequests.studentId,
          status: internshipRequests.status,
          createdAt: internshipRequests.createdAt,
        })
        .from(internshipRequests)
        .where(eq(internshipRequests.status, pendingStatus as any))
        .orderBy(internshipRequests.createdAt)
        .limit(5)
    : [];

  return (
    <div>
      <div className="page-header">
        <h1>Staff Dashboard</h1>
        <p>Manage approvals, view students, and track placement progress.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: String(pendingCount), color: "var(--color-warning)", href: "/approvals" },
          { label: "Total Students", value: String(totalStudents), color: "var(--color-info)", href: "/students" },
          { label: "Active Internships", value: String(activeInternships), color: "var(--rathinam-green)" },
        ].map((kpi) => {
          const content = (
            <div className="card" style={{ height: "100%", cursor: kpi.href ? "pointer" : "default" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
                {kpi.label}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          );

          return kpi.href ? (
             <Link href={kpi.href} key={kpi.label} style={{ textDecoration: "none", color: "inherit" }}>
               {content}
             </Link>
          ) : (
             <div key={kpi.label}>{content}</div>
          );
        })}
      </div>

      <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Approval Requests</h2>
      <div className="card">
        {recentPending.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            No pending requests. All caught up! <Sparkles size={18} />
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {recentPending.map((req) => (
              <Link key={req.id} href="/approvals" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ padding: "var(--space-3)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Student ID: {req.studentId?.slice(0, 8)}...</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <span className="status-pill status-pending">Pending</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
