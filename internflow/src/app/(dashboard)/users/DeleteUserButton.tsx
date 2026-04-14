"use client";

import { Trash2 } from "lucide-react";

export default function DeleteUserButton({ userId, userName, deleteAction }: {
  userId: string;
  userName: string;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <form action={deleteAction} style={{ display: "inline-block" }}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        title="Delete user"
        onClick={(e) => {
          if (!confirm(`Delete ${userName}? This will permanently remove the account and all associated data. This action cannot be undone.`)) {
            e.preventDefault();
          }
        }}
        style={{
          background: "rgba(239,68,68,0.08)", color: "#ef4444",
          border: "none", borderRadius: "100%", height: "28px", width: "28px",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
        onMouseOut={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}
