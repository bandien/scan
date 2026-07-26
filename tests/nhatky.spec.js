const { test, expect } = require('@playwright/test');

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_PLAN_NO_PHASES = {
  id: 'T-SIMPLE', PlanID: 'T-SIMPLE',
  task: 'Kiểm tra điện định kỳ', Task: 'Kiểm tra điện định kỳ',
  assignee: 'Đinh Văn Hậu', Assignee: 'Đinh Văn Hậu',
  area: 'Toàn nhà', Area: 'Toàn nhà',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Đang làm', Status: 'Đang làm'
};

const MOCK_PLAN_WITH_PHASES = {
  id: 'T-PHASES', PlanID: 'T-PHASES',
  task: 'Thay thế cáp điện tầng 3', Task: 'Thay thế cáp điện tầng 3',
  assignee: 'Nguyễn Quốc Thắng', Assignee: 'Nguyễn Quốc Thắng',
  area: 'Tầng 3 - Block A', Area: 'Tầng 3 - Block A',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Đang làm', Status: 'Đang làm',
  team: 'Điện',
  phases: JSON.stringify([
    {
      id: 'PH-1', name: 'Khảo sát', order: 1, status: 'done',
      steps: [
        { id: 'ST-1', title: 'Đo đạc hiện trạng', assignees: ['Nguyễn Quốc Thắng'], done: true, doneAt: '2026-07-25T08:00:00Z', doneBy: 'Nguyễn Quốc Thắng', doneByPeople: ['Nguyễn Quốc Thắng'] }
      ]
    },
    {
      id: 'PH-2', name: 'Thi công', order: 2, status: 'doing',
      steps: [
        { id: 'ST-2', title: 'Kéo cáp mới', assignees: ['Đinh Văn Hậu', 'Hoàng Việt Hoàng'], done: false, doneByPeople: ['Đinh Văn Hậu'] },
        { id: 'ST-3', title: 'Đấu nối đầu cáp', assignees: ['Đinh Văn Hậu'], done: false, doneByPeople: [] }
      ]
    },
    {
      id: 'PH-3', name: 'Nghiệm thu', order: 3, status: 'todo', steps: []
    }
  ])
};

// Plan cho test crowd-completion: assignees phải khớp với user mock
const MOCK_PLAN_CROWD = {
  id: 'T-CROWD', PlanID: 'T-CROWD',
  task: 'Test crowd completion', Task: 'Test crowd completion',
  assignee: 'Hau DV', Assignee: 'Hau DV',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Đang làm', Status: 'Đang làm',
  phases: JSON.stringify([
    {
      id: 'PH-C', name: 'Thi công', order: 1, status: 'doing',
      steps: [
        // 2 assignees, user là 'Hau DV' (khớp BD_SSO mock)
        { id: 'ST-C', title: 'Kéo cáp', assignees: ['Hau DV', 'Hoang VH'], done: false, doneByPeople: [] }
      ]
    }
  ])
};

// ── Setup ─────────────────────────────────────────────────────────────────────
function setupMocks(page) {
  return page.addInitScript(() => {
    // Set localStorage TRƯỚC để sso.js.getUser() đọc được
    const mockUser = {
      name: 'Hau DV',
      username: 'hau.dv',
      role: 'user',
      team: 'Điện',
      loginAt: Date.now() - 1000  // mới đăng nhập 1 giây trước
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // Fallback: cũng set window.BD_SSO phòng trường hợp sso.js chưa load
    window.BD_SSO = {
      getUser: () => mockUser
    };

    // Mock API functions
    window.bdsApiFetch = async (action) => {
      if (action === 'getPlans') return { status: 'success', plans: [] };
      if (action === 'getStaff') return {
        status: 'success',
        data: [
          { fullName: 'Đinh Văn Hậu', shortName: 'Hậu ĐV', dept: 'Điện', username: 'hau.dv' },
          { fullName: 'Hoàng Việt Hoàng', shortName: 'Hoàng VH', dept: 'Điện', username: 'hoang.vh' },
          { fullName: 'Nguyễn Quốc Thắng', shortName: 'Thắng NQ', dept: 'Cơ khí', username: 'thang.nq' }
        ]
      };
      return { status: 'success' };
    };
    window.bdsApiPost = async () => ({ status: 'success' });
  });
}

async function openDetail(page, plan) {
  await page.evaluate((p) => {
    allPlans = [p];
    navigateToDetail(p.id);
    showScreen('detail');
    renderDetailScreen(p.id);
  }, plan);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
test.describe('Core — UI cơ bản', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Hiển thị giao diện chính', async ({ page }) => {
    await expect(page).toHaveTitle(/Công việc/);
    await expect(page.locator('#screenMain .nk-appbar__name')).toHaveText('Công việc');
    await expect(page.locator('#loginOverlay')).not.toBeVisible();
  });

  test('Dark Mode toggle', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.locator('#btnTheme').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.locator('#btnTheme').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('Mở/đóng Modal Việc Mới', async ({ page }) => {
    const modal = page.locator('#modalNewTask');
    await expect(modal).not.toHaveClass(/is-open/);
    await page.locator('#btnNewTask').click();
    await expect(modal).toHaveClass(/is-open/);
    await page.locator('#btnCloseNewTask').click();
    await expect(modal).not.toHaveClass(/is-open/);
  });
});

