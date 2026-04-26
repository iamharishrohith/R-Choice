"use client";

import { exportMoUPDF, exportRegistrationCertificatePDF } from "@/lib/export-utils";
import { Download } from "lucide-react";

export function ExportCompanyDocs({ companyName, date }: { companyName: string, date: string }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
      <button 
        onClick={() => exportMoUPDF(companyName, date)}
        className="btn btn-outline" 
        style={{ fontSize: "0.75rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
      >
        <Download size={14} /> Export MoU
      </button>
      <button 
        onClick={() => exportRegistrationCertificatePDF(companyName, date)}
        className="btn btn-outline" 
        style={{ fontSize: "0.75rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
      >
        <Download size={14} /> Export Certificate
      </button>
    </div>
  );
}
