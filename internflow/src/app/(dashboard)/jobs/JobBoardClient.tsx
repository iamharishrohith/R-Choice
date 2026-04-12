"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Building2, Calendar, Briefcase, Sparkles } from "lucide-react";
import ApplyButton from "./ApplyButton";

export default function JobBoardClient({ jobs, interests, isStudent }: { jobs: any[], interests: any[], isStudent: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");

  const roleKeywords = useMemo(() => interests.map(i => i.roleName.toLowerCase()), [interests]);

  const sortedAndFilteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.companyName?.toLowerCase().includes(q) || 
        j.description.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    }

    // Role preference sort multiplier
    result.sort((a, b) => {
      const aMatch = roleKeywords.some(kw => a.title.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw));
      const bMatch = roleKeywords.some(kw => b.title.toLowerCase().includes(kw) || b.description.toLowerCase().includes(kw));

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0; // Default created_at sort fallback
    });

    return result;
  }, [jobs, searchTerm, roleKeywords]);

  return (
    <>
      <div style={{ position: "relative", marginBottom: "var(--space-6)" }}>
        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} size={20} />
        <input 
          type="text" 
          placeholder="Search by company, role, or technology..." 
          className="input-field" 
          style={{ paddingLeft: "48px", height: "56px", fontSize: "1rem" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {sortedAndFilteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🔍</div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Active Postings Found</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            No opportunities matched your search criteria. Try broadening your keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: "var(--space-5)" }}>
          {sortedAndFilteredJobs.map((job, idx) => {
            const isRecommended = roleKeywords.some(kw => job.title.toLowerCase().includes(kw) || job.description.toLowerCase().includes(kw));
            
            return (
              <div key={job.id} className="card stagger-1" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", height: "100%", position: "relative", animationDelay: `${idx * 50}ms` }}>
                {isRecommended && (
                  <div style={{ position: "absolute", top: "-10px", right: "16px", background: "var(--gradient-primary)", color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", boxShadow: "var(--shadow-md)" }}>
                    <Sparkles size={12} /> Recommended Match
                  </div>
                )}
                <div style={{ display: "flex", gap: "16px", marginBottom: "var(--space-4)", marginTop: isRecommended ? "8px" : "0" }}>
                  <div style={{ 
                    width: "56px", height: "56px", 
                    background: "var(--bg-hover)", 
                    borderRadius: "12px", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" 
                  }}>
                    {job.companyName?.[0] || <Briefcase size={24} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", margin: "0 0 4px 0" }}>{job.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <Building2 size={14} /> {job.companyName}
                    </div>
                  </div>
                </div>

                <div style={{ flexGrow: 1 }}>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    color: "var(--text-secondary)", 
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: "var(--space-4)"
                  }}>
                    {job.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-5)" }}>
                    <span className="job-tag"><MapPin size={12} /> {job.location}</span>
                    <span className="job-tag"><Calendar size={12} /> Apply by {new Date(job.deadline!).toLocaleDateString()}</span>
                    <span className="job-tag">💰 {job.stipendInfo || "Unpaid"}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                  {isStudent ? (
                    <ApplyButton job={job as any} />
                  ) : (
                    <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ display: "flex", width: "100%", justifyContent: "center", gap: "8px" }}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
