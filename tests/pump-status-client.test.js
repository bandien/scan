const test = require('node:test');
const assert = require('node:assert/strict');
const status = require('../js/pump-status.js');

const NOW = new Date('2026-08-03T12:00:00+07:00');

test('counts pump states', () => {
  assert.deepEqual(status.counts([
    { state: 'RUNNING' }, { state: 'RUNNING' },
    { state: 'STOPPED' }, { state: 'UNKNOWN' }
  ]), { total: 4, running: 2, stopped: 1, unknown: 1 });
});

test('running pumps appear first and old information is marked stale', () => {
  const result = status.prepare([
    { id: '1', name: 'Bơm dừng', state: 'STOPPED', lastEvent: { timestamp: '2026-08-03T11:00:00+07:00' } },
    { id: '2', name: 'Bơm chạy cũ', state: 'RUNNING', lastEvent: { timestamp: '2026-08-02T20:00:00+07:00' } },
    { id: '3', name: 'Bơm chưa rõ', state: 'UNKNOWN', lastEvent: null }
  ], NOW, 12);

  assert.deepEqual(result.map(item => item.id), ['2', '1', '3']);
  assert.equal(result[0].isStale, true);
  assert.equal(result[1].isStale, false);
  assert.equal(result[2].isStale, true);
});

test('filters by state and Vietnamese name without case sensitivity', () => {
  const result = status.filter([
    { name: 'Bơm Hồ 1', source: 'Hồ cảnh quan', state: 'RUNNING' },
    { name: 'Bơm Giếng 2', source: 'Giếng khoan', state: 'STOPPED' }
  ], { state: 'RUNNING', query: 'hồ' });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Bơm Hồ 1');
});
