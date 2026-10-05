const { test, expect } = require('@playwright/test');

test('bảng công cộng giữ mùa, ô gộp, giây và dữ liệu cuối nguồn', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.getByRole('button', { name: 'Xem danh sách hẹn giờ công cộng' }).click();
  await expect(page.locator('#public-timer-table')).toBeVisible();
  await expect(page.locator('#public-timer-source')).toContainText('27/09/2026');
  await expect(page.locator('#public-timer-table thead')).toContainText('01/04–30/09');
  await expect(page.locator('#public-timer-table [data-source-cell="G8"]')).toHaveText('05:45');
  await expect(page.locator('#public-timer-table [data-source-cell="H8"]')).toHaveText('17:30');
  await expect(page.locator('#public-timer-table [data-source-cell="B11"]')).toHaveAttribute('rowspan', '2');
  await expect(page.locator('#public-timer-table [data-source-cell="G37"]')).toHaveAttribute('colspan', '4');
  await expect(page.locator('#public-timer-table [data-source-cell="I30"]')).toHaveText('Tắt');
  await expect(page.locator('#public-timer-table [data-source-cell="H232"]')).toHaveText('09:00:30');
  await expect(page.locator('#public-timer-table [data-source-cell="H165"]')).toHaveText('00:00');
  await expect(page.locator('#public-timer-table [data-source-cell="G255"]')).toHaveText('225');
  await expect(page.locator('#public-timer-table [data-source-cell="B340"]')).toHaveText('Bệnh viện Bắc Hà');
  await expect(page.locator('#public-timer-table [data-source-cell="G341"]')).toHaveText('Bật 24/24');
  await expect(page.locator('#public-timer-table [data-source-cell="G107"]')).toHaveText('—');
  expect(await page.evaluate(() => localStorage.getItem('app_device_timers_v1'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const snapshot = await page.locator('#public-device-timer-data').textContent();
  const data = JSON.parse(snapshot);
  const renderedCells = await page.locator('#public-timer-table [data-source-cell]').evaluateAll(cells =>
    Object.fromEntries(cells.map(cell => [cell.dataset.sourceCell, cell.textContent])));
  expect(data.rows).toHaveLength(336);
  for (const row of data.rows) {
    for (const [col, value] of Object.entries(row.cells)) {
      if (value) expect(renderedCells[col + row.row], 'Ô nguồn ' + col + row.row).toBe(value);
    }
  }
  await page.locator('#public-timer-source').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('public-timers.png') });
});
