"use server";

import { signIn, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, companyRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sanitize, validateEmail } from "@/lib/validation";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const userId = session.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Incorrect current password" };
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (err) {
    console.error("Password change error:", err);
    return { error: "Failed to update password" };
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !role) {
    return { error: "Please fill in all fields" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      role,
      redirectTo: getRedirectUrl(role),
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password for this role." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error; // Re-throw non-auth errors (e.g., redirect)
  }
}

function getRedirectUrl(role: string): string {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "tutor":
    case "placement_coordinator":
    case "hod":
      return "/dashboard/staff";
    case "dean":
    case "placement_officer":
    case "principal":
      return "/dashboard/admin";
    case "company":
      return "/dashboard/company";
    default:
      return "/";
  }
}

export async function registerCompany(formData: FormData) {
  try {
    const rawCompanyName = formData.get("companyName");
    const rawIndustry = formData.get("industry");
    const rawWebsite = formData.get("website");
    const rawHrName = formData.get("hrName");
    const rawHrPhone = formData.get("hrPhone");
    const rawEmail = formData.get("email");
    const password = formData.get("password") as string;

    const companyName = sanitize(rawCompanyName, "Company Name", 255);
    const industry = sanitize(rawIndustry, "Industry Sector", 100);
    const website = sanitize(rawWebsite, "Website URL", 255);
    const hrName = sanitize(rawHrName, "HR Name", 100);
    const hrPhone = sanitize(rawHrPhone, "HR Phone", 50);
    const email = validateEmail(rawEmail, "Email Address");

    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters long" };
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const newHash = await bcrypt.hash(password, 12);
    
    const result = await db.insert(users).values({
      email,
      passwordHash: newHash,
      role: "company",
      firstName: companyName,
      lastName: "Partner",
      isActive: true,
    }).returning();

    if (!result || result.length === 0) {
      return { error: "Failed to create user account" };
    }

    const newUser = result[0];

    try {
      await db.insert(companyRegistrations).values({
        userId: newUser.id,
        companyLegalName: companyName,
        companyType: "Private",
        industrySector: industry,
        website,
        hrName,
        hrEmail: email,
        hrPhone,
        address: "Please update",
        city: "Please update",
        state: "Please update",
        pinCode: "000000",
        status: "pending"
      });
    } catch (innerError) {
      await db.delete(users).where(eq(users.id, newUser.id));
      throw innerError;
    }

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ValidationError") {
      return { error: err.message };
    }
    console.error("[registerCompany] Error:", err);
    return { error: "Failed to create company account. Try again later." };
  }
}
