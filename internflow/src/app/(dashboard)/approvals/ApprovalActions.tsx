"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceApproval } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (action: "approve" | "reject") => {
    setLoading(action);
    startTransition(async () => {
      try {
        const result = await advanceApproval(requestId, action);
        if (result?.error) {
          toast.error(result.error);
          setLoading(null);
          return;
        }
        if (action === "approve") {
          toast.success("Request approved and forwarded!", {
            description: "The request has been sent to the next approval level.",
          });
        } else {
          toast.error("Request rejected", {
            description: "The applicant has been notified.",
          });
        }
        setDone(true);
        router.refresh();
      } catch {
        toast.error("Action failed. Please try again.");
      }
      setLoading(null);
    });
  };

  if (done) {
    return <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Processed</span>;
  }

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="btn"
        style={{
          padding: "6px 12px",
          background: "rgba(34, 197, 94, 0.1)",
          color: "#22c55e",
          border: "none",
          transition: "all var(--transition-fast)",
          borderRadius: "var(--border-radius-sm)",
        }}
        title="Approve & Send to Next Level"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="btn"
        style={{
          padding: "6px 12px",
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "none",
          transition: "all var(--transition-fast)",
          borderRadius: "var(--border-radius-sm)",
        }}
        title="Reject Request"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {loading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
      </button>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
