const { test, expect } = require('@playwright/test');

test.describe('Nhật Ký & Checklist Vận Hành — Đa Nhân Viên & Quản Lý Ca', () => {

  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Kịch bản 1, 2, 3: Cô lập dữ liệu theo Ca và Nhân viên (Thắng Ca 1 vs Hậu Ca 2)', async ({ page }) => {
    await page.goto('/nhatky/index.html#tasks');

    // 1. Kiểm tra nhân viên mặc định và chọn Ngô Quyết Thắng - Ca 1
    await page.click('#header-user-badge');
    await expect(page.locator('#modal-shift-select')).toBeVisible();
    await page.selectOption('#select-active-employee', 'EMP01'); // Ngô Quyết Thắng
    await page.selectOption('#select-active-shift-type', 'Ca 1 (06h - 14h)');
    await page.click('#btn-save-shift');

    // Kiểm tra UI hiển thị đúng Thắng Ca 1
    await expect(page.locator('#header-user-code')).toContainText('Thắng');

    // Thắng thêm Task A và đánh dấu hoàn thành
    await page.click('button:has-text("Thêm việc")');
    await page.fill('#input-task-title', 'Task A - Kiểm tra TBA Ca 1');
    await page.selectOption('#input-task-priority', 'Khẩn cấp');
    await page.click('button:has-text("Lưu công việc")');

    await expect(page.locator('#task-list')).toContainText('Task A - Kiểm tra TBA Ca 1');
    // Hoàn thành task
    await page.locator('.task-item-check').first().click();

    // Thắng ghi Log A
    await page.click('#nav-journal');
    await page.click('button:has-text("Ghi nhật ký")');
    await page.fill('#input-log-content', 'Log A - Đã kiểm tra trạm điện an toàn');
    await page.selectOption('#input-log-status', 'Không bất thường');
    await page.click('button:has-text("Ghi vào sổ")');
    await expect(page.locator('#journal-list')).toContainText('Log A - Đã kiểm tra trạm điện an toàn');

    // Kiểm tra Báo cáo Ca 1
    await page.click('#nav-report');
    await expect(page.locator('#report-preview')).toContainText('Ngô Quyết Thắng');
    await expect(page.locator('#report-preview')).toContainText('Ca 1 (06h - 14h)');
    await expect(page.locator('#report-preview')).toContainText('Log A - Đã kiểm tra trạm điện an toàn');

    // 2. Chuyển sang Đinh Văn Hậu - Ca 2
    await page.click('#header-user-badge');
    await page.selectOption('#select-active-employee', 'EMP02'); // Đinh Văn Hậu
    await page.selectOption('#select-active-shift-type', 'Ca 2 (14h - 22h)');
    await page.click('#btn-save-shift');

    await expect(page.locator('#header-user-code')).toContainText('Hậu');

    // Checklist Ca 2 không bị trộn Task A của Ca 1
    await page.click('#nav-tasks');
    await expect(page.locator('#task-list')).not.toContainText('Task A - Kiểm tra TBA Ca 1');

    // Nhật ký Ca 2 ban đầu trống cho ca mới
    await page.click('#nav-journal');
    await expect(page.locator('#journal-list')).not.toContainText('Log A - Đã kiểm tra trạm điện an toàn');

    // 3. Báo cáo Ca 2 hiển thị đúng Đinh Văn Hậu
    await page.click('#nav-report');
    await expect(page.locator('#report-preview')).toContainText('Đinh Văn Hậu');
    await expect(page.locator('#report-preview')).toContainText('Ca 2 (14h - 22h)');
    await expect(page.locator('#report-preview')).not.toContainText('Log A - Đã kiểm tra trạm điện an toàn');
  });

  test('Kịch bản 4: Hoàng Việt Hoàng mở lại task đã xong -> Yêu cầu lý do và lưu audit taskEvents', async ({ page }) => {
    await page.goto('/nhatky/index.html#tasks');

    // Chọn Hoàng Việt Hoàng
    await page.click('#header-user-badge');
    await page.selectOption('#select-active-employee', 'EMP03'); // Hoàng Việt Hoàng
    await page.click('#btn-save-shift');

    // Thêm task và hoàn thành
    await page.click('button:has-text("Thêm việc")');
    await page.fill('#input-task-title', 'Kiểm tra bơm nước hồ');
    await page.click('button:has-text("Lưu công việc")');

    const taskCheck = page.locator('.task-item-check').first();
    await taskCheck.click(); // Hoàn thành

    // Mở lại task đã xong -> Phải hiện modal xác nhận lý do
    await taskCheck.click();
    await expect(page.locator('#modal-reopen-task')).toBeVisible();
    await page.fill('#input-reopen-reason', 'Phát hiện áp suất tụt bất thường cần kiểm tra lại');
    await page.click('#btn-confirm-reopen');

    // Kiểm tra task đã được mở lại (không còn class/gạch ngang hoàn thành)
    await expect(page.locator('#task-list')).toContainText('Kiểm tra bơm nước hồ');

    // Kiểm tra taskEvents trong localStorage
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem('app_task_events') || '[]'));
    expect(events.length).toBeGreaterThanOrEqual(2); // COMPLETED + REOPENED
    const lastEvent = events[events.length - 1];
    expect(lastEvent.action).toBe('REOPENED');
    expect(lastEvent.actorId).toBe('EMP03');
    expect(lastEvent.reason).toContain('áp suất tụt bất thường');
  });

  test('Kịch bản 7 & 8: Danh sách nhân viên chỉ có 4 active, nhân viên nghỉ việc không có trong ca mới, migration an toàn', async ({ page }) => {
    // Giả lập dữ liệu legacy chưa có tác giả
    await page.addInitScript(() => {
      localStorage.setItem('app_tasks', JSON.stringify([
        { id: 999, title: 'Việc cũ legacy', priority: 'Bình thường', done: true }
      ]));
      localStorage.setItem('app_logs', JSON.stringify([
        { id: 888, content: 'Nhật ký cũ legacy', status: 'Không bất thường', time: '08:00' }
      ]));
    });

    await page.goto('/nhatky/index.html');

    // Mở chọn nhân viên
    await page.click('#header-user-badge');
    const options = await page.locator('#select-active-employee option').allInnerTexts();
    
    // 4 người active
    expect(options.some(t => t.includes('Ngô Quyết Thắng'))).toBe(true);
    expect(options.some(t => t.includes('Đinh Văn Hậu'))).toBe(true);
    expect(options.some(t => t.includes('Hoàng Việt Hoàng'))).toBe(true);
    expect(options.some(t => t.includes('Nguyễn Đức Phong'))).toBe(true);

    // Không có Bùi Hồng Quân & Nguyễn Đình Thủy trong danh sách chọn
    expect(options.some(t => t.includes('Bùi Hồng Quân'))).toBe(false);
    expect(options.some(t => t.includes('Nguyễn Đình Thủy'))).toBe(false);

    // Dữ liệu legacy được đánh dấu legacy-unattributed và không bị gán cho người dùng hiện tại
    const tasks = await page.evaluate(() => JSON.parse(localStorage.getItem('app_tasks') || '[]'));
    const legacyTask = tasks.find(t => t.id === 999);
    expect(legacyTask).toBeDefined();
    expect(legacyTask.createdBy).toBe('legacy-unattributed');
  });

  test('Kịch bản 10 & 12: Đảm bảo Accessibility (aria-label) và không có console error', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/nhatky/index.html');

    // Kiểm tra các button icon có aria-label
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.innerText()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      if (!text) {
        expect(ariaLabel || title).toBeTruthy();
      }
    }

    // Không có lỗi Javascript
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toEqual([]);
  });

});