test.describe('Task 8 — Badge GĐ X/Y trên card danh sách', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Plan có phases → hiện badge GĐ 1/3', async ({ page }) => {
    await page.evaluate((plan) => {
      allPlans = [plan];
      renderMainBoard();
    }, MOCK_PLAN_WITH_PHASES);
    // Badge GĐ 1/3 (1 bước done trong 3 bước tổng)
    const badge = page.locator('.nk-wrow__title').first();
    await expect(badge).toContainText('GĐ');
    await expect(badge).toContainText('1/3');
  });

  test('Plan không có phases → không hiện badge GĐ', async ({ page }) => {
    await page.evaluate((plan) => {
      allPlans = [plan];
      renderMainBoard();
    }, MOCK_PLAN_NO_PHASES);
    const badge = page.locator('.nk-wrow__title').filter({ hasText: /GĐ \d/ });
    await expect(badge).toHaveCount(0);
  });
});

test.describe('Task 5 — Nút Nâng cấp (plan không có phases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Plan không có phases → hiện nút Nâng cấp, không có .nk-pline', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_NO_PHASES);
    await expect(page.locator('button', { hasText: 'Việc này phức tạp' })).toBeVisible();
    await expect(page.locator('.nk-pline')).toHaveCount(0);
  });
});

test.describe('Task 6 — Render Giai đoạn & Bước (plan có phases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Hiện đúng 3 giai đoạn, không có nút Nâng cấp', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    await expect(page.locator('button', { hasText: 'Việc này phức tạp' })).toHaveCount(0);
    await expect(page.locator('.nk-pline')).toHaveCount(3);
    await expect(page.locator('.nk-pline').nth(0)).toContainText('Khảo sát');
    await expect(page.locator('.nk-pline').nth(1)).toContainText('Thi công');
    await expect(page.locator('.nk-pline').nth(2)).toContainText('Nghiệm thu');
  });

  test('Giai đoạn Khảo sát có icon done (✓)', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    // icon done = '✓' trong .nk-pmark--done
    const ph1Mark = page.locator('.nk-pmark--done').first();
    await expect(ph1Mark).toBeVisible();
  });

  test('Bước ST-1 done → hiện .step-done-note', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const doneNote = page.locator('.step-done-note').first();
    await expect(doneNote).toBeVisible();
    await expect(doneNote).toContainText('đã xong');
  });

  test('Bước có assignees → hiện .step-chip đúng số lượng', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    // ST-1: 1 chip, ST-2: 2 chips, ST-3: 1 chip = tổng 4
    const chips = page.locator('.step-chip');
    await expect(chips).toHaveCount(4);
  });

  test('Bước ST-2 (2 người, Hậu đã xong) → hiện progress 1/2', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const progress = page.locator('.step-progress-people').first();
    await expect(progress).toBeVisible();
    await expect(progress).toContainText('1/2');
  });

  test('Có nút + Thêm bước và + Thêm giai đoạn', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const addStepBtns = page.locator('.nk-add-step', { hasText: /Thêm bước/ });
    await expect(addStepBtns).toHaveCount(3); // 3 phases
    const addPhaseBtns = page.locator('.nk-add-step', { hasText: /Thêm giai đoạn/ });
    await expect(addPhaseBtns).toHaveCount(1);
  });
});

