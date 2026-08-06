const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backendPath = path.join(root, '19_GolfChecklist.gs');
const routerPath = path.join(root, '02_Router.gs');
const source = fs.readFileSync(backendPath, 'utf8');
const router = fs.readFileSync(routerPath, 'utf8');

const context = vm.createContext({ console });
new vm.Script(source, { filename: backendPath }).runInContext(context);

test('backend công bố đủ handler định nghĩa mẫu checklist', () => {
  assert.equal(typeof context.handleGetChecklistTemplateDefs, 'function');
  assert.equal(typeof context.handleGetChecklistSchedule, 'function');
  assert.equal(typeof context.handleUpsertChecklistTemplateDef, 'function');
  assert.equal(typeof context.handleDeleteChecklistTemplateDef, 'function');
});

test('router công bố route định nghĩa mẫu checklist', () => {
  assert.match(router, /getChecklistTemplateDefs.*handleGetChecklistTemplateDefs/);
  assert.match(router, /getChecklistSchedule.*handleGetChecklistSchedule/);
  assert.match(router, /upsertChecklistTemplateDef\s*:\s*handleUpsertChecklistTemplateDef/);
  assert.match(router, /deleteChecklistTemplateDef\s*:\s*handleDeleteChecklistTemplateDef/);
});

test('upsert định nghĩa mẫu tương thích payload lồng def từ client cũ', () => {
  const writes = [];
  context.contentResponse = obj => obj;
  context.writeAuditLog = () => {};
  context.findChecklistTemplateDefRow_ = () => 2;
  context.ensureChecklistTemplateDefsSheet_ = () => ({
    getRange: (row, column) => ({
      setValues: values => writes.push({ row, column, values }),
      setValue: value => writes.push({ row, column, value })
    })
  });

  const result = context.handleUpsertChecklistTemplateDef({
    def: {
      templateId: 'ca_toi',
      templateName: 'Ca Tối (14h00 – 22h00)',
      location: 'Sân Golf Kỳ Sơn',
      shiftCode: 'ca_toi_san_golf_14h',
      frequency: 'daily',
      timeStart: '14:00',
      timeEnd: '22:00',
      active: true
    },
    user: 'Quản lý test'
  });

  assert.equal(result.status, 'success');
  assert.equal(result.templateId, 'ca_toi');
  assert.ok(writes.length >= 3);
});

test('seed phủ đủ 4 mẫu golf hiện hành', () => {
  // const trong script không gắn vào context object → đọc bằng biểu thức
  const seed = vm.runInContext('CHECKLIST_TEMPLATE_DEF_SEED', context);
  // seed đến từ realm của VM → so sánh giá trị chuỗi, không so prototype mảng
  const ids = Array.from(seed, d => d.templateId).sort().join(',');
  assert.equal(ids, 'ca_sang,ca_toi,thang,tuan');
  for (const def of seed) {
    assert.ok(def.location, `Seed thiếu địa điểm: ${def.templateId}`);
    assert.ok(def.shiftCode, `Seed thiếu ca trực: ${def.templateId}`);
    assert.equal(context.validateChecklistTemplateDef_(def), '',
      `Seed không qua được validation: ${def.templateId}`);
  }
});

test('mẫu hàng ngày: trong và ngoài khung giờ', () => {
  const defs = [{ templateId: 'ca_sang', frequency: 'daily', timeStart: '05:00', timeEnd: '13:00', active: true }];

  const inWindow = context.resolveChecklistSchedule_(defs, '2026-07-29', '10:00')[0];
  assert.equal(inWindow.businessDate, '2026-07-29');
  assert.equal(inWindow.matchesDate, true);
  assert.equal(inWindow.inWindow, true);

  const outWindow = context.resolveChecklistSchedule_(defs, '2026-07-29', '14:00')[0];
  assert.equal(outWindow.matchesDate, true);
  assert.equal(outWindow.inWindow, false);
});

test('ca qua đêm: 2 giờ sáng thuộc ngày nghiệp vụ hôm trước', () => {
  const defs = [{ templateId: 'ca_dem', frequency: 'daily', timeStart: '21:00', timeEnd: '05:00', active: true }];

  const night = context.resolveChecklistSchedule_(defs, '2026-07-29', '02:00')[0];
  assert.equal(night.businessDate, '2026-07-28');
  assert.equal(night.inWindow, true);

  const evening = context.resolveChecklistSchedule_(defs, '2026-07-29', '22:00')[0];
  assert.equal(evening.businessDate, '2026-07-29');
  assert.equal(evening.inWindow, true);

  const noon = context.resolveChecklistSchedule_(defs, '2026-07-29', '12:00')[0];
  assert.equal(noon.businessDate, '2026-07-29');
  assert.equal(noon.inWindow, false);
});

test('mẫu tuần chỉ áp dụng đúng thứ, mẫu tháng đúng ngày', () => {
  const defs = [
    { templateId: 'tuan', frequency: 'weekly', dayOfWeek: 1, timeStart: '', timeEnd: '', active: true },
    { templateId: 'thang', frequency: 'monthly', dayOfMonth: 1, timeStart: '', timeEnd: '', active: true }
  ];

  // 2026-07-27 là thứ Hai; 2026-07-29 là thứ Tư
  const monday = context.resolveChecklistSchedule_(defs, '2026-07-27', '08:00');
  assert.equal(monday.find(x => x.templateId === 'tuan').inWindow, true);
  assert.equal(monday.find(x => x.templateId === 'thang').inWindow, false);

  const wednesday = context.resolveChecklistSchedule_(defs, '2026-07-29', '08:00');
  assert.equal(wednesday.find(x => x.templateId === 'tuan').inWindow, false);

  const firstOfMonth = context.resolveChecklistSchedule_(defs, '2026-08-01', '08:00');
  assert.equal(firstOfMonth.find(x => x.templateId === 'thang').inWindow, true);
});

test('mẫu ngừng áp dụng không xuất hiện trong lịch', () => {
  const defs = [{ templateId: 'cu', frequency: 'daily', timeStart: '', timeEnd: '', active: false }];
  assert.deepEqual(context.resolveChecklistSchedule_(defs, '2026-07-29', '08:00'), []);
});

test('validation chặn định nghĩa mẫu thiếu/sai dữ liệu', () => {
  const base = { templateName: 'Ca đêm', location: 'Nhà máy A', frequency: 'daily', timeStart: '', timeEnd: '' };

  assert.equal(context.validateChecklistTemplateDef_(base), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, templateName: '' }), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, location: '' }), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, frequency: 'hang_gio' }), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, timeStart: '05:00' }), '',
    'Có giờ bắt đầu mà thiếu giờ kết thúc phải bị chặn');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, timeStart: '25:00', timeEnd: '13:00' }), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, frequency: 'weekly' }), '');
  assert.notEqual(context.validateChecklistTemplateDef_({ ...base, frequency: 'monthly', dayOfMonth: 32 }), '');
});

test('handleGetGolfStatus sử dụng readChecklistTemplateDefs_', () => {
  context.ensureGolfRunsSheet_ = () => ({ getLastRow: () => 0 });
  context.readChecklistTemplateDefs_ = () => [
    { templateId: 'ca_moi', templateName: 'Ca Mới Tăng Cường', active: true }
  ];
  context.contentResponse = (obj) => obj;
  const res = context.handleGetGolfStatus();
  assert.equal(res.status, 'success');
  assert.equal(res.shifts.length, 1);
  assert.equal(res.shifts[0].templateId, 'ca_moi');
  assert.equal(res.shifts[0].templateName, 'Ca Mới Tăng Cường');
});
