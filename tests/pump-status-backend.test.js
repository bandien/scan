const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const routerSource = fs.readFileSync(require.resolve('../02_Router.gs'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(routerSource, context);

test('router exposes getPumpStatuses', () => {
  assert.match(routerSource, /case ['"]getPumpStatuses['"]:\s*return handleGetPumpStatuses\(e\)/);
});

test('pump overview uses event time and keeps pumps without history', () => {
  assert.equal(typeof context.buildPumpStatuses_, 'function');
  const pumps = [
    { id: '1', name: 'Bơm hồ 1', source: 'Hồ cảnh quan', flowRate: 15 },
    { id: '2', name: 'Bơm tưới 2', source: 'Giếng', flowRate: 10 },
    { id: '3', name: 'Bơm dự phòng', source: 'Bể ngầm', flowRate: 8 }
  ];
  const readings = [
    ['r1', 'PUMP_1', 0, '', '2026-08-03T09:00:00+07:00', 'Chi', 'Đã dừng'],
    ['r2', 'PUMP_2', 1, '', '2026-08-03T08:00:00+07:00', 'Bình', 'Tưới cỏ'],
    ['r3', 'PUMP_1', 1, '', '2026-08-03T07:00:00+07:00', 'An', 'Đồng bộ muộn']
  ];

  const result = context.buildPumpStatuses_(pumps, readings);
  assert.deepEqual(JSON.parse(JSON.stringify(result.map(item => ({
    id: item.id,
    state: item.state,
    operator: item.lastEvent && item.lastEvent.operator
  })))), [
    { id: '1', state: 'STOPPED', operator: 'Chi' },
    { id: '2', state: 'RUNNING', operator: 'Bình' },
    { id: '3', state: 'UNKNOWN', operator: null }
  ]);
});
