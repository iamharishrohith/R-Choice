import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "1234567890";

export const TEST_ACCOUNTS = {
  student: "harishrohiths.bct24@rathinam.in",
  tutor: "tutor@rathinam.in",
  placementCoordinator: "pc@rathinam.in",
  hod: "hod@rathinam.in",
  dean: "dean@rathinam.in",
  placementOfficer: "po@rathinam.in",
  coe: "coe@rathinam.in",
  principal: "principal@rathinam.in",
  company: "company@rathinam.in",
} as const;

export async function selectRole(page: Page, roleLabel: string) {
  if (roleLabel === "Student" || roleLabel === "Company") {
    await page.getByRole("button", { name: new RegExp(roleLabel, "i") }).first().click({ force: true });
    return;
  }

  // Find the carousel card containing the role label
  const roleButton = page.locator(`button:has-text("${roleLabel}")`).first();
  
  // Directly click the element in the DOM bypassing CSS opacity/transform occlusions
  await roleButton.evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
}

export async function loginAs(page: Page, email: string, roleLabel: string, expectedUrl?: RegExp) {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  await selectRole(page, roleLabel);

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);

  // Submit and wait for navigation or error
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);

  if (!expectedUrl) {
    return;
  }

  // Wait for redirect with generous timeout — auth + SSR can be slow in dev mode
  try {
    await expect(page).toHaveURL(expectedUrl, { timeout: 20000 });
  } catch {
    // Collect diagnostic info before failing
    const currentUrl = page.url();
    const bodyText = await page.locator("body").innerText().catch(() => "(could not read body)");
    const hasError = bodyText.includes("Invalid email or password");
    const hasDbError = bodyText.toLowerCase().includes("error") || bodyText.toLowerCase().includes("neondb");

    throw new Error(
      `Login failed for ${email} (${roleLabel}).\n` +
      `  Current URL: ${currentUrl}\n` +
      `  Expected URL pattern: ${expectedUrl}\n` +
      `  Invalid credentials shown: ${hasError}\n` +
      `  DB/server error detected: ${hasDbError}\n` +
      `  Body snippet: ${bodyText.slice(0, 300)}`
    );
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
