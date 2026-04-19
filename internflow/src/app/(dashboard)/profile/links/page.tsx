import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studentProfiles, studentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LinksClient from "./LinksClient";

type StudentLink = typeof studentLinks.$inferSelect;

export default async function ProfileLinksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  let links: StudentLink[] = [];
  
  if (profile) {
    links = await db.select().from(studentLinks).where(eq(studentLinks.studentId, profile.id)).orderBy(studentLinks.displayOrder);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Links & Portals</h1>
        <p>Add your LeetCode, GitHub, HackerRank, and other external profiles.</p>
      </div>
      <LinksClient initialLinks={links} />
    </div>
  );
}
