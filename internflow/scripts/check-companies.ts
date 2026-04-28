import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq, notInArray } from 'drizzle-orm';

async function main() {
  const allCompanies = await db.select().from(users).where(eq(users.role, 'company'));
  console.log("Found companies:");
  console.log(allCompanies.map(c => ({ id: c.id, email: c.email })));

  const baseCompanyEmails = ["company@internflow.com", "company1@internflow.com"]; // Assuming one of these is the base one
  const companiesToDelete = allCompanies.filter(c => !baseCompanyEmails.includes(c.email));
  
  if (companiesToDelete.length > 0) {
    const idsToDelete = companiesToDelete.map(c => c.id);
    console.log("Deleting companies:", idsToDelete.length);
    const { inArray } = require('drizzle-orm');
    const { jobPostings, internshipRequests, authorityMappings, companyRegistrations, auditLogs, notifications } = require('../src/lib/db/schema');
    
    await db.delete(jobPostings).where(inArray(jobPostings.postedBy, idsToDelete));
    await db.update(internshipRequests).set({ lastReviewedBy: null }).where(inArray(internshipRequests.lastReviewedBy, idsToDelete));
    await db.update(authorityMappings).set({ updatedBy: null }).where(inArray(authorityMappings.updatedBy, idsToDelete));
    await db.delete(companyRegistrations).where(inArray(companyRegistrations.userId, idsToDelete));
    await db.delete(auditLogs).where(inArray(auditLogs.userId, idsToDelete));
    await db.delete(notifications).where(inArray(notifications.userId, idsToDelete));
    await db.delete(users).where(inArray(users.id, idsToDelete));
    
    console.log("Done deleting.");
  }

  process.exit(0);
}

main();
