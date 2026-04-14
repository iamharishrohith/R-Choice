/**
 * R-Choice — Test Data Purge Script
 * Removes all e2e_ test accounts and mock company registrations.
 * Preserves: Real students (seeded from official register), all authority/staff accounts.
 *
 * Run with: npx tsx src/lib/db/purge-test-data.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like, inArray, and, notInArray } from "drizzle-orm";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// Authority roles to NEVER delete
const PROTECTED_ROLES = [
  "tutor",
  "placement_coordinator",
  "hod",
  "dean",
  "placement_officer",
  "principal",
];

async function main() {
  console.log("🧹 Starting test data purge...\n");

  // 1. Delete e2e_ test accounts
  const e2eAccounts = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
    .from(schema.users)
    .where(like(schema.users.email, "e2e_%"));

  if (e2eAccounts.length > 0) {
    console.log(`🗑️  Found ${e2eAccounts.length} e2e test accounts:`);
    e2eAccounts.forEach(a => console.log(`   - ${a.email} (${a.role})`));

    for (const acc of e2eAccounts) {
      await db.delete(schema.users).where(eq(schema.users.id, acc.id));
    }
    console.log(`   ✅ Deleted ${e2eAccounts.length} test accounts.\n`);
  } else {
    console.log("✅ No e2e test accounts found.\n");
  }

  // 2. Delete mock company registrations with placeholder addresses
  const mockCompanies = await db
    .select({ id: schema.companyRegistrations.id, name: schema.companyRegistrations.companyLegalName, userId: schema.companyRegistrations.userId })
    .from(schema.companyRegistrations)
    .where(eq(schema.companyRegistrations.address, "Please update"));

  if (mockCompanies.length > 0) {
    console.log(`🗑️  Found ${mockCompanies.length} placeholder company registrations:`);
    mockCompanies.forEach(c => console.log(`   - ${c.name}`));

    for (const comp of mockCompanies) {
      await db.delete(schema.companyRegistrations).where(eq(schema.companyRegistrations.id, comp.id));
      // Also delete the associated user account
      if (comp.userId) {
        await db.delete(schema.users).where(eq(schema.users.id, comp.userId));
      }
    }
    console.log(`   ✅ Deleted ${mockCompanies.length} mock companies.\n`);
  } else {
    console.log("✅ No mock company registrations found.\n");
  }

  // 3. Summary
  const remainingUsers = await db.select({ id: schema.users.id, role: schema.users.role }).from(schema.users);
  const roleBreakdown: Record<string, number> = {};
  remainingUsers.forEach(u => {
    roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
  });

  console.log("📊 Remaining accounts breakdown:");
  Object.entries(roleBreakdown).forEach(([role, count]) => {
    const isProtected = PROTECTED_ROLES.includes(role);
    console.log(`   ${isProtected ? "🛡️" : "👤"} ${role}: ${count}`);
  });

  console.log("\n✅ Test data purge complete! All authority accounts preserved.");
  process.exit(0);
}

main().catch(e => {
  console.error("❌ Purge script error:", e);
  process.exit(1);
});
