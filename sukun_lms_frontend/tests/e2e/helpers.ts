import {expect, Page, test} from '@playwright/test';

/** The suite intentionally shares an IP. Respect the real login throttle rather than disabling it. */
export async function submitLogin(page:Page) {
    for(let attempt=0;attempt<3;attempt++){
        const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/login/')&&r.request().method()==='POST');
        await page.getByRole('button',{name:/^Sign in/}).click();
        const result=await response;
        if(result.status()!==429){await expect(page).not.toHaveURL(/login/);return;}
        const wait=Math.max(1,Math.min(60,Number(result.headers()['retry-after'])||1));
        test.setTimeout(test.info().timeout+(wait+2)*1000);
        await page.waitForTimeout(wait*1000+150);
    }
    throw new Error('Login remained throttled after respecting Retry-After.');
}
