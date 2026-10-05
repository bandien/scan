const { test } = require('node:test');
const assert = require('node:assert/strict');
const schedule = require('../nhatky/my-shift.js');

const week = {startDate:'2026-10-05',endDate:'2026-10-11',weekLabel:'41',members:[
  {name:'Ngô Quyết Thắng',team:'Tổ cơ điện Sân Golf',days:[['','x',''],['CN','',''],['x','',''],['tx','',''],['tx','',''],['x','',''],['','','x']]},
  {name:'Nguyễn Văn Cường',team:'Tổ điện nước',days:[['hc','',''],['CN','',''],['P','',''],['','',''],['HB','',''],['','x','x'],['N','','']]}
]};

test('Vietnam time does not depend on the browser timezone',()=>{
  assert.equal(schedule.vietnamDate(new Date('2026-10-04T18:00:00Z')),'2026-10-05');
});
test('full-name matching normalizes whitespace and Unicode but never guesses a similar name',()=>{
  assert.equal(schedule.findMember(week,'  Ngô Quyết   Thắng ').name,'Ngô Quyết Thắng');
  assert.equal(schedule.findMember(week,'Ngô Quyết Thắng'.normalize('NFD')).name,'Ngô Quyết Thắng');
  assert.equal(schedule.findMember(week,'Nguyễn Quang Cường'),null);
});
test('duplicate names require a unique exact team match',()=>{
  const member=week.members[0];
  const duplicates={...week,members:[member,{...member,team:'Tổ điện'}]};
  assert.equal(schedule.findMember(duplicates,member.name).team,member.team);
  assert.throws(()=>schedule.findMember({...week,members:[member,{...member}]},member.name),/trùng/);
});
test('CMMS slot order is Ca 3, Ca 1, Ca 2 and source codes are preserved',()=>{
  assert.deepEqual(schedule.describeDay(['','x','']).assignments.map(s=>[s.label,s.time,s.code]),[['Ca 1','06:00–14:00','x']]);
  assert.equal(schedule.describeDay(['tx','','']).assignments[0].code,'tx');
  assert.equal(schedule.describeDay(['tx','','']).assignments[0].label,'Ca 3');
});
test('blank, rest, leave and administrative days have distinct states',()=>{
  assert.equal(schedule.describeDay(['','','']).kind,'unassigned');
  assert.equal(schedule.describeDay(['CN','','']).kind,'rest');
  assert.equal(schedule.describeDay(['P','','']).kind,'leave');
  assert.equal(schedule.describeDay(['hc','','']).kind,'administrative');
  assert.equal(schedule.describeDay(['HB','','']).kind,'other');
  assert.equal(schedule.describeDay(['Nghỉ việc','','']).kind,'inactive');
  assert.equal(schedule.describeDay(['?', '', '']).kind,'other');
  assert.equal(schedule.describeDay(['','x','x']).assignments.length,2);
});
test('today uses the assigned shift instead of the shift detected from the clock',()=>{
  const selected=schedule.selectCurrent([week],week.members[0].name,new Date('2026-10-05T12:00:00Z'));
  assert.equal(selected.date,'2026-10-05');
  assert.equal(selected.assignment.label,'Ca 1');
});
test('overnight remains on its start date until 06:00 Vietnam time',()=>{
  const selected=schedule.selectCurrent([week],week.members[0].name,new Date('2026-10-07T22:30:00Z'));
  assert.equal(selected.date,'2026-10-07');
  assert.equal(selected.assignment.label,'Ca 3');
  assert.equal(selected.overnight,true);
  const after=schedule.selectCurrent([week],week.members[0].name,new Date('2026-10-07T23:00:00Z'));
  assert.equal(after.date,'2026-10-08');
});
test('an overnight on Sunday can continue across the week boundary',()=>{
  const previous={...week,startDate:'2026-09-28',endDate:'2026-10-04',members:[{...week.members[0],days:[[],[],[],[],[],[],['x','','']]}]};
  assert.equal(schedule.selectCurrent([previous,week],week.members[0].name,new Date('2026-10-04T22:00:00Z')).date,'2026-10-04');
});
test('missing week and missing employee are not inferred from a different week',()=>{
  assert.equal(schedule.selectCurrent([week],'Nguyễn Quang Cường',new Date('2026-10-05T05:00:00Z')).kind,'unmatched');
  assert.equal(schedule.selectCurrent([week],week.members[0].name,new Date('2026-10-12T05:00:00Z')).kind,'unpublished');
});
