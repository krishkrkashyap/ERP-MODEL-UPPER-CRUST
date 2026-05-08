import { test, expect } from '@playwright/test';

test.describe('ERP Frontend Navigation', () => {
  test('Dashboard page loads and shows brand title', async ({ page }) => {
    await page.goto('/');
    // Check the brand name is visible (first match = header title)
    await expect(page.getByText('Upper Crust ERP').first()).toBeVisible();
    // Check the Dashboard menu item has the selected class
    await expect(page.getByRole('menuitem', { name: /dashboard/i })).toHaveClass(/ant-menu-item-selected/);
  });

  test('Navigate to Orders page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /orders/i }).click();
    await expect(page).toHaveURL(/\/orders/);
    // Orders page heading or content area should render
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Inventory page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /inventory/i }).click();
    await expect(page).toHaveURL(/\/inventory/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Raw Materials page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /raw materials/i }).click();
    await expect(page).toHaveURL(/\/raw-materials/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Wastage Tracking page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /wastage/i }).click();
    await expect(page).toHaveURL(/\/wastage/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Customer Profiles page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /customer/i }).click();
    await expect(page).toHaveURL(/\/customers/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Financial page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /financial/i }).click();
    await expect(page).toHaveURL(/\/financial/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('Navigate to Reports page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: /reports/i }).click();
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });
});

test.describe('ERP API Connectivity', () => {
  test('Health endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
  });

  test('Orders API is accessible', async ({ request }) => {
    const response = await request.get('/api/orders?limit=1');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
  });
});
