const { test, expect } = require('@playwright/test');

test('giữ đủ lịch văn phòng, ghi chú và bảng công cộng', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.getByRole('button', { name: 'Xem danh sách văn phòng' }).click();
  await expect(page.locator('#office-timer-table')).toBeVisible();
  const cell = address => page.locator('#office-timer-table [data-source-cell="' + address + '"]');
  await expect(cell('D8')).toHaveText('TOMITA');
  await expect(cell('G8')).toHaveText('07:30');
  await expect(cell('M8')).toHaveText('13:00');
  await expect(cell('H27')).toHaveText('07:40');
  await expect(cell('N27')).toHaveText('12:20');
  await expect(cell('O8')).toHaveText('—');
  await expect(cell('P175')).toHaveText('24:00');
  await expect(cell('D161')).toHaveAttribute('rowspan', '9');
  await expect(cell('G193')).toHaveAttribute('colspan', '10');
  await expect(cell('G194')).toHaveText('Để điện 24/24');
  await expect(cell('V195')).toHaveText('Để 24/24 do có tủ mát');
  await expect(cell('A201')).toHaveText('Lưu ý: thay thế ngay các đồng hồ hỏng');
  const source = JSON.parse(await page.locator('#office-device-timer-data').textContent());
  const rendered = await page.locator('#office-timer-table [data-source-cell]').evaluateAll(cells =>
    Object.fromEntries(cells.map(cell => [cell.dataset.sourceCell, cell.textContent])));
  for (const row of source.rows) for (const [col, value] of Object.entries(row.cells)) {
    if (value) expect(rendered[col + row.row], col + row.row).toBe(value);
  }
  await page.getByRole('button', { name: 'Đóng danh sách hẹn giờ' }).click();
  await page.getByRole('button', { name: 'Xem danh sách hẹn giờ công cộng' }).click();
  await expect(page.locator('#public-timer-table [data-source-cell="G8"]')).toHaveText('05:45');
  expect(await page.evaluate(() => localStorage.getItem('app_device_timers_v1'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#public-timer-source').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('public-timers-after-office.png') });
});
