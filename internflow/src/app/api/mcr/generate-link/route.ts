import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCompanyRegistrationLink } from "@/app/actions/mcr";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "management_corporation") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateCompanyRegistrationLink();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ link: result.link });
}
