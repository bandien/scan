(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MyShiftSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SOURCE_URL = 'https://amd500.tail030e1.ts.net/shifts';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1d_dbPMeToPfP86rRJVoB_BF15J4xh912jVfcjcagxXs/htmlview/sheet?headers=true&gid=36044768';
  const CACHE_KEY = 'app_my_shift_source_v1';
  // Preserve the slot order shown by the CMMS shifts page, including its raw codes.
  const SLOTS = [
    { id: 'ca3', label: 'Ca 3', time: '22:00–06:00', start: 1320, end: 1800 },
    { id: 'ca1', label: 'Ca 1', time: '06:00–14:00', start: 360, end: 840 },
    { id: 'ca2', label: 'Ca 2', time: '14:00–22:00', start: 840, end: 1320 }
  ];
  const OTHER_CODES = {
    cn: ['rest', 'Nghỉ tuần (CN)'],
    p: ['leave', 'Nghỉ phép (P)'],
    kl: ['leave', 'Nghỉ không lương (KL)'],
    n: ['rest', 'Nghỉ việc / Nghỉ (N)'],
    hb: ['other', 'Lịch HC Hòa Bình 7h00–11h30 & 13h30–17h00 (HB)']
  };

  function normalizeName(value) {
    return String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
  }
  function vietnamParts(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    return Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  }
  function vietnamDate(now = new Date()) {
    const p = vietnamParts(now);
    return `${p.year}-${p.month}-${p.day}`;
  }
  function addDays(isoDate, days) {
    const date = new Date(isoDate + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
  function parseDate(text) {
    const match = String(text).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    const date = new Date(iso + 'T12:00:00Z');
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === iso ? iso : null;
  }
  function displayDate(iso) {
    return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  }
  function expandedCells(row) {
    const values = [];
    for (const cell of row.children) {
      if (cell.tagName !== 'TD' || cell.classList.contains('freezebar-cell')) continue;
      const span = Math.max(1, Math.min(2000, Number(cell.getAttribute('colspan')) || 1));
      values.push(cell.textContent.trim().replace(/\s+/g, ' '));
      for (let i = 1; i < span; i++) values.push('');
    }
    return values;
  }
  function parseSourceHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr')).map(row => {
      const header = Array.from(row.children).find(cell => cell.tagName === 'TH' && /^36044768R\d+$/.test(cell.id));
      return header ? { number: Number(header.id.match(/R(\d+)$/)[1]) + 1, cells: expandedCells(row) } : null;
    }).filter(Boolean);
    const metadata = rows.find(row => row.number === 2)?.cells;
    const dayHeaders = rows.find(row => row.number === 3)?.cells;
    if (!metadata || !dayHeaders) throw new Error('Nguồn chưa trả về bảng phân ca hợp lệ.');
    const weeks = [];
    dayHeaders.forEach((label, column) => {
      const dayMatch = label.match(/^Thứ\s+Hai\s+(\d+)\s*\/\s*(\d+)/i);
      if (!dayMatch) return;
      const dates = metadata.slice(column, column + 21).map(parseDate).filter(Boolean);
      const startDate = dates.find(date => Number(date.slice(8)) === Number(dayMatch[1]) && Number(date.slice(5, 7)) === Number(dayMatch[2]));
      if (!startDate || !dates.includes(addDays(startDate, 6)) || new Date(startDate + 'T12:00:00Z').getUTCDay() !== 1) return;
      const validDays = Array.from({ length: 7 }, (_, day) => {
        const date = addDays(startDate, day);
        const match = (dayHeaders[column + day * 3] || '').match(/(\d+)\s*\/\s*(\d+)/);
        return match && Number(match[1]) === Number(date.slice(8)) && Number(match[2]) === Number(date.slice(5, 7));
      }).every(Boolean);
      if (!validDays) return;
      const weekLabel = metadata.slice(column, column + 21).find(value => /^\d{1,2}$/.test(value)) || '';
      let team = '';
      const members = [];
      for (const row of rows.filter(r => r.number > 4)) {
        const [stt, name] = row.cells;
        if (!name) continue;
        // Summary columns after the roster may contain totals on team heading rows.
        if (!stt && !row.cells.slice(column, column + 21).some(Boolean)) { team = name; continue; }
        if (!/^\d+$/.test(stt || '')) continue;
        members.push({ name, team, days: Array.from({ length: 7 }, (_, day) => Array.from({ length: 3 }, (_, slot) => row.cells[column + day * 3 + slot] || '')) });
      }
      if (members.length) weeks.push({ startDate, endDate: addDays(startDate, 6), weekLabel, members });
    });
    if (!weeks.length) throw new Error('Nguồn chưa có tuần phân ca hợp lệ.');
    return weeks;
  }
  function findMember(week, name) {
    const candidates = week.members.filter(member => normalizeName(member.name) === normalizeName(name));
    const preferred = candidates.filter(member => normalizeName(member.team) === normalizeName('Tổ cơ điện Sân Golf'));
    const matches = preferred.length ? preferred : candidates;
    if (matches.length > 1) throw new Error('Tên nhân viên bị trùng trong nguồn phân ca; cần đối chiếu với người phụ trách.');
    return matches[0] || null;
  }
  function describeDay(cells = []) {
    const codes = Array.from({ length: 3 }, (_, i) => String(cells[i] || '').trim());
    const assignments = [];
    const notes = [];
    const kinds = [];
    codes.forEach((code, slot) => {
      if (!code || code === '·' || code === '—') return;
      const key = normalizeName(code);
      if (key === 'x' || key === 'tx') assignments.push({ ...SLOTS[slot], code, ...(key === 'tx' ? { time: '06:00–10:00 & 14:00–18:00' } : {}) });
      else if (key === 'hc') { assignments.push({ id: 'hc', label: 'Hành chính', time: '07:30–11:30 & 13:00–17:00', code }); kinds.push('administrative'); }
      else if (OTHER_CODES[key]) { kinds.push(OTHER_CODES[key][0]); notes.push(OTHER_CODES[key][1]); }
      else if (key === 'nghỉ việc') { kinds.push('inactive'); notes.push('Nghỉ việc theo nguồn'); }
      else { kinds.push('other'); notes.push('Ký hiệu ' + code); }
    });
    const kind = assignments.some(a => a.id !== 'hc') ? 'working' : kinds[0] || 'unassigned';
    return { kind, assignments, notes, codes, label: assignments.length ? assignments.map(a => a.label + (normalizeName(a.code) === 'tx' ? ' (tx)' : '')).join(' · ') : notes.join(' · ') || 'Chưa phân công' };
  }
  function dayFor(weeks, name, date) {
    const week = weeks.find(w => w.startDate <= date && date <= w.endDate);
    if (!week) return { kind: 'unpublished', date };
    const member = findMember(week, name);
    if (!member) return { kind: 'unmatched', week, date };
    const index = Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(week.startDate + 'T12:00:00Z')) / 86400000);
    return { ...describeDay(member.days[index]), date, week, member };
  }
  function selectCurrent(weeks, name, now = new Date()) {
    const today = vietnamDate(now);
    const p = vietnamParts(now);
    const minute = Number(p.hour) * 60 + Number(p.minute);
    if (minute < 360) {
      const previous = dayFor(weeks, name, addDays(today, -1));
      const overnight = previous.assignments?.find(a => a.id === 'ca3');
      if (overnight) return { ...previous, assignment: overnight, overnight: true };
    }
    const current = dayFor(weeks, name, today);
    const ordered = (current.assignments || []).slice().sort((a, b) => (a.start || 0) - (b.start || 0));
    const assignment = ordered.find(a => a.start <= minute && minute < a.end) || ordered.find(a => a.start > minute) || ordered.at(-1);
    return { ...current, assignment: assignment || null, overnight: false };
  }
  function validCache(cache, user) {
    return cache?.version === 1 && cache.employeeId === user?.id && cache.employeeName === user?.fullName && Number.isFinite(Date.parse(cache.fetchedAt)) && Array.isArray(cache.weeks) && cache.weeks.length > 0 && cache.weeks.every(week => /^\d{4}-\d{2}-\d{2}$/.test(week.startDate) && addDays(week.startDate, 6) === week.endDate && Array.isArray(week.members) && week.members.every(member => typeof member.name === 'string' && typeof member.team === 'string' && member.days.length === 7 && member.days.every(day => day.length === 3 && day.every(code => typeof code === 'string'))));
  }

  function convertGolfGridToWeeks(loader) {
    if (!loader || !loader.grid || loader.grid.length < 4) return [];
    const baseMonday = loader.viewingMonday || new Date();
    const mondays = [-2, -1, 0, 1, 2].map(offset => {
      const m = new Date(baseMonday);
      const day = m.getDay();
      const diff = m.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
      m.setDate(diff);
      m.setHours(0, 0, 0, 0);
      return m;
    });

    const parsedWeeks = [];
    for (const mon of mondays) {
      const weekInfo = loader.getWeekInfo(mon);
      if (!weekInfo || !weekInfo.teams || !weekInfo.teams.length) continue;
      const startDate = vietnamDate(mon);
      const endDate = addDays(startDate, 6);
      const weekLabel = String(weekInfo.weekNum || '');
      const members = [];
      weekInfo.teams.forEach(team => {
        team.staff.forEach(s => {
          const days = [];
          for (let d = 0; d < 7; d++) {
            days.push([
              s.shifts[d * 3 + 0] || '',
              s.shifts[d * 3 + 1] || '',
              s.shifts[d * 3 + 2] || ''
            ]);
          }
          members.push({
            name: s.name,
            team: team.name,
            days
          });
        });
      });
      if (members.length) {
        parsedWeeks.push({ startDate, endDate, weekLabel, members });
      }
    }
    return parsedWeeks;
  }

  function createController({ getUser, onSelection }) {
    let weeks = [];
    let fetchedAt = '';
    let viewingDate = vietnamDate();
    let owner = '';
    let generation = 0;
    let pending = null;
    let controller = null;
    let initialized = false;
    let followToday = true;
    let lastAttempt = 0;
    let syncState = 'empty';
    let syncError = '';
    let selectionSignature = '';
    const el = id => document.getElementById(id);
    const userKey = user => user ? `${user.id}:${user.fullName}` : '';
    const text = (id, value) => { const target = el(id); if (target) target.textContent = value; };
    const formatSyncTime = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

    function initialize() {
      if (initialized) return;
      initialized = true;
      el('my-shift-sync').addEventListener('click', () => refresh(true));
      el('my-shift-date').addEventListener('change', e => {
        const value = e.target.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        viewingDate = value; followToday = value === vietnamDate(); render();
      });
      el('my-shift-today-button').addEventListener('click', () => { viewingDate = vietnamDate(); followToday = true; render(); });
      setInterval(() => { if (getUser() && document.visibilityState === 'visible') render(); }, 60000);
      setInterval(() => { if (getUser() && document.visibilityState === 'visible') refresh(); }, 300000);
      document.addEventListener('visibilitychange', () => { if (getUser() && document.visibilityState === 'visible') { render(); refresh(); } });
    }
    function activate() {
      initialize();
      const user = getUser();
      if (!user) {
        generation++; controller?.abort(); owner = ''; weeks = []; fetchedAt = ''; pending = null; selectionSignature = ''; return;
      }
      const key = userKey(user);
      if (owner !== key) {
        generation++; controller?.abort(); pending = null; owner = key; weeks = []; fetchedAt = ''; syncState = 'empty'; viewingDate = vietnamDate(); followToday = true; selectionSignature = '';
        try {
          const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
          if (validCache(cache, user)) { weeks = cache.weeks; fetchedAt = cache.fetchedAt; syncState = 'cached'; }
        } catch (_) {}
        if (!weeks.length && typeof GolfRootSheetLoader !== 'undefined' && GolfRootSheetLoader.grid && GolfRootSheetLoader.grid.length > 3) {
          try {
            const rootWeeks = convertGolfGridToWeeks(GolfRootSheetLoader);
            if (rootWeeks && rootWeeks.length) {
              weeks = rootWeeks;
              fetchedAt = GolfRootSheetLoader.lastSyncTime ? new Date(GolfRootSheetLoader.lastSyncTime).toISOString() : new Date().toISOString();
              syncState = 'synced';
            }
          } catch (_) {}
        }
        render(); refresh(true);
      } else render();
    }
    async function refresh(force = false) {
      const user = getUser();
      if (!user) return;
      if (owner !== userKey(user)) { activate(); return; }
      if (pending || (!force && Date.now() - lastAttempt < 30000)) return pending;
      const currentGeneration = generation;
      const key = owner;
      controller = new AbortController();
      const requestController = controller;
      lastAttempt = Date.now(); syncState = 'loading'; syncError = ''; render();
      const timeout = setTimeout(() => requestController.abort(), 15000);
      pending = (async () => {
        try {
          const response = await fetch(SHEET_URL, { credentials: 'omit', cache: 'no-store', signal: requestController.signal });
          if (!response.ok) throw new Error('Không thể đọc lịch phân ca.');
          const parsed = parseSourceHtml(await response.text());
          if (currentGeneration !== generation || key !== userKey(getUser())) return;
          weeks = parsed;
          fetchedAt = new Date().toISOString(); syncState = 'synced';
          const personalWeeks = weeks.map(week => ({ ...week, members: week.members.filter(member => normalizeName(member.name) === normalizeName(user.fullName)) }));
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ version: 1, employeeId: user.id, employeeName: user.fullName, fetchedAt, weeks: personalWeeks })); } catch (_) {}
        } catch (error) {
          if (typeof GolfRootSheetLoader !== 'undefined') {
            try {
              if (!GolfRootSheetLoader.grid) {
                await GolfRootSheetLoader.fetchLive();
              }
              if (GolfRootSheetLoader.grid && GolfRootSheetLoader.grid.length > 3) {
                const rootWeeks = convertGolfGridToWeeks(GolfRootSheetLoader);
                if (rootWeeks && rootWeeks.length) {
                  if (currentGeneration !== generation || key !== userKey(getUser())) return;
                  weeks = rootWeeks;
                  fetchedAt = GolfRootSheetLoader.lastSyncTime ? new Date(GolfRootSheetLoader.lastSyncTime).toISOString() : new Date().toISOString();
                  syncState = 'synced';
                  const personalWeeks = weeks.map(week => ({ ...week, members: week.members.filter(member => normalizeName(member.name) === normalizeName(user.fullName)) }));
                  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ version: 1, employeeId: user.id, employeeName: user.fullName, fetchedAt, weeks: personalWeeks })); } catch (_) {}
                  return;
                }
              }
            } catch (_) {}
          }
          if (currentGeneration !== generation || key !== userKey(getUser())) return;
          syncState = weeks.length ? 'cached' : 'error';
          syncError = error.name === 'AbortError' ? 'Kết nối quá thời gian chờ.' : 'Không đọc được nguồn phân ca.';
        } finally {
          clearTimeout(timeout);
          if (currentGeneration === generation) { pending = null; render(); }
        }
      })();
      return pending;
    }
    function render() {
      const user = getUser();
      if (!user || owner !== userKey(user)) return;
      if (followToday) viewingDate = vietnamDate();
      text('my-shift-employee', user.fullName);
      el('my-shift-date').value = viewingDate;
      text('my-shift-date-label', (viewingDate === vietnamDate() ? 'Hôm nay · ' : 'Ngày xem · ') + displayDate(viewingDate));
      const status = syncState === 'loading' ? 'Đang đọc lịch phân ca…' : syncState === 'synced' ? 'Đã đồng bộ · ' + formatSyncTime(fetchedAt) : syncState === 'cached' ? 'Đang dùng bản đã lưu · ' + formatSyncTime(fetchedAt) + (syncError ? ' · ' + syncError : ' · Đang chờ đồng bộ') : 'Chưa đồng bộ · ' + (syncError || 'Đang chờ đọc lịch');
      text('my-shift-sync-status', status);
      el('my-shift-sync').disabled = syncState === 'loading';
      const week = weeks.find(w => w.startDate <= viewingDate && viewingDate <= w.endDate);
      text('my-shift-week', week ? `Tuần ${week.weekLabel} · ${displayDate(week.startDate)}–${displayDate(week.endDate)}` : 'Lịch trong tuần');
      const container = el('my-shift-days');
      container.replaceChildren();
      let selection;
      try {
        selection = weeks.length ? (followToday ? selectCurrent(weeks, user.fullName) : dayFor(weeks, user.fullName, viewingDate)) : { kind: 'unavailable' };
        const member = week && findMember(week, user.fullName);
        if (week && member) {
          ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((label, day) => {
            const date = addDays(week.startDate, day);
            const description = describeDay(member.days[day]);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'my-shift-day';
            button.setAttribute('aria-pressed', String(date === viewingDate));
            button.setAttribute('aria-label', label + ' ' + displayDate(date) + ': ' + description.label);
            for (const [className, value] of [['my-shift-day-date', label + ' · ' + date.slice(8, 10) + '/' + date.slice(5, 7)], ['my-shift-day-assignment', description.label]]) {
              const span = document.createElement('span'); span.className = className; span.textContent = value; button.appendChild(span);
            }
            button.addEventListener('click', () => { viewingDate = date; followToday = date === vietnamDate(); render(); });
            container.appendChild(button);
          });
        }
        const messages = {
          unavailable: 'Chưa đọc được lịch phân ca. Bấm Đồng bộ lịch để thử lại.',
          unpublished: 'Chưa có lịch phân ca cho tuần này trong nguồn.',
          unmatched: 'Chưa tìm thấy tên tài khoản trong bảng phân ca. Cần đối chiếu với người phụ trách.',
          unassigned: 'Chưa phân công ca trong ngày này.'
        };
        text('my-shift-today', messages[selection.kind] || selection.label);
        text('my-shift-team', selection.member?.team || 'Theo tài khoản đang đăng nhập');
        text('my-shift-hours', (selection.assignments || []).map(a => `${a.label}: ${a.time}${normalizeName(a.code) === 'tx' ? ' · ký hiệu tx' : ''}`).join(' / '));
        text('my-shift-notes', selection.overnight ? `Đang trong Ca 3 bắt đầu ngày ${displayDate(selection.date)}, kết thúc lúc 06:00 hôm nay.` : (selection.notes || []).join(' · '));
        const current = weeks.length ? selectCurrent(weeks, user.fullName) : { kind: 'unavailable', date: vietnamDate(), label: syncState === 'loading' ? 'Đang đọc lịch phân ca' : 'Chưa đồng bộ lịch' };
        const signature = [user.id, syncState, current.date, current.kind, current.assignment?.id, current.assignment?.code, current.label].join('|');
        if (signature !== selectionSignature) { selectionSignature = signature; onSelection({ ...current, sourceState: syncState }); }
      } catch (error) {
        text('my-shift-today', error.message); text('my-shift-hours', ''); text('my-shift-notes', ''); text('my-shift-team', 'Cần đối chiếu nguồn phân ca');
        onSelection({ kind: 'unavailable', date: vietnamDate(), label: 'Cần đối chiếu lịch phân ca', sourceState: syncState });
      }
    }
    return { activate, refresh, render };
  }
  return { SOURCE_URL, SHEET_URL, parseSourceHtml, normalizeName, vietnamDate, addDays, findMember, describeDay, dayFor, selectCurrent, convertGolfGridToWeeks, createController };
});
