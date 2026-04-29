"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, MapPin, Clock, Banknote, Building2, Calendar, Briefcase, Users, Star, CheckCircle2, Video, BookOpen, Wrench, Gift, HelpCircle, ExternalLink, Loader2 } from "lucide-react";
import { getFullJobDetails } from "@/app/actions/jobs";
import ApplyButton from "./ApplyButton";
import Link from "next/link";

type ModalProps = {
  jobId: string;
  isStudent: boolean;
  isApplied: boolean;
  onClose: () => void;
  jobBasic: { id: string; title: string; companyName: string | null };
};

type JobDetails = {
  id: string;
  title: string;
  description: string;
  responsibilities?: string | null;
  learnings?: string | null;
  location: string;
  workMode?: string | null;
  duration?: string | null;
  stipendSalary?: string | null;
  openingsCount?: number | null;
  applicationDeadline: string;
  startDate?: string | null;
  interviewMode?: string | null;
  jobType?: string | null;
  isPpoAvailable?: boolean | null;
  isCampusHiring?: boolean | null;
  requiredSkills?: string[] | null;
  mandatorySkills?: string[] | null;
  preferredSkills?: string[] | null;
  tools?: string[] | null;
  perks?: string[] | null;
  selectionRounds?: { round: string; date?: string; meetLink?: string }[] | null;
  selectionProcessSteps?: string[] | null;
  preferredQualifications?: string | null;
  minCgpa?: string | null;
  faq?: { question: string; answer: string }[] | null;
  domain?: string | null;
};

type CompanyInfo = {
  id: string;
  companyLegalName: string;
  brandName?: string | null;
  industrySector: string;
  website: string;
  logoUrl?: string | null;
  city: string;
  state: string;
  companySize?: string | null;
  companyDescription?: string | null;
};

