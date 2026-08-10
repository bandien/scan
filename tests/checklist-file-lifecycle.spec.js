const { test, expect } = require('@playwright/test');

test('tab Checklist ưu tiên ca hiện tại và tóm tắt bàn giao ca trước', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bd_current_user', JSON.stringify({
      username: 'e2e', name: 'KTV E2E', role: 'staff'
    }));
  });
  await page.route(/script\.google\.com|script\.googleusercontent\.com/, async route => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (action === 'getGolfRuns') {
      const params = new URL(route.request().url()).searchParams;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', runs: [{
          runId: 'previous-run', templateId: params.get('templateId'), date: params.get('from'),
          status: 'submitted', operator: 'KTV Ca Sáng',
          submittedAt: '2026-08-02T12:55:00+07:00',
          handoverNote: 'Theo dõi áp suất bơm số 2',
          items: JSON.stringify({ A01: { status: 'ok' }, A02: { status: 'ng' } })
        }] })
      });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'success', plans: [] }) });
  });

  await page.goto('/nhatky/index.html');
  await page.locator('#subtabChecklist').click();

  const current = page.locator('.nk-current-shift');
  const previous = page.locator('.nk-previous-summary');
  await expect(current).toContainText('Ca hiện tại');
  await expect(current.getByRole('link', { name: /checklist Golf/i })).toBeVisible();
  await expect(current.getByRole('link', { name: /Hiện trạng bơm/i })).toBeVisible();
  await expect(current.getByRole('link', { name: /Check Bơm/i })).toHaveCount(0);
  await expect(previous).toContainText('Bàn giao ca trước');
  await expect(previous).toContainText('1 mục cần chú ý');
  await expect(previous).toContainText('Theo dõi áp suất bơm số 2');
  await expect(page.locator('.nk-shift-card[data-shift-position="next"]')).toHaveCount(0);

  const layout = await page.evaluate(() => {
    const currentBox = document.querySelector('.nk-current-shift').getBoundingClientRect();
    const previousBox = document.querySelector('.nk-previous-summary').getBoundingClientRect();
    const actionHeights = Array.from(document.querySelectorAll('.nk-checklist-action'))
      .map(element => element.getBoundingClientRect().height);
    return {
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      currentBeforePrevious: currentBox.top < previousBox.top,
      actionHeights
    };
  });
  expect(layout.noHorizontalOverflow).toBe(true);
  expect(layout.currentBeforePrevious).toBe(true);
  expect(Math.min(...layout.actionHeights)).toBeGreaterThanOrEqual(44);
});

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
  await expect(page.locator('.nk-current-shift')).toBeVisible();
  await page.locator('.nk-current-shift')
    .getByRole('link', { name: /checklist Golf/i }).click();

  await expect(page).toHaveURL(/sangolf\/index\.html\?autoTemplate=(ca_sang|ca_toi)&date=\d{4}-\d{2}-\d{2}/);
  await expect(page.locator('#runView')).toBeVisible();
  await expect(page.locator('#runTitle')).toContainText(/Ca (Sáng|Tối)/i);
  await expect(page.locator('#runBody .item-card').first()).toBeVisible();
  await expect(page.locator('#progressText')).not.toContainText('0/0');
});

test('route checklist theo đối tượng mở đúng tab và giữ đường quay về', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bd_current_user', JSON.stringify({
      username: 'e2e', name: 'KTV E2E', role: 'staff'
    }));
  });
  await page.route(/script\.google\.com|script\.googleusercontent\.com/, route => route.abort());

  await page.goto('/nhatky/index.html#checklist/golf');

  await expect(page.locator('#subtabChecklist')).toHaveClass(/is-active/);
  await expect(page.locator('.nk-current-shift')).toBeVisible();
  const href = await page.locator('.nk-current-shift')
    .getByRole('link', { name: /checklist Golf/i })
    .getAttribute('href');
  const target = new URL(href, page.url());
  expect(target.searchParams.get('returnTo')).toBe('../nhatky/#checklist/golf');

  await page.goto('/nhatky/index.html#checklist/equipment/PUMP-01');
  await expect(page.locator('#subtabChecklist')).toHaveClass(/is-active/);
  await expect(page.locator('.nk-current-shift')).toHaveCount(0);
  await expect(page.locator('#mainBoard')).toContainText('equipment');
  await expect(page.locator('#mainBoard')).toContainText('PUMP-01');

  await page.goto('/sangolf/index.html?returnTo=..%2Fnhatky%2F%23checklist%2Fgolf');
  await expect(page.locator('.bds-app-header__back'))
    .toHaveAttribute('href', '../nhatky/#checklist/golf');
});

