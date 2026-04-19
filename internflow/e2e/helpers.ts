import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "R-Choice@2025";

export const TEST_ACCOUNTS = {
  student: "student@rathinam.edu.in",
  tutor: "tutor@rathinam.edu.in",
  placementCoordinator: "pc@rathinam.edu.in",
  hod: "hod@rathinam.edu.in",
  dean: "dean@rathinam.edu.in",
  placementOfficer: "po@rathinam.edu.in",
  principal: "principal@rathinam.edu.in",
  company: "hr@techcorp.com",
} as const;

const STAFF_ROLE_PATHS: Record<string, string[]> = {
  Tutor: ["Tutor"],
  "Placement Coordinator": ["Placement Coordinator"],
  HOD: ["Placement Coordinator", "HOD"],
  Dean: ["Placement Coordinator", "HOD", "Dean"],
  "Placement Officer": ["Placement Coordinator", "HOD", "Dean", "Placement Officer"],
  Principal: ["Placement Coordinator", "HOD", "Dean", "Placement Officer", "Principal"],
};

export async function selectRole(page: Page, roleLabel: string) {
  if (roleLabel === "Student" || roleLabel === "Company") {
    await page.getByRole("button", { name: new RegExp(roleLabel, "i") }).click({ force: true });
    return;
  }

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
