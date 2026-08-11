const { test, expect } = require('@playwright/test');

// â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MOCK_PLAN_NO_PHASES = {
  id: 'T-SIMPLE', PlanID: 'T-SIMPLE',
  task: 'Kiá»ƒm tra Ä‘iá»‡n Ä‘á»‹nh ká»³', Task: 'Kiá»ƒm tra Ä‘iá»‡n Ä‘á»‹nh ká»³',
  assignee: 'Äinh VÄƒn Háº­u', Assignee: 'Äinh VÄƒn Háº­u',
  area: 'ToÃ n nhÃ ', Area: 'ToÃ n nhÃ ',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Äang lÃ m', Status: 'Äang lÃ m'
};

const MOCK_PLAN_WITH_PHASES = {
  id: 'T-PHASES', PlanID: 'T-PHASES',
  task: 'Thay tháº¿ cÃ¡p Ä‘iá»‡n táº§ng 3', Task: 'Thay tháº¿ cÃ¡p Ä‘iá»‡n táº§ng 3',
  assignee: 'Nguyá»…n Quá»‘c Tháº¯ng', Assignee: 'Nguyá»…n Quá»‘c Tháº¯ng',
  area: 'Táº§ng 3 - Block A', Area: 'Táº§ng 3 - Block A',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Äang lÃ m', Status: 'Äang lÃ m',
  team: 'Äiá»‡n',
  phases: JSON.stringify([
    {
      id: 'PH-1', name: 'Kháº£o sÃ¡t', order: 1, status: 'done',
      steps: [
        { id: 'ST-1', title: 'Äo Ä‘áº¡c hiá»‡n tráº¡ng', assignees: ['Nguyá»…n Quá»‘c Tháº¯ng'], done: true, doneAt: '2026-07-25T08:00:00Z', doneBy: 'Nguyá»…n Quá»‘c Tháº¯ng', doneByPeople: ['Nguyá»…n Quá»‘c Tháº¯ng'] }
      ]
    },
    {
      id: 'PH-2', name: 'Thi cÃ´ng', order: 2, status: 'doing',
      steps: [
        { id: 'ST-2', title: 'KÃ©o cÃ¡p má»›i', assignees: ['Äinh VÄƒn Háº­u', 'HoÃ ng Viá»‡t HoÃ ng'], done: false, doneByPeople: ['Äinh VÄƒn Háº­u'] },
        { id: 'ST-3', title: 'Äáº¥u ná»‘i Ä‘áº§u cÃ¡p', assignees: ['Äinh VÄƒn Háº­u'], done: false, doneByPeople: [] }
      ]
    },
    {
      id: 'PH-3', name: 'Nghiá»‡m thu', order: 3, status: 'todo', steps: []
    }
  ])
};

// Plan cho test crowd-completion: assignees pháº£i khá»›p vá»›i user mock
const MOCK_PLAN_CROWD = {
  id: 'T-CROWD', PlanID: 'T-CROWD',
  task: 'Test crowd completion', Task: 'Test crowd completion',
  assignee: 'Hau DV', Assignee: 'Hau DV',
  date: '2026-07-26', Date: '2026-07-26',
  status: 'Äang lÃ m', Status: 'Äang lÃ m',
  phases: JSON.stringify([
    {
      id: 'PH-C', name: 'Thi cÃ´ng', order: 1, status: 'doing',
      steps: [
        // 2 assignees, user lÃ  'Hau DV' (khá»›p BD_SSO mock)
        { id: 'ST-C', title: 'KÃ©o cÃ¡p', assignees: ['Hau DV', 'Hoang VH'], done: false, doneByPeople: [] }
      ]
    }
  ])
};

// â”€â”€ Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STAGING_URL = process.env.STAGING_URL;

