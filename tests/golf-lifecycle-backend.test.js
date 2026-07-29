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

test('backend Golf Checklist parse được và công bố đủ handler vòng đời', () => {
  const context = vm.createContext({ console });
  new vm.Script(source, { filename: backendPath }).runInContext(context);

  assert.equal(typeof context.handleSaveGolfRun, 'function');
  assert.equal(typeof context.handleSubmitGolfRun, 'function');
  assert.equal(typeof context.handleConfirmGolfHandover, 'function');
  assert.equal(typeof context.handleAcceptGolfHandoverAndStartRun, 'function');
});

test('router công bố giao dịch nhận bàn giao và bắt đầu ca', () => {
  assert.match(router,
    /acceptGolfHandoverAndStartRun\s*:\s*handleAcceptGolfHandoverAndStartRun/);
});

test('backend khóa sửa và chốt lại hồ sơ đã bàn giao', () => {
  const saveBody = source.match(
    /function handleSaveGolfRun[\s\S]*?\r?\n}\r?\n\r?\n\/\/ POST action=submitGolfRun/);
  const submitBody = source.match(
    /function handleSubmitGolfRun[\s\S]*?\r?\n}\r?\n\r?\n\/\/ POST action=confirmGolfHandover/);

  assert.ok(saveBody, 'Không tìm thấy handleSaveGolfRun');
  assert.ok(submitBody, 'Không tìm thấy handleSubmitGolfRun');
  assert.match(saveBody[0], /status === "submitted"/);
  assert.match(saveBody[0], /status === "confirmed"/);
  assert.match(submitBody[0], /status !== "draft" && status !== "in_progress"/);
});

test('giao dịch nhận ca dùng script lock và idempotency', () => {
  const body = source.match(
    /function handleAcceptGolfHandoverAndStartRun[\s\S]*?\n}\n/);
  assert.ok(body, 'Không tìm thấy handler nhận ca');
  assert.match(body[0], /LockService\.getScriptLock/);
  assert.match(body[0], /previousStatus === "confirmed"/);
  assert.match(body[0], /currentRunId/);
});
