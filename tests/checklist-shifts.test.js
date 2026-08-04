const test = require('node:test');
const assert = require('node:assert/strict');
const shifts = require('../js/checklist-shifts.js');

test('10 giờ: xác định đúng ca trước và ca hiện tại', () => {
  const result = shifts.context(new Date('2026-08-02T10:00:00+07:00'));
  assert.deepEqual(
    [result.previous.templateId, result.previous.date, result.current.templateId, result.current.date],
    ['ca_toi', '2026-08-01', 'ca_sang', '2026-08-02']
  );
});

test('18 giờ: ca hiện tại là Ca Tối cùng ngày', () => {
  const result = shifts.context(new Date('2026-08-02T18:00:00+07:00'));
  assert.deepEqual(
    [result.previous.templateId, result.previous.date, result.current.templateId, result.current.date],
    ['ca_sang', '2026-08-02', 'ca_toi', '2026-08-02']
  );
});

test('2 giờ sáng: ca hiện tại vẫn thuộc ngày nghiệp vụ hôm trước', () => {
  const result = shifts.context(new Date('2026-08-03T02:00:00+07:00'));
  assert.deepEqual(
    [result.previous.templateId, result.previous.date, result.current.templateId, result.current.date],
    ['ca_sang', '2026-08-02', 'ca_toi', '2026-08-02']
  );
});

test('đổi ca đúng tại các mốc 05:00 và 13:00', () => {
  const cases = [
    ['2026-08-03T04:59:00+07:00', 'ca_toi', '2026-08-02'],
    ['2026-08-03T05:00:00+07:00', 'ca_sang', '2026-08-03'],
    ['2026-08-03T12:59:00+07:00', 'ca_sang', '2026-08-03'],
    ['2026-08-03T13:00:00+07:00', 'ca_toi', '2026-08-03']
  ];
  for (const [time, templateId, date] of cases) {
    const current = shifts.context(new Date(time)).current;
    assert.deepEqual([current.templateId, current.date], [templateId, date], time);
  }
});

test('tóm tắt ca trước đếm mục không đạt và giữ ghi chú bàn giao', () => {
  const shift = { templateId: 'ca_sang', date: '2026-08-02' };
  const result = shifts.summarizePreviousRun([{
    templateId: 'ca_sang',
    date: '2026-08-02',
    status: 'submitted',
    operator: 'Anh Minh',
    submittedAt: '2026-08-02T12:55:00+07:00',
    handoverNote: 'Theo dõi áp suất bơm số 2',
    items: JSON.stringify({ A01: { status: 'ok' }, A02: { status: 'ng' } })
  }], shift, 'loaded');

  assert.equal(result.kind, 'ready');
  assert.equal(result.issueCount, 1);
  assert.equal(result.operator, 'Anh Minh');
  assert.equal(result.handoverNote, 'Theo dõi áp suất bơm số 2');
});

test('không có mạng vẫn trả trạng thái không chặn checklist hiện tại', () => {
  const result = shifts.summarizePreviousRun([], { templateId: 'ca_sang', date: '2026-08-02' }, 'error');
  assert.equal(result.kind, 'error');
  assert.match(result.detail, /vẫn có thể mở checklist hiện tại/i);
});

test('10 giờ: trước là tối hôm qua, sau là tối hôm nay', () => {
  const result = shifts.adjacent(new Date('2026-07-29T10:00:00+07:00'));
  assert.deepEqual(result.map(x => [x.position, x.templateId, x.date]), [
    ['previous', 'ca_toi', '2026-07-28'],
    ['next', 'ca_toi', '2026-07-29']
  ]);
});

test('18 giờ: trước là sáng hôm nay, sau là sáng ngày mai', () => {
  const result = shifts.adjacent(new Date('2026-07-29T18:00:00+07:00'));
  assert.deepEqual(result.map(x => [x.position, x.templateId, x.date]), [
    ['previous', 'ca_sang', '2026-07-29'],
    ['next', 'ca_sang', '2026-07-30']
  ]);
});

test('2 giờ sáng vẫn thuộc ngày nghiệp vụ của ca tối hôm trước', () => {
  const result = shifts.adjacent(new Date('2026-07-29T02:00:00+07:00'));
  assert.deepEqual(result.map(x => [x.position, x.templateId, x.date]), [
    ['previous', 'ca_sang', '2026-07-28'],
    ['next', 'ca_sang', '2026-07-29']
  ]);
});

test('URL Golf mang đủ ca và ngày', () => {
  const shift = { templateId: 'ca_sang', date: '2026-07-29' };
  assert.equal(shifts.golfUrl(shift), '../sangolf/index.html?autoTemplate=ca_sang&date=2026-07-29');
});

