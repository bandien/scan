const { test, expect } = require('@playwright/test');

async function openLoggedOut(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/nhatky/index.html');
}

async function openAs(page, user) {
  await page.addInitScript((sessionUser) => {
    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
  }, {
    loginAt: Date.now(),
    authToken: 'session-token',
    teams: 'Tổ điện',
    ...user
  });
  await page.goto('/nhatky/index.html');
}

test.describe('Tài khoản — Đăng nhập', () => {
  test('chưa đăng nhập hiển thị screen login cố định', async ({ page }) => {
    await openLoggedOut(page);
    await expect(page.locator('#screenLogin')).toBeVisible();
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('#loginOverlay')).toHaveCount(0);
  });

  test('submit trống hiển thị lỗi inline', async ({ page }) => {
    await openLoggedOut(page);
    await page.locator('#loginForm').press('Enter');
    await expect(page.locator('#loginError')).toContainText('đầy đủ');
  });

  test('đăng nhập thành công lưu phiên đầy đủ và mở ứng dụng', async ({ page }) => {
    await openLoggedOut(page);
    await page.evaluate(() => {
      window.bdsApiPost = async (action, payload) => {
        window.__loginCall = { action, payload };
        return {
          status: 'success',
          username: 'hau.dv',
          name: 'Đinh Văn Hậu',
          fullName: 'Đinh Văn Hậu',
          role: 'Manager',
          teams: 'Tổ điện',
          authToken: 'auth-123'
        };
      };
      window.bdsApiFetch = async action =>
        action === 'getPlans' ? { status: 'success', plans: [] } : { status: 'success', data: [] };
    });

    await page.locator('#liUser').fill('hau.dv');
    await page.locator('#liPass').fill('1234');
    await page.locator('#loginForm').press('Enter');

    await expect(page.locator('#screenMain')).toBeVisible();
    const state = await page.evaluate(() => ({
      call: window.__loginCall,
      user: JSON.parse(localStorage.getItem('currentUser'))
    }));
    expect(state.call).toEqual({
      action: 'nhatkyLogin',
      payload: { username: 'hau.dv', pin: '1234' }
    });
    expect(state.user).toMatchObject({
      username: 'hau.dv',
      name: 'Đinh Văn Hậu',
      role: 'Manager',
      teams: 'Tổ điện',
      authToken: 'auth-123'
    });
    expect(state.user.loginAt).toEqual(expect.any(Number));
  });

  test('đăng nhập sai hiển thị thông báo backend', async ({ page }) => {
    await openLoggedOut(page);
    await page.evaluate(() => {
      window.bdsApiPost = async () => ({ status: 'error', message: 'Sai PIN' });
    });
    await page.locator('#liUser').fill('hau.dv');
    await page.locator('#liPass').fill('0000');
    await page.locator('#liBtn').click();
    await expect(page.locator('#loginError')).toContainText('Sai PIN');
    await expect(page.locator('#screenLogin')).toBeVisible();
  });
});

