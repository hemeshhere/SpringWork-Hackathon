import { test, expect } from '@playwright/test';

test.describe('UI Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Note: Make sure the local server is actually running first!
    await page.goto('http://localhost:3008');
    
    // Reset DB state before each run so tests don't step on each other
    await page.click('#reset-data-btn');
    await page.waitForTimeout(300); // give the DOM a beat to re-render
  });

  test('column header counts should exactly match the rendered cards', async ({ page }) => {
    // Grab the IN_PROGRESS column specifically by matching its header text
    const inProgressCol = page.locator('.column').filter({ 
      has: page.locator('.column-header', { hasText: /^IN_PROGRESS/ }) 
    });
    
    const badgeCount = await inProgressCol.locator('.count').innerText();
    const actualCards = await inProgressCol.locator('.card').count();
    
    // Fails right now: API math double-counts, so badge shows 4 but only 1 card is visible
    expect(Number(badgeCount)).toBe(actualCards);
  });

  test('inactive vendors should not show up in the assignment dropdown', async ({ page }) => {
    const firstDropdown = await page.locator('.vendor-select').first().innerText();
    
    // "Old Ledger Associates" is marked active: false in the DB
    expect(firstDropdown).not.toContain('Old Ledger Associates'); 
  });

  test('optimistic UI should revert vendor dropdown on network failure', async ({ page }) => {
    // Force the API to drop the assignment request
    await page.route('**/api/requests/*/assign', route => route.abort());
    
    const dropdown = page.locator('.vendor-select').first();
    const originalVal = await dropdown.inputValue(); 
    
    // Pick a different vendor to trigger the UI update
    const newVal = originalVal === 'v1' ? 'v2' : 'v1';
    await dropdown.selectOption(newVal);
    
    await page.waitForTimeout(500); // wait for the network drop to settle
    
    // The UI should reset to the original value since the backend rejected the change
    expect(await dropdown.inputValue()).toBe(originalVal);
  });

  test('network failures during state transitions should surface an error toast', async ({ page }) => {
    // Block the transition endpoint
    await page.route('**/api/requests/*/transition', route => route.abort());
    
    // Click the first button that isn't already disabled
    await page.locator('.state-btn:not([disabled])').first().click();
    
    // We should see some kind of error message in the toast, not a silent fail
    const toast = page.locator('#toast');
    await expect(toast).toContainText('error', { ignoreCase: true }); 
  });
});