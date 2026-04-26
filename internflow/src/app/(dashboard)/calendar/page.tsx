import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchStudentCalendarEvents } from "@/app/actions/calendar";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const events = await fetchStudentCalendarEvents();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Calendar</h1>
        <p>Track your internship timelines, report deadlines, meetings, and interview rounds.</p>
      </div>
      <CalendarClient events={events} />
    </div>
  );
}
