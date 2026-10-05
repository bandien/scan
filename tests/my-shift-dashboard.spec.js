const {test,expect}=require('@playwright/test');
const SOURCE='https://docs.google.com/spreadsheets/d/1d_dbPMeToPfP86rRJVoB_BF15J4xh912jVfcjcagxXs/htmlview/sheet*';
const iso='2026-10-05';

function sourceHtml(firstMark='x') {
  const metadata=Array(21).fill(''); metadata[4]='Tuần:';metadata[7]='41';metadata[13]='Từ:';metadata[14]='5/10/2026';metadata[18]='Đến:';metadata[19]='11/10/2026';
  const dayNames=['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];
  const days=dayNames.flatMap((name,i)=>[name+' '+(i+5)+'/10','','']);
  const tr=(row,cells)=>'<tr><th id="36044768R'+(row-1)+'">'+row+'</th>'+cells.map((cell,i)=>'<td>'+cell+'</td>'+(i===1?'<td class="freezebar-cell"></td>':'')).join('')+'</tr>';
  const staff=[
    ['2','Ngô Quyết Thắng','',''+firstMark,'','CN','','','x','','','tx','','','tx','','','x','','','','','x'],
    ['3','Đinh Văn Hậu','','','CN','','','x','','x','','','x','','','x','','','x','','x','',''],
    ['4','Hoàng Việt Hoàng','','','x','','x','','','','x','','','x','','','x','','','CN','','x',''],
    ['5','Nguyễn Đức Phong','x','','','x','','','tx','','','x','','','x','','','','','x','','','CN'],
    ['6','Nhân viên minh họa','hc','','','P','','','N','','','','','','HB','','','','x','x','','','']
  ];
  return '<html><body><table>'+tr(2,['','BẢNG PHÂN CA',...metadata])+tr(3,['','HỌ & TÊN',...days])+tr(88,['','BỂ BƠI'])+tr(89,['','Tổ cơ điện Sân Golf',...Array(21).fill(''),'0'])+staff.map((cells,i)=>tr(91+i,cells)).join('')+'</table></body></html>';
}

async function prepare(page,{body=sourceHtml(),fail=false}={}) {
  await page.clock.install({time:new Date('2026-10-05T05:00:00Z')});
  await page.route('https://script.google.com/**',route=>route.abort());
  await page.route(SOURCE,route=>fail?route.abort():route.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));
  await page.goto('/nhatky/index.html#checklist');
}
async function login(page,id='EMP01') {
  await page.selectOption('#select-login-employee',id); await page.fill('#input-login-pin','0204'); await page.click('#btn-submit-login');
}

