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
    await expect(page.getByRole('link',{name:'Sukun home'}).first()).toBeVisible();
    await expect(page.locator('.sidebar-powered')).toContainText('Powered by');
    await expect(page.locator('.sidebar-powered img')).toHaveAttribute('alt','Kyoto Technologies');
    await expect(page.getByRole('heading',{name:'A good day starts with a clear picture.'})).toBeVisible();
    await page.screenshot({path:'../.local/dashboard-desktop.png',fullPage:true});
    await page.goto('/workspace/enquiries');
    await page.getByRole('button',{name:'+ Add enquiry',exact:true}).click();
    const name='Browser enquiry '+Date.now();
    await page.getByLabel('Student / prospect name').fill(name);
    await page.getByRole('dialog').getByRole('button',{name:'India: + 91',exact:true}).click();
    await page.getByPlaceholder('Search country or calling code').fill('United Arab');
    await page.getByRole('option',{name:/United Arab Emirates/}).click();
    await page.getByLabel('Contact phone').fill('501234567');
    await page.getByLabel('Enquiry source').fill('Browser verification');
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Search records').fill(name);
    await expect(page.getByRole('cell',{name,exact:true})).toBeVisible();
    const row=page.getByRole('row').filter({hasText:name});
    await expect(row.getByRole('cell',{name:'+971501234567',exact:true})).toBeVisible();
    await row.getByRole('button',{name:'Edit',exact:true}).click();
    await expect(page.getByRole('button',{name:'United Arab Emirates: + 971',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    expect(errors).toEqual([]);
});

test('optional phone fields save blank without a bare country code',async({page})=>{
    await login(page);
    await page.goto('/workspace/queue');
    await page.getByRole('button',{name:'+ Add record',exact:true}).click();
    const name='No phone visitor '+Date.now();
    await page.getByLabel('Visitor name').fill(name);
    await page.getByRole('dialog').getByRole('button',{name:'India: + 91',exact:true}).click();
    await page.getByPlaceholder('Search country or calling code').fill('United Arab');
    await page.getByRole('option',{name:/United Arab Emirates/}).click();
    const submitted=page.waitForRequest(request=>request.url().includes('/api/operations/queue/')&&request.method()==='POST');
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    expect((await submitted).postDataJSON().phone).toBe('');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Search records').fill(name);
    await expect(page.getByRole('cell',{name,exact:true})).toBeVisible();

    await page.goto('/workspace/institution-settings');
    await page.getByRole('button',{name:'Edit',exact:true}).first().click();
    const phone=page.getByRole('dialog').getByLabel('Phone',{exact:false});
    await expect(phone).not.toHaveValue(/^\+/);
    await expect(phone.locator('..').getByRole('button',{name:/\+ 91$/})).toBeVisible();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
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
    await expect(page.locator('.mobile-brand-link')).toBeVisible();
    await page.getByRole('button',{name:'Open navigation'}).click();
    await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
    await page.getByRole('link',{name:'Enquiry pipeline',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Enquiries & admissions pipeline'})).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({path:'../.local/workspace-mobile.png',fullPage:true});
});

test('teacher can distinguish an unsubmitted attendance register from saved attendance',async({page})=>{
    let saved:any=null;
    await page.route('**/api/attendance/student-attendance/**',async route=>{
        const request=route.request();
        if(request.method()==='POST'){
            saved=request.postDataJSON();
            await route.fulfill({status:200,json:{saved:saved.records.length}});
        }else await route.fulfill({status:200,json:saved?saved.records.map((row:any,index:number)=>({...row,id:'attendance-'+index,date:saved.date,division:saved.division})):[]});
    });
    await login(page,'+919900001002');
    await page.goto('/daily-attendance');
    await page.getByLabel('Class division').selectOption({index:1});
    await expect(page.getByText('Not submitted',{exact:true})).toBeVisible();
    await expect(page.getByRole('group',{name:/Attendance for/}).first()).toBeVisible();
    const rosterSize=await page.getByRole('group',{name:/Attendance for/}).count();
    expect(rosterSize).toBeGreaterThan(0);
    await expect(page.getByText('Not marked',{exact:true})).toHaveCount(rosterSize);
    await expect(page.getByRole('button',{name:'Submit attendance',exact:true})).toBeDisabled();

    const first=page.getByRole('group',{name:/Attendance for/}).first();
    await first.getByRole('button',{name:/Absent/}).click();
    await expect(page.getByText('Unsaved changes',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Mark remaining present',exact:true}).click();
    await expect(first.getByRole('button',{name:/Absent/})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByText(rosterSize+' of '+rosterSize+' marked',{exact:true})).toBeVisible();
    await expect(page.getByText('Ready to submit',{exact:true})).toBeVisible();
    await page.screenshot({path:'../.local/attendance-ready-to-submit.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await expect(first.getByRole('button',{name:/Absent/})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({path:'../.local/attendance-mobile.png',fullPage:true});

    await page.getByRole('button',{name:'Submit attendance',exact:true}).click();
    await expect(page.getByText('Submitted',{exact:true})).toBeVisible();
    await expect(page.getByText('Attendance submitted for '+rosterSize+' students.')).toBeVisible();
    expect(saved.records.filter((row:any)=>row.status==='ABSENT')).toHaveLength(1);
    expect(saved.records.filter((row:any)=>row.status==='PRESENT')).toHaveLength(rosterSize-1);
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
                for(const field of resource.fields.filter(f=>f.type==='tel')){
                    const input=page.getByRole('dialog').getByLabel(field.label,{exact:false});
                    await expect(input).toHaveAttribute('type','tel');
                    await expect(input.locator('..').getByRole('button',{name:'India: + 91',exact:true})).toBeVisible();
                }
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

test('admission becomes an enrolled student with a printable certificate',async({page})=>{
    await login(page);
    const name='Admissions '+Date.now();
    const phone='+917'+String(Date.now()).slice(-9);
    await page.goto('/workspace/applications');
    await page.getByRole('button',{name:'+ Add record',exact:true}).click();
    await page.getByLabel('First name',{exact:false}).fill(name);
    await page.getByLabel('Unique student login phone').fill(phone);
    await page.getByLabel('Class division').selectOption({index:1});
    await page.getByLabel('Academic year').selectOption({index:1});
    await page.getByLabel('Documents verified').check();
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Search records').fill(name);
    const row=page.getByRole('row').filter({hasText:name});
    await row.getByRole('button',{name:'Review',exact:true}).click();
    await page.getByLabel('Decision').selectOption('APPROVED');
    await page.getByRole('dialog').getByRole('button',{name:'Review',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await row.getByRole('button',{name:'Enroll student',exact:true}).click();
    await page.getByLabel('Initial student password').fill(password);
    await page.getByRole('dialog').getByRole('button',{name:'Enroll student',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(row.getByText('ENROLLED',{exact:false})).toBeVisible();
    const application=(await (await page.request.get('/api/admissions/applications/?search='+encodeURIComponent(name))).json()).results[0];
    await page.goto('/students/'+application.student);
    await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Certificate register',exact:true}).click();
    await page.getByRole('link',{name:'Open register →'}).click();
    await page.getByRole('button',{name:'+ Add record',exact:true}).click();
    await page.getByLabel('Certificate type').selectOption('BONAFIDE');
    const number='E2E-'+Date.now();
    await page.getByLabel('Certificate number').fill(number);
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const popup=page.waitForEvent('popup');
    await page.getByRole('row').filter({hasText:number}).getByRole('link',{name:'Print certificate'}).click();
    const certificate=await popup;
    await expect(certificate.getByRole('heading',{name:'Bonafide Certificate'})).toBeVisible();
    await expect(certificate.getByRole('cell',{name,exact:true})).toBeVisible();
    await certificate.close();
});

test('accountant can collect, print and refund a payment with reconciled balance',async({page})=>{
    await login(page,'+919900001005');
    const bills=await (await page.request.get('/api/finance/student-fees/?limit=500')).json();
    const bill=bills.results.find((b:any)=>Number(b.balance)>=2);
    expect(bill).toBeTruthy();
    const reference='BROWSER-'+Date.now();
    await page.goto('/workspace/receipts');
    await page.getByRole('button',{name:'+ Add record',exact:true}).click();
    await page.getByLabel('Student bill').selectOption(bill.id);
    await page.getByLabel('Payment amount').fill('1.00');
    await page.getByLabel('Bank / transaction reference').fill(reference);
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const payment=(await (await page.request.get('/api/finance/fee-payments/?search='+reference)).json()).results[0];
    expect(payment).toBeTruthy();
    const afterPayment=await (await page.request.get('/api/finance/student-fees/'+bill.id+'/')).json();
    expect(Number(afterPayment.balance)).toBe(Number(bill.balance)-1);
    await page.getByLabel('Search records').fill(payment.receipt_number);
    const popup=page.waitForEvent('popup');
    await page.getByRole('row').filter({hasText:payment.receipt_number}).getByRole('link',{name:'Print receipt'}).click();
    const receipt=await popup;
    await expect(receipt.getByRole('button',{name:'Print receipt'})).toBeVisible();
    await receipt.close();
    await page.goto('/workspace/refunds');
    await page.getByRole('button',{name:'+ Add record',exact:true}).click();
    await page.getByLabel('Original receipt').selectOption(payment.id);
    await page.getByLabel('Refund amount').fill('1.00');
    await page.getByLabel('Reason',{exact:false}).fill('Browser verification refund');
    await page.getByRole('button',{name:'Save record',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const afterRefund=await (await page.request.get('/api/finance/student-fees/'+bill.id+'/')).json();
    expect(Number(afterRefund.balance)).toBe(Number(bill.balance));
});
