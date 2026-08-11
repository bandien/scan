const test = require('node:test');
const assert = require('node:assert/strict');
const shifts = require('../js/checklist-shifts.js');

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

test('URL Golf và Bơm mang đủ ca và ngày', () => {
  const shift = { templateId: 'ca_sang', date: '2026-07-29' };
  assert.equal(shifts.golfUrl(shift), '../nhatky/index.html#checklist/golf?autoTemplate=ca_sang&date=2026-07-29');
  assert.equal(shifts.pumpUrl(shift), '../pump_info.html?autoCheck=1&shift=ca_sang&date=2026-07-29');
});

