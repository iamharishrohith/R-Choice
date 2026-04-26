"use client";

import { useState } from "react";
import { Link2, Copy, Check, RefreshCw } from "lucide-react";

export function GenerateLinkButton() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/mcr/generate-link", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.link) {
        const fullLink = `${window.location.origin}${data.link}`;
        setLink(fullLink);
      }
    } catch {
      setError("Failed to generate link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API isn't available
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
        }}
      >
        {loading ? (
          <RefreshCw size={16} className="spin" />
        ) : (
          <Link2 size={16} />
        )}
        {loading ? "Generating…" : "Generate Company Registration Link"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-3)",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {link && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-4)",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "var(--space-2)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Registration Link (expires in 7 days)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <input
              type="text"
              readOnly
              value={link}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                fontSize: "0.8125rem",
                fontFamily: "monospace",
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: copied
                  ? "rgba(34, 197, 94, 0.1)"
                  : "var(--bg-secondary)",
                color: copied ? "#22c55e" : "var(--text-primary)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "var(--space-2)",
            }}
          >
            Share this link with the company to begin their onboarding
            registration.
          </p>
        </div>
      )}
    </div>
  );
}
