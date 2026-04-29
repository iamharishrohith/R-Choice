import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrations, jobPostings } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, Globe, MapPin, Calendar, Users, Briefcase,
  Mail, Phone, ArrowLeft, ExternalLink, Award, ShieldCheck, Link2
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id: companyId } = await props.params;

  const [company] = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.id, companyId))
    .limit(1);

  if (!company) return notFound();

  // Fetch active job postings by this company
  const activeJobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      location: jobPostings.location,
      jobType: jobPostings.jobType,
      stipendSalary: jobPostings.stipendSalary,
      applicationDeadline: jobPostings.applicationDeadline,
      workMode: jobPostings.workMode,
      openingsCount: jobPostings.openingsCount,
    })
    .from(jobPostings)
    .where(and(eq(jobPostings.companyId, companyId), eq(jobPostings.status, "approved")))
    .orderBy(desc(jobPostings.createdAt));

  const domains = (company.domains || []) as string[];
  const founderDetails = (company.founderDetails as { name?: string; designation?: string; linkedin?: string }[] | null) || [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "var(--space-4)", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Job Board
      </Link>

      {/* ── Hero Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)",
        borderRadius: "var(--border-radius-lg)",
        padding: "40px 32px",
        color: "white",
        marginBottom: "var(--space-6)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "-20px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "24px", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <div style={{
            width: "100px", height: "100px", borderRadius: "16px", border: "4px solid rgba(255,255,255,0.3)",
            background: company.logoUrl ? `url(${company.logoUrl}) center/cover` : "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", fontWeight: "bold", color: "rgba(255,255,255,0.8)",
            flexShrink: 0,
          }}>
            {!company.logoUrl && company.companyLegalName[0]}
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              {company.companyLegalName}
            </h1>
            {company.brandName && company.brandName !== company.companyLegalName && (
              <p style={{ margin: "4px 0 0 0", opacity: 0.85, fontSize: "1rem" }}>
                Trading as <strong>{company.brandName}</strong>
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px", alignItems: "center" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
                {company.industrySector}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", opacity: 0.9, fontSize: "0.9rem" }}>
                <MapPin size={14} /> {company.city}, {company.state}
              </span>
              {company.yearEstablished && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", opacity: 0.9, fontSize: "0.9rem" }}>
                  <Calendar size={14} /> Est. {company.yearEstablished}
                </span>
              )}
              {company.companySize && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", opacity: 0.9, fontSize: "0.9rem" }}>
                  <Users size={14} /> {company.companySize} employees
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: "8px", color: "white", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Globe size={14} /> Website
              </a>
              {activeJobs.length > 0 && (
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Briefcase size={14} /> {activeJobs.length} Active Opening{activeJobs.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── About ── */}
      {company.companyDescription && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="var(--color-primary)" /> About
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{company.companyDescription}</p>
        </div>
      )}

      {/* ── Key Information ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <InfoCard icon={<Building2 size={20} />} label="Company Type" value={company.companyType} color="#6366f1" />
        <InfoCard icon={<Award size={20} />} label="Industry" value={company.industrySector} color="#0ea5e9" />
        {company.companySize && <InfoCard icon={<Users size={20} />} label="Company Size" value={company.companySize} color="#10b981" />}
        {company.yearEstablished && <InfoCard icon={<Calendar size={20} />} label="Established" value={String(company.yearEstablished)} color="#f59e0b" />}
        {company.internshipType && <InfoCard icon={<Briefcase size={20} />} label="Internship Type" value={company.internshipType} color="#8b5cf6" />}
        {company.duration && <InfoCard icon={<Calendar size={20} />} label="Typical Duration" value={company.duration} color="#ec4899" />}
        {company.stipendRange && <InfoCard icon={<ShieldCheck size={20} />} label="Stipend Range" value={company.stipendRange} color="#14b8a6" />}
      </div>

      {/* ── Domains ── */}
      {domains.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={18} color="#8b5cf6" /> Domains & Expertise
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {domains.map((d, i) => (
              <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6", fontWeight: 500 }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Contact Information ── */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Mail size={18} color="#0ea5e9" /> Contact Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.05em" }}>HR Contact</p>
            <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{company.hrName}</p>
            <p style={{ margin: "0 0 2px 0", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Mail size={14} /> {company.hrEmail}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Phone size={14} /> {company.hrPhone}
            </p>
          </div>
          {company.ceoName && (
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.05em" }}>CEO / Leadership</p>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{company.ceoName}</p>
              {company.ceoDesignation && <p style={{ margin: "0 0 2px 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{company.ceoDesignation}</p>}
              {company.ceoEmail && (
                <p style={{ margin: "0 0 2px 0", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={14} /> {company.ceoEmail}
                </p>
              )}
              {company.ceoLinkedin && (
                <a href={company.ceoLinkedin} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.85rem", color: "var(--color-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <Link2 size={14} /> LinkedIn Profile
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Founder Details ── */}
      {founderDetails.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} color="#f59e0b" /> Founders
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {founderDetails.map((f, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", minWidth: "200px", flex: "1 1 200px" }}>
                <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{f.name}</p>
                {f.designation && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{f.designation}</p>}
                {f.linkedin && (
                  <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Location ── */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={18} color="#ef4444" /> Office Location
        </h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {company.address}, {company.city}, {company.state} — {company.pinCode}
        </p>
      </div>

      {/* ── Active Jobs ── */}
      {activeJobs.length > 0 && (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={18} color="#10b981" /> Current Openings ({activeJobs.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {activeJobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ padding: "var(--space-4)", borderLeft: "3px solid #10b981", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
                >
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>{job.title}</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.75rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}><MapPin size={12} /> {job.location}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}><Briefcase size={12} /> {job.workMode}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}><Users size={12} /> {job.openingsCount} openings</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span>{job.stipendSalary || "Unpaid"}</span>
                    <span suppressHydrationWarning>Deadline: {new Date(job.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", margin: "0 0 2px 0", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>{value}</p>
      </div>
    </div>
  );
}
