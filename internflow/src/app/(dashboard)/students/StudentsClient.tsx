"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, BookOpen, CheckSquare, Square, Search, Trash2, Mail, Download, Eye, X } from "lucide-react";

function StudentDetailModal({ student, onClose }: { student: any; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: "90%", maxWidth: "500px", padding: "var(--space-6)", position: "relative" }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
          <X size={20} />
        </button>
        
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gradient-accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, margin: "0 auto var(--space-3)" }}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "4px" }}>{student.firstName} {student.lastName}</h2>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{student.email}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Department</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{student.department || "Unassigned"}</div>
          </div>
          <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Year / Section</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Year {student.year || "-"} · Sec {student.section || "-"}</div>
          </div>
          <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Register No</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{student.registerNo || "N/A"}</div>
          </div>
          <div style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Phone</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{student.phone || "Not provided"}</div>
          </div>
        </div>

        {student.cgpa && (
          <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>CGPA</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{student.cgpa}</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function StudentsClient({ initialStudents, queryParam }: { initialStudents: any[], queryParam: string }) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(students.map(s => s.id)));
  };

  const exportCSV = () => {
    const selected = students.filter(s => selectedIds.has(s.id));
    const data = selected.length > 0 ? selected : students;
    const headers = ["First Name", "Last Name", "Email", "Department", "Year", "Section", "Phone", "Register No"];
    const rows = data.map(s => [
      s.firstName, s.lastName, s.email, s.department || "", s.year || "", s.section || "", s.phone || "", s.registerNo || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((c: string) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const departmentColors: Record<string, string> = {
    "Computer Science": "var(--color-primary)",
    "Information Technology": "var(--color-success)",
    "Artificial Intelligence": "var(--color-warning)",
    "Electronics": "var(--color-danger)",
    "Mechanical": "#8b5cf6",
  };

  const getDeptColor = (dept: string) => {
    for (const [key, color] of Object.entries(departmentColors)) {
      if (dept?.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return "var(--text-secondary)";
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Student Directory</h1>
          <p>Comprehensive list of all registered students and their academic profiles.</p>
        </div>
        <form method="GET" style={{ display: "flex", gap: "var(--space-2)" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input 
              type="search" 
              name="q" 
              placeholder="Search students..." 
              defaultValue={queryParam}
              className="input-field"
              style={{ paddingLeft: "36px", width: "250px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {/* Bulk Actions Toolbar (Animated) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              background: "var(--bg-card)", 
              padding: "12px 24px", 
              borderRadius: "12px", 
              marginBottom: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              border: "1px solid var(--color-primary)"
            }}
          >
            <div style={{ fontWeight: "bold", color: "var(--color-primary)" }}>
              {selectedIds.size} students selected
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px" }}>
                <Mail size={16} /> Email Group
              </button>
              <button className="btn btn-outline" onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px" }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export all button when none selected */}
      {selectedIds.size === 0 && students.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px" }}>
            <Download size={16} /> Export All CSV
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                <th style={{ padding: "var(--space-4)", width: "50px", textAlign: "center", cursor: "pointer" }} onClick={toggleAll}>
                  {selectedIds.size === students.length && students.length > 0 ? <CheckSquare size={18} color="var(--color-primary)" /> : <Square size={18} color="var(--text-muted)" />}
                </th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Student Name</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Department</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Batch / Section</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Contact Info</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {students.map((student, idx) => {
                    const isSelected = selectedIds.has(student.id);
                    const deptColor = getDeptColor(student.department);
                    
                    return (
                      <motion.tr 
                        key={student.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ backgroundColor: "var(--bg-hover)" }}
                        style={{ 
                          borderBottom: "1px solid var(--border-color)", 
                          backgroundColor: isSelected ? "var(--bg-hover)" : "transparent",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onClick={() => toggleSelect(student.id)}
                      >
                        <td style={{ padding: "var(--space-4)", textAlign: "center" }}>
                          <motion.div animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }}>
                            {isSelected ? <CheckSquare size={18} color="var(--color-primary)" /> : <Square size={18} color="var(--text-muted)" />}
                          </motion.div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", flexShrink: 0 }}>
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div>
                              {student.firstName} {student.lastName}
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "normal" }}>{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `color-mix(in srgb, ${deptColor} 10%, transparent)`, color: deptColor, padding: "4px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "bold" }}>
                            <GraduationCap size={14} />
                            {student.department || "Unassigned"}
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          <div style={{ display: "flex", gap: "16px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Award size={14} /> Yr {student.year || "-"}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <BookOpen size={14} /> Sec {student.section || "-"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            {student.phone || "No contact saved"}
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)", textAlign: "center" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingStudent(student); }}
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", minHeight: "auto", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem" }}
                            title="View student details"
                          >
                            <Eye size={16} /> View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {viewingStudent && (
          <StudentDetailModal student={viewingStudent} onClose={() => setViewingStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
