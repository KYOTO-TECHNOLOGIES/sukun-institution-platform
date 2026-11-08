import { test, expect } from '@playwright/test';

test('login country search sends a complete international number', async ({ page }) => {
    const requests: Record<string, string>[] = [];
    await page.route('**/api/auth/login/', async route => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({ status: 400, json: { detail: 'Phone submission checked.' } });
    });
    await page.goto('/login');
    const phone = page.getByLabel('Phone number', { exact: true });
    await expect(page.getByRole('button', { name: 'India: + 91', exact: true })).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('Browser-test-only');
    await page.getByRole('button', { name: 'Sign in →', exact: true }).click();
    expect(await phone.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
    expect(requests).toHaveLength(0);

    // Keyboard users can open the country list and search by country name.
    await page.getByRole('button', { name: 'India: + 91', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Search country or calling code').fill('United Arab');
    await page.getByRole('option', { name: /United Arab Emirates/ }).click();
    await expect(phone).toHaveValue('');
    await phone.pressSequentially('501234567');
    await page.getByRole('button', { name: 'Sign in →', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Phone submission checked.');
    expect(requests).toEqual([{ phone_number: '+971501234567', password: 'Browser-test-only' }]);

    // Typing or deleting never changes the country code; only the dropdown can.
    await phone.press('ControlOrMeta+A');
    await phone.press('Backspace');
    await phone.press('Delete');
    await expect(phone).toHaveValue('');
    await expect(page.getByRole('button', { name: 'United Arab Emirates: + 971', exact: true })).toBeVisible();
    await phone.fill('+919876543210');
    expect(await phone.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
    await expect(page.getByRole('button', { name: 'United Arab Emirates: + 971', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'United Arab Emirates: + 971', exact: true }).click();
    await page.getByPlaceholder('Search country or calling code').fill('India');
    await page.getByRole('option', { name: /^India / }).click();
    await expect(page.getByRole('button', { name: 'India: + 91', exact: true })).toBeVisible();
    await expect(phone).toHaveValue('9876543210');
    await page.getByRole('button', { name: 'India: + 91', exact: true }).click();
    await page.getByPlaceholder('Search country or calling code').fill('United Kingdom');
    await page.getByRole('option', { name: /United Kingdom/ }).focus();
    await page.keyboard.press('Enter');
    await expect(phone).toHaveValue('9876543210');
    expect(await phone.evaluate(el => new FormData(el.closest('form')!).get('phone_number'))).toBe('+449876543210');
    await phone.fill('');
    expect(await phone.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
    await expect(page.getByRole('button', { name: 'United Kingdom: + 44', exact: true })).toBeVisible();
});

test('country flags and calling-code search fit a mobile login', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await page.getByRole('button', { name: 'India: + 91', exact: true }).click();
    await page.getByPlaceholder('Search country or calling code').fill('44');
    await expect(page.getByRole('option', { name: /United Kingdom/ })).toBeVisible();
    const list = page.getByRole('listbox');
    const bounds = await list.boundingBox();
    expect(bounds).toBeTruthy();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(await page.locator('.sukun-country-button .fi').evaluate(el => getComputedStyle(el).backgroundImage)).not.toBe('none');
    await page.locator('.sukun-country-button .fi').evaluate(el => new Promise<void>((resolve, reject) => {
        const flag = new Image();
        flag.onload = () => resolve();
        flag.onerror = () => reject(new Error('Country flag could not load'));
        flag.src = getComputedStyle(el).backgroundImage.slice(5, -2);
    }));
    await page.screenshot({ path: '../.local/phone-country-picker-mobile.png', fullPage: true });
    await page.getByRole('option', { name: /United Kingdom/ }).click();
    await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue('');
    await expect(page.getByRole('button', { name: 'United Kingdom: + 44', exact: true })).toBeVisible();
});

test('institution registration uses the same country selector', async ({ page }) => {
    await page.route('**/api/auth/csrf/', route => route.fulfill({ json: { registration_enabled: true } }));
    await page.goto('/login');
    await page.getByRole('button', { name: 'Create institution', exact: true }).click();
    const phone = page.getByLabel('Administrator login phone', { exact: true });
    await expect(phone).toBeVisible();
    await page.getByRole('button', { name: 'India: + 91', exact: true }).click();
    await page.getByPlaceholder('Search country or calling code').fill('Saudi');
    await page.getByRole('option', { name: /Saudi Arabia/ }).click();
    await phone.fill('+966501234567');
    expect(await phone.evaluate(el => new FormData(el.closest('form')!).get('admin_phone'))).toBe('+966501234567');
});
