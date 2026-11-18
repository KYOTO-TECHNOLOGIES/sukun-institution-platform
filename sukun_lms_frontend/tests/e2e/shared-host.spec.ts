import {test, expect} from '@playwright/test';

test('login uses its CSRF endpoint token instead of a sibling application cookie', async ({page, context, baseURL}) => {
    const ownToken = 'sukun-endpoint-token';
    await context.addCookies([{name:'csrftoken', value:'other-application-token', url:baseURL!}]);
    await page.route('**/api/auth/csrf/', route => route.fulfill({json:{csrfToken:ownToken, registration_enabled:false}}));
    await page.route('**/api/auth/login/', async route => {
        expect(route.request().headers()['x-csrftoken']).toBe(ownToken);
        await route.fulfill({status:400, json:{detail:'CSRF header checked.'}});
    });
    await page.goto('/login');
    await page.getByLabel('Phone number', {exact:true}).fill('+919900001001');
    await page.getByLabel('Password', {exact:true}).fill('Synthetic-test-only');
    await page.getByRole('button', {name:/^Sign in/}).click();
    await expect(page.getByRole('alert')).toContainText('CSRF header checked.');
    expect((await context.cookies()).find(cookie=>cookie.name==='csrftoken')?.value).toBe('other-application-token');
});
