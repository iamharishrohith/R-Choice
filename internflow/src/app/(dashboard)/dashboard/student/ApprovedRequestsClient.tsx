"use client";

import { exportBonafidePDF, exportODFormPDF } from "@/lib/export-utils";
import { Download, CheckCircle, FileText } from "lucide-react";

export default function ApprovedRequestsClient({ requests, studentName }: { requests: any[], studentName: string }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div style={{ marginTop: "32px", marginBottom: "32px" }}>
      <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle size={20} color="var(--primary-color)" /> Approved Official Documents
      </h2>
      <div className="grid grid-3">
        {requests.map((req) => (
          <div key={req.id} className="card" style={{ borderLeft: "4px solid #22c55e", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 8px 0" }}>{req.companyName}</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>Role: {req.role}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Approved: {new Date(req.approvedAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: "6px", fontSize: "0.8125rem", display: "flex", justifyContent: "center", gap: "4px", alignItems: "center" }}
                onClick={() => exportBonafidePDF(studentName, req.companyName, req.role, new Date(req.startDate).toLocaleDateString(), new Date(req.endDate).toLocaleDateString())}
              >
                <FileText size={14} /> Bonafide
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, padding: "6px", fontSize: "0.8125rem", display: "flex", justifyContent: "center", gap: "4px", alignItems: "center", background: "var(--primary-color)", color: "white", border: "none" }}
                onClick={() => exportODFormPDF(studentName, req.companyName, req.role)}
              >
                <Download size={14} /> OD Form
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
