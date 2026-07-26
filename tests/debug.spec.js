// Debug test - tìm root cause tại sao navigateToDetail undefined
const { test, expect } = require('@playwright/test');

test('debug - kiểm tra page state sau goto', async ({ page }) => {
  // Collect console messages
  const logs = [];
  const errors = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push({ message: err.message, stack: err.stack }));

  // Setup mocks
  await page.addInitScript(() => {
    const mockUser = {
      name: 'Hau DV', username: 'hau.dv', role: 'user',
      loginAt: Date.now() - 1000
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    
    // Capture JS errors with location info
    window.addEventListener('error', function(e) {
      console.error('JSERR: ' + e.message + ' | file:' + e.filename + ' line:' + e.lineno + ':' + e.colno);
    }, true);
    
    window.bdsApiFetch = async (action) => {
      if (action === 'getPlans') return { status: 'success', plans: [] };
      if (action === 'getStaff') return { status: 'success', data: [] };
      return { status: 'success' };
    };
    window.bdsApiPost = async () => ({ status: 'success' });
    console.log('[addInitScript] localStorage set, mocks ready');
  });

  await page.goto('http://localhost:8080/nhatky/index.html');
  await page.waitForTimeout(1000); // đợi async initApp

  const state = await page.evaluate(() => {
    return {
      navigateToDetailDefined: typeof navigateToDetail !== 'undefined',
      renderMainBoardDefined: typeof renderMainBoard !== 'undefined',
      dataTheme: document.documentElement.getAttribute('data-theme'),
      loginOverlayVisible: document.getElementById('loginOverlay') ? 
        document.getElementById('loginOverlay').style.display : 'none-element',
      BD_SSO_defined: typeof BD_SSO !== 'undefined',
      BD_SSO_user: typeof BD_SSO !== 'undefined' ? JSON.stringify(BD_SSO.getUser()) : 'n/a',
      localStorage_currentUser: localStorage.getItem('currentUser') ? 'set' : 'NOT SET',
      allPlansType: typeof allPlans,
    };
  });

  console.log('Page state:', JSON.stringify(state, null, 2));
  console.log('Console logs:', logs.slice(0, 10));
  console.log('Page errors:', errors);

  // Không assert gì - chỉ print info
  expect(true).toBe(true);
});
