import { test, expect } from '@playwright/test';

test('staff onboarding and job management workflow', async ({ page }) => {
  console.log("Navigating to home...");
  await page.goto('http://localhost:3000/');
  
  console.log("Switching to Company login tab...");
  await page.getByRole('button', { name: 'Company Partner Portal' }).click();
  
  console.log("Filling login credentials...");
  await page.getByRole('textbox', { name: 'Email Address' }).fill('my@company.in');
  await page.getByRole('textbox', { name: 'Password' }).fill('password123');
  
  console.log("Submitting login form...");
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for the dashboard to load.
  console.log("Waiting for dashboard...");
  await page.waitForURL('**/dashboard/company**');
  console.log("Logged in as CEO successfully.");
  
  // Navigate to Team Management.
  console.log("Navigating to team page...");
  await page.goto('http://localhost:3000/dashboard/company/team');
  
  console.log("Waiting for staff creation form...");
  await page.waitForSelector('text="Provision New Staff License"');
  
  // Delete any existing "Test Staff" to ensure a clean slate
  const revokeButtons = await page.locator('button:has-text("Revoke")').all();
  for (const btn of revokeButtons) {
    // Assuming the row text contains "Test Staff"
    const row = page.locator('tr').filter({ hasText: 'teststaff@company.in' });
    if (await row.count() > 0) {
      await row.locator('button:has-text("Revoke")').click();
      console.log("Revoked existing test staff");
    }
  }

  // Generate a unique email
  const staffEmail = `teststaff_${Date.now()}@company.in`;
  
  console.log("Filling staff creation form...");
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'Staff');
  await page.fill('input[name="email"]', staffEmail);
  await page.fill('input[name="phone"]', '9876543210');
  await page.fill('input[name="employeeId"]', 'EMP001');
  await page.fill('input[name="department"]', 'Engineering');
  await page.selectOption('select[name="staffRole"]', 'HR Manager');
  await page.fill('input[name="password"]', 'Staff@123');
  
  console.log("Submitting staff creation form...");
  await page.click('button:has-text("Onboard Staff")');
  
  // Verify staff appears in table
  console.log("Verifying staff in table...");
  const newRow = page.locator('tr').filter({ hasText: staffEmail });
  await newRow.waitFor({ state: 'visible', timeout: 5000 });
  expect(await newRow.isVisible()).toBeTruthy();
  console.log("Staff member created and verified in table.");
  
  // Check Job Management
  console.log("Navigating to Job Management as CEO...");
  await page.goto('http://localhost:3000/jobs/manage');
  await page.waitForSelector('text="My Job Postings"');
  console.log("Job Management page loaded successfully for CEO.");
  
  // Sign out
  console.log("Signing out CEO...");
  await page.goto('http://localhost:3000/api/auth/signout');
  await page.click('button:has-text("Sign out")');
  await page.waitForURL('http://localhost:3000/');
  console.log("Signed out successfully.");
  
  console.log(`Logging in as Staff (${staffEmail})...`);
  await page.getByRole('button', { name: 'Company Partner Portal' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill(staffEmail);
  await page.getByRole('textbox', { name: 'Password' }).fill('Staff@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for staff dashboard
  console.log("Waiting for staff dashboard...");
  await page.waitForURL('**/dashboard/company**'); // Assuming staff goes here too, or similar
  console.log("Logged in as Staff successfully.");
  
  // Check Job Management as Staff
  console.log("Navigating to Job Management as Staff...");
  await page.goto('http://localhost:3000/jobs/manage');
  await page.waitForSelector('text="My Job Postings"');
  console.log("Job Management page loaded successfully for Staff.");
  
  console.log("End-to-End test completed successfully!");
});
