import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studentProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileBuilderClient from "./ProfileBuilderClient";
import DeanProfileClient from "./DeanProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id as string;
  const userRole = (session.user as any).role;

  // Handle Dean Role
  if (userRole === "dean") {
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
        <div className="page-header">
          <h1>Dean Profile Settings</h1>
          <p>Update your personal and administrative contact details.</p>
        </div>
        <DeanProfileClient initialData={deanData || {}} />
      </div>
    );
  }

  // Handle Student Role
  if (userRole === "student") {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const initialData = profile || {
      id: "",
      userId,
      registerNo: "",
      department: "",
      year: 1,
      section: "A",
      cgpa: "0.0",
      professionalSummary: "",
      profileCompletionScore: 0,
    };

    return (
      <div>
        <div className="page-header">
          <h1>Your Professional Profile</h1>
          <p>Complete your profile to unlock job applications.</p>
        </div>
        <ProfileBuilderClient initialData={initialData} />
      </div>
    );
  }

  // Redirect any other roles for now
  redirect("/");
}
