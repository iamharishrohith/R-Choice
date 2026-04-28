import { db } from "@/lib/db";
import { users, studentProfiles, studentEducation, studentSkills, studentProjects, studentCertifications, studentLinks, placementReadiness } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GraduationCap, Mail, Phone, Calendar, User, Code, Award, Briefcase, Link as LinkIcon, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";

export default async function StudentPortfolioPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="empty-state">
        <User size={48} />
        <h3>Access Denied</h3>
        <p>You must be logged in to view student profiles.</p>
        <Link href="/" className="btn btn-primary mt-4">Return to Home</Link>
      </div>
    );
  }

  // Fetch base user
  const userOpt = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!userOpt.length) notFound();
  const user = userOpt[0];

  // Fetch profile
  const profileOpt = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const profile = profileOpt.length > 0 ? profileOpt[0] : null;

  // Fetch nested data
  const education = profile ? await db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id)).orderBy(desc(studentEducation.endYear)) : [];
  const skills = profile ? await db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id)).orderBy(desc(studentSkills.isTop)) : [];
  const projects = profile ? await db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id)) : [];
  const certs = profile ? await db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id)).orderBy(desc(studentCertifications.issueDate)) : [];
  const readinessOpt = profile ? await db.select().from(placementReadiness).where(eq(placementReadiness.studentId, profile.id)).limit(1) : [];
  const readiness = readinessOpt.length > 0 ? readinessOpt[0] : null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        <Link href="/students" className="vcard-link" style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          &larr; Back to Students
        </Link>
      </div>

      {/* ── Hero Profile Section ── */}
      <div className="card" style={{ padding: "0", overflow: "hidden", position: "relative" }}>
        <div style={{ height: "120px", background: "var(--gradient-primary)", position: "relative" }}>
          <div style={{ position: "absolute", bottom: "-40px", left: "var(--space-6)", display: "flex", alignItems: "flex-end", gap: "var(--space-4)" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "var(--radius-full)", backgroundColor: "white", padding: "4px", boxShadow: "var(--shadow-sm)" }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.firstName} style={{ width: "100%", height: "100%", borderRadius: "var(--radius-full)", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: "var(--radius-full)", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
                  <User size={32} color="var(--text-muted)" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ padding: "var(--space-6)", paddingTop: "56px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", margin: "0 0 8px 0" }}>{user.firstName} {user.lastName}</h1>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                {profile?.registerNo && <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", outline: "1px solid var(--border-color)" }}>{profile.registerNo}</span>}
                {profile?.course && <span className="badge" style={{ background: "rgba(30, 155, 215, 0.1)", color: "var(--color-info)" }}>{profile.course}</span>}
                {profile?.department && <span className="badge" style={{ background: "rgba(141, 198, 63, 0.1)", color: "var(--color-success)" }}>{profile.department}</span>}
                {profile?.year && <span className="badge" style={{ background: "var(--bg-hover)" }}>Year {profile.year}</span>}
              </div>
              <p style={{ color: "var(--text-muted)", maxWidth: "800px", marginTop: "var(--space-2)" }}>
                {profile?.professionalSummary || user.about || "No professional summary provided yet."}
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                <Mail size={16} /> <a href={`mailto:${user.email}`} style={{ color: "inherit" }}>{user.email}</a>
              </div>
              {user.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <Phone size={16} /> <a href={`tel:${user.phone}`} style={{ color: "inherit" }}>{user.phone}</a>
                </div>
              )}
              {profile?.dob && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <Calendar size={16} /> {format(new Date(profile.dob), "MMM d, yyyy")}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                {profile?.linkedinLink && (
                  <a href={profile.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "32px" }}>
                    LinkedIn
                  </a>
                )}
                {profile?.githubLink && (
                  <a href={profile.githubLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "32px" }}>
                    GitHub
                  </a>
                )}
                {profile?.resumeUrl && (
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "32px" }}>
                    <FileText size={14} /> Resume
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)" }}>
        
        {/* ── Left Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          
          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
              <GraduationCap size={20} className="text-primary" /> Education Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ padding: "var(--space-3)", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600 }}>{profile?.school || "Rathinam College"}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {profile?.programType || "UG"} - {profile?.course || "Course"} in {profile?.department || "Department"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Batch: {profile?.batchStartYear ? `${profile?.batchStartYear}-${profile?.batchEndYear}` : "N/A"}
                  </span>
                  {profile?.cgpa && <strong style={{ color: "var(--color-success)" }}>CGPA: {profile.cgpa}</strong>}
                </div>
              </div>
              
              {education.map(ed => (
                <div key={ed.id} style={{ padding: "var(--space-3)", borderLeft: "2px solid var(--border-color)", marginLeft: "8px" }}>
                  <div style={{ fontWeight: 500 }}>{ed.institution}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{ed.degree} {ed.fieldOfStudy ? `in ${ed.fieldOfStudy}` : ""}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>{ed.startYear} - {ed.endYear || "Present"}</span>
                    {ed.score && <span>{ed.scoreType}: {ed.score}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
              <Code size={20} className="text-primary" /> Skills
            </h3>
            {skills.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map(s => (
                  <span key={s.id} className="badge" style={{ 
                    background: s.isTop ? "rgba(30, 155, 215, 0.1)" : "var(--bg-elevated)", 
                    color: s.isTop ? "var(--color-info)" : "var(--text-secondary)",
                    border: "1px solid var(--border-color)"
                  }}>
                    {s.isTop && <CheckCircle size={12} style={{ marginRight: "4px" }} />}
                    {s.skillName}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No skills listed.</p>
            )}
          </div>

        </div>

        {/* ── Right Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          
          {readiness && (
            <div className="card" style={{ borderTop: "3px solid var(--color-success)" }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>Placement Readiness Score</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-success)" }}>
                  {readiness.totalScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "8px", width: "100%", background: "var(--bg-elevated)", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ height: "100%", width: `${Math.min(readiness.totalScore || 0, 100)}%`, background: "var(--gradient-success)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>Badge: <strong style={{ textTransform: "capitalize" }}>{readiness.badgeLevel}</strong></span>
                    <span>Out of 100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
              <Briefcase size={20} className="text-primary" /> Projects
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {projects.length > 0 ? projects.map(p => (
                <div key={p.id} style={{ paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    {p.projectUrl && <a href={p.projectUrl} target="_blank" rel="noreferrer" style={{ color: "var(--text-link)", fontSize: "0.875rem" }}><LinkIcon size={14} /> Link</a>}
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "4px 0" }}>{p.description}</p>
                  {p.technologies && p.technologies.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                      {p.technologies.map(t => (
                        <span key={t} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "var(--bg-hover)", borderRadius: "4px", color: "var(--text-muted)" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No projects added.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
              <Award size={20} className="text-primary" /> Certifications
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {certs.length > 0 ? certs.map(c => (
                <div key={c.id} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-2)", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                  <Award size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: "4px" }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{c.name}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{c.issuingOrg}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {c.issueDate ? format(new Date(c.issueDate), "MMM yyyy") : ""}
                      {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noreferrer" style={{ marginLeft: "8px", color: "var(--text-link)" }}>View Credential</a>}
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No certifications added.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
