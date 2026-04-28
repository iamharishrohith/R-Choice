import { db } from "../lib/db";
import { companyRegistrations, users } from "../lib/db/schema";
import { eq, inArray, not } from "drizzle-orm";

async function run() {
  console.log("Fetching companies...");
  const companies = await db.select().from(companyRegistrations);
  
  if (companies.length <= 1) {
    console.log("No extra test companies found.");
    process.exit(0);
  }

  // Keep the first one or a specific one, delete the rest
  // Let's keep the one that actually has a userId or just the first one created
  const companyToKeep = companies[0];
  const idsToDelete = companies.filter(c => c.id !== companyToKeep.id).map(c => c.id);
  const userIdsToDelete = companies.filter(c => c.id !== companyToKeep.id && c.userId).map(c => c.userId!);

  console.log(`Keeping company: ${companyToKeep.companyLegalName} (${companyToKeep.id})`);
  console.log(`Deleting ${idsToDelete.length} companies...`);

  if (idsToDelete.length > 0) {
    await db.delete(companyRegistrations).where(inArray(companyRegistrations.id, idsToDelete));
    if (userIdsToDelete.length > 0) {
      await db.delete(users).where(inArray(users.id, userIdsToDelete));
    }
  }

  console.log("Cleanup complete!");
  process.exit(0);
}

run().catch(console.error);
