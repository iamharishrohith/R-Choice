"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateJobPosting } from "@/app/actions/jobs";
import { Pencil, X, Loader2, Calendar, MapPin, DollarSign, Users, Save } from "lucide-react";
import { toast } from "sonner";

interface EditJobModalProps {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    stipendSalary: string;
    applicationDeadline: string;
    openingsCount: number;
  };
}

export function EditJobButton({ job }: EditJobModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-outline"
        style={{
          padding: "6px 14px", display: "inline-flex",
          alignItems: "center", gap: "6px", fontSize: "0.8125rem",
        }}
      >
        <Pencil size={14} /> Edit Job
      </button>

      {open && <EditJobModal job={job} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditJobModal({ job, onClose }: EditJobModalProps & { onClose: () => void }) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [location, setLocation] = useState(job.location);
  const [stipend, setStipend] = useState(job.stipendSalary);
  const [deadline, setDeadline] = useState(job.applicationDeadline);
  const [openings, setOpenings] = useState(String(job.openingsCount));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("description", description);
      fd.set("location", location);
      fd.set("stipendSalary", stipend);
      fd.set("deadline", deadline);
      fd.set("openingsCount", openings);

      const result = await updateJobPosting(job.id, fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Job updated successfully!");
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: "90%", maxWidth: "560px",
          padding: "var(--space-6)", position: "relative",
          maxHeight: "85vh", overflowY: "auto",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "var(--space-5)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Pencil size={20} /> Edit Job Posting
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Job Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={4}
              style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <MapPin size={14} /> Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <DollarSign size={14} /> Stipend / Salary
              </label>
              <input
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <Calendar size={14} /> Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <Users size={14} /> Openings
              </label>
              <input
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "var(--space-5)" }}>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: "8px 16px" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="btn btn-primary"
            style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
