import { test, expect, Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resources } from '../../src/workspace/resources';
const demoPath = [resolve(process.cwd(), '../.local/demo.json'), resolve(process.cwd(), '.local/demo.json')].find(existsSync);
const password = process.env.E2E_PASSWORD || (demoPath ? JSON.parse(readFileSync(demoPath, 'utf8')).password : '');
test.skip(!password, 'Set up the local demo or provide E2E_PASSWORD before running browser tests.');
async function login(page: Page, phone = '+919900001001') {
    await page.goto('/login');
    await page.getByLabel('Phone number', { exact: true }).fill(phone);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in →', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
}

test('quick view preserves search, supports editing, and opens a reloadable page', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await login(page); await page.goto('/workspace/enquiries');
    const first = page.locator('.record-primary-link').first(); await expect(first).toBeVisible();
    const name = (await first.textContent())!.trim();
    await page.getByLabel('Search records', { exact: true }).fill(name);
    await expect(page).toHaveURL(/q=/);
    await expect(page.locator('.resource-panel')).toHaveAttribute('aria-busy', 'false');
    await page.locator('.record-primary-link').first().click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect(dialog.locator('.record-hero')).toContainText(name);
    await expect(dialog.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
    await page.screenshot({ path: '../.local/detail-modal-desktop.png', fullPage: true });
    await dialog.getByRole('button', { name: 'Edit record', exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel('Student / prospect name')).toHaveValue(name);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog').locator('.record-hero')).toContainText(name);
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Search records', { exact: true })).toHaveValue(name);
    await page.locator('.record-primary-link').first().click();
    await page.getByRole('link', { name: 'Open full page', exact: true }).click();
    await expect(page).toHaveURL(/\/workspace\/enquiries\/[^?]+\?q=/);
    await page.reload(); await expect(page.locator('.record-hero')).toContainText(name);
    await page.screenshot({ path: '../.local/detail-page-desktop.png', fullPage: true });
    await page.getByRole('link', { name: /Back to enquiries/ }).click();
    await expect(page.getByLabel('Search records', { exact: true })).toHaveValue(name);
    expect(errors).toEqual([]);
});

test('page preference persists and detail dialogs remain accessible on mobile', async ({ page }) => {
    await login(page); await page.goto('/workspace/students');
    await page.getByRole('button', { name: 'Full page', exact: true }).click();
    await page.reload(); await expect(page.getByRole('button', { name: 'Full page', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.record-primary-link').first().click();
    await expect(page).toHaveURL(/\/workspace\/students\/[^?]+$/);
    await expect(page.locator('.record-hero')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Open as modal', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('.record-hero')).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.screenshot({ path: '../.local/detail-modal-mobile.png', fullPage: true });
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: '../.local/records-mobile-v2.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('all populated workspaces have working detail pages and missing records recover', async ({ page }) => {
    test.setTimeout(240000); await login(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const [key, config] of Object.entries(resources)) {
        const response = await page.request.get(config.endpoint + '?limit=1');
        expect(response.ok(), config.endpoint).toBeTruthy();
        const data = await response.json(); const row = (data.results || data)[0];
        if (!row) continue;
        await test.step(key, async () => {
            await page.goto('/workspace/' + key + '/' + row.id);
            await expect(page.locator('.record-hero')).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
            if (config.readOnly) await expect(page.getByRole('button', { name: 'Edit record', exact: true })).toHaveCount(0);
        });
    }
    await page.goto('/workspace/enquiries/00000000-0000-0000-0000-000000000000');
    await expect(page.getByRole('heading', { name: 'We couldn’t open this record' })).toBeVisible();
    await page.getByRole('link', { name: /Back to enquiries/ }).click();
    await expect(page.locator('.resource-table')).toBeVisible();
    expect(errors).toEqual([]);
});

test('workspace search navigates and learner tables have read-only detail views', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'A good day starts with a clear picture.' })).toBeVisible();
    await page.screenshot({ path: '../.local/dashboard-v2.png', fullPage: true });
    await page.keyboard.press('Control+k');
    await page.getByLabel('Search workspace pages').fill('Library catalog');
    await page.getByRole('navigation', { name: 'Matching pages' }).getByRole('link', { name: /Library catalog/ }).click();
    await expect(page).toHaveURL(/\/workspace\/books$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: '../.local/library-v2.png', fullPage: true });
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
    await login(page, '+919900002001');
    await page.getByRole('button', { name: 'Fees', exact: true }).click();
    await page.locator('.record-primary-link').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: /Edit|Delete/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Open full page', exact: true }).click();
    await page.reload();
    await expect(page.locator('.record-hero')).toBeVisible();
    await page.goto('/workspace/accounts');
    await expect(page.getByRole('heading', { name: 'You don’t have access to this page.' })).toBeVisible();
});

test('saving and deleting through quick view keeps the table and details synchronized', async ({ page }) => {
    await login(page); await page.goto('/workspace/enquiries');
    const name = 'Detail verification ' + Date.now();
    await page.getByRole('button', { name: '+ Add enquiry', exact: true }).click();
    await page.getByLabel('Student / prospect name').fill(name);
    await page.getByLabel('Contact phone').fill('+919800000099');
    await page.getByLabel('Enquiry source').fill('Detail verification');
    await page.getByRole('button', { name: 'Save record', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Search records', { exact: true }).fill(name);
    await expect(page).toHaveURL(/q=/);
    await expect(page.locator('.resource-panel')).toHaveAttribute('aria-busy', 'false');
    await page.locator('.record-primary-link').first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Edit record', exact: true }).click();
    await page.getByLabel('Conversation notes').fill('Follow up with the family on Friday.');
    await page.getByRole('button', { name: 'Save record', exact: true }).click();
    await expect(page.getByRole('dialog').getByText('Follow up with the family on Friday.', { exact: true })).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page.getByLabel('Search workspace pages')).toHaveCount(0);
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete record', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No matching records', exact: true })).toBeVisible();
});

test('exam student and schedule tables offer details without disrupting edit controls', async ({ page }) => {
    await login(page);
    await page.route('**/api/exam-seating/students/**', route => route.fulfill({ json: { results: [{ id: 'exam-student-1', registration_number: 'EX-101', full_name: 'Exam Student', class_name: 'Grade 8', is_specially_abled: false, preferred_seat_type: 'STANDARD' }] } }));
    await page.goto('/exam-seating/students');
    await page.locator('.record-primary-link').first().click();
    await expect(page.getByRole('dialog').locator('.record-hero')).toContainText('Exam Student');
    await page.getByRole('link', { name: 'Open full page' }).click();
    await page.reload(); await expect(page.locator('.record-hero')).toContainText('Exam Student');
    await page.getByRole('button', { name: 'Back to exam students' }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.route('**/api/exam-seating/days/**', route => route.fulfill({ json: { results: [{ id: 'day-1', date: '2026-11-20', day_number: 1 }] } }));
    await page.route('**/api/exam-seating/subject-schedules/**', route => route.fulfill({ json: { results: [{ id: 'schedule-1', exam_day: 'day-1', subject_name: 'Mathematics', subject_code: 'MATH-01', session: 'MORNING', start_time: '09:30:00', end_time: '12:30:00', duration_minutes: 180, participating_class_groups: ['Grade 8'], max_students_per_room: 30, requires_seat_change_from_previous: false }] } }));
    await page.goto('/schedules');
    await expect(page.locator('.resource-table')).toContainText('Nov 20, 2026');
    await page.locator('.record-primary-link').first().click();
    await expect(page.getByRole('dialog').locator('.record-hero')).toContainText('Mathematics');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});
