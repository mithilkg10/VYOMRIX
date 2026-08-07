# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should login successfully with correct credentials
- Location: tests\auth.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: Vyomrix
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Sign in
        - generic [ref=e11]: Enter your credentials to access the platform
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email
          - textbox "Email" [ref=e15]:
            - /placeholder: m.gowda@vyomrix.com
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]: Password
            - link "Forgot password?" [ref=e19] [cursor=pointer]:
              - /url: "#"
          - textbox "Password" [ref=e20]
      - button "Sign In" [ref=e22]
    - paragraph [ref=e24]: © 2026 Vyomrix Security. All rights reserved.
  - region "Notifications alt+T"
  - alert [ref=e25]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test('should login successfully with correct credentials', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     
  7  |     // Fill in the form
> 8  |     await page.fill('input[name="email"]', 'admin@vyomrix.com'); // We should create this user before tests, or assume it exists
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  9  |     await page.fill('input[name="password"]', 'admin123'); // Adjust based on DB seeder
  10 |     
  11 |     // Submit
  12 |     await page.click('button[type="submit"]');
  13 |     
  14 |     // Should redirect to dashboard
  15 |     await expect(page).toHaveURL('/');
  16 |     await expect(page.locator('text=Dashboard')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should show error with invalid credentials', async ({ page }) => {
  20 |     await page.goto('/login');
  21 |     
  22 |     await page.fill('input[name="email"]', 'admin@vyomrix.com');
  23 |     await page.fill('input[name="password"]', 'wrongpassword');
  24 |     
  25 |     await page.click('button[type="submit"]');
  26 |     
  27 |     // Should stay on login page and show error
  28 |     await expect(page).toHaveURL('/login');
  29 |     await expect(page.locator('text=Incorrect email or password')).toBeVisible();
  30 |   });
  31 | });
  32 | 
```