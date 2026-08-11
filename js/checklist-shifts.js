(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BD_ChecklistShifts = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const pad = value => String(value).padStart(2, '0');
  const dateString = date =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  const shift = (position, label, templateId, templateName, date) => ({
    position, label, templateId, templateName, date: dateString(date)
  });

  function context(now) {
    const hour = now.getHours();
    const calendarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

    if (hour >= 5 && hour < 13) {
      return {
        previous: shift('previous', 'Ca trước', 'ca_toi', 'Ca Tối', addDays(calendarDate, -1)),
        current: shift('current', 'Ca hiện tại', 'ca_sang', 'Ca Sáng', calendarDate)
      };
    }

    const businessDate = hour < 5 ? addDays(calendarDate, -1) : calendarDate;
    return {
      previous: shift('previous', 'Ca trước', 'ca_sang', 'Ca Sáng', businessDate),
      current: shift('current', 'Ca hiện tại', 'ca_toi', 'Ca Tối', businessDate)
    };
  }

  function adjacent(now) {
    const hour = now.getHours();
    const calendarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

    if (hour >= 5 && hour < 13) {
      return [
        { position: 'previous', label: 'Ca liền trước', templateId: 'ca_toi',
          templateName: 'Ca Tối', date: dateString(addDays(calendarDate, -1)) },
        { position: 'next', label: 'Ca liền sau', templateId: 'ca_toi',
          templateName: 'Ca Tối', date: dateString(calendarDate) }
      ];
    }

    const businessDate = hour < 5 ? addDays(calendarDate, -1) : calendarDate;
    return [
      { position: 'previous', label: 'Ca liền trước', templateId: 'ca_sang',
        templateName: 'Ca Sáng', date: dateString(businessDate) },
      { position: 'next', label: 'Ca liền sau', templateId: 'ca_sang',
        templateName: 'Ca Sáng', date: dateString(addDays(businessDate, 1)) }
    ];
  }

  const query = shift =>
    `shift=${encodeURIComponent(shift.templateId)}&date=${encodeURIComponent(shift.date)}`;

  function countIssues(value) {
    if (!value || typeof value !== 'object') return 0;
    if (value.status === 'ng') return 1;
    return Object.values(value).reduce((total, child) => total + countIssues(child), 0);
  }

  function summarizePreviousRun(runs, previousShift, loadState) {
    if (loadState === 'loading' || loadState === 'idle') {
      return { kind: 'loading', headline: 'Đang lấy bàn giao ca trước…', detail: '' };
    }
    if (loadState === 'error') {
      return {
        kind: 'error',
        headline: 'Chưa tải được bàn giao',
        detail: 'Vẫn có thể mở checklist hiện tại; hệ thống sẽ kiểm tra bàn giao ở bước tiếp theo.'
      };
    }

    const matching = (Array.isArray(runs) ? runs : [])
      .filter(run => run && run.templateId === previousShift.templateId && run.date === previousShift.date)
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    const run = matching[0];
    if (!run) {
      return {
        kind: 'empty',
        headline: 'Chưa có bàn giao từ ca trước',
        detail: 'Kiểm tra lại với người trực ca trước nếu cần.'
      };
    }

    let items = run.itemsObj || run.items || {};
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (_) { items = {}; }
    }
    return {
      kind: 'ready',
      status: run.status || '',
      issueCount: countIssues(items),
      operator: run.operator || '',
      submittedAt: run.submittedAt || '',
      handoverNote: run.handoverNote || '',
      run
    };
  }

  return {
    adjacent,
    context,
    summarizePreviousRun,
    golfUrl: shift => `#checklist/golf?autoTemplate=${encodeURIComponent(shift.templateId)}&date=${encodeURIComponent(shift.date)}`,
    pumpUrl: shift => `../pump_info.html?autoCheck=1&${query(shift)}`
  };
});