function setupMocks(page) {
  return page.addInitScript((stagingUrl) => {
    if (stagingUrl) {
      window.CONFIG = window.CONFIG || {};
      window.CONFIG.gasUrl = stagingUrl;
    }
    // Set localStorage TRÆ¯á»šC Ä‘á»ƒ sso.js.getUser() Ä‘á»c Ä‘Æ°á»£c
    const mockUser = {
      name: 'Hau DV',
      username: 'hau.dv',
      role: 'user',
      team: 'Äiá»‡n',
      loginAt: Date.now() - 1000  // má»›i Ä‘Äƒng nháº­p 1 giÃ¢y trÆ°á»›c
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // Fallback: cÅ©ng set window.BD_SSO phÃ²ng trÆ°á»ng há»£p sso.js chÆ°a load
    window.BD_SSO = {
      getUser: () => mockUser
    };

    // Mock API functions
    if (!stagingUrl) {
      window.bdsApiFetch = async (action) => {
      if (action === 'getPlans') return { status: 'success', plans: [] };
      if (action === 'getStaff') return {
        status: 'success',
        data: [
          { fullName: 'Äinh VÄƒn Háº­u', shortName: 'Háº­u ÄV', dept: 'Äiá»‡n', username: 'hau.dv' },
          { fullName: 'HoÃ ng Viá»‡t HoÃ ng', shortName: 'HoÃ ng VH', dept: 'Äiá»‡n', username: 'hoang.vh' },
          { fullName: 'Nguyá»…n Quá»‘c Tháº¯ng', shortName: 'Tháº¯ng NQ', dept: 'CÆ¡ khÃ­', username: 'thang.nq' }
        ]
      };
      return { status: 'success' };
    };
    }
    if (!stagingUrl) {
      window.bdsApiPost = async () => ({ status: 'success' });
    }
  }, STAGING_URL);
}

async function openDetail(page, plan) {
  await page.evaluate((p) => {
    allPlans = [p];
    navigateToDetail(p.id);
    showScreen('detail');
    renderDetailScreen(p.id);
  }, plan);
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('Core â€” UI cÆ¡ báº£n', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Hiá»ƒn thá»‹ giao diá»‡n chÃ­nh', async ({ page }) => {
    await expect(page).toHaveTitle(/CÃ´ng viá»‡c/);
    await expect(page.locator('#screenMain .nk-appbar__name')).toHaveText('CÃ´ng viá»‡c');
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

  test('Má»Ÿ/Ä‘Ã³ng Modal Viá»‡c Má»›i', async ({ page }) => {
    const modal = page.locator('#modalNewTask');
    await expect(modal).not.toHaveClass(/is-open/);
    await page.locator('#btnNewTask').click();
    await expect(modal).toHaveClass(/is-open/);
    await page.locator('#btnCloseNewTask').click();
    await expect(modal).not.toHaveClass(/is-open/);
  });
});

test.describe('Task 8 â€” Badge GÄ X/Y trÃªn card danh sÃ¡ch', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Plan cÃ³ phases â†’ hiá»‡n badge GÄ 1/3', async ({ page }) => {
    await page.evaluate((plan) => {
      allPlans = [plan];
      renderMainBoard();
    }, MOCK_PLAN_WITH_PHASES);
    // Badge GÄ 1/3 (1 bÆ°á»›c done trong 3 bÆ°á»›c tá»•ng)
    const badge = page.locator('.nk-wrow__title').first();
    await expect(badge).toContainText('GÄ');
    await expect(badge).toContainText('1/3');
  });

  test('Plan khÃ´ng cÃ³ phases â†’ khÃ´ng hiá»‡n badge GÄ', async ({ page }) => {
    await page.evaluate((plan) => {
      allPlans = [plan];
      renderMainBoard();
    }, MOCK_PLAN_NO_PHASES);
    const badge = page.locator('.nk-wrow__title').filter({ hasText: /GÄ \d/ });
    await expect(badge).toHaveCount(0);
  });
});