test.describe('Task 7 — Crowd-Completion self-chip', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page); // user = 'Hau DV'
    await page.goto('/nhatky/index.html');
  });

  test('User là assignee trong bước >=2 người → hiện .nk-self-chip', async ({ page }) => {
    // Phải set BD_SSO trước khi render để renderFlatPhases đọc được user
    await page.evaluate((plan) => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv' }) };
      allPlans = [plan];
      navigateToDetail(plan.id);
      showScreen('detail');
      renderDetailScreen(plan.id);
    }, MOCK_PLAN_CROWD);
    const selfChip = page.locator('.nk-self-chip');
    await expect(selfChip).toHaveCount(1);
    await expect(selfChip).toContainText('Báo mình xong');
  });

  test('User chưa báo xong → chip không có class is-done', async ({ page }) => {
    await page.evaluate((plan) => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv' }) };
      allPlans = [plan];
      navigateToDetail(plan.id);
      showScreen('detail');
      renderDetailScreen(plan.id);
    }, MOCK_PLAN_CROWD);
    const selfChip = page.locator('.nk-self-chip');
    await expect(selfChip).toBeVisible();
    // doneByPeople rỗng → chip chưa is-done
    const cls = await selfChip.getAttribute('class');
    expect(cls).not.toMatch(/is-done/);
  });
});

// ── A2: Gate quyền Ghi hộ ─────────────────────────────────────────────────────
test.describe('A2 — Gate quyền Ghi hộ', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('User thường → KHÔNG thấy section Ghi hộ khi mở modal', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'User TH', username: 'user.th', role: 'user' }) };
      openNewTaskModal();
    });
    await page.locator('#btnExpandFields').click();
    await expect(page.locator('#behalfSection')).toHaveCSS('display', 'none');
  });

  test('Manager → THẤY section Ghi hộ khi mở modal', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv', role: 'Manager' }) };
      openNewTaskModal();
    });
    await page.locator('#btnExpandFields').click();
    await expect(page.locator('#behalfSection')).not.toHaveCSS('display', 'none');
  });

  test('fAssignee có datalist attribute', async ({ page }) => {
    await expect(page.locator('#fAssignee')).toHaveAttribute('list', 'staffDatalist');
    await expect(page.locator('#staffDatalist')).toHaveCount(1);
  });
});

// ── A5: Screen Báo cáo ─────────────────────────────────────────────────────────
test.describe('A5 — Screen Báo cáo', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Bấm tab Báo cáo → screenReport hiện, screenMain ẩn', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'R1', Task: 'Việc A', Assignee: 'Hau DV', Date: '2026-07-26', Status: 'Đang làm' },
        { id: 'R2', Task: 'Việc B', Assignee: 'Thang NQ', Date: '2026-07-26', Status: 'Hoàn thành' }
      ];
      navigateToReport();
    });
    await expect(page.locator('#screenReport')).toBeVisible();
    await expect(page.locator('#screenMain')).not.toBeVisible();
  });

  test('Screen Báo cáo có 4 stat cards', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [{ id: 'R1', Task: 'V1', Assignee: 'A', Date: '2026-07-26', Status: 'Đang làm' }];
      navigateToReport();
    });
    await expect(page.locator('.nk-stat-card')).toHaveCount(4);
  });

  test('Stat card Tổng việc hiện đúng số lượng', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'R1', Task: 'V1', Assignee: 'A', Status: 'Đang làm' },
        { id: 'R2', Task: 'V2', Assignee: 'A', Status: 'Đang làm' },
        { id: 'R3', Task: 'V3', Assignee: 'B', Status: 'Hoàn thành' }
      ];
      navigateToReport();
    });
    // Card "Tổng việc" là card thứ 4
    await expect(page.locator('.nk-stat-card').nth(3).locator('.nk-stat-card__num')).toHaveText('3');
  });
});

