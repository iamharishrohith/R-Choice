import { db } from "@/lib/db";
import { users, studentProfiles, authorityMappings } from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  let hierarchyConditions = undefined;

  if (userRole && ["tutor", "placement_coordinator", "hod", "dean"].includes(userRole)) {
    let mappingCondition;
    if (userRole === "tutor") mappingCondition = eq(authorityMappings.tutorId, userId!);
    else if (userRole === "placement_coordinator") mappingCondition = eq(authorityMappings.placementCoordinatorId, userId!);
    else if (userRole === "hod") mappingCondition = eq(authorityMappings.hodId, userId!);
    else if (userRole === "dean") mappingCondition = eq(authorityMappings.deanId, userId!);

    if (mappingCondition) {
      const mappings = await db.select().from(authorityMappings).where(mappingCondition);
      
      if (mappings.length > 0) {
        const matchConditions = mappings.map(m => {
          const conds = [
            eq(studentProfiles.department, m.department),
            eq(studentProfiles.year, m.year),
            eq(studentProfiles.section, m.section)
          ];
          if (m.school) conds.push(eq(studentProfiles.school, m.school));
          if (m.course) conds.push(eq(studentProfiles.course, m.course));
          if (m.programType) conds.push(eq(studentProfiles.programType, m.programType));
          if (m.batchStartYear) conds.push(eq(studentProfiles.batchStartYear, m.batchStartYear));
          if (m.batchEndYear) conds.push(eq(studentProfiles.batchEndYear, m.batchEndYear));
          return and(...conds);
        });
        hierarchyConditions = or(...matchConditions);
      } else {
        hierarchyConditions = sql`1=0`;
      }
    }
  }

  const baseConditions = [eq(users.role, "student")];
  if (hierarchyConditions) baseConditions.push(hierarchyConditions!);

  let students = await db
    .select({
      id: users.id,
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
    .where(and(...baseConditions));

  if (queryParam) {
    students = students.filter(s => 
      s.firstName.toLowerCase().includes(queryParam) || 
      s.lastName.toLowerCase().includes(queryParam) ||
      (s.email && s.email.toLowerCase().includes(queryParam))
    );
  }

  return (
    <StudentsClient initialStudents={students as any} queryParam={queryParam} />
  );
}
