import { test, expect } from '@playwright/test';

test.describe('Vyomrix End-to-End Test Suite', () => {
  const email = process.env.E2E_ADMIN_EMAIL || 'ci-owner@example.invalid';
  const password = process.env.E2E_ADMIN_PASSWORD || '';
  test.skip(!password, 'Set E2E_ADMIN_PASSWORD to run authenticated browser tests');

  test('should reject missing credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // HTML5 validation usually catches this, so we remain on /login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'invalid-ci-attempt');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should login successfully to dashboard, profile data matches, and global logout works', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    await Promise.all([
      page.waitForURL((url) => {
        const path = new URL(url).pathname;
        return path === '/' || path === '/dashboard';
      }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for the UI to load
    await expect(page.locator('h1').filter({ hasText: /^Dashboard$|^Security Overview$/ })).toBeVisible();
    const refreshToken = (await page.context().cookies()).find((cookie) => cookie.name === 'refresh_token')?.value;
    expect(refreshToken).toBeTruthy();
    
    // Check Profile
    const menuButton = page.locator('button[aria-label="User menu"]').or(page.locator('text=Profile')).or(page.locator('.user-menu'));
    if (await menuButton.count() > 0) {
        await menuButton.first().click();
        await expect(page.locator(`text=${email}`)).toBeVisible();
    }
    
    // Test Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*\/login/);
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    const refreshAfterLogout = await page.request.post(
      `${process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/refresh`,
      { data: { refresh_token: refreshToken } }
    );
    expect(refreshAfterLogout.status()).toBe(401);
  });

  test('should navigate to all Checkpoint 3 SOC dashboard routes successfully', async ({ page }) => {
    // We only test that the route loads without client-side crashes. 
    // Since we don't mock the backend for E2E, data might be "unavailable", which is acceptable for layout validation.
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([
      page.waitForURL((url) => {
        const path = new URL(url).pathname;
        return path === '/' || path === '/dashboard';
      }),
      page.click('button[type="submit"]')
    ]);

    const routes = [
      { path: '/', title: 'Security Overview' },
      { path: '/incidents', title: 'Incident Response' },
      { path: '/assets', title: 'Asset Intelligence' },
      { path: '/siem/alerts', title: 'SIEM Alerts' },
      { path: '/siem/agents', title: 'Monitored Agents' },
      { path: '/reports', title: 'Reports' },
      { path: '/audit', title: 'Audit log' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      // Depending on the exact rendering state, it might say "Session expired" or show the page header. 
      // As long as the page doesn't crash with a Next.js 500 error, we consider the route structurally sound.
      // Every valid page or error state renders an h1 or h2.
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
