import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();

  let students = await db
    .select({
      id: users.id, // using users.id as id instead of studentProfiles.id which might be null
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: studentProfiles.department,
      year: studentProfiles.year,
      section: studentProfiles.section,
      school: studentProfiles.school,
      program: studentProfiles.program,
      course: studentProfiles.course,
      batchStartYear: studentProfiles.batchStartYear,
      batchEndYear: studentProfiles.batchEndYear,
      phone: users.phone,
      registerNo: studentProfiles.registerNo,
      cgpa: studentProfiles.cgpa,
      dob: studentProfiles.dob,
      professionalSummary: studentProfiles.professionalSummary,
      githubLink: studentProfiles.githubLink,
      linkedinLink: studentProfiles.linkedinLink,
      portfolioUrl: studentProfiles.portfolioUrl
    })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.role, "student"));

  if (queryParam) {
    students = students.filter(s => 
      s.firstName.toLowerCase().includes(queryParam) || 
      s.lastName.toLowerCase().includes(queryParam) ||
      (s.email && s.email.toLowerCase().includes(queryParam))
    );
  }

  return (
    <StudentsClient initialStudents={students} queryParam={queryParam} />
  );
}
