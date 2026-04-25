"use client";

import { useState } from "react";
import { createCompanyStaff } from "@/app/actions/companyStaff";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function StaffManagerClient() {
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createCompanyStaff(formData);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success("Staff account licensed successfully.");
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <div className="card" style={{ padding: "var(--space-6)" }}>
      <h3 style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: 8 }}>
        <UserPlus size={20} /> Provision New Staff License
      </h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)", fontSize: "0.9rem" }}>
        Staff members can post jobs and review applicants on the company's behalf.
      </p>

      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 600 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="input-group">
            <label>First Name</label>
            <input type="text" name="firstName" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input type="text" name="lastName" className="input-field" required />
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="input-group">
            <label>Staff Official Email</label>
            <input type="email" name="email" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Mobile Number</label>
            <input type="tel" name="phone" className="input-field" required />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="input-group">
            <label>Employee ID</label>
            <input type="text" name="employeeId" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Department</label>
            <input type="text" name="department" className="input-field" required />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="input-group">
            <label>Staff Role</label>
            <select name="staffRole" className="input-field" required>
              <option value="">Select Role</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Hiring Manager">Hiring Manager</option>
            </select>
          </div>
          <div className="input-group">
            <label>Temporary Password</label>
            <input type="password" name="password" className="input-field" required minLength={8} placeholder="Set a temporary password" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "var(--space-2)" }}>
          {loading ? "Provisioning..." : "Onboard Staff"}
        </button>
      </form>
    </div>
  );
}
