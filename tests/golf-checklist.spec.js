// tests/golf-checklist.spec.js
// E2E Test â€“ Golf Checklist: Trá»n vÃ²ng Ä‘á»i
//
// Mock mode (khÃ´ng cáº§n backend):
//   npx playwright test tests/golf-checklist.spec.js --project=chromium
//
// Staging mode (backend tháº­t):
//   $env:STAGING_URL="https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec"
//   npx playwright test tests/golf-checklist.spec.js --project=chromium

const { test, expect } = require('@playwright/test');

const STAGING_URL = process.env.STAGING_URL;
const IS_STAGING  = !!STAGING_URL;
const TODAY       = new Date().toLocaleDateString('sv-SE');

const MOCK_TEMPLATES = [
  {
    templateId: 'ca_sang',
    templateName: 'Ca SÃ¡ng (00h00 - 23h59)',
    items: [
      { itemId: 'A01', section: 'A', sectionTitle: 'Nháº­n ca', label: 'Nháº­n bÃ n giao tá»« ca tá»‘i', inputType: 'check' },
      { itemId: 'A02', section: 'A', sectionTitle: 'Nháº­n ca', label: 'Má»©c nÆ°á»›c bá»ƒ ngáº§m (cm)', inputType: 'number', unit: 'cm' },
      { itemId: 'C01', section: 'C', sectionTitle: 'ÄÃ³ng ca', label: 'Ghi nháº­t kÃ½ sá»± cá»‘', inputType: 'text' }
    ]
  }
];

async function injectMocks(page) {
  await page.addInitScript(({ stagingUrl, templates }) => {
    window.__lastApiCall__ = null;
    if (stagingUrl) {
      window.CONFIG = window.CONFIG || {};
      window.CONFIG.gasUrl = stagingUrl;
      return;
    }
    // Only set staging URL in init script
    if (stagingUrl) {
      window.CONFIG = window.CONFIG || {};
      window.CONFIG.gasUrl = stagingUrl;
    }
    // Bypass SSO requirement for submit
    localStorage.setItem('cmms_op_name', 'Test E2E KTV');
  }, { stagingUrl: STAGING_URL });
}

