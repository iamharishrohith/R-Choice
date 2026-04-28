import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studentProfiles, studentLinks, studentSkills, studentEducation, studentProjects, studentCertifications, studentJobInterests, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileBuilderClient from "./ProfileBuilderClient";
import DeanProfileClient from "./DeanProfileClient";
import Link from "next/link";
import { Pencil } from "lucide-react";

function EditProfileButton() {
  return (
    <Link href="/settings" style={{ textDecoration: "none" }}>
      <button className="btn btn-outline" style={{ display: "inline-flex", gap: "8px", alignItems: "center", padding: "8px 16px" }}>
        <Pencil size={16} /> Edit Profile
      </button>
    </Link>
  );
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  const userId = session.user.id;

  if (role === "principal") {
    const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return (
      <div className="animate-fade-in">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Principal Profile</h1>
            <p>Personal profile overview.</p>
          </div>
          <EditProfileButton />
        </div>
        <div className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-6)", fontSize: "1.05rem" }}>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Name:</strong> {u.firstName} {u.lastName}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Email:</strong> {u.email}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Phone:</strong> {u.phone || <em style={{ color: "var(--text-secondary)" }}>Not set</em>}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Role:</strong> <span style={{ textTransform: "capitalize" }}>{u.role}</span></div>
          <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>About:</strong>
            {u.about ? (
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{u.about}</div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No about information provided. You can add one in Settings.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle Dean Role
  if (role === "dean") {
    const [deanData] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (
      <div>
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Dean Profile Settings</h1>
            <p>Update your personal and administrative contact details.</p>
          </div>
          <EditProfileButton />
        </div>
        <DeanProfileClient initialData={deanData || {}} />
      </div>
    );
  }

  // Handle Student Role
  if (role === "student") {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const [user] = await db.select({ avatarUrl: users.avatarUrl, firstName: users.firstName }).from(users).where(eq(users.id, userId)).limit(1);

    let links: Array<typeof studentLinks.$inferSelect> = [];
    let skills: Array<{ name: string; type: string; isTop?: boolean }> = [];
    let education: Array<{ institution?: string; degree?: string; fieldOfStudy?: string; startYear?: string | number; endYear?: string | number; score?: string | number }> = [];
    let projects: Array<{ title?: string; description?: string; projectUrl?: string }> = [];
    let certifications: Array<{ name?: string; issuingOrg?: string; credentialUrl?: string }> = [];
    let roles: string[] = [];

    if (profile) {
      // Load all sub-relations in parallel
      const [dbLinks, dbSkills, dbEducation, dbProjects, dbCerts, dbRoles] = await Promise.all([
        db.select().from(studentLinks).where(eq(studentLinks.studentId, profile.id)).orderBy(studentLinks.displayOrder),
        db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id)),
        db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id)),
        db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id)),
        db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id)),
        db.select().from(studentJobInterests).where(eq(studentJobInterests.studentId, profile.id)),
      ]);

      links = dbLinks;
      skills = dbSkills.map(s => ({ name: s.skillName, type: s.skillType, isTop: s.isTop || false }));
      education = dbEducation.map(e => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy || undefined,
        startYear: e.startYear || undefined,
        endYear: e.endYear || undefined,
        score: e.score || undefined,
      }));
      projects = dbProjects.map(p => ({
        title: p.title,
        description: p.description || undefined,
        projectUrl: p.projectUrl || undefined,
      }));
      certifications = dbCerts.map(c => ({
        name: c.name,
        issuingOrg: c.issuingOrg,
        credentialUrl: c.credentialUrl || undefined,
      }));
      roles = dbRoles.map(r => r.roleName);
    }

    const initialData = {
      ...(profile || {
        id: "",
        userId,
        registerNo: "",
        department: "",
        year: 1,
        section: "",
        cgpa: "0.0",
        professionalSummary: "",
        dob: "",
        githubLink: "",
        linkedinLink: "",
        portfolioUrl: "",
        resumeUrl: "",
        profileCompletionScore: 0,
      }),
      avatarUrl: user?.avatarUrl || null,
      firstName: user?.firstName,
      skills,
      education,
      projects,
      certifications,
      roles,
    };

    const { getCollegeHierarchy } = await import("@/app/actions/hierarchy");
    const dynamicHierarchy = await getCollegeHierarchy();

    return (
      <div>
        <div className="page-header">
          <h1>Your Professional Profile</h1>
          <p>Complete your profile to unlock job applications.</p>
        </div>
        <ProfileBuilderClient initialData={initialData} initialLinks={links} collegeHierarchy={dynamicHierarchy} />
      </div>
    );
  }

  // Generic Profile fallback for all other roles (Tutor, Coordinator, HOD, PO, Company, etc)
  const [genericUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ textTransform: "capitalize" }}>{genericUser.role.replace(/_/g, " ")} Profile</h1>
          <p>Personal profile overview.</p>
        </div>
        <EditProfileButton />
      </div>
      <div className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-6)", fontSize: "1.05rem" }}>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Name:</strong> {genericUser.firstName} {genericUser.lastName}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Email:</strong> {genericUser.email}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Phone:</strong> {genericUser.phone || <em style={{ color: "var(--text-secondary)" }}>Not set</em>}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Role:</strong> <span style={{ textTransform: "capitalize" }}>{genericUser.role.replace(/_/g, " ")}</span></div>
        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)" }}>
          <strong style={{ display: "block", marginBottom: "8px" }}>About:</strong>
          {genericUser.about ? (
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{genericUser.about}</div>
          ) : (
            <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No about information provided. You can update this via Settings.</div>
          )}
        </div>
      </div>
    </div>
  );
}
