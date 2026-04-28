"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Users, Briefcase, Check } from "lucide-react";
import { exportStudentData, exportInternshipData } from "@/app/actions/export";

const STUDENT_COLUMNS = [
  { key: "registerNo", label: "Register No" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "school", label: "School" },
  { key: "department", label: "Department" },
  { key: "course", label: "Course" },
  { key: "section", label: "Section" },
  { key: "program", label: "Program (UG/PG)" },
  { key: "year", label: "Year" },
  { key: "batchStartYear", label: "Batch Start" },
  { key: "batchEndYear", label: "Batch End" },
  { key: "cgpa", label: "CGPA" },
];

const INTERNSHIP_COLUMNS = [
  { key: "studentName", label: "Student First Name" },
  { key: "studentLastName", label: "Student Last Name" },
  { key: "email", label: "Email" },
  { key: "companyName", label: "Company" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "applicationType", label: "Type" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "submittedAt", label: "Submitted At" },
];

function downloadCSV(data: Record<string, unknown>[], columns: string[], filename: string) {
  if (data.length === 0) return;
  const header = columns.join(",");
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportClient() {
  const [exportType, setExportType] = useState<"students" | "internships">("students");
  const [selectedCols, setSelectedCols] = useState<string[]>(STUDENT_COLUMNS.map(c => c.key));
  const [loading, setLoading] = useState(false);

  const columns = exportType === "students" ? STUDENT_COLUMNS : INTERNSHIP_COLUMNS;

  const toggleColumn = (key: string) => {
    setSelectedCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectAll = () => {
    setSelectedCols(columns.map(c => c.key));
  };

  const handleExport = async () => {
    if (selectedCols.length === 0) return;
    setLoading(true);
    try {
      const result = exportType === "students"
        ? await exportStudentData(selectedCols)
        : await exportInternshipData(selectedCols);

      if (result.success && result.data) {
        const filename = `internflow_${exportType}_${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(result.data, selectedCols, filename);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const switchType = (type: "students" | "internships") => {
    setExportType(type);
    setSelectedCols(type === "students" ? STUDENT_COLUMNS.map(c => c.key) : INTERNSHIP_COLUMNS.map(c => c.key));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Type selector */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => switchType("students")}
          className={`btn ${exportType === "students" ? "" : "btn-outline"}`}
          style={{ display: "flex", gap: "8px", alignItems: "center", background: exportType === "students" ? "var(--primary-color)" : undefined, color: exportType === "students" ? "white" : undefined }}
        >
          <Users size={16} /> Student Data
        </button>
        <button
          onClick={() => switchType("internships")}
          className={`btn ${exportType === "internships" ? "" : "btn-outline"}`}
          style={{ display: "flex", gap: "8px", alignItems: "center", background: exportType === "internships" ? "var(--primary-color)" : undefined, color: exportType === "internships" ? "white" : undefined }}
        >
          <Briefcase size={16} /> Internship Data
        </button>
      </div>

      {/* Column selector */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <FileSpreadsheet size={18} /> Select Columns to Export
          </h3>
          <button onClick={selectAll} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>Select All</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
          {columns.map(col => (
            <label
              key={col.key}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                border: selectedCols.includes(col.key) ? "2px solid var(--primary-color)" : "1px solid var(--border-color)",
                background: selectedCols.includes(col.key) ? "rgba(99, 102, 241, 0.05)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{
                width: "18px", height: "18px", borderRadius: "4px",
                border: selectedCols.includes(col.key) ? "none" : "2px solid var(--border-color)",
                background: selectedCols.includes(col.key) ? "var(--primary-color)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selectedCols.includes(col.key) && <Check size={12} color="white" />}
              </div>
              <input type="checkbox" checked={selectedCols.includes(col.key)} onChange={() => toggleColumn(col.key)} style={{ display: "none" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{col.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={loading || selectedCols.length === 0}
        className="btn btn-primary"
        style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", padding: "14px 24px", fontSize: "1rem" }}
      >
        <Download size={18} />
        {loading ? "Exporting..." : `Export ${selectedCols.length} Columns as CSV`}
      </button>
    </div>
  );
}
