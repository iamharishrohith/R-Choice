import { auth } from "@/lib/auth";
import { getPendingRequestsForStaff } from "@/lib/db/queries/approvals";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import ApprovalActions from "./ApprovalActions";
import Link from "next/link";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = (session.user as any).role;
  // Let's only allow staff/admins
  if (role === "student" || role === "company" || role === "alumni") {
    redirect("/dashboard/student");
  }

  const params = await searchParams;
  const filter = params.filter;
  const actualFilter = role === "dean" ? (filter || "pending") : "pending";

  const requests = await getPendingRequestsForStaff(session.user.id, role, actualFilter);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>{actualFilter === 'pending' ? 'Action Required' : 'Approval History'}</h1>
        <p>Review and approve internship requests pending at your level.</p>
      </div>

      {role === "dean" && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)' }}>
          <Link href="?filter=pending" className={`btn ${actualFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}>Pending Approval</Link>
          <Link href="?filter=approved" className={`btn ${actualFilter === 'approved' ? 'btn-primary' : 'btn-outline'}`}>Successfully Approved</Link>
          <Link href="?filter=rejected" className={`btn ${actualFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}>Rejected Approval</Link>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>✅</div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>All Caught Up!</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            There are no student internship requests waiting for your approval right now.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Role</th>
                <th>Type</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 600 }}>{req.studentName}</td>
                  <td>{req.companyName}</td>
                  <td>{req.role}</td>
                  <td>
                    <span className="badge">
                      {req.applicationType}
                    </span>
                  </td>
                  <td>{new Date(req.submittedAt!).toLocaleDateString()}</td>
                  <td>
                    <ApprovalActions requestId={req.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .data-table th, .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .data-table th {
          background: var(--bg-hover);
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }
        .badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 8px;
          background: var(--bg-hover);
          border-radius: 4px;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
