import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Building, Globe, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function CompaniesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();
  const session = await auth();
  const isAdmin = session?.user?.role && ["dean", "placement_officer", "principal"].includes(session.user.role);

  let companies = await db
    .select()
    .from(users)
    .where(eq(users.role, "company"));

  if (queryParam) {
    companies = companies.filter(c => 
      c.firstName.toLowerCase().includes(queryParam) || 
      c.lastName.toLowerCase().includes(queryParam) ||
      (c.email && c.email.toLowerCase().includes(queryParam))
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Company Directory</h1>
          <p>List of all corporate partners registered on R-Choice for hiring.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <form method="GET" style={{ display: "flex", gap: "var(--space-2)" }}>
            <input 
              type="search" 
              name="q" 
              placeholder="Search companies..." 
              defaultValue={queryParam}
              style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}
            />
            <button type="submit" className="button">Search</button>
          </form>
          {isAdmin && (
            <Link href="/companies/review" style={{ textDecoration: "none" }}>
              <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Review Registrations
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          {companies.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
              No companies have registered yet.
            </div>
          ) : (
            companies.map((company) => (
              <div key={company.id} style={{ 
                border: "1px solid var(--border-color)", 
                borderRadius: "var(--radius-lg)", 
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: "var(--surface)", 
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Building size={24} color="var(--primary-color)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{company.firstName} {company.lastName}</div>
                    <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", marginTop: "4px" }}>
                      Authorized Partner
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Mail size={14} /> <a href={`mailto:${company.email}`} style={{ color: "inherit" }}>{company.email}</a>
                  </div>
                  {company.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <Phone size={14} /> <a href={`tel:${company.phone}`} style={{ color: "inherit" }}>{company.phone}</a>
                    </div>
                  )}
                  {company.createdAt && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      <Calendar size={14} /> Member since {format(new Date(company.createdAt), "MMM yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

