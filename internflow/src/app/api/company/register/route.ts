import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyRegistrations, notifications, users } from "@/lib/db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...companyData } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing registration token" }, { status: 400 });
    }

    // Validate token
    const [link] = await db
      .select()
      .from(companyRegistrationLinks)
      .where(
        and(
          eq(companyRegistrationLinks.token, token),
          eq(companyRegistrationLinks.isUsed, false),
          gt(companyRegistrationLinks.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "Invalid or expired registration link" }, { status: 400 });
    }

    // Required field validation
    const requiredFields = ["companyLegalName", "companyType", "industrySector", "website", "hrEmail", "hrName", "hrPhone", "address", "city", "state", "pinCode", "ceoName", "ceoDesignation", "ceoEmail"];
    for (const field of requiredFields) {
      if (!companyData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // 1. Insert company registration
    await db.insert(companyRegistrations).values({
      companyLegalName: companyData.companyLegalName,
      brandName: companyData.brandName || null,
      companyDescription: companyData.companyDescription || null,
      companyType: companyData.companyType,
      industrySector: companyData.industrySector,
      yearEstablished: companyData.yearEstablished ? parseInt(companyData.yearEstablished) : null,
      companySize: companyData.companySize || null,
      website: companyData.website,
      address: companyData.address,
      city: companyData.city,
      state: companyData.state,
      pinCode: companyData.pinCode,
      hrName: companyData.hrName,
      hrEmail: companyData.hrEmail,
      hrPhone: companyData.hrPhone,
      altPhone: companyData.altPhone || null,
      gstNumber: companyData.gstNumber || null,
      panNumber: companyData.panNumber || null,
      cinLlpin: companyData.cinLlpin || null,
      coi: companyData.coi || null,
      ceoName: companyData.ceoName || null,
      ceoDesignation: companyData.ceoDesignation || null,
      ceoEmail: companyData.ceoEmail || null,
      ceoPhone: companyData.ceoPhone || null,
      ceoLinkedin: companyData.ceoLinkedin || null,
      ceoPortfolio: companyData.ceoPortfolio || null,
      internshipType: companyData.internshipType || null,
      domains: companyData.domains ? companyData.domains.split(",").map((d: string) => d.trim()) : null,
      duration: companyData.duration || null,
      stipendRange: companyData.stipendRange || null,
      hiringIntention: companyData.hiringIntention || null,
      generalTcAccepted: companyData.generalTcAccepted || false,
      generalTcAcceptedAt: companyData.generalTcAccepted ? new Date() : null,
      status: "pending",
    });

    // 2. Mark token as used
    await db
      .update(companyRegistrationLinks)
      .set({ isUsed: true })
      .where(eq(companyRegistrationLinks.id, link.id));

    // 3. Notify MCR users that a new registration is pending
    const mcrUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "management_corporation"));

    if (mcrUsers.length > 0) {
      const notifs = mcrUsers.map((u) => ({
        userId: u.id,
        type: "company_registration_pending",
        title: "New Company Registration",
        message: `${companyData.companyLegalName} has submitted a registration application.`,
        linkUrl: "/companies/review",
      }));
      await db.insert(notifications).values(notifs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
