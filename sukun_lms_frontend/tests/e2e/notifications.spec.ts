import { test, expect, BrowserContext, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const password = process.env.E2E_PASSWORD || JSON.parse(readFileSync(resolve(process.cwd(), '../.local/demo.json'), 'utf8')).password;
const origin = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function session(context: BrowserContext, phone: string) {
    const csrf = await (await context.request.get(origin + '/api/auth/csrf/')).json();
    const response = await context.request.post(origin + '/api/auth/login/', { data: { phone_number: phone, password }, headers: { 'X-CSRFToken': csrf.csrfToken, Origin: origin } });
    expect(response.ok(), await response.text()).toBeTruthy();
    const data = await response.json();
    return data.user;
}
async function write(context: BrowserContext, method: string, path: string, data?: any) {
    const csrf = await (await context.request.get(origin + '/api/auth/csrf/')).json();
    const response = await context.request.fetch(origin + path, { method, data, headers: { 'X-CSRFToken': csrf.csrfToken, Origin: origin } });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.status() === 204 ? undefined : response.json();
}
async function inbox(page: Page) {
    await page.goto('/notifications');
    await expect(page.getByText('Live updates', { exact: true })).toBeVisible();
}
test('addressed notices arrive live, read state syncs across tabs, and popup preference persists', async ({ browser }) => {
    const sender = await browser.newContext(), recipient = await browser.newContext();
    const actor = await session(sender, '+919900001001');
    const parent = await session(recipient, '+919900001009');
    const page = await recipient.newPage();
    const title = 'Live family notice ' + Date.now();
    let notice: any, quiet: any;
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    try {
        await write(recipient, 'PATCH', '/api/notifications/preferences/', { toasts_enabled: true, muted_modules: [] });
        await inbox(page);
        const frames: string[] = [];
        page.on('websocket', socket => socket.on('framereceived', event => frames.push(String(event.payload))));
        // Reopen once so the test observes the actual Daphne socket frames.
        await page.reload(); await expect(page.getByText('Live updates', { exact: true })).toBeVisible();
        notice = await write(sender, 'POST', '/api/communications/notifications/', { institution: actor.institution_id || actor.institution, recipients: [parent.id], title, message: 'Please bring your handbook tomorrow.', notification_type: 'GENERAL' });
        await expect(page.locator('.notification-list').getByRole('heading', { name: title, exact: false })).toBeVisible();
        await expect(page.locator('.Toastify__toast').filter({ hasText: title })).toBeVisible();
        expect(frames.some(frame => frame.includes('notifications.changed'))).toBeTruthy();
        const second = await recipient.newPage(); await inbox(second);
        await expect(second.locator('.notification-list').getByRole('heading', { name: title, exact: false })).toBeVisible();
        await page.getByRole('button', { name: 'Mark read: ' + title, exact: true }).click();
        await expect(page.getByRole('button', { name: 'Mark read: ' + title, exact: true })).toHaveCount(0);
        await expect(second.getByRole('button', { name: 'Mark read: ' + title, exact: true })).toHaveCount(0);
        await second.close();
        await page.getByRole('switch', { name: /Important popups/ }).uncheck();
        await expect(page.getByRole('switch', { name: /Important popups/ })).toBeEnabled();
        await page.reload();
        await expect(page.getByRole('switch', { name: /Important popups/ })).not.toBeChecked();
        await expect(page.getByText('Live updates', { exact: true })).toBeVisible();
        const quietTitle = 'Quiet family notice ' + Date.now();
        quiet = await write(sender, 'POST', '/api/communications/notifications/', { institution: actor.institution_id || actor.institution, recipients: [parent.id], title: quietTitle, message: 'Saved in your inbox without a popup.', notification_type: 'GENERAL' });
        await expect(page.locator('.notification-list').getByRole('heading', { name: quietTitle, exact: false })).toBeVisible();
        await expect(page.locator('.Toastify__toast').filter({ hasText: quietTitle })).toHaveCount(0);
        await page.screenshot({ path: '../.local/notifications-desktop.png', fullPage: true });
        expect(errors).toEqual([]);
    } finally {
        await write(recipient, 'PATCH', '/api/notifications/preferences/', { toasts_enabled: true, muted_modules: [] });
        for (const item of [notice, quiet]) if (item?.id) await write(sender, 'DELETE', '/api/communications/notifications/' + item.id + '/');
        await sender.close(); await recipient.close();
    }
});

test('routine module updates refresh the inbox silently and open the detail page', async ({ browser }) => {
    const sender = await browser.newContext(), recipient = await browser.newContext();
    const actor = await session(sender, '+919900001001');
    await session(recipient, '+919900001003');
    const page = await recipient.newPage();
    let lead: any;
    const sockets: string[] = [];
    page.on('websocket', socket => { if (socket.url().includes('/ws/notifications/')) sockets.push(socket.url()); });
    try {
        await inbox(page);
        lead = await write(sender, 'POST', '/api/admissions/leads/', { institution: actor.institution_id || actor.institution, full_name: 'Realtime enquiry ' + Date.now(), phone: '9991234567', source: 'Walk-in' });
        const detail = page.locator('.notification-list a[href="/workspace/enquiries/' + lead.id + '"]');
        await expect(detail).toBeVisible();
        await expect(page.locator('.Toastify__toast')).toHaveCount(0);
        await detail.click();
        await expect(page).toHaveURL(new RegExp('/workspace/enquiries/' + lead.id));
        await expect(page.locator('.record-hero')).toContainText(lead.full_name);
        expect(sockets).toHaveLength(1);
    } finally {
        if (lead?.id) await write(sender, 'DELETE', '/api/admissions/leads/' + lead.id + '/');
        await sender.close(); await recipient.close();
    }
});

test('offline delivery is recovered on reconnect without replaying old popups', async ({ browser }) => {
    const sender = await browser.newContext(), recipient = await browser.newContext();
    const actor = await session(sender, '+919900001001');
    const parent = await session(recipient, '+919900001009');
    const page = await recipient.newPage();
    await page.addInitScript(() => {
        const NativeSocket = window.WebSocket;
        (window as any).__inboxSockets = [];
        window.WebSocket = class extends NativeSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                (window as any).__inboxSockets.push(this);
            }
        };
    });
    let notice: any;
    const title = 'Offline notice ' + Date.now();
    try {
        await inbox(page);
        await recipient.setOffline(true);
        await page.evaluate(() => (window as any).__inboxSockets.forEach((socket: WebSocket) => socket.close()));
        await expect(page.getByText(/Reconnecting|Waiting for connection/, { exact: false }).first()).toBeVisible();
        notice = await write(sender, 'POST', '/api/communications/notifications/', { institution: actor.institution_id || actor.institution, recipients: [parent.id], title, message: 'Catch up when you return.', notification_type: 'GENERAL' });
        await recipient.setOffline(false);
        await expect(page.getByText('Live updates', { exact: true })).toBeVisible();
        await expect(page.locator('.notification-list').getByRole('heading', { name: title, exact: false })).toBeVisible();
        await expect(page.locator('.Toastify__toast')).toHaveCount(0);
    } finally {
        await recipient.setOffline(false);
        if (notice?.id) await write(sender, 'DELETE', '/api/communications/notifications/' + notice.id + '/');
        await sender.close(); await recipient.close();
    }
});

test('notification dialog supports keyboard focus, mobile layout, and full inbox navigation', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await session(context, '+919900001009');
    const page = await context.newPage();
    try {
        await page.goto('/');
        const bell = page.getByRole('button', { name: /^Notifications/ });
        await bell.click();
        const dialog = page.getByRole('dialog', { name: 'Your notifications' });
        await expect(dialog).toBeVisible();
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBeTruthy();
        await page.screenshot({ path: '../.local/notifications-mobile.png', fullPage: true });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(bell).toBeFocused();
        await bell.click();
        await page.getByRole('link', { name: 'Open full inbox', exact: true }).click();
        await expect(page).toHaveURL(/\/notifications/);
        await expect(page.getByRole('heading', { name: /Your inbox/ })).toBeVisible();
    } finally { await context.close(); }
});
