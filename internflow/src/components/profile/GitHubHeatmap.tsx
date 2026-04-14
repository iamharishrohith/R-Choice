"use client";

import { HelpCircle } from "lucide-react";
import { GitHubCalendar } from 'react-github-calendar';

export function GitHubHeatmap({ username }: { username: string }) {
  if (!username) return null;

  return (
    <div className="card" style={{ marginTop: "var(--space-6)", overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          GitHub Contributions
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>
            @{username}
          </span>
        </h3>
        <span title={`Fetching and displaying real GitHub contributions for @${username}.`} style={{ color: "var(--text-muted)", cursor: "help" }}>
          <HelpCircle size={14} />
        </span>
      </div>

      <div style={{ display: "flex", minWidth: "max-content", padding: "4px" }}>
        <GitHubCalendar 
          username={username} 
          blockSize={12}
          blockMargin={4}
          fontSize={12}
          theme={{
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
            dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
          }}
        />
      </div>
    </div>
  );
}
