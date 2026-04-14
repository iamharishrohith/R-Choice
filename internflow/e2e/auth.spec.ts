import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, TEST_PASSWORD, loginAs, selectRole } from "./helpers";

test.describe("Authentication Flows", () => {
  test("should login successfully as student and redirect to student dashboard", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /\/dashboard\/student/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("should reject repeated invalid student logins without poisoning seeded accounts", async ({ page }) => {
    await page.goto("/");
    await selectRole(page, "Student");

    // Use a non-existent account so the suite does not lock real seeded users.
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', "lockout-check@rathinam.edu.in");
      await page.fill('input[type="password"]', `${TEST_PASSWORD}-invalid`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
    }

    await expect(page.locator("body")).toContainText(/invalid email or password/i);
  });

  test("should login as dean and access admin dashboard", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.dean, "Dean", /\/dashboard\/admin/);
  });
});
