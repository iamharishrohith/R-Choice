"use client";

import { useState } from "react";
import { submitCompanyRegistration } from "@/app/actions/companyOnboarding";
import { toast } from "sonner";
import { Building2, UserCircle, Briefcase, FileCheck, CheckCircle2 } from "lucide-react";

export default function RegistrationForm({ token }: { token: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await submitCompanyRegistration(token, formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <CheckCircle2 size={64} style={{ color: "var(--color-success)", margin: "0 auto", marginBottom: 24 }} />
        <h2 style={{ marginBottom: 12 }}>Registration Submitted Successfully</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          The Management Corporation Relationship (MCR) team is reviewing your application.
          Once approved, credentials for the CEO dashboard will be securely generated and sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* ── SECTION 1: Company Profile ── */}
      <section style={{ display: step === 1 ? "block" : "none" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
          <Building2 size={24} /> 1. Organizational Profile
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label>Company Legal Name</label>
            <input type="text" name="companyLegalName" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Website</label>
            <input type="url" name="website" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Official Mail</label>
            <input type="email" name="officeMail" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Contact No</label>
            <input type="text" name="contactNo" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Industry</label>
            <input type="text" name="industry" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Company Size</label>
            <select name="companySize" className="input-field" required>
              <option value="1-10">1-10 Employees</option>
              <option value="11-50">11-50 Employees</option>
              <option value="51-200">51-200 Employees</option>
              <option value="201-500">201-500 Employees</option>
              <option value="500+">500+ Employees</option>
            </select>
          </div>
          <div className="input-group">
            <label>Company Type</label>
            <select name="companyType" className="input-field" required>
              <option value="Pvt Ltd">Pvt Ltd</option>
              <option value="Public Ltd">Public Ltd</option>
              <option value="Startup">Startup</option>
              <option value="LLP">LLP</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
          <div className="input-group">
            <label>Year of Establishment</label>
            <input type="number" name="yearEstablished" className="input-field" min="1800" max="2030" required />
          </div>
        </div>
        
        <div className="input-group" style={{ marginTop: 16 }}>
          <label>Company Description</label>
          <textarea name="companyDescription" className="input-field" rows={4} required></textarea>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 16 }}>
          <div className="input-group">
            <label>Full Address</label>
            <textarea name="address" className="input-field" rows={2} required></textarea>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="input-group">
            <label>City</label>
            <input type="text" name="city" className="input-field" required />
          </div>
          <div className="input-group">
            <label>State</label>
            <input type="text" name="state" className="input-field" required />
          </div>
          <div className="input-group">
            <label>PIN Code</label>
            <input type="text" name="pinCode" className="input-field" required />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="input-group">
            <label>GSTIN (Optional)</label>
            <input type="text" name="gstin" className="input-field" />
          </div>
          <div className="input-group">
            <label>PAN Card (Company)</label>
            <input type="text" name="panCard" className="input-field" required />
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label>Link to Certificate of Incorporation (COI)</label>
            <input type="url" name="coiUrl" className="input-field" required />
          </div>
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button type="button" onClick={() => setStep(2)} className="btn btn-primary">Next: Founder Details →</button>
        </div>
      </section>

      {/* ── SECTION 2: CEO / Founder ── */}
      <section style={{ display: step === 2 ? "block" : "none" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
          <UserCircle size={24} /> 2. Founder / CEO Details
        </h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Credentials for the master company dashboard will be generated for this authority.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" name="founderName" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Designation</label>
            <input type="text" name="founderDesignation" className="input-field" defaultValue="CEO" required />
          </div>
          <div className="input-group">
            <label>Direct Office Mail</label>
            <input type="email" name="founderMail" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Direct Phone No</label>
            <input type="text" name="founderPhone" className="input-field" required />
          </div>
          <div className="input-group">
            <label>LinkedIn Profile URL</label>
            <input type="url" name="founderLinkedin" className="input-field" />
          </div>
          <div className="input-group">
            <label>Personal Portfolio URL</label>
            <input type="url" name="founderPortfolio" className="input-field" />
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label>Link to ID Proof (Aadhaar/Passport)</label>
            <input type="url" name="founderIdProof" className="input-field" required />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button type="button" onClick={() => setStep(1)} className="btn btn-outline">← Back</button>
          <button type="button" onClick={() => setStep(3)} className="btn btn-primary">Next: Job Preferences →</button>
        </div>
      </section>

      {/* ── SECTION 3: Preferences ── */}
      <section style={{ display: step === 3 ? "block" : "none" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
          <Briefcase size={24} /> 3. Internship & Hiring Preferences
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label>Default Work Mode</label>
            <select name="prefInternshipType" className="input-field" required>
              <option value="remote">Remote</option>
              <option value="onsite">On-Site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="input-group">
            <label>Target Domains (e.g. IT, Marketing)</label>
            <input type="text" name="prefDomains" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Typical Duration</label>
            <select name="prefDuration" className="input-field" required>
              <option value="1-3 months">1 - 3 Months</option>
              <option value="3-6 months">3 - 6 Months</option>
              <option value="6+ months">6+ Months</option>
            </select>
          </div>
          <div className="input-group">
            <label>Compensation</label>
            <select name="prefIsPaid" className="input-field" required>
              <option value="true">Paid Stipend</option>
              <option value="false">Unpaid / Academic Only</option>
            </select>
          </div>
          <div className="input-group">
            <label>Stipend Range (e.g. 10k-20k INR)</label>
            <input type="text" name="prefStipendRange" className="input-field" />
          </div>
          <div className="input-group">
            <label>Hiring Intention</label>
            <select name="prefHiringIntention" className="input-field" required>
              <option value="ppo">Internship into Full Time (PPO expected)</option>
              <option value="internship_only">Internship Only</option>
              <option value="contract">Contract Renewal based</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button type="button" onClick={() => setStep(2)} className="btn btn-outline">← Back</button>
          <button type="button" onClick={() => setStep(4)} className="btn btn-primary">Next: Confirm & Submit →</button>
        </div>
      </section>

      {/* ── SECTION 4: Terms ── */}
      <section style={{ display: step === 4 ? "block" : "none" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
          <FileCheck size={24} /> 4. Terms & Submission
        </h3>
        
        <div style={{ background: "rgba(0,0,0,0.2)", padding: 24, borderRadius: 8, border: "1px solid var(--border-color)", marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>Platform Policies</h4>
          <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8, paddingLeft: 20 }}>
            <li>We certify that our company is legally registered and authorized to operate.</li>
            <li>We agree to provide accurate and timely updates regarding intern performance via R-Choice.</li>
            <li>We adhere to equal opportunity regulations and student welfare provisions.</li>
            <li>We understand all submissions are audited and physically / virtually verifiable by the institution.</li>
          </ul>

          <label style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" name="authenticityConfirmed" value="true" required style={{ width: 18, height: 18 }} />
            I confirm the authenticity of this company and accept all terms.
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button type="button" onClick={() => setStep(3)} className="btn btn-outline">← Back</button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: "12px 32px" }}>
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      </section>

    </form>
  );
}
