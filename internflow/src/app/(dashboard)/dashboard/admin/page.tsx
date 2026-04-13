import Link from "next/link";
import { AdminKpiCards } from "./AdminKpiCards";
import { AuditLogTypewriter } from "@/components/dashboard/admin/AuditLogTypewriter";
import { ExportDataButton } from "@/components/dashboard/admin/ExportDataButton";
import { db } from "@/lib/db";
import { users, internshipRequests, companyRegistrations, auditLogs } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";

export default async function AdminDashboard() {
  // Fetch real KPI data
  const [pendingResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(eq(internshipRequests.status, "pending_admin"));
  const pendingApprovals = pendingResult?.value ?? 0;

  const [studentsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "student"));
  const activeStudents = studentsResult?.value ?? 0;

  const [companiesResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "company"));
  const totalCompanies = companiesResult?.value ?? 0;

  // Calculate placement rate
  const [approvedResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(eq(internshipRequests.status, "approved"));
  const approvedCount = approvedResult?.value ?? 0;
  const placementRate = activeStudents > 0 ? Math.round((approvedCount / activeStudents) * 100) : 0;

  // Fetch real audit logs
  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Full platform overview — approvals, analytics, and management.</p>
      </div>

      <AdminKpiCards 
        pendingApprovals={pendingApprovals} 
        activeStudents={activeStudents} 
        totalCompanies={totalCompanies} 
        placementRate={placementRate} 
      />

      <div className="grid grid-2">
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Link href="/users/create" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card action-card">
                <p style={{ fontWeight: 600 }}>Create User Account</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Add students, staff, or admin accounts
                </p>
              </div>
            </Link>
            <Link href="/companies/review" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card action-card">
                <p style={{ fontWeight: 600 }}>Review Companies</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Approve pending company registrations
                </p>
              </div>
            </Link>
            <ExportDataButton />
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Activity</h2>
          <AuditLogTypewriter initialLogs={recentLogs.map(log => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType || "system",
            ipAddress: log.ipAddress || "Internal",
            createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
            userId: log.userId || "system",
          }))} />
        </div>
      </div>
    </div>
  );
}
