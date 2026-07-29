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

  return {
    adjacent,
    golfUrl: shift => `../sangolf/index.html?autoTemplate=${encodeURIComponent(shift.templateId)}&date=${encodeURIComponent(shift.date)}`,
    pumpUrl: shift => `../pump_info.html?autoCheck=1&${query(shift)}`
  };
});

