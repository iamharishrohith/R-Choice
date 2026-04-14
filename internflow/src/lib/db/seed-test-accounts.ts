import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding E2E test accounts...");

  const hash = await bcrypt.hash("R-Choice@2025", 10);

  const testAccounts = [
    { email: "student@rathinam.edu.in", role: "student", firstName: "Arun", lastName: "Kumar" },
    { email: "tutor@rathinam.edu.in", role: "tutor", firstName: "Priya", lastName: "Sharma" },
    { email: "pc@rathinam.edu.in", role: "placement_coordinator", firstName: "Ravi", lastName: "Patel" },
    { email: "hod@rathinam.edu.in", role: "hod", firstName: "Dr. Meena", lastName: "Nair" },
    { email: "dean@rathinam.edu.in", role: "dean", firstName: "Dr. Suresh", lastName: "Iyer" },
    { email: "po@rathinam.edu.in", role: "placement_officer", firstName: "Lakshmi", lastName: "Raj" },
    { email: "principal@rathinam.edu.in", role: "principal", firstName: "Dr. Venkat", lastName: "Raman" },
    { email: "hr@techcorp.com", role: "company", firstName: "Deepak", lastName: "Menon" },
  ] as const;

  for (const acc of testAccounts) {
    // Upsert equivalent by ignoring if exists
    try {
      await db.insert(users).values({
        email: acc.email,
        role: acc.role,
        firstName: acc.firstName,
        lastName: acc.lastName,
        passwordHash: hash,
        isActive: true,
      });
      console.log(`Created ${acc.role}`);
    } catch {
      console.log(`${acc.role} already exists, skipping.`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
