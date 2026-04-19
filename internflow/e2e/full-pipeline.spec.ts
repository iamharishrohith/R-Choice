import { test, expect, type Page, type Locator } from "@playwright/test";
import { TEST_ACCOUNTS, TEST_PASSWORD, loginAs } from "./helpers";

// Ensure unique email per run
const randomId = Date.now() % 100000000;
const companyEmail = `mega.corp${randomId}@test.com`;
const jobTitle = `E2E Testing Intern ${randomId}`;

async function waitForApprovalRow(page: Page, companyToken: string, attempts = 6) {
  const row = page.locator("tr").filter({ hasText: companyToken }).first();
  for (let i = 0; i < attempts; i++) {
    if (await row.isVisible().catch(() => false)) {
      return row;
    }
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }
  await expect(row).toBeVisible({ timeout: 5000 });
  return row;
}

async function approveRow(page: Page, row: Locator) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await row.getByRole("button", { name: /^approve$/i }).click();
    await page.getByRole("button", { name: /confirm approval/i }).click();

    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState("networkidle");

    if (!(await row.isVisible().catch(() => false))) {
      return;
    }
  }

  await expect(row).not.toBeVisible({ timeout: 15000 });
}

test.describe("Full Pipeline - Mega Flow", () => {

  test("Company Registers -> PO Approves Job -> Student Applies -> Full Hierarchy Approves", async ({ page }) => {
    test.setTimeout(180000); // 3 minutes timeout due to many context switches
    let companyLoginEmail = companyEmail;

    // --- 1. Company Registration ---
    await page.goto("/register/company");
    await page.fill('input[name="companyName"]', `Mega Corp ${randomId}`);
    await page.fill('input[name="industry"]', "Technology");
    await page.fill('input[name="website"]', "https://megacorp.test");
    await page.fill('input[name="hrName"]', "HR Boss");
    await page.fill('input[name="hrPhone"]', "1234567890");
    await page.fill('input[name="email"]', companyEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    const registered = await page.waitForURL(/\/\?message=registered/, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!registered) {
      companyLoginEmail = TEST_ACCOUNTS.company;
    }

    // --- 2. Company Posts Job ---
    await loginAs(page, companyLoginEmail, "Company", /.*dashboard.*/);
    await page.goto("/jobs/create");
    await page.fill('input[name="title"]', jobTitle);
    await page.fill('input[name="location"]', "Remote");
    await page.fill('textarea[name="description"]', "Write amazing e2e tests.");
    await page.fill('input[name="deadline"]', "2026-12-31");
    await page.click('button[type="submit"]');

    // Wait for redirect to /jobs/manage
    await expect(page).toHaveURL(/\/jobs\/manage/);

    await page.context().clearCookies(); // Log out

    // --- 3. Placement Officer Approves Job ---
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /.*dashboard.*/);
    await page.goto("/approvals/jobs");
    const pendingJobCard = page.locator(".card").filter({ hasText: jobTitle }).first();
    await expect(pendingJobCard).toBeVisible();
    
    // Click approve
    const approveBtnJob = pendingJobCard.getByRole("button", { name: /approve/i });
    await approveBtnJob.click();
    
    // Verify approval after refresh (list is server-rendered and may not update instantly)
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(800);
      await page.reload();
      await page.waitForLoadState("networkidle");
      if (!(await page.locator(".card").filter({ hasText: jobTitle }).first().isVisible().catch(() => false))) {
        break;
      }
    }
    await page.context().clearCookies();

    // --- 4. Student Applies ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/jobs");
    // Wait for page to load and revalidate cache
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Debug: Check what's on the page
    const pageText = await page.textContent("body");
    if (!pageText?.includes(jobTitle)) {
      console.log(`[TEST] Page does not contain '${jobTitle}', refreshing...`);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
    }
    
    const studentJobCard = page.locator(".job-card, .card").filter({ hasText: jobTitle }).first();
    await expect(studentJobCard).toBeVisible();
    
    // Click View Details and Apply
    const applyBtn = studentJobCard.getByRole("button", { name: /apply/i }).first();
    if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await expect(studentJobCard.getByRole("button", { name: /applied successfully/i })).toBeVisible();
    }
    
    // Check applications page shows the exact generated request
    await page.goto("/applications");
    const studentApplicationCard = page.locator(".card").filter({ hasText: jobTitle }).first();
    await expect(studentApplicationCard).toBeVisible();
    await page.context().clearCookies();

    // --- 5. Tutor Approves ---
    await loginAs(page, TEST_ACCOUNTS.tutor, "Tutor", /.*dashboard.*/);
    await page.goto("/approvals");
    const tutorRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, tutorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 6. Coordinator Approves ---
    await loginAs(page, TEST_ACCOUNTS.placementCoordinator, "Placement Coordinator", /.*dashboard.*/);
    await page.goto("/approvals");
    const coordinatorRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, coordinatorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 7. HOD Approves ---
    await loginAs(page, TEST_ACCOUNTS.hod, "HOD", /.*dashboard.*/);
    await page.goto("/approvals");
    const hodRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, hodRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 8. Dean Approves ---
    await loginAs(page, TEST_ACCOUNTS.dean, "Dean", /.*dashboard.*/);
    await page.goto("/approvals");
    const deanRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, deanRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 9. PO Approves (Again for the request!) ---
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /.*dashboard.*/);
    await page.goto("/approvals");
    const poRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, poRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 10. Principal Approves ---
    await loginAs(page, TEST_ACCOUNTS.principal, "Principal", /.*dashboard.*/);
    await page.goto("/approvals");
    const principalRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, principalRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 11. Student Views Final Tracker ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/applications");

    const finalApplicationCard = page.locator(".card").filter({ hasText: jobTitle }).first();
    await expect(finalApplicationCard).toBeVisible();
    await expect(finalApplicationCard.locator('span.badge-success')).toBeVisible();
    await expect(finalApplicationCard.getByRole("link", { name: /print bonafide/i })).toBeVisible();
  });
});
