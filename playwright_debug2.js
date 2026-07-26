const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');

let html = fs.readFileSync('nhatky/index.html', 'utf8');
html = html.replace('renderMainBoard();', 'try { renderMainBoard(); console.log(\'RENDER DONE\'); } catch(e) { console.log(\'RENDER ERROR: \' + e.message + e.stack); }');
fs.writeFileSync('nhatky/index_test.html', html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.addInitScript(() => {
    window.BD_SSO = { getUser: () => ({ name: 'Test' }) };
    window.bdsApiFetch = async () => ({ status: 'success', plans: [{ id: '1', task: 'Task 1', status: 'Đang làm' }] });
  });

  const fileUrl = 'file:///' + path.resolve('nhatky/index_test.html').replace(/\\/g, '/');
  await page.goto(fileUrl);
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
