const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('không thể tái commit bản xuất danh bạ', async () => {
  const ignore = fs.readFileSync('.gitignore', 'utf8');
  expect(ignore).toMatch(/danhba_chuan_hoa\.\{csv,json\}/);
  expect(fs.existsSync('danhba_chuan_hoa.csv')).toBeFalsy();
  expect(fs.existsSync('danhba_chuan_hoa.json')).toBeFalsy();
});

test('getStaff bắt buộc session và suy quyền từ backend', async () => {
  const source = fs.readFileSync('07_Analytics.gs', 'utf8');
  expect(source).toContain('if (!sessionUser)');
  expect(source).toContain('getUserRole_(sessionUser)');
  expect(source).toContain('getUserTeams_(sessionUser)');
  expect(source).not.toMatch(/const requestingRole\s*=\s*e\s*&&/);
});

test('frontend gửi authToken khi tải danh bạ', async () => {
  const source = fs.readFileSync('nhatky/index.html', 'utf8');
  expect(source).toMatch(/bdsApiFetch\('getStaff',\s*\{[^}]*authToken:/s);
});

