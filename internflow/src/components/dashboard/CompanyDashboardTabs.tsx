"use client";

import { useState, useTransition } from "react";
import { Users, Briefcase, BarChart3, Plus, Trash2, Loader2, Mail, Phone, X, Building2 } from "lucide-react";
import { addCompanyStaff, removeCompanyStaff } from "@/app/actions/company-staff";

type Staff = {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string | null;
  phone: string | null;
};

type Job = {
  id: string;
  title: string;
  status: string | null;
  openingsCount: number;
  applicantCount: number;
  applicationDeadline: string;
};

type Analytics = {
  totalJobs: number;
  totalApplicants: number;
  pendingApprovals: number;
  shortlisted: number;
};

export default function CompanyDashboardTabs({
  staff,
  jobs,
  analytics,
}: {
  staff: Staff[];
  jobs: Job[];
  analytics: Analytics;
}) {
  const [tab, setTab] = useState<"overview" | "staff" | "jobs" | "analytics">("overview");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: <Building2 size={16} /> },
    { key: "staff" as const, label: "Staff", icon: <Users size={16} /> },
    { key: "jobs" as const, label: "Job Postings", icon: <Briefcase size={16} /> },
    { key: "analytics" as const, label: "Analytics", icon: <BarChart3 size={16} /> },
  ];

  function handleAddStaff(formData: FormData) {
    setFormError("");
    startTransition(async () => {
      const result = await addCompanyStaff(formData);
      if (result?.error) setFormError(result.error);
      else setShowAddForm(false);
    });
  }

  function handleRemoveStaff(id: string) {
    if (!confirm("Remove this staff member?")) return;
    startTransition(async () => {
      await removeCompanyStaff(id);
    });
  }

  return (
    <div>
      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "var(--space-6)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
              borderRadius: "8px", fontSize: "0.875rem", fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              background: tab === t.key ? "var(--bg-primary)" : "transparent",
              color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          <StatCard label="Total Jobs" value={analytics.totalJobs} color="#9b2e87" />
          <StatCard label="Total Applicants" value={analytics.totalApplicants} color="#3b82f6" />
          <StatCard label="Pending Approvals" value={analytics.pendingApprovals} color="#f59e0b" />
          <StatCard label="Shortlisted" value={analytics.shortlisted} color="#22c55e" />
        </div>
      )}

      {/* Staff Tab */}
      {tab === "staff" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Company Staff ({staff.length})</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="button" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}>
              {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Staff</>}
            </button>
          </div>

          {showAddForm && (
            <div className="card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)" }}>
              <form action={handleAddStaff} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
                <input name="name" placeholder="Full Name *" required className="input-field" style={{ padding: "8px 12px" }} />
                <input name="email" type="email" placeholder="Email *" required className="input-field" style={{ padding: "8px 12px" }} />
                <input name="designation" placeholder="Designation *" required className="input-field" style={{ padding: "8px 12px" }} />
                <input name="department" placeholder="Department" className="input-field" style={{ padding: "8px 12px" }} />
                <input name="phone" type="tel" placeholder="Phone" className="input-field" style={{ padding: "8px 12px" }} />
                <input name="password" type="password" placeholder="Password *" required minLength={8} className="input-field" style={{ padding: "8px 12px" }} />
                <div style={{ display: "flex", alignItems: "end" }}>
                  <button type="submit" className="button" disabled={isPending} style={{ padding: "8px 20px", fontSize: "0.875rem" }}>
                    {isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Add"}
                  </button>
                </div>
              </form>
              {formError && <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "8px" }}>{formError}</p>}
            </div>
          )}

          {staff.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p>No staff members added yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-3)" }}>
              {staff.map(s => (
                <div key={s.id} className="card" style={{ padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "2px" }}>{s.name}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{s.designation}{s.department ? ` · ${s.department}` : ""}</div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12} /> {s.email}</span>
                      {s.phone && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={12} /> {s.phone}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveStaff(s.id)} title="Remove" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {tab === "jobs" && (
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Your Job Postings ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
              <Briefcase size={40} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p>No job postings yet. Post your first opportunity!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {jobs.map(j => (
                <div key={j.id} className="card" style={{ padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "2px" }}>{j.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {j.openingsCount} openings · {j.applicantCount} applicants · Deadline: {j.applicationDeadline}
                    </div>
                  </div>
                  <span className={`status-pill status-${(j.status || "draft").split("_")[0]}`}>
                    {(j.status || "draft").replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Hiring Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <StatCard label="Jobs Posted" value={analytics.totalJobs} color="#9b2e87" />
            <StatCard label="Total Applicants" value={analytics.totalApplicants} color="#3b82f6" />
            <StatCard label="Pending Levels" value={analytics.pendingApprovals} color="#f59e0b" />
            <StatCard label="Shortlisted" value={analytics.shortlisted} color="#22c55e" />
          </div>

          <div className="card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Approval Pipeline</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
              {["Tutor", "PC", "HOD", "Dean", "PO", "COE", "Principal"].map((stage, i) => (
                <div key={stage} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                    {stage}
                  </div>
                  {i < 6 && <span style={{ color: "var(--text-muted)" }}>→</span>}
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "var(--space-3)" }}>
              Student applications pass through {7} approval tiers before final placement confirmation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
      </div>
      <div>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}
