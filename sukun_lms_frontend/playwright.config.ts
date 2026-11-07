import {defineConfig} from '@playwright/test';
export default defineConfig({
    testDir:'./tests/e2e',timeout:60000,expect:{timeout:15000},fullyParallel:false,workers:1,
    reporter:[['list'],['html',{open:'never'}]],
    webServer:process.env.CI?[
        {command:'python ../scripts/dev.py api',url:'http://127.0.0.1:8000/health/',timeout:120000},
        {command:'npm run dev -- --host 127.0.0.1 --port 5173',url:'http://127.0.0.1:5173',timeout:120000},
    ]:undefined,
    use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:5173',viewport:{width:1440,height:1000},trace:'retain-on-failure',screenshot:'only-on-failure'},
});
