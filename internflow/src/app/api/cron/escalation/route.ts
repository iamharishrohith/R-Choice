import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internshipRequests, notifications, users } from "@/lib/db/schema";
import { eq, and, lt, inArray, sql } from "drizzle-orm";

const ESCALATION_TIMEOUT_HOURS = 48;

const ESCALATION_MAP: Record<string, { higherRole: string; currentRole: string }> = {
  pending_tutor: { currentRole: "tutor", higherRole: "placement_coordinator" },
  pending_coordinator: { currentRole: "placement_coordinator", higherRole: "hod" },
  pending_hod: { currentRole: "hod", higherRole: "dean" },
  pending_dean: { currentRole: "dean", higherRole: "placement_officer" },
  pending_po: { currentRole: "placement_officer", higherRole: "principal" },
  pending_principal: { currentRole: "principal", higherRole: "principal" },
};

export async function GET() {
  try {
    const cutoffDate = new Date(Date.now() - ESCALATION_TIMEOUT_HOURS * 60 * 60 * 1000);

    const pendingStatuses = Object.keys(ESCALATION_MAP) as ("pending_tutor" | "pending_coordinator" | "pending_hod" | "pending_dean" | "pending_po" | "pending_principal")[];

    // Find all requests that have been pending longer than the timeout
    const overdueRequests = await db
      .select({
        id: internshipRequests.id,
        status: internshipRequests.status,
        studentId: internshipRequests.studentId,
        companyName: internshipRequests.companyName,
        lastReviewedAt: internshipRequests.lastReviewedAt,
        submittedAt: internshipRequests.submittedAt,
      })
      .from(internshipRequests)
      .where(sql`${internshipRequests.status} IN (${sql.join(pendingStatuses.map(s => sql`${s}`), sql`, `)})`);

    let escalatedCount = 0;

    for (const req of overdueRequests) {
      const lastAction = req.lastReviewedAt || req.submittedAt;
      if (!lastAction || new Date(lastAction) > cutoffDate) continue;

      const statusKey = req.status as string;
      if (!statusKey) continue;
      const escalation = ESCALATION_MAP[statusKey];
      if (!escalation) continue;

      // Notify higher authority
      const higherAuthorities = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, escalation.higherRole as typeof users.$inferSelect.role));

      for (const authority of higherAuthorities) {
        await db.insert(notifications).values({
          userId: authority.id,
          type: "escalation",
          title: "⚠️ Approval Timeout Alert",
          message: `An internship request for "${req.companyName}" has been pending at the ${escalation.currentRole.replace("_", " ")} stage for over ${ESCALATION_TIMEOUT_HOURS} hours.`,
          linkUrl: "/approvals",
        });
      }

      // Alert current-tier authority
      const currentAuthorities = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, escalation.currentRole as typeof users.$inferSelect.role));

      for (const authority of currentAuthorities) {
        await db.insert(notifications).values({
          userId: authority.id,
          type: "reminder",
          title: "⏰ Approval Reminder",
          message: `You have a pending internship request for "${req.companyName}" that needs your attention. Please review it promptly.`,
          linkUrl: "/approvals",
        });
      }

      escalatedCount++;
    }

    return NextResponse.json({ success: true, escalated: escalatedCount });
  } catch (error) {
    console.error("Escalation cron error:", error);
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
