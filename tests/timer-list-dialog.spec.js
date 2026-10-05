const { test, expect } = require('@playwright/test');

test('dashboard chỉ hiện thẻ tóm tắt và mở danh sách trong cửa sổ riêng', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');

  await expect(page.locator('#timer-reference-cards')).toBeVisible();
  await expect(page.locator('#timer-reference-cards')).toContainText('314 mục');
  await expect(page.locator('#timer-reference-cards')).toContainText('197 mục');
  await expect(page.locator('#modal-timer-reference')).toBeHidden();
  await expect(page.locator('#office-timer-table')).toBeHidden();
  await page.locator('#timer-reference-cards').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('compact-dashboard.png') });

  await page.getByRole('button', { name: 'Xem danh sách văn phòng' }).click();
  await expect(page.locator('#modal-timer-reference')).toBeVisible();
  await expect(page.locator('#timer-reference-title')).toHaveText('Hẹn giờ đóng/ngắt điện văn phòng');
  await expect(page.locator('#office-timer-table')).toBeVisible();
  await expect(page.locator('#public-timer-table')).toBeHidden();

  await page.fill('#timer-reference-search', 'TOMITA');
  await expect(page.locator('#office-timer-rows tr:visible')).toHaveCount(1);
  await expect(page.locator('#office-timer-rows tr:visible')).toContainText('TOMITA');
  await expect(page.locator('#timer-reference-result-count')).toContainText('1 kết quả');
  await page.screenshot({ path: test.info().outputPath('office-dialog-search.png') });

  await page.getByRole('button', { name: 'Đóng danh sách hẹn giờ' }).click();
  await expect(page.locator('#modal-timer-reference')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