test('login opens Ca của tôi and reads the exact assigned employee/week',async({page})=>{
  await prepare(page); await login(page);
  await expect(page).toHaveURL(/#dashboard$/);
  await expect(page.locator('#header-title')).toHaveText('Ca của tôi');
  await expect(page.locator('#my-shift-employee')).toHaveText('Ngô Quyết Thắng');
  await expect(page.locator('#my-shift-team')).toHaveText('Tổ cơ điện Sân Golf');
  await expect(page.locator('#my-shift-today')).toContainText('Ca 1');
  await expect(page.locator('#my-shift-hours')).toContainText('06:00–14:00');
  await expect(page.locator('#my-shift-week')).toContainText('Tuần 41');
  await expect(page.locator('#my-shift-days > button')).toHaveCount(7);
  await expect(page.locator('#my-shift-sync-status')).toContainText('Đã đồng bộ');
  await expect(page.locator('#header-shift-label')).toContainText('Ca 1');
  await expect(page.locator('#my-shift-source')).toHaveAttribute('href','https://amd500.tail030e1.ts.net/shifts');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath('my-shift.png')});
});
test('source rest day differs from an unassigned cell and preserves source symbols',async({page})=>{
  await prepare(page); await login(page);
  await page.locator('#my-shift-days > button').nth(1).click();
  await expect(page.locator('#my-shift-today')).toContainText('Nghỉ tuần');
  await page.locator('#my-shift-days > button').nth(3).click();
  await expect(page.locator('#my-shift-today')).toContainText('tx');
  await page.locator('#my-shift-date').fill('2026-10-12');
  await expect(page.locator('#my-shift-today')).toContainText('Chưa có lịch');
});
test('unmatched account has no invented assignment',async({page})=>{
  await prepare(page); await login(page,'EMP05');
  await expect(page.locator('#my-shift-today')).toContainText('Chưa tìm thấy');
  await expect(page.locator('#my-shift-today')).not.toContainText('Ca 1');
});
test('refresh replaces the old assignment and failure retains it as cached data',async({page})=>{
  await prepare(page); await login(page);
  await expect(page.locator('#my-shift-today')).toContainText('Ca 1');
  await page.route(SOURCE,route=>route.fulfill({status:200,contentType:'text/html',body:sourceHtml('CN')}));
  await page.click('#my-shift-sync');
  await expect(page.locator('#my-shift-today')).toContainText('Nghỉ tuần');
  await page.route(SOURCE,route=>route.abort());
  await page.click('#my-shift-sync');
  await expect(page.locator('#my-shift-sync-status')).toContainText('bản đã lưu');
  await expect(page.locator('#my-shift-today')).toContainText('Nghỉ tuần');
});
test('network or HTML login page cannot be reported as a synchronized schedule',async({page})=>{
  await prepare(page,{body:'<html><body>Đăng nhập CMMS</body></html>'}); await login(page);
  await expect(page.locator('#my-shift-sync-status')).toContainText('Chưa đồng bộ');
  await expect(page.locator('#my-shift-today')).toContainText('Chưa đọc được');
  expect(await page.evaluate(()=>localStorage.getItem('app_my_shift_source_v1'))).toBeNull();
});
test('restored login reloads the source rather than relying on the saved shift selection',async({page})=>{
  await prepare(page); await login(page);
  await expect(page.locator('#my-shift-today')).toContainText('Ca 1');
  await page.route(SOURCE,route=>route.fulfill({status:200,contentType:'text/html',body:sourceHtml('CN')}));
  await page.reload();
  await expect(page.locator('#my-shift-today')).toContainText('Nghỉ tuần');
  await expect(page.locator('#my-shift-sync-status')).toContainText('Đã đồng bộ');
});
test('parser preserves source week dates, names and blank cells',async({page})=>{
  await prepare(page); await login(page); await expect(page.locator('#my-shift-sync-status')).toContainText('Đã đồng bộ');
  const output=await page.evaluate(html=>{
    const weeks=MyShiftSchedule.parseSourceHtml(html);
    return {week:weeks[0].startDate,names:weeks[0].members.map(m=>m.name),thang:weeks[0].members.find(m=>m.name==='Ngô Quyết Thắng').days[0]};
  },sourceHtml());
  expect(output.week).toBe(iso);expect(output.thang).toEqual(['','x','']);
});

test('switching accounts during a slow read cannot leave the previous employee on screen',async({page})=>{
  await prepare(page);
  let release;
  const gate=new Promise(resolve=>release=resolve);
  await page.route(SOURCE,async route=>{await gate;await route.fulfill({status:200,contentType:'text/html',body:sourceHtml()}).catch(()=>{});});
  await login(page);
  await page.evaluate(()=>{repo.logout();repo.login('EMP02','0204');checkAuthAndRenderScreen();});
  release();
  await expect(page.locator('#my-shift-employee')).toHaveText('Đinh Văn Hậu');
  await expect(page.locator('#my-shift-today')).toContainText('Nghỉ tuần');
  await expect(page.locator('#my-shift-sync-status')).toContainText('Đã đồng bộ');
  const cache=await page.evaluate(()=>JSON.parse(localStorage.getItem('app_my_shift_source_v1')));
  expect(cache.employeeId).toBe('EMP02');
  expect(cache.weeks[0].members.map(m=>m.name)).toEqual(['Đinh Văn Hậu']);
});

test('an unassigned day is explicit and cannot look like a rest day',async({page})=>{
  const empty=sourceHtml('');
  await prepare(page,{body:empty});await login(page);
  await expect(page.locator('#my-shift-today')).toContainText('Chưa phân công');
  await expect(page.locator('#my-shift-today')).not.toContainText('Nghỉ');
});

test('a restored session cannot show an unrelated saved shift when the source is unavailable',async({page})=>{
  await prepare(page);await login(page);
  await expect(page.locator('#my-shift-sync-status')).toContainText('Đã đồng bộ');
  await page.evaluate(()=>{localStorage.removeItem('app_my_shift_source_v1');repo.setCurrentShift('EMP01','Đêm','2026-10-04');});
  await page.route(SOURCE,route=>route.abort());
  await page.reload();
  await expect(page.locator('#my-shift-sync-status')).toContainText('Chưa đồng bộ');
  await expect(page.locator('#header-shift-label')).toHaveText('Chưa đồng bộ lịch');
});
