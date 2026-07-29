const { test, expect } = require('@playwright/test');

test('Nhật ký mở được checklist Ca Sáng khi backend không khả dụng', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bd_current_user', JSON.stringify({
      username: 'e2e', name: 'KTV E2E', role: 'staff'
    }));
    localStorage.setItem('cmms_op_name', 'KTV E2E');
  });
  await page.route(/script\.google\.com|script\.googleusercontent\.com/, route => route.abort());

  await page.goto('/nhatky/index.html');
  await page.locator('#subtabChecklist').click();
  await page.getByRole('link', { name: /Golf \(Sáng\)/ }).click();

  await expect(page).toHaveURL(/sangolf\/index\.html\?autoTemplate=ca_sang/);
  await expect(page.locator('#runView')).toBeVisible();
  await expect(page.locator('#runTitle')).toContainText(/Ca Sáng/i);
  await expect(page.locator('#runBody .item-card').first()).toBeVisible();
  await expect(page.locator('#progressText')).not.toContainText('0/0');
});

test('vòng đời: bắt đầu, lưu draft, chốt ca và xác nhận bàn giao', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cmms_op_name', 'KTV Ca Sáng');
  });
  await page.goto('/sangolf/index.html?autoTemplate=ca_sang');
  await expect(page.locator('#runView')).toBeVisible();

  await page.evaluate(() => {
    window.__golfCalls = [];
    window.__submittedRun = null;
    window.bdsApiPost = async (action, body) => {
      window.__golfCalls.push(action);
      if (action === 'submitGolfRun') {
        window.__submittedRun = {
          ...body.payload, status: 'submitted', items: body.payload.items
        };
      }
      if (action === 'confirmGolfHandover' && window.__submittedRun) {
        window.__submittedRun.status = 'confirmed';
      }
      return { status: 'success' };
    };
    window.bdsApiFetch = async (action) => {
      if (action === 'getGolfRuns') {
        return { status: 'success', runs: window.__submittedRun ? [window.__submittedRun] : [] };
      }
      return { status: 'success', items: window.BD_GOLF_FALLBACK_TEMPLATES };
    };
  });

  await page.locator('#item-A01 .check-btn').first().click();
  await page.locator('#item-A02 input[type="number"]').fill('55');
  const runId = await page.evaluate(() =>
    Object.keys(localStorage).find(key => key.startsWith('golf_run_GOLF-ca_sang-'))
      .replace('golf_run_', ''));
  await expect.poll(() => page.evaluate(id =>
    Boolean(localStorage.getItem('golf_run_' + id)), runId)).toBe(true);

  await page.locator('#submitArea .btn-submit-glow').click();
  await expect(page.locator('#submitModal')).toBeVisible();
  await page.locator('#handoverNoteInput').fill('Bàn giao thiết bị hoạt động bình thường');
  await page.locator('#handoverToInput').fill('KTV Ca Tối');
  await page.locator('#btnConfirmSubmit').click();
  await expect(page.locator('#runStatusChip')).not.toBeEmpty();
  await expect.poll(() => page.evaluate(() => window.__golfCalls)).toContain('submitGolfRun');

  await page.evaluate(async () => {
    backHome();
    await loadRuns();
  });
  await expect(page.locator('#pendingBanners button')).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('currentUser');
    localStorage.setItem('cmms_op_name', 'KTV Ca Tối');
  });
  await page.locator('#pendingBanners button').click();
  await expect.poll(() => page.evaluate(() => window.__golfCalls)).toContain('confirmGolfHandover');
  await expect.poll(() => page.evaluate(() => window.__submittedRun.status)).toBe('confirmed');
});
