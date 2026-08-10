const test = require('node:test');
const assert = require('node:assert/strict');
const routes = require('../js/checklist-routes.js');

test('route checklist tổng hợp không gắn đối tượng', () => {
  assert.deepEqual(routes.parseHash('#checklist'), { scope: 'all', objectId: '' });
});

test('route checklist hỗ trợ loại và đối tượng cụ thể', () => {
  assert.deepEqual(routes.parseHash('#checklist/golf'), { scope: 'golf', objectId: '' });
  assert.deepEqual(routes.parseHash('#checklist/equipment/PUMP-01'), {
    scope: 'equipment', objectId: 'PUMP-01'
  });
});

test('tạo route và đường quay về an toàn cho từng đối tượng', () => {
  assert.equal(routes.buildHash('golf'), '#checklist/golf');
  assert.equal(routes.buildHash('equipment', 'PUMP 01'), '#checklist/equipment/PUMP%2001');
  assert.equal(routes.returnTo('golf'), '../nhatky/#checklist/golf');
});
