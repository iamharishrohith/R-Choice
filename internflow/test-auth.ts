import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import dns from "node:dns";
import tls from "node:tls";
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';

async function run() {
  const { db } = await import("./src/lib/db/index.js");
  const { users } = await import("./src/lib/db/schema.js");
  const { eq, and, inArray } = await import("drizzle-orm");
  const bcrypt = (await import("bcryptjs")).default;

  async function testAuth(email, password, role) {
    try {
      const [user] = await db.select().from(users).where(
        and(
          eq(users.email, email),
          role === "company" 
            ? inArray(users.role, ["company", "company_staff"])
            : eq(users.role, role)
        )
      ).limit(1);
      
      if (!user) {
        console.log(`User not found: ${email}`);
        return;
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log(`Password valid for ${email}: ${isValid}`);
    } catch(e) {
      console.error("Auth error:", e);
    }
  }

  await testAuth("ph@rathinam.edu.in", "R-Choice@2025", "placement_head");
  await testAuth("hr@techcorp.com", "R-Choice@2025", "company");
  await testAuth("student@rathinam.edu.in", "R-Choice@2025", "student");
}
run().then(() => process.exit(0));
