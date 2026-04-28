"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton({ companyName }: { companyName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      title={`Delete ${companyName}`}
      aria-label={`Delete ${companyName}`}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Delete ${companyName}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
      style={{
        background: "rgba(239,68,68,0.08)", color: "#ef4444",
        border: "none", borderRadius: "var(--border-radius-sm)",
        padding: "6px", cursor: pending ? "wait" : "pointer", display: "flex", alignItems: "center",
        opacity: pending ? 0.6 : 1
      }}
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}

export default function DeleteCompanyButton({ companyId, companyName, deleteAction }: {
  companyId: string;
  companyName: string;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <SubmitButton companyName={companyName} />
    </form>
  );
}
