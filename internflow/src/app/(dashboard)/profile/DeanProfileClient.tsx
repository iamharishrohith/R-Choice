"use client";

import { useState } from "react";
import styles from "./profile.module.css";
import { Save, User } from "lucide-react";
import { saveDeanProfile } from "@/app/actions/profile";

export default function DeanProfileClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    phone: initialData.phone || "",
    email: initialData.email || ""
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await saveDeanProfile(data);

      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else if (result.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
      }
    } catch {
      setMessage({ text: "An unexpected error occurred.", type: "error" });
    }
    
    setIsSaving(false);
  };

  return (
    <div className={styles.profileContainer}>
      {/* Sidebar Navigation */}
      <div className={styles.profileSidebar}>
        <div className={styles.completionWidget}>
          <p className={styles.completionText}>Dean Account</p>
          <span className={styles.badgeSuccess}>Active Role</span>
        </div>

        <nav className={styles.tabNav}>
          <button className={`${styles.tabBtn} ${styles.activeTab}`}>
            <User size={18} />
            Account Details
          </button>
        </nav>
      </div>

      {/* Main Form Area */}
      <div className={styles.profileContent}>
        <div className="card">
          <form onSubmit={handleSave}>
            <div className={styles.formHeader}>
              <h2>Account Details</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                {message.text && (
                  <span style={{ fontSize: "0.875rem", color: message.type === "error" ? "var(--color-danger)" : "var(--rathinam-green)" }}>
                    {message.text}
                  </span>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                  <Save size={16} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </div>

            <div className="animate-fade-in">
              <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                <div className="input-group">
                  <label>First Name *</label>
                  <input
                    className="input-field"
                    value={data.firstName}
                    onChange={(e) => setData({ ...data, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Last Name *</label>
                  <input
                    className="input-field"
                    value={data.lastName}
                    onChange={(e) => setData({ ...data, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Email Address *</label>
                  <input
                    className="input-field"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Note: Changing this will change your login email.
                  </p>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input
                    className="input-field"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
