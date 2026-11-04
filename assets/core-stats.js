/* 研途 408 · 统计与汇总 */
(function () {
  'use strict';

  const A = window.YTApp;
  const START = A.START, PLAN_END = A.PLAN_END, EXAM = A.EXAM;
  const addDays = A.addDays, weekday = A.weekday, activeToday = A.activeToday;

  function dateRange(a, b, fn) {
    let d = a;
    while (d <= b) {
      fn(d);
      d = addDays(d, 1);
    }
  }

  function subjectStats() {
    const today = activeToday();
    const rows = A.SUBJECT_ORDER.map(function (key) {
      return { key: key, name: A.SUBJECTS[key].name, color: A.SUBJECTS[key].color, bg: A.SUBJECTS[key].bg, total: 0, done: 0, minutes: 0, plannedMinutes: 0 };
    });
    dateRange(START, today, function (k) {
      const day = A.getDay(k);
      day.tasks.forEach(function (t) {
        const row = rows.find(function (r) { return r.key === t.subject; });
        if (!row) return;
        if (t.core) {
          row.total++;
          if (A.isChecked(t.id)) row.done++;
          row.plannedMinutes += t.minutes;
        }
        if (A.isChecked(t.id)) row.minutes += t.minutes;
      });
    });
    return rows.filter(function (r) { return r.total > 0 || r.minutes > 0; }).map(function (r) {
      r.percent = r.total ? Math.round(r.done / r.total * 100) : 0;
      return r;
    });
  }

  function weekSummary(today) {
    const offset = (weekday(today) + 6) % 7;
    const monday = addDays(today, -offset);
    let total = 0, done = 0, minutes = 0;
    for (let i = 0; i < 7; i++) {
      const k = addDays(monday, i);
      if (k < START || k > PLAN_END) continue;
      const day = A.getDay(k);
      const core = day.tasks.filter(function (t) { return t.core; });
      total += core.length;
      core.forEach(function (t) { if (A.isChecked(t.id)) done++; });
      minutes += day.tasks.reduce(function (s, t) { return s + (A.isChecked(t.id) ? t.minutes : 0); }, 0);
    }
    return { monday: monday, total: total, done: done, minutes: minutes, percent: total ? Math.round(done / total * 100) : 0 };
  }

  function overallStats() {
    const today = activeToday();
    const totalDays = A.diff(START, A.PLAN_END) + 1;
    const elapsed = Math.max(0, A.diff(START, today) + 1);
    let passedDays = 0, minutes = 0, checked = 0, plannedTasks = 0;
    dateRange(START, today, function (k) {
      const day = A.getDay(k);
      if (A.isPassedDay(day)) passedDays++;
      day.tasks.forEach(function (t) {
        plannedTasks++;
        if (A.isChecked(t.id)) { checked++; minutes += t.minutes; }
      });
    });
    const todayDay = A.getDay(today);
    const todayStats = A.dayStats(todayDay);
    const streak = A.streakInfo();
    const week = weekSummary(today);
    return {
      today: today, todayDay: todayDay, todayStats: todayStats,
      totalDays: totalDays, elapsed: elapsed, passedDays: passedDays,
      minutes: minutes, checked: checked, plannedTasks: plannedTasks,
      streak: streak, week: week,
      dayPercent: Math.round(elapsed / totalDays * 100)
    };
  }

  function monthlyStats() {
    const today = activeToday();
    const start = A.parse(START);
    const end = A.parse(PLAN_END);
    const months = [];
    let y = start.getUTCFullYear(), m = start.getUTCMonth();
    while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
      const key = y + '-' + A.pad(m + 1);
      months.push({ key: key, label: String(y).slice(2) + '.' + A.pad(m + 1), year: y, month: m, doneMinutes: 0, plannedMinutes: 0 });
      m++;
      if (m === 12) { m = 0; y++; }
    }
    dateRange(START, PLAN_END, function (k) {
      const monthKey = k.slice(0, 7);
      const row = months.find(function (x) { return x.key === monthKey; });
      if (!row) return;
      const day = A.getDay(k);
      row.plannedMinutes += day.totalMinutes;
      if (k <= today) row.doneMinutes += day.tasks.reduce(function (s, t) { return s + (A.isChecked(t.id) ? t.minutes : 0); }, 0);
    });
    const max = Math.max.apply(null, months.map(function (x) { return x.plannedMinutes; }).concat([1]));
    months.forEach(function (x) {
      x.donePercent = max ? x.doneMinutes / max * 100 : 0;
      x.planPercent = max ? x.plannedMinutes / max * 100 : 0;
    });
    return months;
  }

  let planCache = null;
  function planTotals() {
    if (planCache) return planCache;
    let minutes = 0, tasks = 0, restFull = 0, restLight = 0, days = 0;
    dateRange(START, PLAN_END, function (k) {
      const day = A.getDay(k);
      days++;
      minutes += day.totalMinutes;
      tasks += day.tasks.length;
      if (day.rest === 'full') restFull++;
      if (day.rest === 'light' || day.kind === 'pre') restLight++;
    });
    planCache = {
      days: days, weeks: 60, hours: Math.round(minutes / 60), minutes: minutes,
      tasks: tasks, restFull: restFull, restLight: restLight
    };
    return planCache;
  }

  function countdown() {
    const t = A.localToday();
    return Math.max(0, A.diff(t, EXAM));
  }

  function prepDay() {
    const t = A.localToday();
    return Math.max(1, Math.min(A.diff(START, EXAM) + 1, A.diff(START, t) + 1));
  }

  function pomoTotals() {
    const days = (A.getState().pomo && A.getState().pomo.days) || {};
    let sessions = 0, minutes = 0;
    Object.keys(days).forEach(function (k) {
      sessions += Math.max(0, days[k].sessions || 0);
      minutes += Math.max(0, days[k].minutes || 0);
    });
    const today = activeToday();
    const t = days[today] || { sessions: 0, minutes: 0 };
    return {
      sessions: sessions,
      minutes: minutes,
      todaySessions: Math.max(0, t.sessions || 0),
      todayMinutes: Math.max(0, t.minutes || 0)
    };
  }

  A.subjectStats = subjectStats;
  A.overallStats = overallStats;
  A.monthlyStats = monthlyStats;
  A.planTotals = planTotals;
  A.countdown = countdown;
  A.prepDay = prepDay;
  A.weekSummary = weekSummary;
  A.dateRange = dateRange;
  A.pomoTotals = pomoTotals;
})();
