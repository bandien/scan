const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'sangolf', 'index.html');

test('giao diện Checklist không chứa chuỗi mojibake', () => {
  const source = fs.readFileSync(file, 'utf8');
  const markers = source.match(/Ã|Â|â€|Ä[„†]|Æ|Å|ðŸ|�/g) || [];
  assert.equal(markers.length, 0,
    `Còn ${markers.length} dấu hiệu sai encoding trong sangolf/index.html`);
  assert.match(source, /Người thực hiện/);
  assert.match(source, /Chưa bắt đầu/);
  assert.match(source, /hạng mục/);
  assert.match(source, /Chốt ca & bàn giao/i);
});

