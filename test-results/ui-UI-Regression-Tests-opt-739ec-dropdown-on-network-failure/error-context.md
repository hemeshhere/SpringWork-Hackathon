# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.js >> UI Regression Tests >> optimistic UI should revert vendor dropdown on network failure
- Location: ui.spec.js:33:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: ""
Received: "v1"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - heading "Vendor Request Queue" [level=1] [ref=e3]
    - paragraph [ref=e4]: REQUESTED → ASSIGNED → IN_PROGRESS → COMPLETED
    - generic [ref=e5]:
      - button "↺ Reset data" [active] [ref=e6] [cursor=pointer]
      - link "📋 Spec" [ref=e7] [cursor=pointer]:
        - /url: /spec
      - link "📥 API collection" [ref=e8] [cursor=pointer]:
        - /url: /openapi.json
  - main [ref=e10]:
    - generic [ref=e11]:
      - heading "New Request" [level=2] [ref=e12]
      - generic [ref=e13]:
        - combobox [ref=e14]:
          - option "IDENTITY" [selected]
          - option "EDUCATION"
          - option "EMPLOYMENT"
          - option "ADDRESS"
        - textbox "Candidate name" [ref=e15]
        - button "Create" [ref=e16] [cursor=pointer]
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - text: REQUESTED
          - generic [ref=e20]: "1"
        - generic [ref=e22]:
          - generic [ref=e23]: Ananya Iyer
          - generic [ref=e24]: IDENTITY
          - combobox [ref=e25]:
            - option "Unassigned"
            - option "Swift Verify Co" [selected]
            - option "ClearCheck Partners"
            - option "Old Ledger Associates"
          - generic [ref=e26]:
            - button "REQUESTED" [disabled] [ref=e27]
            - button "ASSIGNED" [ref=e28] [cursor=pointer]
            - button "IN_PROGRESS" [ref=e29] [cursor=pointer]
            - button "COMPLETED" [ref=e30] [cursor=pointer]
      - generic [ref=e31]:
        - generic [ref=e32]:
          - text: ASSIGNED
          - generic [ref=e33]: "2"
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: Dev Kapoor
            - generic [ref=e37]: EDUCATION
            - combobox [ref=e38]:
              - option "Unassigned" [selected]
              - option "Swift Verify Co"
              - option "ClearCheck Partners"
              - option "Old Ledger Associates"
            - generic [ref=e39]:
              - button "REQUESTED" [ref=e40] [cursor=pointer]
              - button "ASSIGNED" [disabled] [ref=e41]
              - button "IN_PROGRESS" [ref=e42] [cursor=pointer]
              - button "COMPLETED" [ref=e43] [cursor=pointer]
          - generic [ref=e44]:
            - generic [ref=e45]: Ritika Malhotra
            - generic [ref=e46]: IDENTITY
            - combobox [ref=e47]:
              - option "Unassigned" [selected]
              - option "Swift Verify Co"
              - option "ClearCheck Partners"
              - option "Old Ledger Associates"
            - generic [ref=e48]:
              - button "REQUESTED" [ref=e49] [cursor=pointer]
              - button "ASSIGNED" [disabled] [ref=e50]
              - button "IN_PROGRESS" [ref=e51] [cursor=pointer]
              - button "COMPLETED" [ref=e52] [cursor=pointer]
      - generic [ref=e53]:
        - generic [ref=e54]:
          - text: IN_PROGRESS
          - generic [ref=e55]: "5"
        - generic [ref=e57]:
          - generic [ref=e58]: Neha Joshi
          - generic [ref=e59]: EMPLOYMENT
          - combobox [ref=e60]:
            - option "Unassigned" [selected]
            - option "Swift Verify Co"
            - option "ClearCheck Partners"
            - option "Old Ledger Associates"
          - generic [ref=e61]:
            - button "REQUESTED" [ref=e62] [cursor=pointer]
            - button "ASSIGNED" [ref=e63] [cursor=pointer]
            - button "IN_PROGRESS" [disabled] [ref=e64]
            - button "COMPLETED" [ref=e65] [cursor=pointer]
      - generic [ref=e66]:
        - generic [ref=e67]:
          - text: COMPLETED
          - generic [ref=e68]: "1"
        - generic [ref=e70]:
          - generic [ref=e71]: Farhan Ali
          - generic [ref=e72]: ADDRESS
          - combobox [ref=e73]:
            - option "Unassigned" [selected]
            - option "Swift Verify Co"
            - option "ClearCheck Partners"
            - option "Old Ledger Associates"
          - generic [ref=e74]:
            - button "REQUESTED" [ref=e75] [cursor=pointer]
            - button "ASSIGNED" [ref=e76] [cursor=pointer]
            - button "IN_PROGRESS" [ref=e77] [cursor=pointer]
            - button "COMPLETED" [disabled] [ref=e78]
  - button "🐛 Report a bug" [ref=e80] [cursor=pointer]
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
> 47 |     expect(await dropdown.inputValue()).toBe(originalVal);
     |                                         ^ Error: expect(received).toBe(expected) // Object.is equality
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
  59 |     await expect(toast).toContainText('error', { ignoreCase: true }); 
  60 |   });
  61 | });
```