test.describe('Tài khoản — Quên và đổi PIN', () => {
  test('quên PIN tra cứu danh bạ nhưng không hiển thị PIN', async ({ page }) => {
    await openLoggedOut(page);
    await page.evaluate(() => {
      staffDirectory = [
        { username: 'nv.dien', fullName: 'Nguyễn Văn Điện', phone: '0901000001', dept: 'Tổ điện', role: 'User' },
        { username: 'quanly.dien', fullName: 'Trần Quản Lý', phone: '0909000009', dept: 'Tổ điện', role: 'Manager' }
      ];
    });
    await page.locator('#btnOpenForgot').click();
    await page.locator('#forgotInput').fill('nv.dien');
    await page.locator('#btnForgotSearch').click();
    await expect(page.locator('#forgotResult')).toContainText('Nguyễn Văn Điện');
    await expect(page.locator('#forgotResult')).toContainText('Trần Quản Lý');
    await expect(page.locator('#forgotResult a[href="tel:0909000009"]')).toBeVisible();
    await expect(page.locator('#forgotResult')).not.toContainText('1234');
  });

  test('đổi PIN validate và gửi authToken', async ({ page }) => {
    await openAs(page, { username: 'hau.dv', name: 'Đinh Văn Hậu', role: 'User' });
    await page.evaluate(() => {
      window.bdsApiPost = async (action, payload) => {
        window.__pinCall = { action, payload };
        return { status: 'success', message: 'Đã đổi PIN thành công.' };
      };
    });
    await page.evaluate(() => navigateToProfile());
    await page.locator('#btnChangePin').click();
    await page.locator('#currentPin').fill('1234');
    await page.locator('#newPin').fill('5678');
    await page.locator('#confirmNewPin').fill('5678');
    await page.locator('#changePinForm').press('Enter');

    await expect(page.locator('#modalChangePin')).not.toHaveClass(/is-open/);
    const call = await page.evaluate(() => window.__pinCall);
    expect(call).toEqual({
      action: 'nhatkyChangePin',
      payload: {
        actorUsername: 'hau.dv',
        authToken: 'session-token',
        oldPin: '1234',
        newPin: '5678'
      }
    });
  });
});

