import {test,expect,Page} from '@playwright/test';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {resources} from '../../src/workspace/resources';
const configPath=resolve(process.cwd(),'../.local/demo.json');
const password=process.env.E2E_PASSWORD||(existsSync(configPath)?JSON.parse(readFileSync(configPath,'utf8')).password:'');
test.skip(!password,'Run python scripts/dev.py setup and start the API and frontend first.');

async function login(page:Page,phone='+919900001001'){
    await page.goto('/login');
    await page.getByLabel('Phone number',{exact:true}).fill(phone);
    await page.getByLabel('Password',{exact:true}).fill(password);
    await page.getByRole('button',{name:'Sign in →',exact:true}).click();
    await expect(page).not.toHaveURL(/login/);
}

test('administrator can open dashboard and capture an enquiry',async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await login(page);
    await expect(page.getByRole('heading',{name:'A good day starts with a clear picture.'})).toBeVisible();
    await page.screenshot({path:'../.local/dashboard-desktop.png',fullPage:true});
    await page.goto('/workspace/enquiries');
    await page.getByRole('button',{name:'+ Add enquiry',exact:true}).click();
    const name='Browser enquiry '+Date.now();
    await page.getByLabel('Student / prospect name').fill(name);
    await page.getByLabel('Contact phone').fill('+919900009999');
    await page.getByLabel('Enquiry source').fill('Browser verification');
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Search records').fill(name);
    await expect(page.getByRole('cell',{name,exact:true})).toBeVisible();
    expect(errors).toEqual([]);
});

test('student can learn and submit an assignment',async({page})=>{
    await login(page,'+919900002001');
    await expect(page.getByRole('heading',{name:'Your next chapter starts here.'})).toBeVisible();
    await page.getByRole('button',{name:'Open classroom →'}).first().click();
    await expect(page.getByRole('heading',{name:'Mathematics in everyday life'})).toBeVisible();
    const complete=page.getByRole('button',{name:'Mark lesson complete'}).first();
    if(await complete.count())await complete.click();
    await expect(page.getByRole('button',{name:'✓ Completed'}).first()).toBeVisible();
    await page.getByRole('button',{name:'Assignments',exact:true}).click();
    await page.getByLabel('Your answer').fill('I counted time, measured a notebook, and checked the price of my school supplies.');
    await page.getByRole('button',{name:/Submit assignment|Update submission/}).click();
    await expect(page.getByText('Your work has been saved.')).toBeVisible();
    await page.screenshot({path:'../.local/student-classroom.png',fullPage:true});
    await page.goto('/workspace/accounts');
    await expect(page.getByRole('heading',{name:'You don’t have access to this page.'})).toBeVisible();
});

test('parent can review the linked child without submission controls',async({page})=>{
    await login(page,'+919900001009');
    await expect(page.getByRole('heading',{name:'A clear view of your child’s journey.'})).toBeVisible();
    await page.getByRole('button',{name:'Open classroom →'}).first().click();
    await expect(page.getByRole('button',{name:'Mark lesson complete'})).toHaveCount(0);
    await page.getByRole('button',{name:'Assignments',exact:true}).click();
    await expect(page.getByRole('button',{name:'Submit assignment'})).toHaveCount(0);
});

for(const [role,phone,path,heading] of [
    ['teacher','+919900001002','/workspace/courses','Course studio'],
    ['marketing','+919900001003','/workspace/enquiries','Enquiries & admissions pipeline'],
    ['admissions','+919900001004','/workspace/applications','Admission applications'],
    ['accountant','+919900001005','/workspace/receipts','Collections & receipts'],
    ['librarian','+919900001006','/workspace/books','Library catalog'],
    ['HR','+919900001007','/workspace/payroll','Payroll register'],
    ['front desk','+919900001008','/workspace/queue','Front desk queue'],
]){
    test(role+' has a working role workspace',async({page})=>{
        await login(page,phone);await page.goto(path);
        await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
        await expect(page.getByText('Loading records…')).toHaveCount(0);
        await expect(page.locator('.workspace-error')).toHaveCount(0);
    });
}

test('mobile navigation works',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await login(page);
    await page.getByRole('button',{name:'Open navigation'}).click();
    await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
    await page.getByRole('link',{name:'Enquiry pipeline',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Enquiries & admissions pipeline'})).toBeVisible();
    await page.screenshot({path:'../.local/workspace-mobile.png',fullPage:true});
});

test('every institution workspace and its create form loads',async({page})=>{
    test.setTimeout(240000);
    await login(page);
    for(const [key,resource] of Object.entries(resources)){
        await test.step(key,async()=>{
            await page.goto('/workspace/'+key);
            await expect(page.getByRole('heading',{name:resource.title,exact:true})).toBeVisible();
            await expect(page.getByText('Loading records…')).toHaveCount(0);
            await expect(page.locator('.workspace-error')).toHaveCount(0);
            if(!resource.noCreate&&!resource.readOnly){
                await page.locator('.workspace-primary').filter({hasText:/Add/}).first().click();
                await expect(page.getByRole('dialog')).toBeVisible();
                await expect(page.getByRole('dialog').getByText('Loading…',{exact:true})).toHaveCount(0);
                await expect(page.locator('.workspace-error')).toHaveCount(0);
                await page.getByRole('button',{name:'Cancel',exact:true}).click();
            }
            const response=await page.request.fetch((process.env.E2E_API_URL||'http://127.0.0.1:8000')+resource.endpoint,{method:'OPTIONS'});
            expect(response.status(),resource.endpoint).toBe(200);
            const meta=await response.json();
            const fields=meta.actions?.POST;
            if(fields){
                for(const field of resource.fields){
                    expect(fields[field.key],key+': '+field.key+' exists on the API').toBeTruthy();
                    if(fields[field.key]?.choices&&field.options){
                        const allowed=fields[field.key].choices.map((c:any)=>String(c.value));
                        for(const option of field.options)expect(allowed,key+': '+field.key).toContain(Array.isArray(option)?option[0]:option);
                    }
                }
            }
        });
    }
});
