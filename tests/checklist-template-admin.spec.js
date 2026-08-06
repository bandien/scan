const { test, expect } = require('@playwright/test');

const MOCK_DEFS = [
  {
    templateId: 'ca_sang',
    templateName: 'Ca Sáng',
    location: 'Sân Golf Kỳ Sơn',
    shiftCode: 'ca_sang',
    frequency: 'daily',
    timeStart: '05:00',
    timeEnd: '13:00',
    active: true
  }
];

test.describe('Checklist Template Admin - Quản lý mẫu', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ defs }) => {
      window.__lastApiCall__ = null;
      localStorage.setItem('cmms_op_name', 'Quản Lý Test');
      const origFetch = window.fetch;
      window.fetch = async function (url, opts) {
        const urlStr = String(url || '');
        if (opts && opts.body) {
          try {
            const bodyObj = JSON.parse(opts.body);
            window.__lastApiCall__ = bodyObj;
          } catch (e) {}
        }
        if (urlStr.includes('script.google.com') || urlStr.includes('action=')) {
          if (urlStr.includes('action=getChecklistTemplateDefs')) {
            return new Response(JSON.stringify({ status: 'success', defs: window.__mockDefs || defs }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }
          if (urlStr.includes('action=getChecklistSchedule')) {
            return new Response(JSON.stringify({ status: 'success', schedule: [] }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }
          if (urlStr.includes('action=getGolfTemplates')) {
            return new Response(JSON.stringify({ status: 'success', templates: [] }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({ status: 'success' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        }
        return origFetch.apply(this, arguments);
      };
    }, { defs: MOCK_DEFS });

    await page.goto('/sangolf/index.html');
  });

  test('Hiển thị nút Quản lý mẫu và danh sách định nghĩa mẫu hiện có', async ({ page }) => {
    const btnManage = page.locator('#btnManageTemplates');
    await expect(btnManage).toBeVisible();
    await btnManage.click();

    await expect(page.locator('#adminTemplatesView')).toBeVisible();
    await expect(page.locator('.admin-tpl-card')).toHaveCount(4);
    await expect(page.locator('.admin-tpl-card').first()).toContainText('Ca Sáng');
  });

  test('Báo lỗi inline khi thiếu địa điểm hoặc tên mẫu', async ({ page }) => {
    await page.locator('#btnManageTemplates').click();
    await page.locator('#btnAddTemplate').click();
    await expect(page.locator('#templateFormModal')).toBeVisible();

    // Để trống địa điểm
    await page.locator('#tplNameInput').fill('Ca Đêm');
    await page.locator('#tplLocationInput').fill('');
    await page.locator('#btnSaveTemplateDef').click();

    await expect(page.locator('#tplFormError')).toBeVisible();
    await expect(page.locator('#tplFormError')).toContainText('địa điểm');
  });

  test('Tạo mẫu mới với cloneFromTemplateId -> gọi upsertChecklistTemplateDef payload đúng', async ({ page }) => {
    await page.locator('#btnManageTemplates').click();
    await page.locator('#btnAddTemplate').click();

    await page.locator('#tplNameInput').fill('Ca Đêm Tăng Cường');
    await page.locator('#tplLocationInput').fill('Sân Golf Kỳ Sơn');
    await page.locator('#tplShiftCodeInput').fill('ca_dem');
    await page.locator('#tplTimeStartInput').fill('21:00');
    await page.locator('#tplTimeEndInput').fill('05:00');
    await page.locator('#tplCloneFromSelect').selectOption('ca_sang');

    await page.locator('#btnSaveTemplateDef').click();

    await page.waitForFunction(() => window.__lastApiCall__ && window.__lastApiCall__.action === 'upsertChecklistTemplateDef');
    const lastCall = await page.evaluate(() => window.__lastApiCall__);
    expect(lastCall).toBeTruthy();
    expect(lastCall.templateName).toBe('Ca Đêm Tăng Cường');
    expect(lastCall.cloneFromTemplateId).toBe('ca_sang');
  });

  test('Sửa mẫu gửi payload phẳng và dùng timeout phù hợp cold start', async ({ page }) => {
    await page.evaluate(() => {
      window.__templateSaveCall__ = null;
      window.bdsApiPost = async (action, payload, options) => {
        window.__templateSaveCall__ = { action, payload, options };
        return { status: 'success', templateId: payload.templateId };
      };
    });

    await page.locator('#btnManageTemplates').click();
    await page.locator('.admin-tpl-card').first().getByRole('button', { name: /Sửa ca/i }).click();
    await expect(page.locator('#templateFormModal')).toBeVisible();
    await page.locator('#tplNameInput').fill('Ca Sáng cập nhật');
    await page.locator('#btnSaveTemplateDef').click();

    await expect.poll(() => page.evaluate(() => window.__templateSaveCall__)).not.toBeNull();
    const call = await page.evaluate(() => window.__templateSaveCall__);
    expect(call.action).toBe('upsertChecklistTemplateDef');
    expect(call.payload.templateId).toBe('ca_sang');
    expect(call.payload.templateName).toBe('Ca Sáng cập nhật');
    expect(call.payload.def).toBeUndefined();
    expect(call.options.timeout).toBeGreaterThanOrEqual(60000);
    expect(call.options.retries).toBe(0);
    await expect(page.locator('#templateFormModal')).toBeHidden();
  });

  test('Timeout khi lưu mẫu hiển thị hướng dẫn thay cho lỗi Fetch is aborted', async ({ page }) => {
    await page.evaluate(() => {
      window.bdsApiPost = async () => {
        throw new DOMException('Fetch is aborted', 'AbortError');
      };
    });

    await page.locator('#btnManageTemplates').click();
    await page.locator('.admin-tpl-card').first().getByRole('button', { name: /Sửa ca/i }).click();
    await page.locator('#btnSaveTemplateDef').click();

    await expect(page.locator('#tplFormError')).toContainText('Máy chủ phản hồi quá lâu');
    await expect(page.locator('#tplFormError')).not.toContainText('Fetch is aborted');
    await expect(page.locator('#btnSaveTemplateDef')).toBeEnabled();
  });

  test('Sửa tiêu đề phần cập nhật đồng loạt và gửi payload đúng', async ({ page }) => {
    await page.locator('#btnManageTemplates').click();
    await page.locator('.admin-tpl-card').filter({ hasText: 'Ca Tối' })
      .getByRole('button', { name: /Sửa hạng mục/i }).click();

    await page.locator('.btn-edit-section-title').first().click();
    await expect(page.locator('#editSectionTitleModal')).toBeVisible();
    await page.locator('#sectionTitleInput').fill('Nhận ca & kiểm tra nước (17h30 – 19h30)');
    await page.locator('#btnSaveSectionTitle').click();

    await page.waitForFunction(() => window.__lastApiCall__ && window.__lastApiCall__.action === 'updateGolfTemplateSectionTitle');
    const call = await page.evaluate(() => window.__lastApiCall__);
    expect(call.templateId).toBe('ca_toi');
    expect(call.section).toBe('A');
    expect(call.sectionTitle).toBe('Nhận ca & kiểm tra nước (17h30 – 19h30)');
    await expect(page.locator('#adminItemsList')).toContainText('Nhận ca & kiểm tra nước (17h30 – 19h30)');
  });

  test('Ngừng áp dụng mẫu hiển thị mác giữ lịch sử và gọi deleteChecklistTemplateDef', async ({ page }) => {
    await page.locator('#btnManageTemplates').click();
    await expect(page.locator('.btn-soft-delete-tpl').first()).toContainText('Ngừng áp dụng');

    await page.locator('.btn-soft-delete-tpl').first().click();

    await page.waitForFunction(() => window.__lastApiCall__ && window.__lastApiCall__.action === 'deleteChecklistTemplateDef');
    const lastCall = await page.evaluate(() => window.__lastApiCall__);
    expect(lastCall).toBeTruthy();
    const tplId = lastCall.templateId || (lastCall.payload && lastCall.payload.templateId);
    expect(tplId).toBe('ca_sang');
  });
});
