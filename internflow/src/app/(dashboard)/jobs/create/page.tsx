"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Briefcase } from "lucide-react";
import Link from "next/link";
import { createJobPosting } from "@/app/actions/jobs";
import { toast } from "sonner";

export default function CreateJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createJobPosting(formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Job posted! Pending MCR verification.");
      router.push("/jobs/manage");
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: 64 }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/jobs/manage" className="btn btn-ghost" style={{ padding: "8px 0" }}>
          <ArrowLeft size={16} /> Back to My Postings
        </Link>
      </div>

      <div className="page-header" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ padding: "12px", background: "var(--bg-hover)", borderRadius: "var(--border-radius-md)" }}>
          <Briefcase size={24} color="var(--primary-color)" />
        </div>
        <div>
          <h1>Create New Opportunity</h1>
          <p>Publish an advanced internship tracking profile to the R-Choice talent pool.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* SECTION 1 */}
          <section>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 8, marginBottom: 16 }}>1. Basic Parameters</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="input-group">
                <label>Job Title / Role *</label>
                <input name="title" className="input-field" required placeholder="e.g. Frontend Intern" />
              </div>
              <div className="input-group">
                <label>Domain</label>
                <input name="domain" className="input-field" required placeholder="e.g. IT, Design, Mechanics" />
              </div>
              <div className="input-group">
                <label>Mode</label>
                <select name="mode" className="input-field" required>
                  <option value="Internship Only">Internship Only</option>
                  <option value="Internship + Fulltime (PPO)">Internship + Fulltime (PPO)</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
              <div className="input-group">
                <label>Internship Type *</label>
                <select name="internshipType" className="input-field" required>
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="input-group">
                <label>Location (City)</label>
                <input name="location" className="input-field" required placeholder="e.g. Coimbatore" />
              </div>
              <div className="input-group">
                <label>Duration *</label>
                <input name="duration" className="input-field" required placeholder="e.g. 6 Months" />
              </div>
              <div className="input-group">
                <label>No. of Openings *</label>
                <input type="number" name="openingsCount" className="input-field" required defaultValue={1} min={1} />
              </div>
              <div className="input-group">
                <label>Application Deadline *</label>
                <input type="date" name="applicationDeadline" className="input-field" required />
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 8, marginBottom: 16 }}>2. Description & Requirements</h3>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>General Description *</label>
              <textarea name="description" className="input-field" required rows={3} placeholder="About the role..."></textarea>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Roles and Responsibilities *</label>
              <textarea name="rolesAndResponsibilities" className="input-field" required rows={3} placeholder="- Develop React components..."></textarea>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>What the intern will learn *</label>
              <textarea name="learnings" className="input-field" required rows={2} placeholder="- Agile methodologies..."></textarea>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="input-group">
                <label>Mandatory Skills (Comma separated)</label>
                <input name="requiredSkills" className="input-field" placeholder="React, Node, Postgres" />
              </div>
              <div className="input-group">
                <label>Tools Stack (Comma separated)</label>
                <input name="tools" className="input-field" placeholder="VS Code, Figma, Jira" />
              </div>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>Preferred Qualifications</label>
                <input name="preferredQualifications" className="input-field" placeholder="Prior internship experience..." />
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 8, marginBottom: 16 }}>3. Eligibility & Compensation</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="input-group">
                <label>Eligible Degrees (Comma separated)</label>
                <input name="eligibilityDegree" className="input-field" placeholder="B.E, B.Tech, M.Sc" />
              </div>
              <div className="input-group">
                <label>Eligible Departments (Comma separated)</label>
                <input name="departmentEligibility" className="input-field" placeholder="CSE, IT, ECE" />
              </div>
              <div className="input-group">
                <label>Eligible Passing Years (Comma separated)</label>
                <input name="yearEligibility" className="input-field" placeholder="2025, 2026" />
              </div>
              <div className="input-group">
                <label>Compensation</label>
                <select name="isPaid" className="input-field">
                  <option value="true">Paid Stipend</option>
                  <option value="false">Unpaid</option>
                </select>
              </div>
              <div className="input-group">
                <label>Stipend Range</label>
                <input name="stipendSalary" className="input-field" placeholder="e.g. 15,000 INR/Month" />
              </div>
            </div>
          </section>

          {error && <div style={{ color: "var(--color-danger)", padding: 12, background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingtop: 24, borderTop: "1px solid var(--border-color)" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ padding: "12px 32px" }}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isLoading ? "Publishing..." : "Submit for MCR Review"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
