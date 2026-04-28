"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertMapping, deleteMapping } from "@/app/actions/hierarchy";
import {
  GitBranch, Plus, Trash2, Save, Loader2, X,
  GraduationCap, Users, BookOpen, Crown, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

type StaffMember = { id: string; firstName: string; lastName: string };
type Mapping = {
  id: string;
  school?: string | null;
  section?: string | null;
  course?: string | null;
  department: string;
  year: number;
  programType?: string | null;
  tutorId: string | null;
  placementCoordinatorId: string | null;
  hodId: string | null;
  deanId: string | null;
};

import { COLLEGE_HIERARCHY, YEARS } from "@/lib/constants/hierarchy";

export default function HierarchyClient({
  initialMappings,
  tutors,
  coordinators,
  hods,
  deans,
}: {
  initialMappings: Mapping[];
  tutors: StaffMember[];
  coordinators: StaffMember[];
  hods: StaffMember[];
  deans: StaffMember[];
}) {
  const [mappings] = useState<Mapping[]>(initialMappings);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state
  const [school, setSchool] = useState("");
  const [section, setSection] = useState("");
  const [course, setCourse] = useState("");
  const [programType, setProgramType] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState(1);
  const [tutorId, setTutorId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [hodId, setHodId] = useState("");
  const [deanId, setDeanId] = useState("");

  const resetForm = () => {
    setSchool("");
    setSection("");
    setCourse("");
    setProgramType("");
    setDept("");
    setYear(1);
    setTutorId("");
    setCoordinatorId("");
    setHodId("");
    setDeanId("");
    setEditId(null);
  };

  const openEdit = (m: any) => {
    setSchool(m.school || "");
    setSection(m.section || "");
    setCourse(m.course || "");
    setProgramType(m.programType || "");
    setDept(m.department || "");
    setYear(m.year || 1);
    setTutorId(m.tutorId || "");
    setCoordinatorId(m.placementCoordinatorId || "");
    setHodId(m.hodId || "");
    setDeanId(m.deanId || "");
    setEditId(m.id);
    setShowForm(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      if (editId) fd.set("id", editId);
      fd.set("school", school);
      fd.set("section", section);
      fd.set("course", course);
      fd.set("programType", programType);
      fd.set("department", dept);
      fd.set("year", String(year));
      fd.set("tutorId", tutorId);
      fd.set("coordinatorId", coordinatorId);
      fd.set("hodId", hodId);
      fd.set("deanId", deanId);

      const result = await upsertMapping(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(editId ? "Mapping updated!" : "New mapping created!");
        setShowForm(false);
        resetForm();
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this mapping?")) return;
    startTransition(async () => {
      const result = await deleteMapping(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Mapping removed.");
        router.refresh();
      }
    });
  };

  const getName = (id: string | null, list: StaffMember[]) => {
    if (!id) return "Not Assigned";
    const found = list.find((s) => s.id === id);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown";
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GitBranch size={24} /> Authority Hierarchy
          </h1>
          <p>Map approval chains: Department + Year → Tutor → HOD → Dean</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={18} /> New Mapping
        </button>
      </div>

      {/* Flowchart Cards */}
      {mappings.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--text-secondary)" }}>
          <GitBranch size={48} style={{ margin: "0 auto var(--space-4)", opacity: 0.3 }} />
          <p>No authority mappings defined yet. Create one to establish the approval flow.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-5)" }}>
          {mappings.map((m) => (
            <div key={m.id} className="card" style={{ padding: "var(--space-5)", position: "relative" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    {m.course} - {m.department}
                    <span style={{
                      padding: "2px 10px", borderRadius: "100px", fontSize: "0.6875rem", fontWeight: 600,
                      background: m.programType === "PG" ? "rgba(168,85,247,0.1)" : "rgba(99,102,241,0.1)",
                      color: m.programType === "PG" ? "#a855f7" : "#6366f1",
                    }}>
                      {m.programType || "UG"}
                    </span>
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {m.school} • {m.section} • Year {m.year}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => openEdit(m)}
                    className="btn btn-outline"
                    style={{ padding: "4px 10px", fontSize: "0.8125rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="btn"
                    style={{ padding: "4px 10px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: "var(--border-radius-sm)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Flowchart visualization */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0",
                overflowX: "auto", padding: "var(--space-3) 0",
              }}>
                <FlowNode
                  icon={<GraduationCap size={18} />}
                  label="Students"
                  sublabel={`${m.department} Yr ${m.year}`}
                  color="#6366f1"
                />
                <FlowArrow />

                <FlowNode
                  icon={<BookOpen size={18} />}
                  label="Tutor"
                  sublabel={getName(m.tutorId, tutors)}
                  color="#0ea5e9"
                />
                <FlowArrow />

                <FlowNode
                  icon={<Users size={18} />}
                  label="HOD"
                  sublabel={getName(m.hodId, hods)}
                  color="#a855f7"
                />
                <FlowArrow />

                <FlowNode
                  icon={<Crown size={18} />}
                  label="Dean"
                  sublabel={getName(m.deanId, deans)}
                  color="#f59e0b"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }}
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: "90%", maxWidth: "520px",
              padding: "var(--space-6)", position: "relative",
              maxHeight: "85vh", overflowY: "auto",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "var(--space-5)" }}>
              {editId ? "Edit Mapping" : "New Authority Mapping"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={labelStyle}>School</label>
                  <select value={school} onChange={(e) => { setSchool(e.target.value); setSection(""); setCourse(""); setProgramType(""); setDept(""); }} className="input-field" style={{ width: "100%" }}>
                    <option value="" disabled>Select School...</option>
                    {COLLEGE_HIERARCHY.map(s => <option key={s.school} value={s.school}>{s.school}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Section</label>
                  <select value={section} onChange={(e) => { setSection(e.target.value); setCourse(""); setProgramType(""); setDept(""); }} className="input-field" style={{ width: "100%" }} disabled={!school}>
                    <option value="" disabled>Select Section...</option>
                    {COLLEGE_HIERARCHY.find(s => s.school === school)?.sections.map(sec => <option key={sec.section} value={sec.section}>{sec.section}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Course</label>
                  <select value={course} onChange={(e) => { setCourse(e.target.value); setProgramType(""); setDept(""); }} className="input-field" style={{ width: "100%" }} disabled={!section}>
                    <option value="" disabled>Select Course...</option>
                    {Array.from(new Set(COLLEGE_HIERARCHY.find(s => s.school === school)?.sections.find(sec => sec.section === section)?.courses.map(c => c.course) || [])).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Program Type</label>
                  <select value={programType} onChange={(e) => { setProgramType(e.target.value); setDept(""); }} className="input-field" style={{ width: "100%" }} disabled={!course}>
                    <option value="" disabled>Select Program...</option>
                    {Array.from(new Set(COLLEGE_HIERARCHY.find(s => s.school === school)?.sections.find(sec => sec.section === section)?.courses.filter(c => c.course === course).map(c => c.programType) || [])).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select value={dept} onChange={(e) => setDept(e.target.value)} className="input-field" style={{ width: "100%" }} disabled={!programType}>
                    <option value="" disabled>Select Department...</option>
                    {COLLEGE_HIERARCHY.find(s => s.school === school)?.sections.find(sec => sec.section === section)?.courses.find(c => c.course === course && c.programType === programType)?.departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>) || []}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field" style={{ width: "100%" }}>
                    {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <StaffSelect label="Tutor" value={tutorId} onChange={setTutorId} options={tutors} />
              <StaffSelect label="Placement Coordinator" value={coordinatorId} onChange={setCoordinatorId} options={coordinators} />
              <StaffSelect label="Head of Department" value={hodId} onChange={setHodId} options={hods} />
              <StaffSelect label="Dean" value={deanId} onChange={setDeanId} options={deans} />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "var(--space-5)" }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-outline" style={{ padding: "8px 16px" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="btn btn-primary"
                style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editId ? "Update" : "Create"} Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.8125rem", fontWeight: 500,
  color: "var(--text-secondary)", display: "block", marginBottom: "4px",
};

function StaffSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: StaffMember[];
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field" style={{ width: "100%" }}>
        <option value="">— Not Assigned —</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
        ))}
      </select>
    </div>
  );
}

function FlowNode({ icon, label, sublabel, color }: {
  icon: React.ReactNode; label: string; sublabel: string; color: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "var(--space-3) var(--space-4)",
      background: `color-mix(in srgb, ${color} 8%, transparent)`,
      borderRadius: "12px", minWidth: "120px",
      border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, marginBottom: "6px",
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.8125rem", color }}>{label}</div>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {sublabel}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: "var(--text-muted)" }}>
      <ArrowRight size={20} />
    </div>
  );
}
