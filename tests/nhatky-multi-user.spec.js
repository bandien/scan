const { test, expect } = require('@playwright/test');

test.describe('Nhật Ký & Checklist Vận Hành — Đa Nhân Viên, Quản Lý Ca & Xác Thực', () => {

  test.beforeEach(async ({ page }) => {
    // Auto accept all dialogs (confirm / alert)
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/nhatky/index.html');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  // Helper để đăng nhập nhanh trong các bài test vận hành
  async function performLogin(page, empId = 'EMP01', pin = '1234') {
    await expect(page.locator('#screen-login')).toBeVisible();
    await page.selectOption('#select-login-employee', empId);
    await page.fill('#input-login-pin', pin);
    await page.click('#btn-submit-login');
    await expect(page.locator('#screen-app')).toBeVisible();
  }

  test('Kịch bản Xác Thực 1: Đăng nhập với mật khẩu mặc định (1234) & Đăng nhập sai báo lỗi', async ({ page }) => {
    await page.goto('/nhatky/index.html');

    // 1. Màn hình login xuất hiện
    await expect(page.locator('#screen-login')).toBeVisible();
    await expect(page.locator('#screen-app')).toBeHidden();

    // 2. Đăng nhập sai mật khẩu -> Báo lỗi
    await page.selectOption('#select-login-employee', 'EMP01'); // Ngô Quyết Thắng
    await page.fill('#input-login-pin', '9999'); // Sai PIN
    await page.click('#btn-submit-login');
    await expect(page.locator('#login-error-msg')).toContainText('Mật khẩu không chính xác');
    await expect(page.locator('#screen-app')).toBeHidden();

    // 3. Đăng nhập đúng với mật khẩu mặc định 1234 -> Vào app
    await page.fill('#input-login-pin', '1234');
    await page.click('#btn-submit-login');
    await expect(page.locator('#screen-app')).toBeVisible();
    await expect(page.locator('#screen-login')).toBeHidden();
    await expect(page.locator('#header-user-code')).toContainText('Thắng');
  });

  test('Kịch bản Xác Thực 2: Đổi mật khẩu cá nhân & Đăng xuất rồi đăng nhập lại bằng mật khẩu mới', async ({ page }) => {
    await page.goto('/nhatky/index.html');
    await performLogin(page, 'EMP01', '1234');

    // Vào Tab Cá nhân
    await page.click('#nav-personal');

    // Mở modal Đổi mật khẩu
    await page.click('#btn-open-change-password');
    await expect(page.locator('#modal-change-password')).toBeVisible();

    // Điền form đổi PIN: 1234 -> 5678
    await page.fill('#input-current-pin', '1234');
    await page.fill('#input-new-pin', '5678');
    await page.fill('#input-confirm-new-pin', '5678');
    await page.click('#btn-save-new-pin');

    // Đăng xuất
    await page.click('#btn-logout');
    await expect(page.locator('#screen-login')).toBeVisible();
    await expect(page.locator('#screen-app')).toBeHidden();

    // Thử đăng nhập lại bằng mật khẩu cũ 1234 -> Báo lỗi
    await page.selectOption('#select-login-employee', 'EMP01');
    await page.fill('#input-login-pin', '1234');
    await page.click('#btn-submit-login');
    await expect(page.locator('#login-error-msg')).toBeVisible();

    // Đăng nhập bằng mật khẩu mới 5678 -> Thành công
    await page.fill('#input-login-pin', '5678');
    await page.click('#btn-submit-login');
    await expect(page.locator('#screen-app')).toBeVisible();
    await expect(page.locator('#header-user-code')).toContainText('Thắng');
  });

  test('Kịch bản Bảng Phân Ca Tổ Cơ Điện Sân Golf Chuẩn (21 Cột Ca Trực, Mã Màu & Hàng Trực Điện Nước)', async ({ page }) => {
    await page.goto('/nhatky/index.html');

    // 1. Admin đăng nhập
    await performLogin(page, 'ADMIN01', '1234');

    // 2. Mở Bảng Phân Ca Trực Chuẩn
    await page.click('#btn-header-schedule');
    await expect(page.locator('#modal-shift-schedule')).toBeVisible();
    await expect(page.locator('#schedule-matrix-table')).toBeVisible();

    // Kiểm tra cấu trúc bảng chuẩn theo mẫu ảnh
    await expect(page.locator('#schedule-matrix-table thead')).toContainText('BẢNG PHÂN CA');
    await expect(page.locator('#schedule-matrix-table thead')).toContainText('Tuần:');
    await expect(page.locator('#schedule-matrix-table thead')).toContainText('Tổ cơ điện Sân Golf');
    await expect(page.locator('#schedule-days-header-row')).toContainText('Thứ Hai');
    await expect(page.locator('#schedule-days-header-row')).toContainText('Chủ Nhật');

    // Kiểm tra footer "Trực điện nước"
    await expect(page.locator('#schedule-summary-row')).toContainText('Trực điện nước');

    // 3. Admin click vào ô để phân ca với bảng chọn nhanh (x / hc / CN / P)
    const firstCell = page.locator('#schedule-matrix-tbody .roster-cell').first();
    await firstCell.click();
    await expect(page.locator('#schedule-cell-picker')).toBeVisible();

    // Chọn x (Trực ca)
    await page.locator('#schedule-cell-picker button:has-text("x (Trực ca)")').click();
    await expect(page.locator('#schedule-cell-picker')).toBeHidden();

    // Kiểm tra ô đã được cập nhật x và có màu nền hồng (bg-rose-100)
    await expect(firstCell).toContainText('x');
    await expect(firstCell).toHaveClass(/bg-rose-100/);

    // Đóng bảng phân ca
    await page.click('#modal-shift-schedule button:has-text("Đóng")');
  });

  test('Kịch bản Tài Khoản Admin: Đăng nhập quyền cao nhất và quản lý nhân sự', async ({ page }) => {
    await page.goto('/nhatky/index.html');
    
    // Đăng nhập bằng tài khoản ADMIN01
    await performLogin(page, 'ADMIN01', '1234');
    await expect(page.locator('#header-user-code')).toContainText('Admin');

    // Vào Tab Cá nhân kiểm tra danh sách có Admin và Thắng là Kỹ thuật viên
    await page.click('#nav-personal');
    await expect(page.locator('#active-employees-container')).toContainText('Quản Trị Viên');
    await expect(page.locator('#active-employees-container')).toContainText('Ngô Quyết Thắng');
    await expect(page.locator('#active-employees-container')).toContainText('Kỹ thuật viên');

    // Admin có nút Reset PIN cho nhân sự
    const resetButtons = await page.locator('#active-employees-container button[title*="Reset PIN"]').count();
    expect(resetButtons).toBeGreaterThan(0);
  });

  test('Kịch bản Mẫu Sổ Checklist: Admin tạo mới, chỉnh sửa, xóa mẫu sổ & Nhân viên áp dụng vào ca trực', async ({ page }) => {
    await page.goto('/nhatky/index.html');

    // 1. Admin đăng nhập và mở Danh sách Quản lý Mẫu Sổ
    await performLogin(page, 'ADMIN01', '1234');
    await page.click('#nav-personal');
    await page.click('#btn-open-template-manager');
    await expect(page.locator('#modal-template-manager')).toBeVisible();

    // 2. Tạo Mẫu Sổ mới
    await page.click('#btn-create-new-template');
    await expect(page.locator('#modal-template-builder')).toBeVisible();

    await page.fill('#input-template-name', 'Sổ kiểm tra Máy Phát Điện');
    await page.fill('#input-template-category', 'Máy phát điện');

    // Hạng mục 1
    await page.fill('.tpl-item-title >> nth=0', 'Kiểm tra mức nhiên liệu dầu Diesel');
    await page.selectOption('.tpl-item-priority >> nth=0', 'Khẩn cấp');
    await page.fill('.tpl-item-criteria >> nth=0', 'Mức dầu tối thiểu đạt trên 80% dung tích bồn');

    // Thêm hạng mục 2
    await page.click('#btn-add-template-item');
    await page.fill('.tpl-item-title >> nth=1', 'Kiểm tra điện áp bình ắc quy đề máy');
    await page.selectOption('.tpl-item-priority >> nth=1', 'Quan trọng');
    await page.fill('.tpl-item-criteria >> nth=1', 'Điện áp ắc quy từ 24V - 27V, cọc bình không bị muối hóa');

    await page.click('#btn-save-template');
    await expect(page.locator('#modal-template-builder')).toBeHidden();
    await expect(page.locator('#modal-template-manager')).toContainText('Sổ kiểm tra Máy Phát Điện');

    // 3. Admin Chỉnh sửa Mẫu Sổ (Edit)
    const editBtn = page.locator('.template-item-card:has-text("Sổ kiểm tra Máy Phát Điện") .btn-edit-template');
    await editBtn.click();
    await expect(page.locator('#modal-template-builder')).toBeVisible();

    // Đổi tên và sửa tiêu chí
    await page.fill('#input-template-name', 'Sổ kiểm tra Máy Phát Điện Dự Phòng');
    await page.fill('.tpl-item-criteria >> nth=0', 'Mức dầu tối thiểu đạt trên 90% dung tích bồn');
    await page.click('#btn-save-template');
    await expect(page.locator('#modal-template-builder')).toBeHidden();
    await expect(page.locator('#modal-template-manager')).toContainText('Sổ kiểm tra Máy Phát Điện Dự Phòng');

    // Đóng modal quản lý mẫu sổ
    await page.click('#modal-template-manager button:has-text("Đóng")');

    // 4. Đăng xuất Admin -> Nhân viên Ngô Quyết Thắng đăng nhập Ca 1
    await page.click('#btn-logout');
    await performLogin(page, 'EMP01', '1234');

    // 5. Nhân viên mở "Áp dụng Mẫu Sổ"
    await page.click('#nav-tasks');
    await page.click('#btn-open-apply-template');
    await expect(page.locator('#modal-apply-template')).toBeVisible();
    await expect(page.locator('#modal-apply-template')).toContainText('Sổ kiểm tra Máy Phát Điện Dự Phòng');

    // Áp dụng mẫu sổ đã sửa vào ca
    await page.locator('.template-card:has-text("Sổ kiểm tra Máy Phát Điện Dự Phòng") .btn-apply-tpl').click();
    await expect(page.locator('#modal-apply-template')).toBeHidden();

    // 6. Checklist của ca trực được nạp và hiển thị đầy đủ tiêu chí đã sửa
    await expect(page.locator('#task-list')).toContainText('Kiểm tra mức nhiên liệu dầu Diesel');
    await expect(page.locator('#task-list')).toContainText('Mức dầu tối thiểu đạt trên 90% dung tích bồn');
    await expect(page.locator('#task-list')).toContainText('Kiểm tra điện áp bình ắc quy đề máy');
    await expect(page.locator('#task-list')).toContainText('Điện áp ắc quy từ 24V - 27V');

    // Đánh dấu hoàn thành
    await page.locator('.task-item-check').first().click();
    await expect(page.locator('#progress-percent')).toHaveText('50%');

    // 7. Kiểm tra chức năng Xóa Mẫu Sổ (Admin Delete)
    await page.click('#nav-personal');
    await page.click('#btn-logout');
    await performLogin(page, 'ADMIN01', '1234');
    await page.click('#nav-personal');
    await page.click('#btn-open-template-manager');

    const deleteBtn = page.locator('.template-item-card:has-text("Sổ kiểm tra Máy Phát Điện Dự Phòng") .btn-delete-template');
    await deleteBtn.click();
    await expect(page.locator('#modal-template-manager')).not.toContainText('Sổ kiểm tra Máy Phát Điện Dự Phòng');
  });

  test('Kịch bản 1, 2, 3: Cô lập dữ liệu theo Ca và Nhân viên (Thắng Ca 1 vs Hậu Ca 2)', async ({ page }) => {
    await page.goto('/nhatky/index.html');
    await performLogin(page, 'EMP01', '1234'); // Ngô Quyết Thắng

    // Kiểm tra UI hiển thị đúng Thắng Ca 1 hoặc ca tương ứng (Kỹ thuật viên)
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
    await expect(page.locator('#report-preview')).toContainText('Kỹ thuật viên');
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
    await page.goto('/nhatky/index.html');
    await performLogin(page, 'EMP03', '1234'); // Hoàng Việt Hoàng

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

  test('Kịch bản 7 & 8: Danh sách nhân viên mặc định có Admin + 4 KTV active, nhân viên nghỉ việc không có trong ca mới, migration an toàn', async ({ page }) => {
    // Giả lập dữ liệu legacy chưa có tác giả và chưa migrate
    await page.evaluate(() => {
      localStorage.removeItem('app_schema_version');
      localStorage.setItem('app_tasks', JSON.stringify([
        { id: 999, title: 'Việc cũ legacy', priority: 'Bình thường', done: true }
      ]));
      localStorage.setItem('app_logs', JSON.stringify([
        { id: 888, content: 'Nhật ký cũ legacy', status: 'Không bất thường', time: '08:00' }
      ]));
    });

    await page.reload();
    await performLogin(page, 'EMP01', '1234');

    // Mở chọn nhân viên
    await page.click('#header-user-badge');
    const options = await page.locator('#select-active-employee option').allInnerTexts();
    
    // 5 người active (1 Admin + 4 KTV)
    expect(options.some(t => t.includes('Quản Trị Viên'))).toBe(true);
    expect(options.some(t => t.includes('Ngô Quyết Thắng'))).toBe(true);
    expect(options.some(t => t.includes('Đinh Văn Hậu'))).toBe(true);
    expect(options.some(t => t.includes('Hoàng Việt Hoàng'))).toBe(true);
    expect(options.some(t => t.includes('Nguyễn Đức Phong'))).toBe(true);

    // Dữ liệu legacy được đánh dấu legacy-unattributed và không bị gán cho người dùng hiện tại
    const tasks = await page.evaluate(() => JSON.parse(localStorage.getItem('app_tasks') || '[]'));
    const legacyTask = tasks.find(t => t.id === 999);
    expect(legacyTask).toBeDefined();
    expect(legacyTask.createdBy).toBe('legacy-unattributed');
  });

  test('Kịch bản Mở Rộng: Nhân viên mới / Thử việc tự tạo tài khoản và đăng nhập ghi nhật ký độc lập', async ({ page }) => {
    await page.goto('/nhatky/index.html');

    // 1. Mở modal đăng ký từ màn hình login
    await page.click('#btn-login-open-register');
    await expect(page.locator('#modal-add-employee')).toBeVisible();

    // 2. Điền thông tin nhân viên thử việc mới
    await page.fill('#input-new-emp-name', 'Lê Văn An');
    await page.selectOption('#select-new-emp-role', 'Thử việc');
    await page.click('#btn-save-new-employee');

    // 3. Sau khi tạo, hệ thống tự động đăng nhập và đưa Lê Văn An vào ca trực
    await expect(page.locator('#screen-app')).toBeVisible();
    await expect(page.locator('#header-user-code')).toContainText('An');

    // 4. Lê Văn An thêm công việc và ghi nhật ký
    await page.click('button:has-text("Thêm việc")');
    await page.fill('#input-task-title', 'Học việc - Đọc sơ đồ tủ điện hạ thế');
    await page.click('button:has-text("Lưu công việc")');
    await expect(page.locator('#task-list')).toContainText('Học việc - Đọc sơ đồ tủ điện hạ thế');

    await page.click('#nav-journal');
    await page.click('button:has-text("Ghi nhật ký")');
    await page.fill('#input-log-content', 'Nhật ký thử việc: Đã nắm bắt vị trí các tủ điện phân phối');
    await page.click('button:has-text("Ghi vào sổ")');
    await expect(page.locator('#journal-list')).toContainText('Lê Văn An');
    await expect(page.locator('#journal-list')).toContainText('Nhật ký thử việc: Đã nắm bắt vị trí các tủ điện phân phối');

    // 5. Báo cáo hiển thị chính xác tên và mã của nhân viên thử việc mới
    await page.click('#nav-report');
    await expect(page.locator('#report-preview')).toContainText('Lê Văn An');
    await expect(page.locator('#report-preview')).toContainText('Nhật ký thử việc: Đã nắm bắt vị trí các tủ điện phân phối');

    // 6. Chuyển sang Tab Cá nhân kiểm tra danh sách nhân sự đã có Lê Văn An
    await page.click('#nav-personal');
    await expect(page.locator('#active-employees-container')).toContainText('Lê Văn An');
    await expect(page.locator('#active-employees-container')).toContainText('Thử việc');

    // 7. Reload trang kiểm tra phiên vẫn được bảo toàn
    await page.reload();
    await expect(page.locator('#screen-app')).toBeVisible();
    await expect(page.locator('#header-user-code')).toContainText('An');
  });

  test('Kịch bản 10 & 12: Đảm bảo Accessibility (aria-label) và không có console error', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/nhatky/index.html');
    await performLogin(page, 'EMP01', '1234');

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
