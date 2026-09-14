import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'browser.spec.js',workers:1,timeout:90000,
 use:{baseURL:'http://127.0.0.1:4173/brauprotokoll/',headless:true,launchOptions:{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'},trace:'retain-on-failure'},
 webServer:{command:'python3 tests/serve.py',url:'http://127.0.0.1:4173/brauprotokoll/',reuseExistingServer:!process.env.CI},
 projects:[{name:'mobile',use:{viewport:{width:375,height:812},isMobile:true,hasTouch:true}},{name:'desktop',use:{viewport:{width:1440,height:1000}}}]
});
