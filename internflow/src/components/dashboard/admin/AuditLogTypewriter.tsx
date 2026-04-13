"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldAlert, CheckCircle, Database, UserCheck, Key, Shield } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  ipAddress: string;
  createdAt: string;
  userId: string;
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AuditLogTypewriter({ initialLogs }: { initialLogs: AuditLog[] }) {
  const logs = initialLogs.length > 0 ? initialLogs : [
    { id: "empty", action: "No audit events recorded yet", entityType: "system", ipAddress: "—", createdAt: new Date().toISOString(), userId: "system" },
  ];
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [hoveredLog, setHoveredLog] = useState<string | null>(null);

  // Typewriter stagger effect sequence
  useEffect(() => {
    if (visibleIdx < logs.length) {
      const timer = setTimeout(() => {
        setVisibleIdx(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visibleIdx, logs.length]);

  const getIcon = (entityType: string) => {
    if (entityType === "auth" || entityType === "login") return <Key size={14} color="var(--text-secondary)" />;
    if (entityType === "security" || entityType === "role") return <Shield size={14} color="var(--color-warning)" />;
    if (entityType === "database" || entityType === "export") return <Database size={14} color="var(--color-primary)" />;
    if (entityType === "user" || entityType === "student") return <UserCheck size={14} color="var(--color-info)" />;
    return <CheckCircle size={14} color="var(--color-success)" />;
  };

  return (
    <div className="card" style={{ padding: "0", overflow: "hidden", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
      <div style={{ background: "var(--bg-primary)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
        <Terminal size={16} />
        <span style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "monospace" }}>
          {initialLogs.length > 0 ? "Live Audit Stream" : "Audit Stream (Empty)"}
        </span>
        {initialLogs.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", animation: "deadlinePulse 2s infinite" }} />
          </div>
        )}
      </div>
      
      <div style={{ padding: "var(--space-2) 0", height: "300px", overflowY: "auto" }}>
        <AnimatePresence>
          {logs.slice(0, visibleIdx).map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              style={{ 
                padding: "10px 16px", 
                borderBottom: i === logs.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
              onMouseEnter={() => setHoveredLog(log.id)}
              onMouseLeave={() => setHoveredLog(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ marginTop: "2px" }}>{getIcon(log.entityType)}</div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      by <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{log.userId.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {getTimeAgo(log.createdAt)}
                </div>
              </div>

              {/* Detail tooltip on hover */}
              <AnimatePresence>
                {hoveredLog === log.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                      position: "absolute",
                      left: "32px",
                      top: "calc(100% - 4px)",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      boxShadow: "var(--shadow-md)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      zIndex: 50,
                      fontSize: "0.75rem",
                      minWidth: "200px"
                    }}
                  >
                    <div style={{ marginBottom: "4px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Meta Data</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Type:</span>
                        <span>{log.entityType.toUpperCase()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>IP:</span>
                        <span style={{ fontFamily: "monospace" }}>{log.ipAddress}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Time:</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
