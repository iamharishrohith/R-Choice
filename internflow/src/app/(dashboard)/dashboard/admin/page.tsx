import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Full platform overview — approvals, analytics, and management.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: "8", color: "var(--rathinam-gold)" },
          { label: "Active Students", value: "2,450", color: "var(--rathinam-teal)" },
          { label: "Companies", value: "24", color: "var(--rathinam-purple)" },
          { label: "Placement Rate", value: "78%", color: "var(--rathinam-green)" },
        ].map((kpi) => {
          let dest = "";
          if (userRole === "dean") {
            if (kpi.label === "Pending Approvals") dest = "/approvals";
            else if (kpi.label === "Active Students") dest = "/students";
            else if (kpi.label === "Companies") dest = "/companies";
          }
          
          const cardContent = (
            <div className="card" key={!dest ? kpi.label : undefined} style={dest ? { height: "100%", cursor: "pointer" } : {}}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
                {kpi.label}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          );

          if (dest) {
            return (
              <Link key={kpi.label} href={dest} style={{ display: "block", textDecoration: "none", color: "inherit", height: "100%" }}>
                {cardContent}
              </Link>
            );
          }

          return cardContent;
        })}
      </div>

      <div className="grid grid-2">
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="card" style={{ cursor: "pointer" }}>
              <p style={{ fontWeight: 600 }}>Create User Account</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Add students, staff, or admin accounts
              </p>
            </div>
            {userRole === "dean" ? (
              <Link href="/companies" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="card" style={{ cursor: "pointer" }}>
                  <p style={{ fontWeight: 600 }}>Review Companies</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Approve pending company registrations
                  </p>
                </div>
              </Link>
            ) : (
              <div className="card" style={{ cursor: "pointer" }}>
                <p style={{ fontWeight: 600 }}>Review Companies</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Approve pending company registrations
                </p>
              </div>
            )}
            <div className="card" style={{ cursor: "pointer" }}>
              <p style={{ fontWeight: 600 }}>Export Data</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Download reports as Excel sheets
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Activity</h2>
          <div className="card">
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)" }}>
              Activity feed will appear here once the system is live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
