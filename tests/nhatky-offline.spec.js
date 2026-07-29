const { test, expect } = require('@playwright/test');

const QUEUE_KEY = 'bandien_offline_queue_v1';

test.beforeEach(async ({ page }) => {
  await page.goto('/nhatky/');
  await page.evaluate((key) => localStorage.removeItem(key), QUEUE_KEY);
  await page.reload();
});

test('khai báo manifest và hạ tầng PWA', async ({ page, request }) => {
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'manifest.json');
  await expect.poll(() => page.evaluate(() => Boolean(window.BD_PWA))).toBe(true);
  const manifest = await request.get('/nhatky/manifest.json');
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).start_url).toBe('./');
  const worker = await request.get('/sw.js');
  expect(worker.ok()).toBeTruthy();
});

test('mất mạng thì savePlan được xếp hàng và hiện trạng thái', async ({ page, context }) => {
  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    return window.bdsApiPost('savePlan', { PlanID: 'P-1', title: 'Kiểm tra điện' });
  });
  expect(result).toMatchObject({ status: 'success', queued: true, offline: true });
  const queue = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), QUEUE_KEY);
  expect(queue).toHaveLength(1);
  await expect(page.locator('#nk-sync-toast')).toContainText('Chờ gửi · 1');
});

test('nhiều lần lưu cùng kế hoạch chỉ giữ dữ liệu mới nhất', async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(async () => {
    await window.bdsApiFetch('savePlan', { PlanID: 'P-2', title: 'Cũ' });
    await window.bdsApiPost('savePlan', { PlanID: 'P-2', title: 'Mới' });
  });
  const queue = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), QUEUE_KEY);
  expect(queue).toHaveLength(1);
  expect(queue[0].payload.title).toBe('Mới');
});

test('API tài khoản không bao giờ bị queue', async ({ page, context }) => {
  await context.setOffline(true);
  await expect(page.evaluate(async () => {
    try {
      await window.bdsApiPost('nhatkyChangePin', { pin: '123456' }, { retries: 0, timeout: 50 });
      return 'resolved';
    } catch (_) {
      return 'rejected';
    }
  })).resolves.toBe('rejected');
  expect(await page.evaluate((key) => localStorage.getItem(key), QUEUE_KEY)).toBeNull();
});

test('lỗi nghiệp vụ savePlan không bị phát lại tự động', async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.BD_OFFLINE_QUEUE.setTransport({
      post: async () => { throw new Error('Không có quyền cập nhật'); }
    });
    try {
      await window.bdsApiPost('savePlan', { PlanID: 'P-ERR' });
      return 'resolved';
    } catch (error) {
      return error.message;
    }
  });
  expect(result).toBe('Không có quyền cập nhật');
  expect(await page.evaluate((key) => localStorage.getItem(key), QUEUE_KEY)).toBeNull();
});

test('có mạng thì gửi lại tuần tự và xóa queue', async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(() => window.bdsApiPost('savePlan', { PlanID: 'P-3', title: 'Chờ gửi' }));
  await page.evaluate(() => {
    window.BD_OFFLINE_QUEUE.setTransport({
      post: async () => ({ status: 'success' }),
      fetch: async () => ({ status: 'success' })
    });
  });
  await context.setOffline(false);
  await page.evaluate(() => window.BD_OFFLINE_QUEUE.flush());
  expect(await page.evaluate(() => window.BD_OFFLINE_QUEUE.getState().pending)).toBe(0);
  await expect(page.locator('#nk-sync-toast')).toContainText('Đã đồng bộ');
});