test.describe('Task 5 â€” NÃºt NÃ¢ng cáº¥p (plan khÃ´ng cÃ³ phases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Plan khÃ´ng cÃ³ phases â†’ hiá»‡n nÃºt NÃ¢ng cáº¥p, khÃ´ng cÃ³ .nk-pline', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_NO_PHASES);
    await expect(page.locator('button', { hasText: 'Viá»‡c nÃ y phá»©c táº¡p' })).toBeVisible();
    await expect(page.locator('.nk-pline')).toHaveCount(0);
  });
});

test.describe('Task 6 â€” Render Giai Ä‘oáº¡n & BÆ°á»›c (plan cÃ³ phases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Hiá»‡n Ä‘Ãºng 3 giai Ä‘oáº¡n, khÃ´ng cÃ³ nÃºt NÃ¢ng cáº¥p', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    await expect(page.locator('button', { hasText: 'Viá»‡c nÃ y phá»©c táº¡p' })).toHaveCount(0);
    await expect(page.locator('.nk-pline')).toHaveCount(3);
    await expect(page.locator('.nk-pline').nth(0)).toContainText('Kháº£o sÃ¡t');
    await expect(page.locator('.nk-pline').nth(1)).toContainText('Thi cÃ´ng');
    await expect(page.locator('.nk-pline').nth(2)).toContainText('Nghiá»‡m thu');
  });

  test('Giai Ä‘oáº¡n Kháº£o sÃ¡t cÃ³ icon done (âœ“)', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    // icon done = 'âœ“' trong .nk-pmark--done
    const ph1Mark = page.locator('.nk-pmark--done').first();
    await expect(ph1Mark).toBeVisible();
  });

  test('BÆ°á»›c ST-1 done â†’ hiá»‡n .step-done-note', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const doneNote = page.locator('.step-done-note').first();
    await expect(doneNote).toBeVisible();
    await expect(doneNote).toContainText('Ä‘Ã£ xong');
  });

  test('BÆ°á»›c cÃ³ assignees â†’ hiá»‡n .step-chip Ä‘Ãºng sá»‘ lÆ°á»£ng', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    // ST-1: 1 chip, ST-2: 2 chips, ST-3: 1 chip = tá»•ng 4
    const chips = page.locator('.step-chip');
    await expect(chips).toHaveCount(4);
  });

  test('BÆ°á»›c ST-2 (2 ngÆ°á»i, Háº­u Ä‘Ã£ xong) â†’ hiá»‡n progress 1/2', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const progress = page.locator('.step-progress-people').first();
    await expect(progress).toBeVisible();
    await expect(progress).toContainText('1/2');
  });

  test('CÃ³ nÃºt + ThÃªm bÆ°á»›c vÃ  + ThÃªm giai Ä‘oáº¡n', async ({ page }) => {
    await openDetail(page, MOCK_PLAN_WITH_PHASES);
    const addStepBtns = page.locator('.nk-add-step', { hasText: /ThÃªm bÆ°á»›c/ });
    await expect(addStepBtns).toHaveCount(3); // 3 phases
    const addPhaseBtns = page.locator('.nk-add-step', { hasText: /ThÃªm giai Ä‘oáº¡n/ });
    await expect(addPhaseBtns).toHaveCount(1);
  });
});