test.describe('Golf Checklist â€“ VÃ²ng Ä‘á»i Ä‘áº§y Ä‘á»§', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[ERR] ${msg.text()}`);
    });
    await injectMocks(page);
    await page.goto('/sangolf/index.html');
    
    // Override API functions after scripts are loaded so they aren't overwritten
    if (!IS_STAGING) {
      await page.evaluate((templates) => {
        window.__lastApiCall__ = null;
        window.bdsApiFetch = async (action) => {
          if (action === 'getGolfTemplates') return { status: 'success', templates };
          if (action.startsWith('getGolfRuns')) return { status: 'success', runs: [] };
          return { status: 'success' };
        };
        window.bdsApiPost = async (action, payload) => {
          window.__lastApiCall__ = { action, payload };
          return { status: 'success', runId: 'GOLF-ca_sang-TEST' };
        };
      }, MOCK_TEMPLATES);
    }
  });

  // 1. Home View
  test('Home View: hiá»‡n datePicker vÃ  operatorInput', async ({ page }) => {
    await expect(page.locator('#homeView')).toBeVisible();
    await expect(page.locator('#datePicker')).toBeVisible();
    await expect(page.locator('#operatorInput')).toBeVisible();
  });

  test('templateCards hiá»ƒn thá»‹ sau khi load templates', async ({ page }) => {
    if (!IS_STAGING) {
      await page.evaluate((tpls) => {
        window.templates = tpls;
        if (typeof renderHome === 'function') renderHome();
      }, MOCK_TEMPLATES);
    }
    await expect(
      page.locator('#templateCards .card-custom, #templateCards button, #templateCards .nk-empty').first()
    ).toBeVisible({ timeout: IS_STAGING ? 45000 : 10000 });
  });

  // 2. Má»Ÿ Run View
  test('Click Ca SÃ¡ng â†’ runView hiá»‡n + runBody cÃ³ ná»™i dung', async ({ page }) => {
    const TIMEOUT = IS_STAGING ? 45000 : 10000;
    if (!IS_STAGING) {
      await page.evaluate((tpls) => {
        window.templates = tpls;
        window.serverRuns = {};
        if (typeof renderHome === 'function') renderHome();
      }, MOCK_TEMPLATES);
    }

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await expect(caBtn).toBeVisible({ timeout: TIMEOUT });
    await caBtn.click();

    await expect(page.locator('#runView')).toBeVisible({ timeout: IS_STAGING ? 30000 : 10000 });
    await expect(page.locator('#runBody')).not.toBeEmpty();
  });

  // 3. Äiá»n form
  test('Äiá»n sá»‘ vÃ o item A02 â†’ progress text khÃ´ng cÃ²n 0/0', async ({ page }) => {
    test.skip(IS_STAGING, 'Chá»‰ cháº¡y trong mock mode');

    await page.evaluate((tpls) => {
      window.templates = tpls;
      window.serverRuns = {};
      if (typeof renderHome === 'function') renderHome();
    }, MOCK_TEMPLATES);

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await caBtn.click();
    await expect(page.locator('#runView')).toBeVisible();

    const numInput = page.locator('#item-A02 input[type="number"], #item-A02 .num-input').first();
    if (await numInput.count() > 0) {
      await numInput.fill('50');
      await expect(numInput).toHaveValue('50');
    }

    const progressText = await page.locator('#progressText').textContent().catch(() => '');
    console.log('Progress:', progressText);
    expect(progressText).not.toBe('0/0 má»¥c');
  });

  // 4. NÃºt chá»‘t ca
  test('runView: nÃºt CHá»T CA & BÃ€N GIAO hiá»‡n khi status=draft', async ({ page }) => {
    test.skip(IS_STAGING, 'Chá»‰ cháº¡y trong mock mode');

    await page.evaluate((tpls) => {
      window.templates = tpls;
      window.serverRuns = {};
      if (typeof renderHome === 'function') renderHome();
    }, MOCK_TEMPLATES);

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await caBtn.click();
    await expect(page.locator('#runView')).toBeVisible();

    const btn = page.locator('.btn-submit-glow, #submitArea button').first();
    await expect(btn).toBeVisible();
  });

  test('Báº¥m Chá»‘t Ca â†’ submitModal má»Ÿ', async ({ page }) => {
    test.skip(IS_STAGING, 'Chá»‰ cháº¡y trong mock mode');

    await page.evaluate((tpls) => {
      window.templates = tpls;
      window.serverRuns = {};
      if (typeof renderHome === 'function') renderHome();
    }, MOCK_TEMPLATES);

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await caBtn.click();
    await expect(page.locator('#runView')).toBeVisible();

    await page.locator('.btn-submit-glow').first().click();
    await expect(page.locator('#submitModal')).toBeVisible({ timeout: 5000 });
  });

  test('Äiá»n bÃ n giao â†’ XÃ¡c Nháº­n â†’ gá»i submitGolfRun', async ({ page }) => {
    test.skip(IS_STAGING, 'Chá»‰ cháº¡y trong mock mode');

    await page.evaluate((tpls) => {
      window.templates = tpls;
      window.serverRuns = {};
      if (typeof renderHome === 'function') renderHome();
    }, MOCK_TEMPLATES);

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await caBtn.click();
    await expect(page.locator('#runView')).toBeVisible();

    await page.locator('.btn-submit-glow').first().click();
    await expect(page.locator('#submitModal')).toBeVisible({ timeout: 5000 });

    await page.locator('#handoverNoteInput').fill('Thiáº¿t bá»‹ hoáº¡t Ä‘á»™ng tá»‘t');
    await page.locator('#handoverToInput').fill('Nguyá»…n VÄƒn B');
    await page.locator('#btnConfirmSubmit').click();

    // Wait for API call to happen without strictly depending on modal animation
    await page.waitForFunction(() => window.__lastApiCall__ && window.__lastApiCall__.action === 'submitGolfRun', { timeout: 10000 });
    const lastCall = await page.evaluate(() => window.__lastApiCall__);
    expect(lastCall).toBeTruthy();
    expect(lastCall.action).toBe('submitGolfRun');
    console.log('submitGolfRun payload:', JSON.stringify(lastCall.payload));
  });

  // 5. Tráº¡ng thÃ¡i sau submit
  test('Sau submit: háº¿t nÃºt Chá»‘t Ca, chip tráº¡ng thÃ¡i khÃ´ng rá»—ng', async ({ page }) => {
    test.skip(IS_STAGING, 'Chá»‰ cháº¡y trong mock mode');

    await page.evaluate(async (args) => {
      const today = document.getElementById('datePicker').value;
      window.bdsApiFetch = async (action) => {
        if (action === 'getGolfTemplates') return { status: 'success', templates: args.tpls };
        if (action.startsWith('getGolfRuns')) {
          return { status: 'success', runs: [{
            runId: 'GOLF-ca_sang-TEST', templateId: 'ca_sang',
            date: today, status: 'submitted', items: {}
          }]};
        }
        return { status: 'success' };
      };
      if (typeof loadRuns === 'function') await loadRuns();
    }, { tpls: MOCK_TEMPLATES });

    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await caBtn.click();
    await expect(page.locator('#runView')).toBeVisible();

    await expect(page.locator('#submitArea .btn-submit-glow')).toHaveCount(0);
    await expect(page.locator('#runStatusChip')).not.toBeEmpty();
    console.log('StatusChip:', await page.locator('#runStatusChip').textContent());
  });

  // 6. STAGING â€“ trá»n vÃ²ng Ä‘á»i tháº­t
  test('STAGING: Trá»n vÃ²ng Ä‘á»i â€“ Load â†’ Má»Ÿ â†’ Äiá»n â†’ Chá»‘t Ca', async ({ page }) => {
    test.skip(!IS_STAGING, 'Cáº§n STAGING_URL Ä‘á»ƒ cháº¡y');

    await page.locator('#operatorInput').fill('Test E2E Playwright');

    // Chá» card Ca SÃ¡ng tá»« backend tháº­t
    const caBtn = page.locator('#templateCards').getByText(/Ca SÃ¡ng/i).first();
    await expect(caBtn).toBeVisible({ timeout: 50000 });
    await caBtn.click();

    // runView
    await expect(page.locator('#runView')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#runBody')).not.toBeEmpty();

    // Äiá»n item sá»‘ Ä‘áº§u náº¿u cÃ³
    const numInput = page.locator('#runBody input[type="number"]').first();
    if (await numInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await numInput.fill('55');
    }

    const progressTxt = await page.locator('#progressText').textContent().catch(() => '');
    console.log(`[STAGING] Progress: ${progressTxt}`);

    // Chá»‘t ca
    await expect(page.locator('.btn-submit-glow').first()).toBeVisible({ timeout: 15000 });
    await page.locator('.btn-submit-glow').first().click();
    await expect(page.locator('#submitModal')).toBeVisible({ timeout: 10000 });

    await page.locator('#handoverNoteInput').fill('[TEST E2E] Táº¥t cáº£ bÃ¬nh thÆ°á»ng');
    await page.locator('#handoverToInput').fill('KTV Ca Sau (E2E Test)');
    await page.locator('#btnConfirmSubmit').click();

    // Modal Ä‘Ã³ng
    await expect(page.locator('#submitModal')).not.toBeVisible({ timeout: 30000 });

    // Chip tráº¡ng thÃ¡i
    await expect(page.locator('#runStatusChip')).not.toBeEmpty({ timeout: 20000 });
    const chipTxt = await page.locator('#runStatusChip').textContent();
    console.log(`[STAGING] StatusChip: "${chipTxt}"`);
    console.log('[STAGING] Golf Checklist E2E THÃ€NH CÃ”NG!');
  });
});