test('mở nhanh màn hình hiện trạng và thấy bơm đang chạy', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      username: 'e2e', name: 'KTV E2E', role: 'staff'
    }));
  });
  await page.route(/script\.google\.com|script\.googleusercontent\.com/, async route => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const body = action === 'getPumpStatuses'
      ? { status: 'success', items: [
          { id: '1', name: 'Bơm hồ 1', source: 'Hồ cảnh quan', state: 'RUNNING',
            lastEvent: { timestamp: new Date().toISOString(), operator: 'KTV E2E', action: 'START' } },
          { id: '2', name: 'Bơm hồ 2', source: 'Hồ cảnh quan', state: 'STOPPED',
            lastEvent: { timestamp: new Date().toISOString(), operator: 'KTV E2E', action: 'STOP' } }
        ] }
      : { status: 'success', plans: [] };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/nhatky/index.html');
  await page.locator('#subtabChecklist').click();
  await expect(page.locator('.nk-current-shift')).toBeVisible();

  const currentShift = page.locator('.nk-current-shift');
  await currentShift.getByRole('link', { name: /Hiện trạng bơm/i }).click();

  await expect(page).toHaveURL(/pump_status\.html/);
  await expect(page.getByRole('heading', { name: /Hiện trạng bơm/i })).toBeVisible();
  await expect(page.locator('[data-pump-state="RUNNING"]')).toContainText('Bơm hồ 1');
  await expect(page.locator('#runningCount')).toHaveText('1');
  await page.getByRole('button', { name: 'Đang chạy' }).click();
  await expect(page.locator('.pump')).toHaveCount(1);
  const mobileLayout = await page.evaluate(() => ({
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    controlsAtLeast44px: Array.from(document.querySelectorAll('button'))
      .every(button => button.getBoundingClientRect().height >= 44)
  }));
  expect(mobileLayout.noHorizontalOverflow).toBe(true);
  expect(mobileLayout.controlsAtLeast44px).toBe(true);
});

test('không bỏ qua ca trước đang chờ nhận khi vào bằng autoTemplate', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cmms_op_name', 'KTV Ca Sáng');
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes('script.google.com')) return nativeFetch(input, init);
      const action = new URL(url).searchParams.get('action');
      if (action === 'getGolfTemplates') {
        return new Response(JSON.stringify({ status: 'success', items: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (action === 'getGolfRuns') {
        return new Response(JSON.stringify({ status: 'success', runs: [{
          runId: 'GOLF-ca_toi-PREVIOUS',
          templateId: 'ca_toi',
          date: '2026-07-28',
          status: 'submitted',
          operator: 'KTV Ca Tối',
          submittedAt: '2026-07-28T21:00:00+07:00',
          handoverNote: 'Bơm hồ đang tiếp tục chạy',
          items: JSON.stringify({ A01: { status: 'ng' } })
        }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ status: 'success' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  });

  await page.goto('/sangolf/index.html?autoTemplate=ca_sang');
  await expect(page.locator('#homeView')).toBeVisible();
  await expect(page.locator('#runView')).toBeHidden();
  await expect(page.locator('#pendingBanners')).toContainText('CA TRƯỚC BÀN GIAO');
  await expect(page.locator('#pendingBanners')).toContainText('Bơm hồ đang tiếp tục chạy');
  await expect(page.locator('#pendingBanners button')).toBeVisible();
});

test('vòng đời: bắt đầu, lưu draft, chốt ca và xác nhận bàn giao', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cmms_op_name', 'KTV Ca Sáng');
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes('script.google.com')) return nativeFetch(input, init);
      const action = new URL(url).searchParams.get('action');
      const data = action === 'getGolfRuns'
        ? { status: 'success', runs: [] }
        : { status: 'success', items: [] };
      return new Response(JSON.stringify(data),
        { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
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
      if (action === 'acceptGolfHandoverAndStartRun' && window.__submittedRun) {
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

  await page.locator('#item-A01 .check-btn').first().click({ force: true });
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
  await expect.poll(() => page.evaluate(() => window.__golfCalls))
    .toContain('acceptGolfHandoverAndStartRun');
  await expect.poll(() => page.evaluate(() => window.__submittedRun.status)).toBe('confirmed');
});