export default function JobDetailModal({ jobId, isStudent, isApplied, onClose, jobBasic }: ModalProps) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [poster, setPoster] = useState<string>("Staff");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getFullJobDetails(jobId);
      if (!res.error && res.job) {
        setJob(res.job as JobDetails);
        setCompany(res.company as CompanyInfo | null);
        setPoster(res.poster || "Staff");
      }
      setLoading(false);
    })();
  }, [jobId]);

  // Close on Escape key
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const selectionRounds = (job?.selectionRounds as { round: string; date?: string; meetLink?: string }[] | null) || [];
  const allSkills = [...(job?.requiredSkills || []), ...(job?.mandatorySkills || [])];
  const uniqueSkills = [...new Set(allSkills)];
  const faq = (job?.faq as { question: string; answer: string }[] | null) || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)", zIndex: 1000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 800px)", maxHeight: "85vh",
          background: "var(--bg-primary)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          border: "1px solid var(--border-color)",
          zIndex: 1001,
          display: "flex", flexDirection: "column",
          animation: "modalSlideIn 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border-color)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {jobBasic.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              <Building2 size={14} />
              {company ? (
                <Link
                  href={`/company-profile/${company.id}`}
                  target="_blank"
                  style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                >
                  {company.companyLegalName}
                </Link>
              ) : (
                <span>{jobBasic.companyName || poster}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-hover)", border: "none", borderRadius: "8px",
              padding: "8px", cursor: "pointer", display: "flex",
              color: "var(--text-secondary)", flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0", gap: "12px", color: "var(--text-secondary)" }}>
              <Loader2 size={24} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
              Loading details...
            </div>
          ) : !job ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
              Failed to load job details.
            </div>
          ) : (
            <>
              {/* Badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: job.jobType === "full_time" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)", color: job.jobType === "full_time" ? "#10b981" : "#3b82f6" }}>
                  {(job.jobType || "internship").replace(/_/g, " ").toUpperCase()}
                </span>
                {job.isPpoAvailable && (
                  <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>PPO Available</span>
                )}
                {job.isCampusHiring && (
                  <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Campus Hiring</span>
                )}
                {job.domain && (
                  <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: "var(--bg-hover)", color: "var(--text-secondary)" }}>{job.domain}</span>
                )}
              </div>

              {/* Key Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                <InfoTile icon={<MapPin size={16} />} label="Location" value={job.location} />
                <InfoTile icon={<Clock size={16} />} label="Duration" value={job.duration || "—"} />
                <InfoTile icon={<Banknote size={16} />} label="Stipend" value={job.stipendSalary || "Unpaid"} />
                <InfoTile icon={<Users size={16} />} label="Openings" value={String(job.openingsCount || 1)} />
                <InfoTile icon={<Calendar size={16} />} label="Deadline" value={new Date(job.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                <InfoTile icon={<Briefcase size={16} />} label="Work Mode" value={job.workMode || "—"} />
                {job.interviewMode && <InfoTile icon={<Video size={16} />} label="Interview" value={job.interviewMode} />}
                {job.minCgpa && <InfoTile icon={<Star size={16} />} label="Min CGPA" value={job.minCgpa} />}
              </div>

              {/* Description */}
              <Section title="Job Description" icon={<BookOpen size={18} />}>
                <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{job.description}</p>
              </Section>

              {/* Responsibilities */}
              {job.responsibilities && (
                <Section title="Responsibilities" icon={<CheckCircle2 size={18} />}>
                  <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{job.responsibilities}</p>
                </Section>
              )}

              {/* What You'll Learn */}
              {job.learnings && (
                <Section title="What You'll Learn" icon={<BookOpen size={18} />}>
                  <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{job.learnings}</p>
                </Section>
              )}

              {/* Skills */}
              {uniqueSkills.length > 0 && (
                <Section title="Required Skills" icon={<Star size={18} />}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {uniqueSkills.map((skill, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(99, 102, 241, 0.08)", color: "var(--color-primary)", fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Preferred Skills */}
              {job.preferredSkills && job.preferredSkills.length > 0 && (
                <Section title="Preferred Skills" icon={<Star size={18} />}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {job.preferredSkills.map((skill, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(16, 185, 129, 0.08)", color: "#10b981", fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tools */}
              {job.tools && job.tools.length > 0 && (
                <Section title="Tools & Technologies" icon={<Wrench size={18} />}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {job.tools.map((tool, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b", fontWeight: 500 }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Selection Process */}
              {(selectionRounds.length > 0 || (job.selectionProcessSteps && job.selectionProcessSteps.length > 0)) && (
                <Section title="Selection Process" icon={<CheckCircle2 size={18} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectionRounds.length > 0
                      ? selectionRounds.map((r, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{r.round}</p>
                              {r.date && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                            </div>
                            {r.meetLink && (
                              <a href={r.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "4px 10px", display: "inline-flex", gap: "4px", textDecoration: "none" }}>
                                <Video size={14} /> Join
                              </a>
                            )}
                          </div>
                        ))
                      : job.selectionProcessSteps?.map((step, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.9rem" }}>{step}</p>
                          </div>
                        ))
                    }
                  </div>
                </Section>
              )}

              {/* Preferred Qualifications */}
              {job.preferredQualifications && (
                <Section title="Preferred Qualifications" icon={<Star size={18} />}>
                  <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{job.preferredQualifications}</p>
                </Section>
              )}

              {/* Perks */}
              {job.perks && job.perks.length > 0 && (
                <Section title="Perks & Benefits" icon={<Gift size={18} />}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {job.perks.map((perk, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6", fontWeight: 500 }}>
                        {perk}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* FAQ */}
              {faq.length > 0 && (
                <Section title="FAQ" icon={<HelpCircle size={18} />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {faq.map((item, i) => (
                      <div key={i} style={{ padding: "12px 16px", background: "var(--bg-hover)", borderRadius: "8px" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "0.9rem" }}>{item.question}</p>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Company Card */}
              {company && (
                <Section title="About the Company" icon={<Building2 size={18} />}>
                  <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)", flexShrink: 0 }}>
                      {company.companyLegalName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{company.companyLegalName}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {company.industrySector} • {company.city}, {company.state}
                        {company.companySize && ` • ${company.companySize} employees`}
                      </p>
                    </div>
                    <Link
                      href={`/company-profile/${company.id}`}
                      target="_blank"
                      className="btn btn-outline"
                      style={{ display: "flex", gap: "6px", alignItems: "center", textDecoration: "none", flexShrink: 0, fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                      <ExternalLink size={14} /> View Profile
                    </Link>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && job && (
          <div style={{
            padding: "16px 24px", borderTop: "1px solid var(--border-color)",
            display: "flex", justifyContent: "flex-end", gap: "12px",
            flexShrink: 0,
          }}>
            <button onClick={onClose} className="btn btn-outline">Close</button>
            {isStudent && (
              <ApplyButton
                job={{ id: job.id, title: job.title, description: job.description, location: job.location, companyName: company?.companyLegalName || null, stipendInfo: job.stipendSalary || null, deadline: job.applicationDeadline }}
                isApplied={isApplied}
              />
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-hover)", display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
        <span style={{ color: "var(--color-primary)" }}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}
