(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BD_PumpStatus = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ORDER = { RUNNING: 0, STOPPED: 1, UNKNOWN: 2 };

  function normalizedState(value) {
    return Object.prototype.hasOwnProperty.call(ORDER, value) ? value : 'UNKNOWN';
  }

  function counts(items) {
    const result = { total: 0, running: 0, stopped: 0, unknown: 0 };
    (items || []).forEach(item => {
      result.total += 1;
      result[normalizedState(item.state).toLowerCase()] += 1;
    });
    return result;
  }

  function prepare(items, now, staleHours) {
    const currentTime = (now instanceof Date ? now : new Date(now || Date.now())).getTime();
    const threshold = (Number(staleHours) || 12) * 60 * 60 * 1000;
    return (items || []).map(item => {
      const timestamp = item.lastEvent && item.lastEvent.timestamp;
      const eventTime = timestamp ? new Date(timestamp).getTime() : NaN;
      const ageMs = currentTime - eventTime;
      return Object.assign({}, item, {
        state: normalizedState(item.state),
        isStale: !Number.isFinite(eventTime) || ageMs < 0 || ageMs > threshold,
        ageMs: Number.isFinite(eventTime) ? ageMs : null
      });
    }).sort((a, b) => ORDER[a.state] - ORDER[b.state]
      || String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  }

  function fold(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function filter(items, options) {
    const opts = options || {};
    const state = opts.state || 'ALL';
    const query = fold(opts.query).trim();
    return (items || []).filter(item => {
      if (state !== 'ALL' && normalizedState(item.state) !== state) return false;
      return !query || fold(`${item.name || ''} ${item.source || ''} ${item.id || ''}`).includes(query);
    });
  }

  return { counts, prepare, filter };
});
