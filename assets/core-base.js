/* 研途 408 · 基础数据与状态 */
(function () {
  'use strict';

  const YT = window.YT;
  const RAW = window.YT_WEEKS || [];
  const PHASES = YT.phases;
  const PHASE_BY_ID = Object.fromEntries(PHASES.map(function (p) { return [p.id, p]; }));
  const SUBJECTS = YT.subjects;
  const SUBJECT_ORDER = ['math', 'c408', 'english', 'cet', 'politics', 'algo', 'review'];
  const MS = 86400000;
  const START = YT.start;
  const PLAN_END = YT.planEnd;
  const EXAM = YT.examDate;
  const EXAM_DATES = YT.examDates;
  const FIRST_MONDAY = '2026-11-02';

  const WEEKS = RAW.map(function (r) {
    return {
      no: r[0], phase: r[1], theme: r[2], math: r[3],
      a: { name: r[4], topic: r[5] },
      b: { name: r[6], topic: r[7] },
      eng: r[8], cet: r[9], algo: r[10], pol: r[11], note: r[12]
    };
  });
  if (WEEKS.length !== 60) console.warn('[研途408] 周计划数量异常：', WEEKS.length);

  const FULL_EXTRA = new Set([
    '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-02-10',
    '2027-06-20', '2027-10-01'
  ]);
  const LIGHT_EXTRA = new Set(['2027-01-01', '2027-02-11', '2027-05-01', '2027-10-02', '2027-10-03']);
  const EVENTS = {
    '2026-12-19': { type: 'cet', title: '六级考试 · 第一次' },
    '2027-06-19': { type: 'cet', title: '六级考试 · 主目标' },
    '2027-12-24': { type: 'pre', title: '考前准备日' },
    '2027-12-25': { type: 'exam', title: '初试第一天' },
    '2027-12-26': { type: 'exam', title: '初试第二天' }
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function parse(k) {
    const p = k.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function toKey(d) {
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function addDays(k, n) { return toKey(new Date(parse(k).getTime() + n * MS)); }
  function diff(a, b) { return Math.round((parse(b).getTime() - parse(a).getTime()) / MS); }
  function weekday(k) { return parse(k).getUTCDay(); }
  function localToday() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function activeToday() {
    const t = localToday();
    if (t < START) return START;
    if (t > PLAN_END) return PLAN_END;
    return t;
  }
  function isLastSunday(k) {
    if (weekday(k) !== 0) return false;
    const d = parse(k);
    return parse(addDays(k, 7)).getUTCMonth() !== d.getUTCMonth();
  }
  function isFullRest(k) {
    if (EXAM_DATES.indexOf(k) >= 0) return false;
    if (FULL_EXTRA.has(k)) return true;
    return isLastSunday(k);
  }
  function isLightRest(k) {
    if (isFullRest(k) || EVENTS[k]) return false;
    if (LIGHT_EXTRA.has(k)) return true;
    return weekday(k) === 0;
  }
  function weekNo(k) {
    const n = Math.floor(diff(FIRST_MONDAY, k) / 7) + 1;
    return n >= 1 && n <= WEEKS.length ? n : 0;
  }
  function weekFor(k) {
    const n = weekNo(k);
    return n ? WEEKS[n - 1] : null;
  }
  function phaseFor(k) {
    const w = weekFor(k);
    return w ? PHASE_BY_ID[w.phase] : null;
  }
  function fmtDuration(m) {
    m = Math.max(0, Math.round(m || 0));
    if (m < 60) return m + ' 分钟';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' 小时' + (r ? ' ' + r + ' 分' : '');
  }
  function fmtHours(m) {
    const h = (m || 0) / 60;
    return h >= 100 ? Math.round(h) : Math.round(h * 10) / 10;
  }
  function fmtDate(k, opt) {
    const d = parse(k);
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getUTCDay()];
    opt = opt || {};
    if (opt.short) return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日';
    return d.getUTCFullYear() + ' 年 ' + (d.getUTCMonth() + 1) + ' 月 ' + d.getUTCDate() + ' 日 · ' + wd;
  }
  function fmtDateDot(k) {
    const d = parse(k);
    return d.getUTCFullYear() + '.' + pad(d.getUTCMonth() + 1) + '.' + pad(d.getUTCDate());
  }

  const STORE = 'yantu408.state.v1';
  let state = { checks: {}, theme: 'light' };
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.checks && typeof parsed.checks === 'object') {
        state.checks = parsed.checks;
      }
      if (parsed && parsed.theme) state.theme = parsed.theme;
    }
  } catch (e) { console.warn('[研途408] 读取进度失败', e); }

  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { console.warn(e); }
  }
  function isChecked(id) { return !!state.checks[id]; }
  function toggleTask(id, on) {
    if (on) state.checks[id] = true; else delete state.checks[id];
    saveState();
  }
  function setTheme(theme) { state.theme = theme; saveState(); }
  function resetData() { state.checks = {}; saveState(); }
  function exportJSON() {
    return JSON.stringify({
      app: 'yantu408', version: 1,
      exportedAt: new Date().toISOString(),
      state: { checks: state.checks }
    }, null, 2);
  }
  function importJSON(text) {
    const parsed = JSON.parse(text);
    const checks = parsed && parsed.state && parsed.state.checks
      ? parsed.state.checks
      : parsed && parsed.checks ? parsed.checks : null;
    if (!checks || typeof checks !== 'object') throw new Error('文件格式不正确');
    const clean = {};
    Object.keys(checks).forEach(function (k) { if (checks[k]) clean[k] = true; });
    state.checks = clean;
    saveState();
    return Object.keys(clean).length;
  }

  window.YTApp = {
    YT: YT, WEEKS: WEEKS, PHASES: PHASES, PHASE_BY_ID: PHASE_BY_ID,
    SUBJECTS: SUBJECTS, SUBJECT_ORDER: SUBJECT_ORDER,
    START: START, PLAN_END: PLAN_END, EXAM: EXAM, EXAM_DATES: EXAM_DATES,
    EVENTS: EVENTS, FULL_EXTRA: FULL_EXTRA, LIGHT_EXTRA: LIGHT_EXTRA,
    pad: pad, parse: parse, toKey: toKey, addDays: addDays, diff: diff,
    weekday: weekday, localToday: localToday, activeToday: activeToday,
    isLastSunday: isLastSunday, isFullRest: isFullRest, isLightRest: isLightRest,
    weekNo: weekNo, weekFor: weekFor, phaseFor: phaseFor,
    fmtDuration: fmtDuration, fmtHours: fmtHours, fmtDate: fmtDate, fmtDateDot: fmtDateDot,
    isChecked: isChecked, toggleTask: toggleTask, setTheme: setTheme,
    resetData: resetData, exportJSON: exportJSON, importJSON: importJSON,
    getState: function () { return state; },
    saveState: saveState
  };
})();
