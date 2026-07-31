(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BD_ChecklistSchedule = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const TEMPLATE_ICONS = {
    ca_sang: '☀️',
    ca_toi: '🌙',
    ca_dem: '🌃',
    tuan: '📅',
    thang: '📊',
    default: '📋'
  };

  function getTemplateIcon(templateId) {
    if (!templateId) return TEMPLATE_ICONS.default;
    return TEMPLATE_ICONS[templateId] || TEMPLATE_ICONS.default;
  }

  function addDays(dateStr, days) {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function resolveDisplayCards(scheduleData, options) {
    if (!Array.isArray(scheduleData)) return [];
    return scheduleData.map(item => {
      const icon = getTemplateIcon(item.templateId);
      const isDue = Boolean(item.matchesDate && item.inWindow);
      return {
        ...item,
        icon,
        isDue
      };
    });
  }

  function getHandoverPairFor(templateId, defs, currentBusinessDate) {
    const date = currentBusinessDate || new Date().toISOString().slice(0, 10);
    if (!Array.isArray(defs) || defs.length === 0) {
      if (templateId === 'ca_sang') {
        return { targetTemplateId: 'ca_toi', targetBusinessDate: date };
      }
      return { targetTemplateId: 'ca_sang', targetBusinessDate: addDays(date, 1) };
    }

    const dailyDefs = defs.filter(d => (d.frequency === 'daily' || !d.frequency) && d.active !== false);
    if (dailyDefs.length === 0) {
      return { targetTemplateId: 'ca_sang', targetBusinessDate: addDays(date, 1) };
    }

    dailyDefs.sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));
    const idx = dailyDefs.findIndex(d => d.templateId === templateId);

    if (idx !== -1) {
      if (idx < dailyDefs.length - 1) {
        return {
          targetTemplateId: dailyDefs[idx + 1].templateId,
          targetBusinessDate: date
        };
      } else {
        return {
          targetTemplateId: dailyDefs[0].templateId,
          targetBusinessDate: addDays(date, 1)
        };
      }
    }

    return { targetTemplateId: 'ca_sang', targetBusinessDate: addDays(date, 1) };
  }

  return {
    TEMPLATE_ICONS,
    getTemplateIcon,
    resolveDisplayCards,
    getHandoverPairFor
  };
});