test.describe('Task 7 â€” Crowd-Completion self-chip', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page); // user = 'Hau DV'
    await page.goto('/nhatky/index.html');
  });

  test('User lÃ  assignee trong bÆ°á»›c >=2 ngÆ°á»i â†’ hiá»‡n .nk-self-chip', async ({ page }) => {
    // Pháº£i set BD_SSO trÆ°á»›c khi render Ä‘á»ƒ renderFlatPhases Ä‘á»c Ä‘Æ°á»£c user
    await page.evaluate((plan) => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv' }) };
      allPlans = [plan];
      navigateToDetail(plan.id);
      showScreen('detail');
      renderDetailScreen(plan.id);
    }, MOCK_PLAN_CROWD);
    const selfChip = page.locator('.nk-self-chip');
    await expect(selfChip).toHaveCount(1);
    await expect(selfChip).toContainText('BÃ¡o mÃ¬nh xong');
  });

  test('User chÆ°a bÃ¡o xong â†’ chip khÃ´ng cÃ³ class is-done', async ({ page }) => {
    await page.evaluate((plan) => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv' }) };
      allPlans = [plan];
      navigateToDetail(plan.id);
      showScreen('detail');
      renderDetailScreen(plan.id);
    }, MOCK_PLAN_CROWD);
    const selfChip = page.locator('.nk-self-chip');
    await expect(selfChip).toBeVisible();
    // doneByPeople rá»—ng â†’ chip chÆ°a is-done
    const cls = await selfChip.getAttribute('class');
    expect(cls).not.toMatch(/is-done/);
  });
});

// â”€â”€ A2: Gate quyá»n Ghi há»™ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A2 â€” Gate quyá»n Ghi há»™', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('User thÆ°á»ng â†’ KHÃ”NG tháº¥y section Ghi há»™ khi má»Ÿ modal', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'User TH', username: 'user.th', role: 'user' }) };
      openNewTaskModal();
    });
    await page.locator('#btnExpandFields').click();
    await expect(page.locator('#behalfSection')).toHaveCSS('display', 'none');
  });

  test('Manager â†’ THáº¤Y section Ghi há»™ khi má»Ÿ modal', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv', role: 'Manager' }) };
      openNewTaskModal();
    });
    await page.locator('#btnExpandFields').click();
    await expect(page.locator('#behalfSection')).not.toHaveCSS('display', 'none');
  });

  test('fAssignee cÃ³ datalist attribute', async ({ page }) => {
    await expect(page.locator('#fAssignee')).toHaveAttribute('list', 'staffDatalist');
    await expect(page.locator('#staffDatalist')).toHaveCount(1);
  });
});

// â”€â”€ A5: Screen BÃ¡o cÃ¡o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A5 â€” Screen BÃ¡o cÃ¡o', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Báº¥m tab BÃ¡o cÃ¡o â†’ screenReport hiá»‡n, screenMain áº©n', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'R1', Task: 'Viá»‡c A', Assignee: 'Hau DV', Date: '2026-07-26', Status: 'Äang lÃ m' },
        { id: 'R2', Task: 'Viá»‡c B', Assignee: 'Thang NQ', Date: '2026-07-26', Status: 'HoÃ n thÃ nh' }
      ];
      navigateToReport();
    });
    await expect(page.locator('#screenReport')).toBeVisible();
    await expect(page.locator('#screenMain')).not.toBeVisible();
  });

  test('Screen BÃ¡o cÃ¡o cÃ³ 4 stat cards', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [{ id: 'R1', Task: 'V1', Assignee: 'A', Date: '2026-07-26', Status: 'Äang lÃ m' }];
      navigateToReport();
    });
    await expect(page.locator('.nk-stat-card')).toHaveCount(4);
  });

  test('Stat card Tá»•ng viá»‡c hiá»‡n Ä‘Ãºng sá»‘ lÆ°á»£ng', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'R1', Task: 'V1', Assignee: 'A', Status: 'Äang lÃ m' },
        { id: 'R2', Task: 'V2', Assignee: 'A', Status: 'Äang lÃ m' },
        { id: 'R3', Task: 'V3', Assignee: 'B', Status: 'HoÃ n thÃ nh' }
      ];
      navigateToReport();
    });
    // Card "Tá»•ng viá»‡c" lÃ  card thá»© 4
    await expect(page.locator('.nk-stat-card').nth(3).locator('.nk-stat-card__num')).toHaveText('3');
  });
});

