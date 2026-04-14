"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verifyAndInitializeOD } from "@/app/actions/applications";

export default function VerificationBannerClient({ 
  applicationId, 
  jobTitle, 
  companyName 
}: { 
  applicationId: string, 
  jobTitle: string, 
  companyName: string 
}) {
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit verification code sent to your email.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please provide tentative start and end dates for your OD request.");
      return;
    }

    setIsVerifying(true);
    toast.loading("Verifying code & initiating OD Request...", { id: "verify-od" });

    try {
      const res = await verifyAndInitializeOD(applicationId, code, startDate, endDate);
      if (res.error) {
        toast.error(res.error, { id: "verify-od" });
      } else {
        toast.success("Verification successful! OD Request initiated to your Tutor.", { id: "verify-od" });
        // The page will revalidate from the server action
      }
    } catch (e) {
      toast.error("Process failed.", { id: "verify-od" });
    }
    setIsVerifying(false);
  };

  return (
    <div style={{
      background: "linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)",
      borderRadius: "12px",
      padding: "24px",
      color: "white",
      marginBottom: "24px",
      boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)"
    }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "50%" }}>
          <Sparkles size={32} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>Congratulations! You've been selected!</h2>
          <p style={{ marginTop: "8px", opacity: 0.9 }}>
            <strong>{companyName}</strong> has shortlisted you for the role of <strong>{jobTitle}</strong>. 
            Check your email for the verification code to officially start your On-Duty request.
          </p>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "12px", 
            marginTop: "20px",
            background: "rgba(255,255,255,0.1)",
            padding: "16px",
            borderRadius: "8px"
          }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px", fontWeight: "500" }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "none", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px", fontWeight: "500" }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "none", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px", fontWeight: "500" }}>6-Digit Code</label>
              <input type="text" maxLength={6} placeholder="######" value={code} onChange={e => setCode(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "none", letterSpacing: "2px", fontWeight: "bold", textAlign: "center", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button 
                onClick={handleVerify} 
                disabled={isVerifying}
                style={{
                  width: "100%", padding: "8px", backgroundColor: "white", color: "#4F46E5", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                }}
              >
                {isVerifying ? <span className="spinner" style={{borderColor: "#4f46e5", borderRightColor: "transparent"}}></span> : <ShieldCheck size={16} />}
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
