"use client";

import React, { useState } from "react";
import { UserCircle, Briefcase, Calendar, CheckCircle2, ChevronRight, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { postCompanyResults } from "@/app/actions/applications";

export default function ApplicantsClient({ initialApplicants }: { initialApplicants: any[] }) {
  const [applicants, setApplicants] = useState(initialApplicants);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);

  const toggleSelect = (studentId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(studentId)) newSet.delete(studentId);
    else newSet.add(studentId);
    setSelectedIds(newSet);
  };

  const handlePostResults = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one candidate to shortlist.");
      return;
    }

    // Since a company might have multiple jobs, we group by jobId
    // Or we assume this is grouped correctly. For simplicity here, we assume one bulk action per job.
    // Let's get the job ID from the first selected applicant
    const firstSelected = applicants.find(a => selectedIds.has(a.id));
    if (!firstSelected) return;

    setIsPosting(true);
    toast.loading("Sending Verification Emails...", { id: "posting-results" });
    
    // Group selected students by Job ID
    const groupedByJob: Record<string, string[]> = {};
    Array.from(selectedIds).forEach(studentId => {
      const app = applicants.find(a => a.id === studentId);
      if (app) {
        if (!groupedByJob[app.jobId]) groupedByJob[app.jobId] = [];
        groupedByJob[app.jobId].push(app.id); 
      }
    });

    try {
      let overallSuccess = true;
      for (const [jobId, studentIds] of Object.entries(groupedByJob)) {
        const res = await postCompanyResults(jobId, studentIds);
        if (res.error) {
          overallSuccess = false;
          toast.error(`Error for job ${jobId}: ${res.error}`, { id: "posting-results" });
        }
      }

      if (overallSuccess) {
        toast.success(`Verification Emails sent to ${selectedIds.size} candidates!`, { id: "posting-results" });
        // Update local state directly
        setApplicants(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status: "selected" } : a));
        setSelectedIds(new Set());
      }
    } catch (e) {
      toast.error("An unexpected error occurred.", { id: "posting-results" });
    }
    setIsPosting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Applicants Repository</h1>
          <p>Review student applications, view their resumes, and post final shortlisting results directly to the college.</p>
        </div>
        {selectedIds.size > 0 && (
          <button onClick={handlePostResults} disabled={isPosting} className="btn btn-primary" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isPosting ? <span className="spinner"></span> : <CheckCircle2 size={18} />}
            Post Results ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-elevated)" }}>
                <th style={{ padding: "var(--space-4)", width: "50px" }}><CheckSquare size={18} color="var(--text-secondary)" /></th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Candidate Profile</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Applied For</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applicants.map((app) => (
                  <tr key={`${app.id}-${app.jobId}`} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s", backgroundColor: selectedIds.has(app.id) ? "var(--bg-elevated)" : "transparent" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(app.id)} 
                        onChange={() => toggleSelect(app.id)}
                        disabled={app.status === "selected"}
                        style={{ cursor: app.status === "selected" ? "not-allowed" : "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                          {app.avatarUrl ? <Image src={app.avatarUrl} alt="Avatar" width={40} height={40} style={{width: "100%", height: "100%", objectFit:"cover"}} /> : <UserCircle size={24} color="var(--text-secondary)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</div>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{app.email}</div>
                          {app.resumeUrl && (
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary-color)", marginTop: "4px", display: "inline-block", textDecoration: "none" }}>
                              View Resume PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Briefcase size={16} /> {app.jobTitle}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} /> {app.appliedAt ? format(new Date(app.appliedAt), "MMM d, yyyy") : "N/A"}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`status-pill status-${app.status === 'selected' ? 'approved' : 'pending'}`}>
                        {app.status === 'selected' ? 'Selected (Emails Sent)' : 'Applied'}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                       <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.875rem" }} onClick={() => alert("Full Profile View Component coming soon!")}>
                         View Details <ChevronRight size={14} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
