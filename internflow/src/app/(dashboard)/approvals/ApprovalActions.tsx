"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceApproval } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const router = useRouter();

  const openModal = (type: "approve" | "reject") => {
    setComment("");
    setShowModal(type);
  };

  const handleSubmit = () => {
    if (showModal === "reject" && comment.trim().length === 0) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setLoading(showModal);
    const action = showModal!;
    const finalComment = comment.trim() || undefined;
    setShowModal(null);

    startTransition(async () => {
      try {
        const result = await advanceApproval(requestId, action, finalComment);
        if (result?.error) {
          toast.error(result.error);
          setLoading(null);
          return;
        }
        if (action === "approve") {
          toast.success("Request approved and forwarded!", {
            description: finalComment
              ? `Your endorsement: "${finalComment}"`
              : "The request has been sent to the next approval level.",
          });
        } else {
          toast.error("Request rejected", {
            description: `Reason: ${finalComment}`,
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
    <>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => openModal("approve")}
          disabled={loading !== null}
          className="btn"
          style={{
            padding: "6px 12px",
            background: "rgba(34, 197, 94, 0.1)",
            color: "#22c55e",
            border: "none",
            transition: "all var(--transition-fast)",
            borderRadius: "var(--border-radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8125rem",
          }}
          title="Approve & Send to Next Level"
        >
          {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Approve
        </button>
        <button
          onClick={() => openModal("reject")}
          disabled={loading !== null}
          className="btn"
          style={{
            padding: "6px 12px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "none",
            transition: "all var(--transition-fast)",
            borderRadius: "var(--border-radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8125rem",
          }}
          title="Reject Request"
        >
          {loading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
      </div>

      {/* Comment Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: "90%", maxWidth: "460px",
              padding: "var(--space-6)", position: "relative",
              animation: "fadeIn 0.2s ease-out"
            }}
          >
            <button
              onClick={() => setShowModal(null)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-4)" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "10px",
                background: showModal === "approve" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {showModal === "approve"
                  ? <CheckCircle size={22} color="#22c55e" />
                  : <XCircle size={22} color="#ef4444" />}
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {showModal === "approve" ? "Approve Application" : "Reject Application"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {showModal === "approve"
                    ? "Optionally add an endorsement or suggestion."
                    : "A reason for rejection is required."}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                <MessageSquare size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {showModal === "approve" ? "Endorsement / Suggestion (Optional)" : "Reason for Rejection *"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={showModal === "approve"
                  ? "e.g. Strong candidate, well-suited for this role..."
                  : "e.g. Incomplete documentation, missing offer letter..."}
                className="input-field"
                rows={4}
                style={{
                  width: "100%", resize: "vertical", minHeight: "80px",
                  fontFamily: "inherit",
                }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(null)}
                className="btn btn-outline"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn"
                style={{
                  padding: "8px 20px",
                  background: showModal === "approve" ? "#22c55e" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--border-radius-sm)",
                  fontWeight: 600,
                }}
              >
                {showModal === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  );
}
