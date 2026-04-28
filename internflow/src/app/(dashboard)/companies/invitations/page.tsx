import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyInvitations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import InvitationsClient from "./InvitationsClient";
import { Check, X, Clock } from "lucide-react";

export default async function InvitationsPage() {
  const session = await auth();
  if (!session?.user || !["mcr", "coe", "principal"].includes(session.user.role)) {
    return <div>Unauthorized. MCR permissions required.</div>;
  }

  const invites = await db.select().from(companyInvitations).orderBy(desc(companyInvitations.createdAt));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <InvitationsClient />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
        <h3 style={{ padding: 24, borderBottom: "1px solid var(--border-color)" }}>Recent Invitations</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Company Email</th>
                <th>Status</th>
                <th>Expires At</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => {
                const isExpired = new Date(inv.expiresAt) < new Date();
                return (
                  <tr key={inv.id}>
                    <td>{inv.companyEmail}</td>
                    <td>
                      {inv.isUsed ? (
                        <span style={{ color: "var(--color-success)", display: "flex", gap: 6, alignItems: "center" }}><Check size={14}/> Consumed</span>
                      ) : isExpired ? (
                        <span style={{ color: "var(--color-danger)", display: "flex", gap: 6, alignItems: "center" }}><X size={14}/> Expired</span>
                      ) : (
                        <span style={{ color: "var(--color-warning)", display: "flex", gap: 6, alignItems: "center" }}><Clock size={14}/> Pending</span>
                      )}
                    </td>
                    <td>{new Date(inv.expiresAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No invitations sent yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
