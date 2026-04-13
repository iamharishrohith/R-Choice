import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Building, CheckCircle, XCircle, Clock, Globe, Mail, Phone, MapPin } from "lucide-react";

export default async function CompanyReviewPage() {
  const session = await auth();
  const role = session?.user?.role;
  
  if (!role || !["dean", "placement_officer", "principal"].includes(role)) {
    redirect("/");
  }

  const registrations = await db.select().from(companyRegistrations).orderBy(companyRegistrations.createdAt);

  async function reviewCompany(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    const role = session.user.role;
    if (!["dean", "placement_officer", "principal"].includes(role)) return;

    const id = formData.get("id") as string;
    const action = formData.get("action") as string;
    const comment = formData.get("comment") as string;

    await db.update(companyRegistrations).set({
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: session.user.id,
      reviewedByRole: role,
      reviewComment: comment || null,
      reviewedAt: new Date(),
    }).where(eq(companyRegistrations.id, id));

    revalidatePath("/companies/review");
  }

  const pending = registrations.filter(r => r.status === "pending");
  const reviewed = registrations.filter(r => r.status !== "pending");

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Company Registration Review</h1>
        <p>Review and approve or reject company registration applications.</p>
      </div>

      {pending.length === 0 && reviewed.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--text-secondary)" }}>
          <Building size={48} style={{ margin: "0 auto var(--space-4)", opacity: 0.3 }} />
          <p>No company registrations found.</p>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h2 style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="var(--status-pending)" /> Pending Review ({pending.length})
          </h2>
          <div style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
            {pending.map(reg => (
              <div key={reg.id} className="card" style={{ padding: "var(--space-6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "var(--space-2)" }}>{reg.companyLegalName}</h3>
                    {reg.brandName && <div style={{ color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>Brand: {reg.brandName}</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building size={14} /> {reg.companyType} · {reg.industrySector}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {reg.city}, {reg.state}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe size={14} /> <a href={reg.website} target="_blank" rel="noopener noreferrer">{reg.website}</a></span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={14} /> {reg.hrEmail}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={14} /> {reg.hrPhone}</span>
                      <span>HR: {reg.hrName}</span>
                    </div>
                    {reg.companySize && <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>Size: {reg.companySize} · Est. {reg.yearEstablished || "N/A"}</div>}
                  </div>
                  <span className="status-pill status-pending">Pending</span>
                </div>

                <form action={reviewCompany} style={{ marginTop: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end" }}>
                  <input type="hidden" name="id" value={reg.id} />
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Review Comment (Optional)</label>
                    <input name="comment" placeholder="Add a note..." className="input-field" style={{ height: "40px" }} />
                  </div>
                  <button type="submit" name="action" value="approve" className="btn" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button type="submit" name="action" value="reject" className="btn" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <XCircle size={16} /> Reject
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Previously Reviewed ({reviewed.length})</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                    <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-secondary)", fontSize: "0.875rem" }}>Company</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-secondary)", fontSize: "0.875rem" }}>Status</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 500, color: "var(--text-secondary)", fontSize: "0.875rem" }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map(reg => (
                    <tr key={reg.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <div style={{ fontWeight: 600 }}>{reg.companyLegalName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{reg.industrySector}</div>
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <span className={`status-pill ${reg.status === "approved" ? "status-approved" : "status-rejected"}`}>{reg.status}</span>
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{reg.reviewComment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
