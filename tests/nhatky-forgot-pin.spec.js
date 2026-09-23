const { test, expect } = require('@playwright/test');

test.describe('Quên mã PIN', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/nhatky/index.html');
  });

  test('hiển thị hướng dẫn khôi phục an toàn cho nhân viên đang chọn', async ({ page }) => {
    await page.locator('#select-login-employee').selectOption('EMP02');
    await page.locator('#btn-forgot-pin').click();

    const modal = page.locator('#modal-forgot-pin');
    await expect(modal).toBeVisible();
    await expect(page.locator('#forgot-pin-employee')).toContainText('Đinh Văn Hậu');
    await expect(modal).toContainText('không hiển thị mã PIN');
    const emailLink = modal.locator('#forgot-pin-email');
    const smsLink = modal.locator('#forgot-pin-sms');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', /^mailto:trucdienhapulico@gmail\.com\?/);
    await expect(emailLink).toHaveAttribute('href', /EMP02/);
    await expect(smsLink).toBeVisible();
    await expect(smsLink).toHaveAttribute('href', /^sms:0392966368\?/);
    await expect(smsLink).toHaveAttribute('href', /EMP02/);
    await expect(modal.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(modal).not.toContainText('0204');
  });

  test('có thể đóng hộp thoại và quay lại đăng nhập', async ({ page }) => {
    await page.locator('#btn-forgot-pin').click();
    await page.locator('#btn-close-forgot-pin').click();
    await expect(page.locator('#modal-forgot-pin')).toBeHidden();
    await expect(page.locator('#input-login-pin')).toBeFocused();
  });
});
