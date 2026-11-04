/* 研途 408 · 日历视图 */
(function () {
  'use strict';

  const A = window.YTApp;
  const UI = window.YTUI;

  function isSameMonth(a, b) {
    const da = A.parse(a), db = A.parse(b);
    return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth();
  }

  function monthBounds(cursor) {
    const d = A.parse(cursor);
    const first = A.toKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const last = A.toKey(new Date(next.getTime() - 86400000));
    return { first: first, last: last };
  }

  function clampCursor(k) {
    const min = UI.firstOfMonth(A.START);
    const max = UI.firstOfMonth(A.PLAN_END);
    if (k < min) return min;
    if (k > max) return max;
    return k;
  }

  function monthSub(cursor) {
    const b = monthBounds(cursor);
    const first = b.first < A.START ? A.START : b.first;
    const last = b.last > A.PLAN_END ? A.PLAN_END : b.last;
    if (first > last) return '考后时间';
    const w1 = A.weekNo(first), w2 = A.weekNo(last);
    const phases = [];
    let d = first;
    while (d <= last) {
      const p = A.phaseFor(d);
      if (p && phases.indexOf(p.name) < 0) phases.push(p.name);
      d = A.addDays(d, 7);
    }
    return '第 ' + w1 + '–' + w2 + ' 周 · ' + phases.join(' / ');
  }

  function dayCellHTML(k, today) {
    const d = A.parse(k);
    const inMonth = true;
    const inPlan = k >= A.START && k <= A.PLAN_END;
    if (!inPlan) {
      return '<div class="cal-day is-out" aria-hidden="true"><span class="cal-num">' + d.getUTCDate() + '</span></div>';
    }
    const day = A.getDay(k);
    const ds = A.dayStats(day);
    const future = k > today;
    let cls = 'cal-day';
    if (day.rest === 'full') cls += ' is-rest';
    else if (day.rest === 'light') cls += ' is-light';
    if (day.kind === 'exam') cls += ' is-exam';
    if (day.kind === 'event') cls += ' is-cet';
    if (!future && ds.passed && day.rest !== 'full') cls += ' is-complete';
    else if (!future && ds.percent > 0) cls += ' is-partial';
    if (k === today) cls += ' is-today';
    if (k === UI.getSelected()) cls += ' is-selected';
    const note = A.getNote(k);
    if (note) cls += ' has-note';

    let mark = '';
    if (k === today) mark = '今';
    else if (day.kind === 'exam') mark = '考';
    else if (day.kind === 'event') mark = '六';
    else if (day.kind === 'pre') mark = '前';
    else if (day.rest === 'full') mark = '休';
    else if (day.rest === 'light') mark = '半';
    const markClass = (day.kind === 'exam' || day.kind === 'pre') ? ' mark-exam'
      : day.kind === 'event' ? ' mark-cet'
      : k === today ? ' mark-today' : '';
    const subjects = [];
    day.tasks.forEach(function (t) {
      if (subjects.indexOf(t.subject) < 0 && t.core) subjects.push(t.subject);
    });
    const dots = subjects.slice(0, 5).map(function (s) {
      return '<i style="background:' + A.SUBJECTS[s].color + '"></i>';
    }).join('');
    const pct = future ? 0 : ds.percent;
    const statusText = day.rest === 'full' ? '全休日'
      : day.kind === 'exam' ? '初试'
      : ds.passed ? '已达标' : day.rest === 'light' ? '半休' : '待完成';
    const label = (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日 · ' + statusText + ' · 必做 ' + ds.coreDone + '/' + ds.coreTotal + (note ? ' · 有每日记录' : '');
    return '<button class="' + cls + '" type="button" data-day-cell="' + k + '" aria-label="' + UI.esc(label) + '" title="' + UI.esc(label) + '">' +
      '<span class="cal-num">' + d.getUTCDate() + '</span>' +
      (mark ? '<span class="cal-mark' + (markClass || '') + '">' + mark + '</span>' : '') +
      '<span class="cal-dots">' + dots + '</span>' +
      '<span class="cal-fill"><i style="width:' + pct + '%"></i></span>' +
    '</button>';
  }

  function renderCalendar() {
    const cursor = clampCursor(UI.getCalCursor());
    UI.setCalCursor(cursor);
    const today = A.activeToday();
    const b = monthBounds(cursor);
    const title = document.getElementById('cal-title');
    const sub = document.getElementById('cal-sub');
    if (title) title.textContent = UI.monthLabel(cursor);
    if (sub) sub.textContent = monthSub(cursor);

    const offset = (A.weekday(b.first) + 6) % 7;
    const days = A.parse(b.last).getUTCDate();
    const cells = Math.ceil((offset + days) / 7) * 7;
    let html = '';
    for (let i = 0; i < cells; i++) {
      const n = i - offset + 1;
      if (n < 1 || n > days) {
        html += '<div class="cal-blank" aria-hidden="true"></div>';
      } else {
        const k = b.first.slice(0, 8) + A.pad(n);
        html += dayCellHTML(k, today);
      }
    }
    const grid = document.getElementById('calendar-grid');
    if (grid) grid.innerHTML = html;

    let sel = UI.getSelected();
    if (!sel || !isSameMonth(sel, cursor) || sel < A.START || sel > A.PLAN_END) {
      const firstInPlan = b.first < A.START ? A.START : b.first;
      const lastInPlan = b.last > A.PLAN_END ? A.PLAN_END : b.last;
      if (firstInPlan <= lastInPlan && isSameMonth(firstInPlan, cursor)) sel = firstInPlan;
      else sel = today;
      UI.setSelected(sel);
    }
    renderDayPanel();
  }

  function renderDayPanel() {
    const el = document.getElementById('day-panel');
    if (!el) return;
    const k = UI.getSelected();
    if (!k || k < A.START || k > A.PLAN_END) {
      el.innerHTML = '<p class="empty-hint">选择计划内的一天，查看当天安排。</p>';
      return;
    }
    const day = A.getDay(k);
    const ds = A.dayStats(day);
    const today = A.activeToday();
    const future = k > today;
    const d = A.parse(k);
    const phase = day.phase;
    const status = UI.statusChip(day, ds);
    const progress = day.rest === 'full' ? '' : UI.progressStrip(day, ds, future);
    const note = A.getNote(k);
    const journal =
      '<div class="day-journal">' +
        '<div class="day-journal-head">' +
          '<span>每日记录</span>' +
          '<span class="day-journal-count"><b>' + note.length + '</b>/160</span>' +
        '</div>' +
        '<textarea class="day-journal-input" data-note-date="' + k + '" maxlength="160" rows="2" placeholder="' +
          (future ? '还没到这一天。到那天再写。' : '一句话记下今天：状态、卡点、明天先做什么。') + '"' +
          (future ? ' disabled' : '') + '>' + UI.esc(note) + '</textarea>' +
        '<div class="day-journal-foot"><span class="day-journal-status">' +
          (future ? '未到日期，暂不可写' : '自动保存在本机') +
        '</span></div>' +
      '</div>';
    let content = '';

    if (day.rest === 'full') {
      content = UI.restCardHTML(day);
    } else {
      const disabled = future;
      content = '<div class="day-tasks">' + UI.taskListHTML(day, { disabled: disabled }) + '</div>';
      if (future) content += '<div class="task-lock">还没到这一天。计划先放在这里，不急着提前打卡。</div>';
      else if (!ds.passed) content += '<div class="task-lock">这天还没达标。可以补卡：把漏掉的必做项补上。</div>';
    }

    el.innerHTML =
      '<div class="day-panel-head">' +
        '<div>' +
          '<p class="day-kicker">DAY DETAIL · 第 ' + day.weekNo + ' 周</p>' +
          '<h2 class="day-date">' + (d.getUTCMonth() + 1) + ' 月 ' + d.getUTCDate() + ' 日</h2>' +
          '<p class="day-weekday">' + UI.weekdayName(k) + ' · ' + UI.esc(phase ? phase.name : '') + '</p>' +
        '</div>' +
        '<div class="day-badges">' + '<span class="phase-chip">' + UI.esc(phase ? phase.weeks : '') + '</span>' + status + '</div>' +
      '</div>' +
      '<h3 class="day-theme">' + UI.esc(day.theme) + '</h3>' +
      (day.note ? '<p class="day-note-sm">' + UI.esc(day.note) + '</p>' : '') +
      progress +
      journal +
      content;
  }

  UI.renderCalendar = renderCalendar;
  UI.renderDayPanel = renderDayPanel;

  UI.calShift = function (delta) {
    const cursor = clampCursor(UI.getCalCursor());
    const d = A.parse(cursor);
    const next = A.toKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
    UI.setCalCursor(clampCursor(next));
    const b = monthBounds(UI.getCalCursor());
    let sel = b.first;
    if (sel < A.START) sel = A.START;
    if (sel > A.PLAN_END) sel = A.PLAN_END;
    UI.setSelected(sel);
    renderCalendar();
  };

  UI.calToday = function () {
    const t = A.activeToday();
    UI.setCalCursor(UI.firstOfMonth(t));
    UI.setSelected(t);
    renderCalendar();
  };

  UI.selectDay = function (k) {
    if (!k || k < A.START || k > A.PLAN_END) return;
    UI.setSelected(k);
    renderCalendar();
  };
})();
