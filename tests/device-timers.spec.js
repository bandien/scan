const { test, expect } = require('@playwright/test');

test('lưu và sửa lịch qua đêm, giữ dữ liệu sau tải lại', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.getByRole('button', { name: 'Thêm hẹn giờ', exact: true }).click();
  await page.fill('#timer-device', 'Đèn sân tập <b>01</b>');
  await page.fill('#timer-on', '18:00');
  await page.fill('#timer-off', '05:00');
  await page.fill('#timer-date', '2026-09-27');
  await page.fill('#timer-notes', 'Kiểm tra tại tủ');
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  await expect(page.locator('#timer-rows')).toContainText('Đèn sân tập <b>01</b>');
  await expect(page.locator('#timer-rows b')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#timer-rows')).toContainText('18:00');
  await page.locator('#timer-rows').getByRole('button', { name: 'Sửa' }).click();
  await page.fill('#timer-off', '06:00');
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem('app_device_timers_v1')));
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ offTime: '06:00', updatedById: 'ADMIN01', applyDate: '2026-09-27' });
  expect(rows[0].updatedBy).toBeTruthy();
  await expect(page.locator('#timer-rows')).toContainText('(+1 ngày)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#timer-heading').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('timer-table.png') });
});

test('kiểm tra giờ trùng nhau và chế độ thủ công không cần giờ', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.getByRole('button', { name: 'Thêm hẹn giờ', exact: true }).click();
  await page.fill('#timer-device', 'Bơm dự phòng');
  await page.fill('#timer-on', '08:00');
  await page.fill('#timer-off', '08:00');
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  await expect(page.locator('#timer-error')).toContainText('khác nhau');
  await page.selectOption('#timer-mode', 'Tắt thủ công');
  await page.fill('#timer-on', '');
  await page.fill('#timer-off', '');
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  await expect(page.locator('#timer-rows')).toContainText('Tắt thủ công');
});

test('dữ liệu hỏng không bị ghi đè khi thêm lịch', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.evaluate(() => localStorage.setItem('app_device_timers_v1', '{broken'));
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await expect(page.locator('#timer-error')).toContainText('Không thể đọc');
  await page.getByRole('button', { name: 'Thêm hẹn giờ', exact: true }).click();
  await page.fill('#timer-device', 'Đèn');
  await page.selectOption('#timer-mode', 'Tắt thủ công');
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  await expect(page.locator('#timer-error')).toContainText('Không thể lưu');
  expect(await page.evaluate(() => localStorage.getItem('app_device_timers_v1'))).toBe('{broken');
});

test('không báo lưu thành công khi bộ nhớ từ chối ghi', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.getByRole('button', { name: 'Thêm hẹn giờ', exact: true }).click();
  await page.fill('#timer-device', 'Bơm');
  await page.fill('#timer-on', '08:00');
  await page.fill('#timer-off', '09:00');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); }; });
  await page.getByRole('button', { name: 'Lưu hẹn giờ', exact: true }).click();
  await expect(page.locator('#timer-error')).toContainText('Không thể lưu');
  await expect(page.locator('#timer-form')).toBeVisible();
});
