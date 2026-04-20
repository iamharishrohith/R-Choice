import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "1234567890";

export const TEST_ACCOUNTS = {
  student: "harishrohiths.bct24@rathinam.in",
  tutor: "tutor@rathinam.in",
  placementCoordinator: "pc@rathinam.in",
  hod: "hod@rathinam.in",
  dean: "dean@rathinam.in",
  placementOfficer: "po@rathinam.in",
  principal: "principal@rathinam.in",
  company: "company@rathinam.in",
} as const;

export async function selectRole(page: Page, roleLabel: string) {
  if (roleLabel === "Student" || roleLabel === "Company") {
    await page.getByRole("button", { name: new RegExp(roleLabel, "i") }).first().click({ force: true });
    return;
  }

<<<<<<< HEAD
  // Find the carousel card containing the role label
  const roleButton = page.locator(`button:has-text("${roleLabel}")`).first();
  
  // Directly click the element in the DOM bypassing CSS opacity/transform occlusions
  await roleButton.evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
=======
  const steps = STAFF_ROLE_PATHS[roleLabel] ?? [roleLabel];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLastStep = i === steps.length - 1;
    
    const shortcutButton = page
      .getByLabel("Staff and admin roles")
      .getByRole("button", { name: new RegExp(`^${escapeRegex(step)}$`, "i") });

    if (await shortcutButton.count()) {
      await shortcutButton.first().click({ force: true });
      // Wait for carousel animation before next click
      if (!isLastStep) {
        await page.waitForTimeout(300);
      }
      continue;
    }

    const roleButton = page.getByRole("button", { name: new RegExp(`^${escapeRegex(step)}$`, "i") }).first();

    try {
      await roleButton.click({ force: true });
      // Wait for carousel animation before next click
      if (!isLastStep) {
        await page.waitForTimeout(300);
      }
    } catch {
      await roleButton.evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      // Wait for carousel animation before next click
      if (!isLastStep) {
        await page.waitForTimeout(300);
      }
    }
  }
>>>>>>> upstream/main
}

export async function loginAs(page: Page, email: string, roleLabel: string, expectedUrl?: RegExp) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.goto("/");
    await selectRole(page, roleLabel);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    if (!expectedUrl) {
      return;
    }

    try {
      await expect(page).toHaveURL(expectedUrl, { timeout: 15000 });
      return;
    } catch (error) {
      const invalidCredentialsVisible = await page
        .getByText("Invalid email or password for this role.")
        .isVisible()
        .catch(() => false);

      const stillOnLogin = /\/\??(?:message=registered)?$/.test(new URL(page.url()).pathname + new URL(page.url()).search);

      if (attempt < maxAttempts && (invalidCredentialsVisible || stillOnLogin)) {
        await page.waitForTimeout(1000);
        continue;
      }

      throw error;
    }
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
