const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const scheduleModule = require('../js/checklist-schedule.js');

test('BD_ChecklistSchedule.resolveDisplayCards trả danh sách thẻ đúng thứ tự và thuộc tính', () => {
  const scheduleData = [
    {
      templateId: 'ca_sang',
      templateName: 'Ca Sáng (5h00 – 13h00)',
      location: 'Sân Golf Kỳ Sơn',
      shiftCode: 'ca_sang',
      frequency: 'daily',
      businessDate: '2026-08-03',
      matchesDate: true,
      inWindow: false
    },
    {
      templateId: 'ca_chieu',
      templateName: 'Ca Chiều (13h00 – 19h00)',
      location: 'Sân Golf Kỳ Sơn',
      shiftCode: 'ca_chieu',
      frequency: 'daily',
      businessDate: '2026-08-03',
      matchesDate: true,
      inWindow: true
    },
    {
      templateId: 'tuan',
      templateName: 'Kiểm Tra Tuần',
      location: 'Sân Golf Kỳ Sơn',
      shiftCode: 'ca_sang',
      frequency: 'weekly',
      businessDate: '2026-08-03',
      matchesDate: false,
      inWindow: false
    }
  ];

  const cards = scheduleModule.resolveDisplayCards(scheduleData);

  assert.equal(cards.length, 3);
  assert.equal(cards[0].templateId, 'ca_sang');
  assert.equal(cards[0].icon, '☀️');
  assert.equal(cards[0].isDue, false);

  assert.equal(cards[1].templateId, 'ca_chieu');
  assert.equal(cards[1].icon, '📋'); // default icon for new/unknown templateId
  assert.equal(cards[1].isDue, true);

  assert.equal(cards[2].templateId, 'tuan');
  assert.equal(cards[2].icon, '📅');
  assert.equal(cards[2].isDue, false);
});

test('BD_ChecklistSchedule.getHandoverPairFor suy ra cặp bàn giao từ danh sách defs', () => {
  const defs = [
    { templateId: 'ca_sang', shiftCode: 'ca_sang', timeStart: '05:00', timeEnd: '13:00', frequency: 'daily', active: true },
    { templateId: 'ca_chieu', shiftCode: 'ca_chieu', timeStart: '13:00', timeEnd: '19:00', frequency: 'daily', active: true },
    { templateId: 'ca_toi', shiftCode: 'ca_toi', timeStart: '19:00', timeEnd: '03:00', frequency: 'daily', active: true },
    { templateId: 'tuan', shiftCode: 'ca_sang', frequency: 'weekly', active: true }
  ];

  const pairSang = scheduleModule.getHandoverPairFor('ca_sang', defs, '2026-08-03');
  assert.deepEqual(pairSang, {
    targetTemplateId: 'ca_chieu',
    targetBusinessDate: '2026-08-03'
  });

  const pairChieu = scheduleModule.getHandoverPairFor('ca_chieu', defs, '2026-08-03');
  assert.deepEqual(pairChieu, {
    targetTemplateId: 'ca_toi',
    targetBusinessDate: '2026-08-03'
  });

  const pairToi = scheduleModule.getHandoverPairFor('ca_toi', defs, '2026-08-03');
  assert.deepEqual(pairToi, {
    targetTemplateId: 'ca_sang',
    targetBusinessDate: '2026-08-04'
  });
});
