"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarEvents, internshipRequests, workReportSchedules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function fetchStudentCalendarEvents() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  try {
    // 1. Custom calendar events
    const customEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));

    // 2. Internship start/end dates from approved requests
    const approvedRequests = await db
      .select({
        id: internshipRequests.id,
        companyName: internshipRequests.companyName,
        role: internshipRequests.role,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    // 3. Report due dates
    const reportSchedules = await db
      .select({
        id: workReportSchedules.id,
        requestId: workReportSchedules.requestId,
        frequency: workReportSchedules.frequency,
        nextDueDate: workReportSchedules.nextDueDate,
      })
      .from(workReportSchedules);

    // Combine all into a unified event array
    const events: {
      id: string;
      title: string;
      description: string;
      eventType: string;
      startDate: string;
      endDate?: string | null;
      meetLink?: string | null;
      isAllDay: boolean;
    }[] = [];

    // Custom events
    for (const e of customEvents) {
      events.push({
        id: e.id,
        title: e.title,
        description: e.description || "",
        eventType: e.eventType,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() || null,
        meetLink: e.meetLink || null,
        isAllDay: e.isAllDay || false,
      });
    }

    // Internship events
    for (const r of approvedRequests) {
      if (r.startDate) {
        events.push({
          id: `intern-start-${r.id}`,
          title: `Internship Start: ${r.companyName}`,
          description: `Role: ${r.role}`,
          eventType: "internship_start",
          startDate: new Date(r.startDate).toISOString(),
          isAllDay: true,
        });
      }
      if (r.endDate) {
        events.push({
          id: `intern-end-${r.id}`,
          title: `Internship End: ${r.companyName}`,
          description: `Role: ${r.role}`,
          eventType: "internship_end",
          startDate: new Date(r.endDate).toISOString(),
          isAllDay: true,
        });
      }
    }

    // Report due dates
    for (const s of reportSchedules) {
      if (s.nextDueDate) {
        events.push({
          id: `report-${s.id}`,
          title: `Report Due (${s.frequency})`,
          description: "Submit your internship work report",
          eventType: "report_due",
          startDate: new Date(s.nextDueDate).toISOString(),
          isAllDay: true,
        });
      }
    }

    return events;
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return [];
  }
}

export async function createCalendarEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const targetUserId = (formData.get("userId") as string) || session.user.id;

  try {
    await db.insert(calendarEvents).values({
      userId: targetUserId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      eventType: (formData.get("eventType") as string) || "meeting",
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      meetLink: (formData.get("meetLink") as string) || null,
      isAllDay: formData.get("isAllDay") === "true",
    });

    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    console.error("Create calendar event error:", error);
    return { error: "Failed to create event" };
  }
}
