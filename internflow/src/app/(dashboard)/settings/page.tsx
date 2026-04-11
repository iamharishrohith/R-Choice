import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;

  if (role === "principal") {
    const [u] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    
    async function updateProfile(formData: FormData) {
      "use server";
      const session = await auth();
      if (!session?.user?.id) return;
      await db.update(users).set({ 
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        phone: formData.get("phone") as string,
        about: formData.get("about") as string
      }).where(eq(users.id, session.user.id));
      revalidatePath("/profile");
      revalidatePath("/settings");
    }

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Update Profile</h1>
          <p>Modify your administrative account details here.</p>
        </div>
        <div className="card" style={{ maxWidth: "500px" }}>
          <form action={updateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>First Name</label>
              <input name="firstName" defaultValue={u.firstName} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Last Name</label>
              <input name="lastName" defaultValue={u.lastName} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Phone Number</label>
              <input name="phone" defaultValue={u.phone || ""} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>About You</label>
              <textarea name="about" defaultValue={u.about || ""} rows={4} placeholder="Write a short summary about yourself..." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", resize: "vertical" }} />
            </div>
            <button type="submit" className="button" style={{ marginTop: "1rem" }}>Save Changes</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>This section is currently under development.</p>
      </div>
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🚧</div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>Coming Soon</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
          We're actively building out the R-Choice platform functionalities. 
          Check back later to see the completed Settings module!
        </p>
      </div>
    </div>
  );
}
