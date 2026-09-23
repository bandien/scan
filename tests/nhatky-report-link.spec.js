const { test, expect } = require('@playwright/test');

test('Checklist có liên kết mở báo cáo Google Sheet', async ({ page }) => {
  await page.addInitScript(() => {
    const mockUser = {
      name: 'Hau DV',
      username: 'hau.dv',
      role: 'user',
      team: 'Điện',
      loginAt: Date.now()
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    window.BD_SSO = { getUser: () => mockUser };
  });
  await page.goto('/nhatky/index.html#checklist');

  const reportLink = page.locator('#checklist-report-link');
  await expect(reportLink).toHaveCount(1);
  await expect(reportLink).toHaveText(/Báo cáo/);
  await expect(reportLink).toHaveAttribute(
    'href',
    'https://docs.google.com/spreadsheets/d/1wVYYWoJKLU_-nXdpKQGjxW5yTtj_8k_eQBC7tpHXxdY/edit?gid=2114189017#gid=2114189017'
  );
  await expect(reportLink).toHaveAttribute('target', '_blank');
  await expect(reportLink).toHaveAttribute('rel', /noopener/);
});

test('Checklist có liên kết mở báo cáo Hapulico', async ({ page }) => {
  await page.goto('/nhatky/index.html#checklist');

  const reportLink = page.locator('#checklist-hapulico-report-link');
  await expect(reportLink).toHaveCount(1);
  await expect(reportLink).toHaveText(/Báo cáo Hapulico/);
  await expect(reportLink).toHaveAttribute(
    'href',
    'https://docs.google.com/spreadsheets/d/1CKwy_SNbXnyZEkwgMZWRtBgzlg6NI6Ob/edit?gid=1271630179#gid=1271630179'
  );
  await expect(reportLink).toHaveAttribute('target', '_blank');
  await expect(reportLink).toHaveAttribute('rel', /noopener/);
});
