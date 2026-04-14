"use client";

import { Trash2 } from "lucide-react";

export default function DeleteCompanyButton({ companyId, companyName, deleteAction }: {
  companyId: string;
  companyName: string;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <button
        type="submit"
        title="Delete company"
        onClick={(e) => {
          if (!confirm(`Delete ${companyName}? This cannot be undone.`)) {
            e.preventDefault();
          }
        }}
        style={{
          background: "rgba(239,68,68,0.08)", color: "#ef4444",
          border: "none", borderRadius: "var(--border-radius-sm)",
          padding: "6px", cursor: "pointer", display: "flex", alignItems: "center",
        }}
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
