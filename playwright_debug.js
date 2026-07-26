const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
    window.onerror = function(message, source, lineno, colno, error) {
      console.log('GLOBAL ERROR:', message, error);
    };
    window.BD_SSO = { getUser: () => ({ name: 'Test' }) };
    window.bdsApiFetch = async () => ({ status: 'success', plans: [{ id: '1', task: 'Task 1', status: 'Đang làm' }] });
  });

  const fileUrl = 'file:///' + path.resolve('nhatky/index.html').replace(/\\/g, '/');
  await page.goto(fileUrl);
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
