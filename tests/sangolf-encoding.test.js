const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

for (const [relative, phrases, strictMojibakeCheck] of [
  ['sangolf/index.html', [/Người thực hiện/, /Chưa bắt đầu/, /hạng mục/, /Chốt ca & bàn giao/i], true],
  ['nhatky/index.html', [/nk-shift-card/, /nk-pump-auto-link/, /Không có công việc/], false],
  ['pump_info.html', [/Thông tin & Vận Hành Bơm/, /Người vận hành/, /Quét mã QR máy bơm/i], false]
]) {
  test(`${relative} không chứa chuỗi mojibake`, () => {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const markers = source.match(/Ã|Â|â€|Ä[„†]|Æ|Å|ðŸ|�/g) || [];
    if (strictMojibakeCheck) {
      assert.equal(markers.length, 0,
        `Còn ${markers.length} dấu hiệu sai encoding trong ${relative}`);
    }
    for (const phrase of phrases) assert.match(source, phrase);
  });
}
