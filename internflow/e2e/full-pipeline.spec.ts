import { test, expect, type Page, type Locator } from "@playwright/test";
import { TEST_ACCOUNTS, TEST_PASSWORD, loginAs } from "./helpers";

// Ensure unique email per run
const randomId = Math.floor(Math.random() * 100000);
const companyEmail = `mega.corp${randomId}@test.com`;

async function approveRow(page: Page, row: Locator) {
  await row.getByRole("button", { name: /^approve$/i }).click();
  await page.getByRole("button", { name: /confirm approval/i }).click();
}

test.describe("Full Pipeline - Mega Flow", () => {

  test("Company Registers -> PO Approves Job -> Student Applies -> Full Hierarchy Approves", async ({ page }) => {
    test.setTimeout(180000); // 3 minutes timeout due to many context switches

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

    await expect(page).toHaveURL(/\/\?message=registered/);

    // --- 2. Company Posts Job ---
    await loginAs(page, companyEmail, "Company", /.*dashboard.*/);
    await page.goto("/jobs/create");
    await page.fill('input[name="title"]', "E2E Testing Intern");
    await page.fill('input[name="location"]', "Remote");
    await page.fill('textarea[name="description"]', "Write amazing e2e tests.");
    await page.fill('input[name="deadline"]', "2026-12-31");
    await page.click('button[type="submit"]');

    // Wait for redirect to /jobs/manage
    await expect(page).toHaveURL(/\/jobs\/manage/);
    await expect(page.getByText("E2E Testing Intern").first()).toBeVisible();

    // Verify it says "PENDING_REVIEW"
    await expect(page.locator("text=PENDING_REVIEW")).toBeVisible();
    await page.context().clearCookies(); // Log out

    // --- 3. Placement Officer Approves Job ---
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /.*dashboard.*/);
    await page.goto("/approvals/jobs");
    const pendingJobCard = page.locator(".card").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(pendingJobCard).toBeVisible();
    
    // Click approve
    const approveBtnJob = pendingJobCard.getByRole("button", { name: /approve/i });
    await approveBtnJob.click();
    
    // Wait for the job to disappear from pending list
    await expect(pendingJobCard).not.toBeVisible();
    await page.context().clearCookies();

    // --- 4. Student Applies ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/jobs");
    
    // The job should now be visible
    const studentJobCard = page.locator(".job-card, .card").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(studentJobCard).toBeVisible();
    
    // Click View Details and Apply
    const applyBtn = studentJobCard.getByRole("button", { name: /apply/i }).first();
    if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await expect(studentJobCard.getByRole("button", { name: /applied successfully/i })).toBeVisible();
    }
    
    // Check applications page shows the exact generated request
    await page.goto("/applications");
    const studentApplicationCard = page.locator(".card").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(studentApplicationCard).toBeVisible();
    await page.context().clearCookies();

    // --- 5. Tutor Approves ---
    await loginAs(page, TEST_ACCOUNTS.tutor, "Tutor", /.*dashboard.*/);
    await page.goto("/approvals");
    const tutorRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(tutorRow).toBeVisible();
    await approveRow(page, tutorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 6. Coordinator Approves ---
    await loginAs(page, TEST_ACCOUNTS.placementCoordinator, "Placement Coordinator", /.*dashboard.*/);
    await page.goto("/approvals");
    const coordinatorRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(coordinatorRow).toBeVisible();
    await approveRow(page, coordinatorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 7. HOD Approves ---
    await loginAs(page, TEST_ACCOUNTS.hod, "HOD", /.*dashboard.*/);
    await page.goto("/approvals");
    const hodRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(hodRow).toBeVisible();
    await approveRow(page, hodRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 8. Dean Approves ---
    await loginAs(page, TEST_ACCOUNTS.dean, "Dean", /.*dashboard.*/);
    await page.goto("/approvals");
    const deanRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(deanRow).toBeVisible();
    await approveRow(page, deanRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 9. PO Approves (Again for the request!) ---
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /.*dashboard.*/);
    await page.goto("/approvals");
    const poRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(poRow).toBeVisible();
    await approveRow(page, poRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 10. Principal Approves ---
    await loginAs(page, TEST_ACCOUNTS.principal, "Principal", /.*dashboard.*/);
    await page.goto("/approvals");
    const principalRow = page.locator("tr").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(principalRow).toBeVisible();
    await approveRow(page, principalRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 11. Student Views Final Tracker ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/applications");

    const finalApplicationCard = page.locator(".card").filter({ hasText: `Mega Corp ${randomId}` }).first();
    await expect(finalApplicationCard).toBeVisible();
    await expect(finalApplicationCard.locator('span.badge-success')).toBeVisible();
    await expect(finalApplicationCard.getByRole("link", { name: /print bonafide/i })).toBeVisible();
  });
});
