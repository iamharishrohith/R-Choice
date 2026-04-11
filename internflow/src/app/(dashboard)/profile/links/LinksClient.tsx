"use client";

import { useState } from "react";
import { Save, Plus, Trash2, Link as LinkIcon, Globe, Code2, Terminal } from "lucide-react";
import { saveLinks } from "@/app/actions/profile";

export default function LinksClient({ initialLinks }: { initialLinks: any[] }) {
  const [links, setLinks] = useState<any[]>(initialLinks || []);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const platforms = ["GitHub", "LeetCode", "HackerRank", "LinkedIn", "Portfolio", "Other"];

  const getIcon = (platform: string) => {
    switch(platform) {
      case "GitHub": return <Globe size={18} />;
      case "LeetCode": return <Code2 size={18} />;
      case "HackerRank": return <Terminal size={18} />;
      default: return <LinkIcon size={18} />;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const filtered = links.filter(l => l.url && l.title);
      const res = await saveLinks(filtered);
      if (res.error) setMessage({ text: res.error, type: "error" });
      else setMessage({ text: "Links updated successfully!", type: "success" });
    } catch {
      setMessage({ text: "An error occurred.", type: "error" });
    }
    setIsSaving(false);
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LinkIcon size={24} color="var(--color-primary)" /> Externals & Links
        </h2>
        {message.text && (
          <span style={{ fontSize: "0.875rem", color: message.type === "error" ? "var(--color-danger)" : "var(--color-success)" }}>
            {message.text}
          </span>
        )}
      </div>

      <form onSubmit={handleSave}>
        {links.map((link, idx) => (
          <div key={idx} className="grid grid-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-4)", alignItems: "end" }}>
            <div className="input-group">
              <label>Platform</label>
              <select className="input-field" value={link.platform || "Other"} onChange={(e) => { const n = [...links]; n[idx].platform = e.target.value; setLinks(n); }}>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Title / Identifier</label>
              <input className="input-field" placeholder="e.g. My Profile" value={link.title || ""} onChange={(e) => { const n = [...links]; n[idx].title = e.target.value; setLinks(n); }} required />
            </div>
            <div className="input-group" style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label>URL</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getIcon(link.platform)}
                  <input className="input-field" placeholder="https://" value={link.url || ""} onChange={(e) => { const n = [...links]; n[idx].url = e.target.value; setLinks(n); }} required />
                </div>
              </div>
              <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== idx))} style={{ color: "var(--color-danger)", paddingBottom: "12px", background: "none", border: "none", cursor: "pointer" }}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-8)" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setLinks([...links, { platform: "GitHub", title: "", url: "" }])}>
            <Plus size={18} /> Add Link
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