test.describe('Tài khoản — Quản lý nhân sự', () => {
  test('User thường không thấy nút quản lý, Admin thấy nút', async ({ page }) => {
    await openAs(page, { username: 'admin', name: 'Admin', role: 'Admin' });
    await page.evaluate(() => navigateToProfile());
    await expect(page.locator('#btnManageAccounts')).toBeVisible();

    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      user.role = 'User';
      localStorage.setItem('currentUser', JSON.stringify(user));
      renderProfileScreen();
    });
    await expect(page.locator('#btnManageAccounts')).toHaveCount(0);
  });

  test('mở quản lý tải danh sách và lọc theo vai trò', async ({ page }) => {
    await openAs(page, { username: 'admin', name: 'Admin', role: 'Admin' });
    await page.evaluate(() => {
      window.bdsApiPost = async action => {
        if (action === 'listUsers') {
          return {
            status: 'success',
            actorRole: 'Admin',
            roles: ['Admin', 'Manager', 'User'],
            teamOptions: ['Tổ điện', 'Tổ cơ'],
            users: [
              { username: 'admin', fullName: 'Quản trị', role: 'Admin', teams: '*', phone: '', hasPin: true, canDelete: false },
              { username: 'nv1', fullName: 'Nhân viên Một', role: 'User', teams: 'Tổ điện', phone: '0901', hasPin: true, canDelete: true }
            ]
          };
        }
        return { status: 'success' };
      };
      navigateToProfile();
    });
    await page.locator('#btnManageAccounts').click();
    await expect(page.locator('.nk-account-row')).toHaveCount(2);
    await page.locator('#accRoleFilter').selectOption('User');
    await expect(page.locator('.nk-account-row')).toHaveCount(1);
    await expect(page.locator('.nk-account-row')).toContainText('Nhân viên Một');
  });

  test('thêm tài khoản gửi payload có actor và session', async ({ page }) => {
    await openAs(page, { username: 'admin', name: 'Admin', role: 'Admin' });
    await page.evaluate(() => {
      window.bdsApiPost = async (action, payload) => {
        if (action === 'listUsers') {
          return { status: 'success', users: [], roles: ['Admin', 'Manager', 'User'], teamOptions: ['Tổ điện'], actorRole: 'Admin' };
        }
        window.__saveCall = { action, payload };
        return { status: 'success', message: 'Đã thêm tài khoản.' };
      };
      navigateToProfile();
    });
    await page.locator('#btnManageAccounts').click();
    await page.locator('#btnAddAccount').click();
    await page.locator('#accountUsername').fill('nv2');
    await page.locator('#accountFullName').fill('Nhân viên Hai');
    await page.locator('#accountPin').fill('2468');
    await page.locator('#accountRole').selectOption('User');
    await page.locator('#accountTeams').fill('Tổ điện');
    await page.locator('#accountPhone').fill('0902000002');
    await page.locator('#accountForm').press('Enter');

    const call = await page.evaluate(() => window.__saveCall);
    expect(call.action).toBe('saveUser');
    expect(call.payload.actorUsername).toBe('admin');
    expect(call.payload.authToken).toBe('session-token');
    expect(call.payload.user).toMatchObject({
      username: 'nv2',
      fullName: 'Nhân viên Hai',
      pin: '2468',
      role: 'User',
      teams: 'Tổ điện',
      phone: '0902000002'
    });
  });

  test('sửa tài khoản bảo toàn danh sách nhiều tổ', async ({ page }) => {
    await openAs(page, { username: 'admin', name: 'Admin', role: 'Admin' });
    await page.evaluate(() => {
      window.bdsApiPost = async (action, payload) => {
        if (action === 'listUsers') {
          return {
            status: 'success',
            users: [{ username: 'nv3', fullName: 'Nhân viên Ba', role: 'User', teams: 'Tổ điện, Tổ cơ', phone: '', hasPin: true, canDelete: true }],
            roles: ['Admin', 'Manager', 'User'],
            teamOptions: ['Tổ điện', 'Tổ cơ'],
            actorRole: 'Admin'
          };
        }
        window.__editCall = { action, payload };
        return { status: 'success' };
      };
      navigateToProfile();
    });
    await page.locator('#btnManageAccounts').click();
    await page.locator('.nk-account-row button[aria-label^="Sửa"]').click();
    await expect(page.locator('#accountTeams')).toHaveValue('Tổ điện, Tổ cơ');
    await page.locator('#accountForm').press('Enter');
    const call = await page.evaluate(() => window.__editCall);
    expect(call.payload.user.teams).toBe('Tổ điện, Tổ cơ');
  });

  test('xóa tài khoản gửi đúng actor, session và username', async ({ page }) => {
    await openAs(page, { username: 'admin', name: 'Admin', role: 'Admin' });
    await page.evaluate(() => {
      window.confirm = () => true;
      window.bdsApiPost = async (action, payload) => {
        if (action === 'listUsers') {
          return {
            status: 'success',
            users: [{ username: 'nv4', fullName: 'Nhân viên Bốn', role: 'User', teams: 'Tổ điện', phone: '', hasPin: true, canDelete: true }],
            roles: ['Admin', 'Manager', 'User'],
            teamOptions: ['Tổ điện'],
            actorRole: 'Admin'
          };
        }
        window.__deleteCall = { action, payload };
        return { status: 'success' };
      };
      navigateToProfile();
    });
    await page.locator('#btnManageAccounts').click();
    await page.locator('.nk-account-row button[aria-label^="Xóa"]').click();
    const call = await page.evaluate(() => window.__deleteCall);
    expect(call).toEqual({
      action: 'deleteUser',
      payload: { actorUsername: 'admin', authToken: 'session-token', username: 'nv4' }
    });
  });
});

test.describe('Tài khoản — Logout SSO', () => {
  test('logout gọi BD_SSO, xóa cache và trở về login', async ({ page }) => {
    await openAs(page, { username: 'hau.dv', name: 'Hậu', role: 'User' });
    await page.evaluate(() => {
      localStorage.setItem('nk_plans', '[]');
      localStorage.setItem('nk_logs', '[]');
      window.__logoutCalled = false;
      window.BD_SSO.logout = () => {
        window.__logoutCalled = true;
        localStorage.removeItem('currentUser');
      };
      window.confirm = () => true;
      navigateToProfile();
    });
    await page.locator('#btnLogout').click();
    await expect(page.locator('#screenLogin')).toBeVisible();
    const state = await page.evaluate(() => ({
      called: window.__logoutCalled,
      user: localStorage.getItem('currentUser'),
      plans: localStorage.getItem('nk_plans'),
      logs: localStorage.getItem('nk_logs')
    }));
    expect(state).toEqual({ called: true, user: null, plans: null, logs: null });
  });
});
