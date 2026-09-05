const { test, expect } = require('@playwright/test');

test('admin ghi nhận nhân viên không được tiếp nhận sau thử việc', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.click('#nav-personal');

  const employee = page.locator('#active-employees-container > div').filter({ hasText: 'Nguyễn Văn Cường' });
  await employee.getByRole('button', { name: 'Chuyển công tác' }).click();
  await expect(page.locator('#modal-transfer-employee')).toBeVisible();

  await page.selectOption('#select-transfer-status', 'inactive_probation_failed');
  await page.fill('#input-transfer-date', '2026-08-23');
  await page.fill('#input-transfer-reason', 'Hết thử việc, không tiếp nhận vào Tổ cơ điện Sân Golf');
  await page.click('#btn-save-transfer-employee');

  await expect(employee).toContainText('Không tiếp nhận sau thử việc');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('app_active_employees_v1')).find(e => e.id === 'EMP05'));
  expect(saved).toMatchObject({
    status: 'inactive',
    transferType: 'inactive_probation_failed',
    transferDate: '2026-08-23',
    transferReason: 'Hết thử việc, không tiếp nhận vào Tổ cơ điện Sân Golf'
  });
  expect(saved.probationEnd).toBe('2026-08-23');
  await expect(page.locator('#select-login-employee option[value="EMP05"]')).toHaveCount(0);
});

test('bảng phân ca hỗ trợ TX và tx theo giờ công trường Thanh Xuân', async ({ page }) => {
  await page.goto('/nhatky/index.html');
  await page.selectOption('#select-login-employee', 'ADMIN01');
  await page.fill('#input-login-pin', '0204');
  await page.click('#btn-submit-login');
  await page.click('#btn-header-schedule');

  await expect(page.locator('#modal-shift-schedule')).toContainText('TX/tx: Thanh Xuân 05:50–10:00, 13:50–18:00');
  await page.locator('td[title="Ngô Quyết Thắng - Thứ Ba Ca 1: Trống"]').click();
  await page.getByRole('button', { name: 'TX (Thanh Xuân)', exact: true }).click();
  await expect(page.locator('td[title="Ngô Quyết Thắng - Thứ Ba Ca 1: TX"]')).toHaveText('TX');

  await page.locator('td[title="Ngô Quyết Thắng - Thứ Năm Ca 1: Trống"]').click();
  await page.getByRole('button', { name: 'tx (Thanh Xuân)', exact: true }).click();
  await expect(page.locator('td[title="Ngô Quyết Thắng - Thứ Năm Ca 1: tx"]')).toHaveText('tx');
});
