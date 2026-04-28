import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

type UserRole = (typeof users.$inferSelect)["role"];

// Simple in-memory rate limiter to prevent brute force at the API level
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(email: string) {
  const now = Date.now();
  const record = rateLimitMap.get(email);
  if (record && record.expiresAt > now) {
    if (record.count >= 10) return false;
    record.count += 1;
    return true;
  }
  rateLimitMap.set(email, { count: 1, expiresAt: now + 5 * 60 * 1000 }); // 5 minutes
  return true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const role = credentials.role as UserRole;

        if (!checkRateLimit(email)) {
          console.warn(`[AUTH] Rate limit exceeded for email: ${email}`);
          throw new Error("Too many login attempts. Please try again later.");
        }

        // Find user by email and role. If role is 'company', allow 'company_staff' as well.
        const [user] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, email),
              role === "company" 
                ? inArray(users.role, ["company", "company_staff"])
                : eq(users.role, role)
            )
          )
          .limit(1);

        if (!user) {
          console.warn(`[AUTH] User not found for email: ${email}, role: ${role}`);
          return null;
        }
        
        if (!user.isActive) {
          console.warn(`[AUTH] User inactive: ${email}`);
          return null;
        }

        // Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          // Increment failed attempts
          await db
            .update(users)
            .set({
              failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
              lockedUntil:
                (user.failedLoginAttempts || 0) + 1 >= 5
                  ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 min
                  : null,
            })
            .where(eq(users.id, user.id));
          return null;
        }

        // Reset failed attempts on success
        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
});
