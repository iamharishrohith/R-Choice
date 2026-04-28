"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton({ userName }: { userName: string }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      title={`Delete ${userName}`}
      aria-label={`Delete ${userName}`}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Delete ${userName}? This will permanently remove the account and all associated data. This action cannot be undone.`)) {
          e.preventDefault();
        }
      }}
      style={{
        background: "rgba(239,68,68,0.08)", color: "#ef4444",
        border: "none", borderRadius: "100%", height: "28px", width: "28px",
        cursor: pending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s",
        opacity: pending ? 0.6 : 1
      }}
      onMouseOver={e => !pending && (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
      onMouseOut={e => !pending && (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}

export default function DeleteUserButton({ userId, userName, deleteAction }: {
  userId: string;
  userName: string;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <form action={deleteAction} style={{ display: "inline-block" }}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton userName={userName} />
    </form>
  );
}
