import { test, expect } from '@playwright/test';

/**
 * COD CRM Navigation Smoke Tests
 * 
 * Purpose: Verify all critical routes are accessible and return 200 OK.
 * Run: npx playwright test
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
test.describe('Navigation Smoke Tests', () => {

    // Run before each test - Login
    test.beforeEach(async ({ page }) => {
        // Navigate to login page
        await page.goto(`${BASE_URL}/`);

        // Wait for page to stabilize
        await page.waitForLoadState('networkidle');

        // Check if we're on login page (look for login form)
        const loginForm = await page.locator('input[type="email"], input[type="password"]').first();
        if (await loginForm.isVisible()) {
            // Fill login credentials
            await page.fill('input[type="email"]', 'admin@codcrm.com');
            await page.fill('input[type="password"]', 'admin123');

            // Click login button
            await page.click('button[type="submit"]');

            // Wait for navigation after login
            await page.waitForLoadState('networkidle');
        }
    });

    test('Dashboard page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    });

    test('Leads page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/leads`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Leads')).toBeVisible({ timeout: 10000 });
    });

    test('Orders page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/orders`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Orders, text=Order Management').first()).toBeVisible({ timeout: 10000 });
    });

    test('Inventory page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/products`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Inventory, text=Products').first()).toBeVisible({ timeout: 10000 });
    });

    test('Analytics page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/analytics`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Analytics')).toBeVisible({ timeout: 10000 });
    });

    test('Financial page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/financial`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Financial')).toBeVisible({ timeout: 10000 });
    });

    test('Marketing Spend page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/financial/marketing-spend`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Marketing Spend, text=Unit Economics').first()).toBeVisible({ timeout: 10000 });
    });

    test('Settings page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Settings')).toBeVisible({ timeout: 10000 });
    });

    test('Users page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/users`);
        await expect(page).not.toHaveTitle(/404/);
        await expect(page.locator('text=Users, text=Team').first()).toBeVisible({ timeout: 10000 });
    });

});

test.describe('Product Routes', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const loginForm = await page.locator('input[type="email"]').first();
        if (await loginForm.isVisible()) {
            await page.fill('input[type="email"]', 'admin@codcrm.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }
    });

    test('Product detail page loads correctly', async ({ page }) => {
        // First go to products list
        await page.goto(`${BASE_URL}/products`);
        await page.waitForLoadState('networkidle');

        // Check if there's a product to click
        const productRow = await page.locator('tr').nth(1);
        if (await productRow.isVisible()) {
            // Click on first product
            await productRow.click();
            await page.waitForLoadState('networkidle');

            // Verify we're on a product detail page (not 404)
            await expect(page).not.toHaveTitle(/404/);

            // Should see product information
            const productInfo = page.locator('text=Product Information, text=Pricing, text=Stock').first();
            await expect(productInfo).toBeVisible({ timeout: 10000 });
        }
    });

    test('Product edit page loads correctly via navigation', async ({ page }) => {
        // Navigate to products
        await page.goto(`${BASE_URL}/products`);
        await page.waitForLoadState('networkidle');

        // Wait for products table to load
        await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => { });

        // Find and click the dropdown menu on first product
        const dropdown = await page.locator('[data-radix-collection-item]').first();
        if (await dropdown.isVisible()) {
            await dropdown.click();

            // Click "Edit Product" option
            const editButton = page.locator('text=Edit Product, text=Edit').first();
            if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForLoadState('networkidle');

                // Verify we're on edit page (not 404)
                await expect(page).not.toHaveTitle(/404/);

                // Should see edit form
                await expect(page.locator('text=Edit Product, text=Save Changes').first()).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('Product edit page loads directly', async ({ page }) => {
        // Navigate directly to an edit page (using ID 1 as example)
        const response = await page.goto(`${BASE_URL}/products/1/edit`);

        // Should NOT be 404
        expect(response?.status()).not.toBe(404);

        await page.waitForLoadState('networkidle');

        // Page should load (either show form or "not found" message from our component)
        const content = page.locator('text=Edit Product, text=Product Not Found').first();
        await expect(content).toBeVisible({ timeout: 10000 });
    });

});

test.describe('Dynamic Routes Health Check', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const loginForm = await page.locator('input[type="email"]').first();
        if (await loginForm.isVisible()) {
            await page.fill('input[type="email"]', 'admin@codcrm.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }
    });

    test('All sidebar navigation links return 200', async ({ page }) => {
        const routes = [
            '/dashboard',
            '/leads',
            '/calls',
            '/orders',
            '/products',
            '/analytics',
            '/financial',
            '/financial/marketing-spend',
            '/users',
            '/settings',
        ];

        for (const route of routes) {
            const response = await page.goto(`${BASE_URL}${route}`);
            expect(response?.status(), `Route ${route} should return 200`).toBe(200);
        }
    });

    test('Dynamic product routes are accessible', async ({ page }) => {
        // Test product detail route
        const detailResponse = await page.goto(`${BASE_URL}/products/1`);
        expect(detailResponse?.status()).toBe(200);

        // Test product edit route
        const editResponse = await page.goto(`${BASE_URL}/products/1/edit`);
        expect(editResponse?.status()).toBe(200);
    });

});