// â”€â”€ A5: Screen CÃ¡ nhÃ¢n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A5 â€” Screen CÃ¡ nhÃ¢n', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Báº¥m tab CÃ¡ nhÃ¢n â†’ screenProfile hiá»‡n, screenMain áº©n', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Hau DV', username: 'hau.dv', role: 'Manager' }) };
      navigateToProfile();
    });
    await expect(page.locator('#screenProfile')).toBeVisible();
    await expect(page.locator('#screenMain')).not.toBeVisible();
  });

  test('profileName hiá»‡n Ä‘Ãºng tÃªn user', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Äinh VÄƒn Háº­u', username: 'hau.dv', role: 'Manager' }) };
      navigateToProfile();
    });
    await expect(page.locator('#profileName')).toContainText('Äinh VÄƒn Háº­u');
  });

  test('Avatar hiá»‡n chá»¯ cÃ¡i Ä‘áº§u cá»§a tÃªn', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Äinh VÄƒn Háº­u', username: 'hau.dv' }) };
      navigateToProfile();
    });
    await expect(page.locator('.nk-profile__avatar')).toContainText('Ä');
  });

  test('CÃ³ nÃºt ÄÄƒng xuáº¥t', async ({ page }) => {
    await page.evaluate(() => {
      window.BD_SSO = { getUser: () => ({ name: 'Test User', username: 'test' }) };
      navigateToProfile();
    });
    const logoutBtn = page.locator('.nk-profile__action--danger');
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toContainText('ÄÄƒng xuáº¥t');
  });
});

// â”€â”€ A4: Subtab lá»c loáº¡i cÃ´ng viá»‡c â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A4 â€” Subtab lá»c loáº¡i cÃ´ng viá»‡c', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('CÃ³ 3 subtab: CÃ´ng viá»‡c / Káº¿ hoáº¡ch / Checklist', async ({ page }) => {
    const tabs = page.locator('.nk-subtab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('CÃ´ng viá»‡c');
    await expect(tabs.nth(1)).toContainText('Káº¿ hoáº¡ch');
    await expect(tabs.nth(2)).toContainText('Checklist');
  });

  test('Tab "CÃ´ng viá»‡c" active máº·c Ä‘á»‹nh', async ({ page }) => {
    await expect(page.locator('#subtabAll')).toHaveClass(/is-active/);
    await expect(page.locator('#subtabPlan')).not.toHaveClass(/is-active/);
  });

  test('Báº¥m tab "Káº¿ hoáº¡ch" â†’ chá»‰ hiá»‡n plan cÃ³ type Káº¿ hoáº¡ch', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'P1', Task: 'Viá»‡c phÃ¡t sinh', Assignee: 'A', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'PhÃ¡t sinh' },
        { id: 'P2', Task: 'Báº£o dÆ°á»¡ng mÃ¡y bÆ¡m', Assignee: 'B', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'Báº£o dÆ°á»¡ng' },
        { id: 'P3', Task: 'Káº¿ hoáº¡ch sá»­a chá»¯a', Assignee: 'C', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'Káº¿ hoáº¡ch' }
      ];
      renderMainBoard();
    });
    // Báº¥m tab Káº¿ hoáº¡ch
    await page.locator('#subtabPlan').click();
    await expect(page.locator('#subtabPlan')).toHaveClass(/is-active/);
    // Chá»‰ tháº¥y Báº£o dÆ°á»¡ng vÃ  Káº¿ hoáº¡ch (P2 + P3), khÃ´ng tháº¥y P1
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(2);
  });

  test('Báº¥m tab "Checklist" â†’ chá»‰ hiá»‡n plan tÃªn chá»©a CHECKLIST', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'C1', Task: 'KÃ©o cÃ¡p bÃ¬nh thÆ°á»ng', Assignee: 'A', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'PhÃ¡t sinh' },
        { id: 'C2', Task: '[Sá»° Cá» CHECKLIST] Golf ca sÃ¡ng', Assignee: 'B', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'PhÃ¡t sinh' }
      ];
      renderMainBoard();
    });
    await page.locator('#subtabChecklist').click();
    await expect(page.locator('#subtabChecklist')).toHaveClass(/is-active/);
    // Chá»‰ tháº¥y C2
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('CHECKLIST');
    
    // Test A4 Shortcuts xuáº¥t hiá»‡n á»Ÿ tab Checklist
    const shortcuts = page.locator('.nk-checklist-shortcuts');
    await expect(shortcuts).toBeVisible();
    await expect(shortcuts).toContainText('Golf (SÃ¡ng)');
  });

  test('Trá»n vÃ²ng Ä‘á»i Checklist: Táº¡o, xem chi tiáº¿t, vÃ  má»Ÿ form', async ({ page }) => {
    // 1. Mock bdsApiPost Ä‘á»ƒ tráº£ vá» res.data cho riÃªng lá»‡nh savePlan
    const isStaging = !!process.env.STAGING_URL;
    await page.evaluate((isStaging) => {
      if (!isStaging) {
        window.bdsApiPost = async (action, payload) => {
          if (action === 'savePlan') {
            return { status: 'success', planId: 'C99' };
          }
          return { status: 'success' };
        };
      }
      // Reset danh sÃ¡ch plan
      allPlans = [];
      renderMainBoard();
    }, isStaging);

    // 2. Chá»n Tab Checklist
    await page.locator('#subtabChecklist').click();

    // 3. Báº¥m táº¡o Checklist Golf (SÃ¡ng)
    await page.getByText('Golf (SÃ¡ng)').click();

    // 5. LÃºc nÃ y form chi tiáº¿t (nk-sheet) pháº£i tá»± Ä‘á»™ng má»Ÿ ra
    const sheet = page.locator('#detailBody');
    await expect(sheet).toBeVisible({ timeout: 2000 });

    // 6. Kiá»ƒm tra tiÃªu Ä‘á» task cÃ³ chá»¯ CHECKLIST
    const title = page.locator('.nk-detail__bar-title');
    await expect(title).toContainText('[CHECKLIST] SÃ¢n Golf');

    // 7. Kiá»ƒm tra nÃºt Äiá»n Form Checklist cÃ³ tá»“n táº¡i vÃ  truyá»n Ä‘Ãºng taskId
    const btnForm = page.locator('button:has-text("Äiá»n Form Checklist")');
    await expect(btnForm).toBeVisible();
    const onclick = await btnForm.getAttribute('onclick');
    expect(onclick).toContain('?taskId=C99');
  });
});

