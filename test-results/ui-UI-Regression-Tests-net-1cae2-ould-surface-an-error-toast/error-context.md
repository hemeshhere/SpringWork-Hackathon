# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.js >> UI Regression Tests >> network failures during state transitions should surface an error toast
- Location: ui.spec.js:50:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#toast')
Expected substring: "error"
Received string:    "Data reset"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#toast') with timeout 5000ms
  - waiting for locator('#toast')
    6 × locator resolved to <div id="toast" class="toast">Data reset</div>
      - unexpected value "Data reset"
    8 × locator resolved to <div id="toast" class="toast hidden">Data reset</div>
      - unexpected value "Data reset"

```

```yaml
- banner:
  - heading "Vendor Request Queue" [level=1]
  - paragraph: REQUESTED → ASSIGNED → IN_PROGRESS → COMPLETED
  - button "↺ Reset data"
  - link "📋 Spec":
    - /url: /spec
  - link "📥 API collection":
    - /url: /openapi.json
- main:
  - heading "New Request" [level=2]
  - combobox:
    - option "IDENTITY" [selected]
    - option "EDUCATION"
    - option "EMPLOYMENT"
    - option "ADDRESS"
  - textbox "Candidate name"
  - button "Create"
  - text: REQUESTED 1 Ananya Iyer IDENTITY
  - combobox:
    - option "Unassigned" [selected]
    - option "Swift Verify Co"
    - option "ClearCheck Partners"
    - option "Old Ledger Associates"
  - button "REQUESTED" [disabled]
  - button "ASSIGNED"
  - button "IN_PROGRESS"
  - button "COMPLETED"
  - text: ASSIGNED 2 Dev Kapoor EDUCATION
  - combobox:
    - option "Unassigned" [selected]
    - option "Swift Verify Co"
    - option "ClearCheck Partners"
    - option "Old Ledger Associates"
  - button "REQUESTED"
  - button "ASSIGNED" [disabled]
  - button "IN_PROGRESS"
  - button "COMPLETED"
  - text: Ritika Malhotra IDENTITY
  - combobox:
    - option "Unassigned" [selected]
    - option "Swift Verify Co"
    - option "ClearCheck Partners"
    - option "Old Ledger Associates"
  - button "REQUESTED"
  - button "ASSIGNED" [disabled]
  - button "IN_PROGRESS"
  - button "COMPLETED"
  - text: IN_PROGRESS 5 Neha Joshi EMPLOYMENT
  - combobox:
    - option "Unassigned" [selected]
    - option "Swift Verify Co"
    - option "ClearCheck Partners"
    - option "Old Ledger Associates"
  - button "REQUESTED"
  - button "ASSIGNED"
  - button "IN_PROGRESS" [disabled]
  - button "COMPLETED"
  - text: COMPLETED 1 Farhan Ali ADDRESS
  - combobox:
    - option "Unassigned" [selected]
    - option "Swift Verify Co"
    - option "ClearCheck Partners"
    - option "Old Ledger Associates"
  - button "REQUESTED"
  - button "ASSIGNED"
  - button "IN_PROGRESS"
  - button "COMPLETED" [disabled]
- button "🐛 Report a bug"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('UI Regression Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Note: Make sure the local server is actually running first!
  6  |     await page.goto('https://sv-qa-08-vendor-queue.onrender.com/');
  7  |     
  8  |     // Reset DB state before each run so tests don't step on each other
  9  |     await page.click('#reset-data-btn');
  10 |     await page.waitForTimeout(300); // give the DOM a beat to re-render
  11 |   });
  12 | 
  13 |   test('column header counts should exactly match the rendered cards', async ({ page }) => {
  14 |     // Grab the IN_PROGRESS column specifically by matching its header text
  15 |     const inProgressCol = page.locator('.column').filter({ 
  16 |       has: page.locator('.column-header', { hasText: /^IN_PROGRESS/ }) 
  17 |     });
  18 |     
  19 |     const badgeCount = await inProgressCol.locator('.count').innerText();
  20 |     const actualCards = await inProgressCol.locator('.card').count();
  21 |     
  22 |     // Fails right now: API math double-counts, so badge shows 4 but only 1 card is visible
  23 |     expect(Number(badgeCount)).toBe(actualCards);
  24 |   });
  25 | 
  26 |   test('inactive vendors should not show up in the assignment dropdown', async ({ page }) => {
  27 |     const firstDropdown = await page.locator('.vendor-select').first().innerText();
  28 |     
  29 |     // "Old Ledger Associates" is marked active: false in the DB
  30 |     expect(firstDropdown).not.toContain('Old Ledger Associates'); 
  31 |   });
  32 | 
  33 |   test('optimistic UI should revert vendor dropdown on network failure', async ({ page }) => {
  34 |     // Force the API to drop the assignment request
  35 |     await page.route('**/api/requests/*/assign', route => route.abort());
  36 |     
  37 |     const dropdown = page.locator('.vendor-select').first();
  38 |     const originalVal = await dropdown.inputValue(); 
  39 |     
  40 |     // Pick a different vendor to trigger the UI update
  41 |     const newVal = originalVal === 'v1' ? 'v2' : 'v1';
  42 |     await dropdown.selectOption(newVal);
  43 |     
  44 |     await page.waitForTimeout(500); // wait for the network drop to settle
  45 |     
  46 |     // The UI should reset to the original value since the backend rejected the change
  47 |     expect(await dropdown.inputValue()).toBe(originalVal);
  48 |   });
  49 | 
  50 |   test('network failures during state transitions should surface an error toast', async ({ page }) => {
  51 |     // Block the transition endpoint
  52 |     await page.route('**/api/requests/*/transition', route => route.abort());
  53 |     
  54 |     // Click the first button that isn't already disabled
  55 |     await page.locator('.state-btn:not([disabled])').first().click();
  56 |     
  57 |     // We should see some kind of error message in the toast, not a silent fail
  58 |     const toast = page.locator('#toast');
> 59 |     await expect(toast).toContainText('error', { ignoreCase: true }); 
     |                         ^ Error: expect(locator).toContainText(expected) failed
  60 |   });
  61 | });
```