// ── A5: Screen Cá nhân ─────────────────────────────────────────────────────────
test.describe('A5 — Screen Cá nhân', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Bấm tab Cá nhân → screenProfile hiện, screenMain ẩn', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv', role: 'Manager' }) };
      navigateToProfile();
    });
    await expect(page.locator('#screenProfile')).toBeVisible();
    await expect(page.locator('#screenMain')).not.toBeVisible();
  });

  test('profileName hiện đúng tên user', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Đinh Văn Hậu', username: 'hau.dv', role: 'Manager' }) };
      navigateToProfile();
    });
    await expect(page.locator('#profileName')).toContainText('Đinh Văn Hậu');
  });

  test('Avatar hiện chữ cái đầu của tên', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Đinh Văn Hậu', username: 'hau.dv' }) };
      navigateToProfile();
    });
    await expect(page.locator('.nk-profile__avatar')).toContainText('Đ');
  });

  test('Có nút Đăng xuất', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Test User', username: 'test' }) };
      navigateToProfile();
    });
    const logoutBtn = page.locator('.nk-profile__action--danger');
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toContainText('Đăng xuất');
  });
});

// ── A4: Subtab lọc loại công việc ──────────────────────────────────────────────
test.describe('A4 — Subtab lọc loại công việc', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Có 3 subtab: Công việc / Kế hoạch / Checklist', async ({ page }) => {
    const tabs = page.locator('.nk-subtab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Công việc');
    await expect(tabs.nth(1)).toContainText('Kế hoạch');
    await expect(tabs.nth(2)).toContainText('Checklist');
  });

  test('Tab "Công việc" active mặc định', async ({ page }) => {
    await expect(page.locator('#subtabAll')).toHaveClass(/is-active/);
    await expect(page.locator('#subtabPlan')).not.toHaveClass(/is-active/);
  });

  test('Bấm tab "Kế hoạch" → chỉ hiện plan có type Kế hoạch', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'P1', Task: 'Việc phát sinh', Assignee: 'A', Date: '2026-07-26', Status: 'Đang làm', Type: 'Phát sinh' },
        { id: 'P2', Task: 'Bảo dưỡng máy bơm', Assignee: 'B', Date: '2026-07-26', Status: 'Đang làm', Type: 'Bảo dưỡng' },
        { id: 'P3', Task: 'Kế hoạch sửa chữa', Assignee: 'C', Date: '2026-07-26', Status: 'Đang làm', Type: 'Kế hoạch' }
      ];
      renderMainBoard();
    });
    // Bấm tab Kế hoạch
    await page.locator('#subtabPlan').click();
    await expect(page.locator('#subtabPlan')).toHaveClass(/is-active/);
    // Chỉ thấy Bảo dưỡng và Kế hoạch (P2 + P3), không thấy P1
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(2);
  });

  test('Bấm tab "Checklist" → chỉ hiện plan tên chứa CHECKLIST', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'C1', Task: 'Kéo cáp bình thường', Assignee: 'A', Date: '2026-07-26', Status: 'Đang làm', Type: 'Phát sinh' },
        { id: 'C2', Task: '[SỰ CỐ CHECKLIST] Golf ca sáng', Assignee: 'B', Date: '2026-07-26', Status: 'Đang làm', Type: 'Phát sinh' }
      ];
      renderMainBoard();
    });
    await page.locator('#subtabChecklist').click();
    await expect(page.locator('#subtabChecklist')).toHaveClass(/is-active/);
    // Chỉ thấy C2
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('CHECKLIST');
  });

  test('Bấm tab "Công việc" sau khi lọc → hiện lại tất cả', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'A1', Task: 'Việc A', Assignee: 'A', Date: '2026-07-26', Status: 'Đang làm', Type: 'Phát sinh' },
        { id: 'A2', Task: 'Việc B', Assignee: 'B', Date: '2026-07-26', Status: 'Đang làm', Type: 'Kế hoạch' }
      ];
      renderMainBoard();
    });
    // Lọc sang Kế hoạch trước
    await page.locator('#subtabPlan').click();
    // Quay về Công việc
    await page.locator('#subtabAll').click();
    await expect(page.locator('#subtabAll')).toHaveClass(/is-active/);
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(2);
  });
});