// â”€â”€ A3: BÃ n giao ca & Nghiá»‡m thu/Chá»‘t sá»• (Lifecycle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A3 â€” VÃ²ng Ä‘á»i BÃ n giao & Chá»‘t sá»•', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Viá»‡c Ä‘ang lÃ m hiá»ƒn thá»‹ nÃºt Xong ká»¹ thuáº­t vÃ  BÃ n giao', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [{ id: 'L1', Task: 'Sá»­a Ä‘iá»‡n', Status: 'Äang lÃ m' }];
      renderMainBoard();
    });
    await page.locator('.nk-wrow').first().click();
    // Check buttons
    const btnTechDone = page.locator('#btnTechDone');
    await expect(btnTechDone).toBeVisible();
    await expect(btnTechDone).toContainText('Xong ká»¹ thuáº­t');
    
    const actions = page.locator('.nk-actions');
    await expect(actions).toContainText('BÃ n giao');
  });

  test('Viá»‡c Chá» nghiá»‡m thu hiá»ƒn thá»‹ nÃºt Chá»‘t sá»• cho quáº£n lÃ½', async ({ page }) => {
    await page.evaluate(() => {
      // Mock user lÃ  admin Ä‘á»ƒ pass canWriteOnBehalf()
      window.BD_SSO = { getUser: () => ({ username: 'admin', role: 'admin' }) };
      allPlans = [{ id: 'L2', Task: 'Sá»­a nÆ°á»›c', Status: 'Chá» nghiá»‡m thu' }];
      renderMainBoard();
    });
    await page.locator('.nk-wrow').first().click();
    // Quáº£n lÃ½ sáº½ tháº¥y nÃºt Chá»‘t sá»•
    const btnDone = page.locator('#btnMarkDone');
    await expect(btnDone).toBeVisible();
    await expect(btnDone).toContainText('Chá»‘t sá»•');
  });

  test('Viá»‡c Chá» nghiá»‡m thu áº©n nÃºt Chá»‘t sá»• vá»›i nhÃ¢n viÃªn thÆ°á»ng', async ({ page }) => {
    await page.evaluate(() => {
      // Mock user lÃ  nhÃ¢n viÃªn thÆ°á»ng
      window.BD_SSO = { getUser: () => ({ username: 'nv1', role: 'user' }) };
      allPlans = [{ id: 'L3', Task: 'Sá»­a láº¡nh', Status: 'Chá» nghiá»‡m thu' }];
      renderMainBoard();
    });
    await page.locator('.nk-wrow').first().click();
    // NhÃ¢n viÃªn chá»‰ tháº¥y "Äang chá» chá»‘t sá»•" (pointer-events: none)
    const btnDone = page.locator('#btnMarkDone');
    await expect(btnDone).not.toBeVisible();
    const actions = page.locator('.nk-actions');
    await expect(actions).toContainText('Äang chá» chá»‘t sá»•');
  });


  test('Báº¥m tab "CÃ´ng viá»‡c" sau khi lá»c â†’ hiá»‡n láº¡i táº¥t cáº£', async ({ page }) => {
    await page.evaluate(() => {
      allPlans = [
        { id: 'A1', Task: 'Viá»‡c A', Assignee: 'A', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'PhÃ¡t sinh' },
        { id: 'A2', Task: 'Viá»‡c B', Assignee: 'B', Date: '2026-07-26', Status: 'Äang lÃ m', Type: 'Káº¿ hoáº¡ch' }
      ];
      renderMainBoard();
    });
    // Lá»c sang Káº¿ hoáº¡ch trÆ°á»›c
    await page.locator('#subtabPlan').click();
    // Quay vá» CÃ´ng viá»‡c
    await page.locator('#subtabAll').click();
    await expect(page.locator('#subtabAll')).toHaveClass(/is-active/);
    const rows = page.locator('.nk-wrow');
    await expect(rows).toHaveCount(2);
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// A6 â€” Screen Danh báº¡
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('A6 â€” Screen Danh báº¡', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/nhatky/index.html');
  });

  test('Tab Danh báº¡ â†’ screenContacts hiá»‡n, screenMain áº©n', async ({ page }) => {
    await page.evaluate(() => navigateToContacts());
    await expect(page.locator('#screenContacts')).toBeVisible();
    await expect(page.locator('#screenMain')).not.toBeVisible();
  });

  test('screenContacts cÃ³ Ã´ tÃ¬m kiáº¿m #contactSearch', async ({ page }) => {
    await page.evaluate(() => navigateToContacts());
    await expect(page.locator('#contactSearch')).toBeVisible();
  });

  test('Render danh sÃ¡ch tá»« staffDirectory', async ({ page }) => {
    await page.evaluate(() => {
      staffDirectory = [
        { fullName: 'Nguyá»…n VÄƒn A', dept: 'Äiá»‡n', phone: '0901234567' },
        { fullName: 'Tráº§n Thá»‹ B',   dept: 'CÆ¡', phone: '' }
      ];
      navigateToContacts();
    });
    await expect(page.locator('.nk-contact-card')).toHaveCount(2);
  });

  test('Card cÃ³ nÃºt gá»i khi cÃ³ phone', async ({ page }) => {
    await page.evaluate(() => {
      staffDirectory = [
        { fullName: 'Nguyá»…n VÄƒn A', dept: 'Äiá»‡n', phone: '0901234567' },
        { fullName: 'Tráº§n Thá»‹ B',   dept: 'CÆ¡',   phone: '' }
      ];
      navigateToContacts();
    });
    // Chá»‰ A cÃ³ phone â†’ 1 call button
    await expect(page.locator('.nk-contact-card__call')).toHaveCount(1);
  });

  test('TÃ¬m kiáº¿m theo tÃªn lá»c Ä‘Ãºng', async ({ page }) => {
    await page.evaluate(() => {
      staffDirectory = [
        { fullName: 'Nguyá»…n VÄƒn An', dept: 'Äiá»‡n', phone: '0901' },
        { fullName: 'Tráº§n Thá»‹ BÃ­ch', dept: 'CÆ¡',   phone: '0902' },
        { fullName: 'LÃª VÄƒn CÆ°á»ng',  dept: 'Äiá»‡n', phone: '0903' }
      ];
      navigateToContacts();
    });
    await page.locator('#contactSearch').fill('bÃ­ch');
    await expect(page.locator('.nk-contact-card')).toHaveCount(1);
    await expect(page.locator('.nk-contact-card__name')).toContainText('Tráº§n Thá»‹ BÃ­ch');
  });

  test('Empty state khi khÃ´ng tÃ¬m tháº¥y káº¿t quáº£', async ({ page }) => {
    await page.evaluate(() => {
      staffDirectory = [{ fullName: 'Nguyá»…n VÄƒn A', dept: 'Äiá»‡n', phone: '' }];
      navigateToContacts();
    });
    await page.locator('#contactSearch').fill('zzz-not-found');
    await expect(page.locator('.nk-empty')).toBeVisible();
    await expect(page.locator('.nk-contact-card')).toHaveCount(0);
  });

  test('Báº¥m CÃ´ng viá»‡c trong bnavContacts â†’ quay vá»  screenMain', async ({ page }) => {
    await page.evaluate(() => navigateToContacts());
    await page.locator('#bnavContacts a').first().click();
    await expect(page.locator('#screenMain')).toBeVisible();
    await expect(page.locator('#screenContacts')).not.toBeVisible();
  });

  test('Render badge Label tren card va loc theo chip Label', async ({ page }) => {
    await page.evaluate(() => {
      staffDirectory = [
        { fullName: 'Nguyen Van A', dept: 'Dien', labels: 'San Golf, Van hanh', phone: '0901' },
        { fullName: 'Tran Thi B', dept: 'Co', labels: 'Tram bom', phone: '0902' }
      ];
      navigateToContacts();
    });
    await expect(page.locator('.nk-contact-badge')).toHaveCount(3);
    await expect(page.locator('.nk-contact-chip').first()).toBeVisible();

    await page.locator('#contactSearch').fill('Golf');
    await expect(page.locator('.nk-contact-card')).toHaveCount(1);
    await expect(page.locator('.nk-contact-card')).toContainText('Nguyen Van A');
  });
});

test.describe('Hash Route - #checklist/golf navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Truy cập /nhatky/index.html#checklist/golf tự chọn subtabChecklist và hiện khối Ca trực & Checklist', async ({ page }) => {
    await page.goto('/nhatky/index.html#checklist/golf?autoTemplate=ca_toi&date=2026-08-11');
    await expect(page.locator('#subtabChecklist')).toHaveClass(/is-active/);
    await expect(page.locator('.nk-checklist-shortcuts')).toBeVisible();
  });

  test('Bấm shortcut Golf tạo URL dạng #checklist/golf', async ({ page }) => {
    await page.goto('/nhatky/index.html#checklist');
    const golfLink = page.locator('.nk-checklist-shortcuts a', { hasText: 'Golf' }).first();
    await expect(golfLink).toBeVisible();
    await expect(golfLink).toHaveAttribute('href', /#checklist\/golf\?autoTemplate=/);
  });
});
