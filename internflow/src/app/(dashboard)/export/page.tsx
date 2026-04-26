import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExportClient from "./ExportClient";

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const allowedRoles = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "coe", "placement_head", "management_corporation", "principal"];
  if (!allowedRoles.includes(session.user.role)) redirect("/");

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Export Data</h1>
        <p>Customize and download student or internship data as Excel/CSV files.</p>
      </div>
      <ExportClient />
    </div>
  );
}
