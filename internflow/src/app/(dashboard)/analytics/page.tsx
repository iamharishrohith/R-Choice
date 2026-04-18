import { db } from "@/lib/db";
import { users, internshipRequests, jobPostings, studentProfiles } from "@/lib/db/schema";
import { Users, FileText, Briefcase } from "lucide-react";
import { eq, sql } from "drizzle-orm";

import { Sparkline } from "@/components/ui/charts/Sparkline";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { LiquidGauge } from "@/components/ui/charts/LiquidGauge";
import { Treemap } from "@/components/ui/charts/Treemap";

// Helper to bucket dates into a 12-month array
function getMonthlyTimeline(dates: (Date | null)[]) {
  const currentYear = new Date().getFullYear();
  const buckets = Array(12).fill(0);
  let total = 0;
  
  // Create cumulative progression through the year
  dates.forEach(d => {
    if (d && d.getFullYear() === currentYear) {
      buckets[d.getMonth()]++;
    }
  });

  // Calculate cumulative running totals for the sparkline
  for (let i = 0; i < 12; i++) {
    total += buckets[i];
    buckets[i] = total;
  }
  
  // If no data, return flatline
  if (total === 0) return Array(12).fill(0);
  return buckets;
}

export default async function AnalyticsPage() {
  // Aggregate stats via Drizzle (Parallelized for performance)
  const [totalStudentsRes, totalCompaniesRes, totalJobsRes, requestsStats] = await Promise.all([
    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.role, "student")),
    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.role, "company")),
    db.select({ createdAt: jobPostings.createdAt }).from(jobPostings),
    db.select({
      status: internshipRequests.status,
      count: sql`count(*)`
    })
    .from(internshipRequests)
    .groupBy(internshipRequests.status)
  ]);

  const totalStudents = totalStudentsRes.length || 0;
  const totalCompanies = totalCompaniesRes.length || 0;
  const totalJobs = totalJobsRes.length || 0;

  const studentTrace = getMonthlyTimeline(totalStudentsRes.map(u => u.createdAt));
  const companyTrace = getMonthlyTimeline(totalCompaniesRes.map(c => c.createdAt));
  const jobTrace = getMonthlyTimeline(totalJobsRes.map(j => j.createdAt));

  let approved = 0, pending = 0, rejected = 0;
  requestsStats.forEach(stat => {
    if (stat.status === "approved") approved += Number(stat.count);
    else if (stat.status === "rejected") rejected += Number(stat.count);
    else pending += Number(stat.count); // any pending tier
  });
  
  const pipelineData = [
    { label: "Approved Internships", value: approved, color: "#10b981" },
    { label: "Awaiting Review", value: pending, color: "#f59e0b" },
    { label: "Rejected Apps", value: rejected, color: "#ef4444" },
  ];

  // Fetch real department distribution from studentProfiles
  const deptDistribution = await db
    .select({
      department: studentProfiles.department,
      count: sql`count(*)`,
    })
    .from(studentProfiles)
    .groupBy(studentProfiles.department);

  const deptColors: Record<string, string> = {
    "Computer Science": "#6366f1",
    "Information Technology": "#8b5cf6",
    "Artificial Intelligence": "#ec4899",
    "Electronics": "#f43f5e",
    "Mechanical": "#f59e0b",
    "Civil": "#0ea5e9",
    "Business Administration": "#10b981",
  };

  const treemapData = deptDistribution.map(d => ({
    label: d.department.length > 12 ? d.department.slice(0, 12) + "…" : d.department,
    value: Number(d.count),
    color: deptColors[d.department] || "#6b7280",
  }));

  const placementRate = Math.min(100, Math.round((approved / (totalStudents || 1)) * 100)) || 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p>Real-time platform metrics and rich internship application statistics.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {/* Core Network Stats with Gamified Sparklines */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", zIndex: 1 }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color="#6366f1" />
            </div>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Active Students</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalStudents}</div>
            </div>
          </div>
          <div style={{ marginTop: "auto", position: "relative", zIndex: 0, margin: "0 calc(var(--space-4) * -1) calc(var(--space-4) * -1)" }}>
             <Sparkline data={studentTrace} color="#6366f1" height={40} />
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", zIndex: 1 }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(168, 85, 247, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={24} color="#a855f7" />
            </div>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Partner Companies</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalCompanies}</div>
            </div>
          </div>
          <div style={{ marginTop: "auto", position: "relative", zIndex: 0, margin: "0 calc(var(--space-4) * -1) calc(var(--space-4) * -1)" }}>
             <Sparkline data={companyTrace} color="#a855f7" height={40} />
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", zIndex: 1 }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(14, 165, 233, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={24} color="#0ea5e9" />
            </div>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Live Job Postings</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalJobs}</div>
            </div>
          </div>
          <div style={{ marginTop: "auto", position: "relative", zIndex: 0, margin: "0 calc(var(--space-4) * -1) calc(var(--space-4) * -1)" }}>
             <Sparkline data={jobTrace} color="#0ea5e9" height={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
        {/* Pipeline Donut Chart */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-6)", textAlign: "center" }}>Pipeline Distribution</h2>
          <DonutChart data={pipelineData} size={250} strokeWidth={24} />
          
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-4)", marginTop: "var(--space-8)" }}>
            {pipelineData.map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: d.color }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Department Placement Treemap */}
          <div className="card" style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Department Trajectory</h2>
            <Treemap data={treemapData} height={160} />
          </div>

          {/* Institutional Conversion Gauge */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-2)" }}>Institutional Rate</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "200px" }}>Overall percentage of enrolled students who have secured a placement.</p>
            </div>
            <LiquidGauge value={placementRate} size={140} color="#10b981" />
          </div>
        </div>
      </div>
    </div>
  );
}
