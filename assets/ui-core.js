/* 研途 408 · 界面核心 */
(function () {
  'use strict';

  const A = window.YTApp;
  const YT = A.YT;
  const UI = window.YTUI = window.YTUI || {};
  const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const PHASE_WEEKS = { P0: 3, P1: 14, P2: 8, P3: 9, P4: 9, P5: 9, P6: 8 };

  let currentView = 'today';
  let selectedKey = A.activeToday();
  let calCursor = firstOfMonth(A.activeToday());
  let toastTimer = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function firstOfMonth(k) {
    const d = A.parse(k);
    return A.toKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  }
  function monthLabel(k) {
    const d = A.parse(k);
    return d.getUTCFullYear() + ' 年 ' + (d.getUTCMonth() + 1) + ' 月';
  }
  function shortDate(k) { return A.fmtDate(k, { short: true }); }
  function weekdayName(k) { return WEEK_NAMES[A.weekday(k)]; }
  function subjectName(key) { return A.SUBJECTS[key] ? A.SUBJECTS[key].name : key; }

  function groupsFor(day) {
    const groups = A.SUBJECT_ORDER.map(function (key) {
      const tasks = day.tasks.filter(function (t) { return t.subject === key; });
      if (!tasks.length) return null;
      return {
        key: key, name: subjectName(key), color: A.SUBJECTS[key].color,
        tasks: tasks, minutes: tasks.reduce(function (s, t) { return s + t.minutes; }, 0),
        order: day.tasks.indexOf(tasks[0])
      };
    }).filter(Boolean);
    if (day.kind === 'exam' || day.key === A.START) groups.sort(function (a, b) { return a.order - b.order; });
    return groups;
  }

  function taskListHTML(day, opts) {
    opts = opts || {};
    const groups = groupsFor(day);
    if (!groups.length) return '';
    const disabled = !!opts.disabled;
    return groups.map(function (g) {
      return '<div class="task-group" style="--c:' + g.color + '">' +
        '<div class="task-group-head">' +
          '<span class="group-dot"></span>' +
          '<strong>' + esc(g.name) + '</strong>' +
          '<span class="group-meta">' + g.tasks.length + ' 项 · ' + A.fmtDuration(g.minutes) + '</span>' +
        '</div>' +
        g.tasks.map(function (t) {
          const checked = A.isChecked(t.id);
          return '<label class="task-row' + (checked ? ' done' : '') + (t.core ? '' : ' is-optional') + '" style="--c:' + g.color + '">' +
            '<input class="task-check" type="checkbox" data-task-id="' + esc(t.id) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
            '<span class="check-ui" aria-hidden="true"></span>' +
            '<span class="task-body">' +
              '<span class="task-title">' + esc(t.title) + '</span>' +
              '<span class="task-detail">' + esc(t.detail) + '</span>' +
            '</span>' +
            '<span class="task-tail">' +
              '<span class="task-time">' + A.fmtDuration(t.minutes) + '</span>' +
              (t.core ? '' : '<span class="optional-tag">选做</span>') +
            '</span>' +
          '</label>';
        }).join('') +
      '</div>';
    }).join('');
  }

  function statusChip(day, ds) {
    const today = A.activeToday();
    if (!day.inPlan) return '<span class="status-chip">考后</span>';
    if (day.kind === 'exam') return '<span class="status-chip is-exam">初试日</span>';
    if (day.kind === 'event') return '<span class="status-chip is-exam">六级考试</span>';
    if (day.kind === 'pre') return '<span class="status-chip is-exam">考前准备</span>';
    if (day.rest === 'full') return '<span class="status-chip is-rest">全休 · 自动打卡</span>';
    if (day.key > today) {
      return '<span class="status-chip' + (day.rest === 'light' ? ' is-rest' : '') + '">' + (day.rest === 'light' ? '半休 · 未开始' : '未开始') + '</span>';
    }
    if (day.rest === 'light') return '<span class="status-chip ' + (ds.passed ? 'is-pass' : 'is-rest') + '">' + (ds.passed ? '半休 · 已达标' : '半休 · 待复盘') + '</span>';
    return '<span class="status-chip ' + (ds.passed ? 'is-pass' : '') + '">' + (ds.passed ? '已达标' : (day.key === today ? '待完成' : '未达标')) + '</span>';
  }

  function progressStrip(day, ds, future) {
    const pct = future ? 0 : ds.percent;
    const color = day.rest === 'full' ? 'var(--gold)' : (ds.passed ? 'var(--jade)' : 'var(--red)');
    const coreText = day.rest === 'full'
      ? '休息日 · 自动计入打卡'
      : '必做 ' + ds.coreDone + '/' + ds.coreTotal + ' <span>· 选做 ' + ds.optDone + '/' + ds.optTotal + '</span>';
    const subText = day.rest === 'full'
      ? '不补课、不焦虑，休息也是计划的一部分。'
      : '预计 ' + A.fmtDuration(day.totalMinutes) + ' · 已完成 ' + A.fmtDuration(ds.minutesDone);
    return '<div class="progress-strip" data-progress-date="' + day.key + '">' +
      '<div class="ring" style="--p:' + pct + ';--c:' + color + '"><span>' + (day.rest === 'full' ? '休' : pct + '%') + '</span></div>' +
      '<div class="progress-main">' +
        '<strong>' + coreText + '</strong>' +
        '<p>' + subText + '</p>' +
        '<div class="progress-bar"><i style="width:' + pct + '%;background:' + color + '"></i></div>' +
      '</div>' +
    '</div>';
  }

  function restCardHTML(day) {
    const tips = day.restTip || ['睡到自然醒', '运动 30 分钟', '晒太阳 / 散步', '晚上看一眼下周计划'];
    return '<div class="rest-state">' +
      '<div class="rest-glyph">休</div>' +
      '<h3>今天不学，去生活。</h3>' +
      '<p>全休日不安排任何任务。把电充满，明天再继续。<br>这不是偷懒，是长期计划的一部分。</p>' +
      '<div class="rest-tips">' + tips.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
    '</div>';
  }

  function phaseRouteHTML() {
    const today = A.activeToday();
    const activePhase = A.phaseFor(today);
    return A.PHASES.map(function (p) {
      const active = activePhase && activePhase.id === p.id;
      return '<button class="route-seg' + (active ? ' is-active' : '') + '" type="button" data-phase-jump="' + p.id + '" style="--c:' + p.color + ';--w:' + PHASE_WEEKS[p.id] + '">' +
        '<span class="route-name">' + esc(p.name) + '</span>' +
        '<span class="route-weeks">' + PHASE_WEEKS[p.id] + ' 周 · ' + esc(p.hours) + '</span>' +
      '</button>';
    }).join('');
  }

  function ticketHTML(today, day) {
    const wp = day.week;
    if (!wp) return '';
    const phase = day.phase;
    const next = A.nextRest(today);
    const fullText = next.full ? shortDate(next.full) : '—';
    const lightText = next.light ? shortDate(next.light) : '—';
    return '<div class="week-ticket">' +
      '<div class="ticket-stamp">W' + A.pad(wp.no) + '</div>' +
      '<div class="ticket-head"><b>W' + A.pad(wp.no) + '</b><span class="phase-chip">' + esc(phase.name) + '</span><span>' + esc(phase.weeks) + '</span></div>' +
      '<h2>' + esc(wp.theme) + '</h2>' +
      '<dl class="ticket-list">' +
        '<div class="ticket-row"><dt>数学</dt><dd>' + esc(wp.math) + '</dd></div>' +
        '<div class="ticket-row"><dt>408</dt><dd>' + esc(wp.a.name) + ' · ' + esc(wp.a.topic) + '</dd></div>' +
        '<div class="ticket-row"><dt></dt><dd>' + esc(wp.b.name) + ' · ' + esc(wp.b.topic) + '</dd></div>' +
        '<div class="ticket-row"><dt>英语</dt><dd>' + esc(wp.eng) + '</dd></div>' +
        (wp.pol ? '<div class="ticket-row"><dt>政治</dt><dd>' + esc(wp.pol) + '</dd></div>' : '') +
        '<div class="ticket-row"><dt>算法</dt><dd>' + esc(wp.algo) + '</dd></div>' +
      '</dl>' +
      '<div class="ticket-note">' + esc(wp.note || '按计划走，不用想太远。今天完成该做的，就去休息。') + '</div>' +
      '<div class="ticket-foot"><span>下个半休 <b>' + lightText + '</b></span><span>下个全休 <b>' + fullText + '</b></span></div>' +
    '</div>';
  }

  function renderTodayHead(today, day) {
    const ds = A.dayStats(day);
    const el = document.getElementById('today-head');
    if (!el) return;
    el.innerHTML =
      '<div class="today-title-row">' +
        '<div>' +
          '<p class="eyebrow"><span class="eyebrow-dot"></span>今日任务 · ' + weekdayName(today) + ' · 第 ' + day.weekNo + ' 周</p>' +
          '<h2>' + A.fmtDate(today) + '</h2>' +
        '</div>' +
        '<div class="today-badges">' +
          '<span class="phase-chip" style="--c:' + day.phase.color + '">' + esc(day.phase.name) + '</span>' +
          statusChip(day, ds) +
        '</div>' +
      '</div>' +
      (day.note ? '<p class="day-note">' + esc(day.note) + '</p>' : '') +
      progressStrip(day, ds, false);
  }

  function renderTodayTasks(today, day) {
    const el = document.getElementById('today-tasks');
    if (!el) return;
    if (day.rest === 'full') {
      el.innerHTML = restCardHTML(day);
      return;
    }
    const html = taskListHTML(day, { disabled: false });
    el.innerHTML = html || '<p class="empty-hint">今天没有安排，去休息吧。</p>';
  }

  function renderTodaySide(today) {
    const el = document.getElementById('today-side');
    if (!el) return;
    const s = A.streakInfo();
    const wk = A.weekSummary(today);
    const offset = (A.weekday(today) + 6) % 7;
    const monday = A.addDays(today, -offset);
    let dots = '';
    for (let i = 0; i < 7; i++) {
      const k = A.addDays(monday, i);
      const dd = A.getDay(k);
      const dds = A.dayStats(dd);
      let cls = 'week-dot';
      if (dd.rest === 'full') cls += ' is-rest';
      else if (dds.passed) cls += ' is-pass';
      if (k === today) cls += ' is-today';
      const title = shortDate(k) + (dd.rest === 'full' ? ' · 全休' : dds.passed ? ' · 已达标' : '');
      dots += '<div class="' + cls + '" title="' + esc(title) + '"><i></i><small>' + '一二三四五六日'[i] + '</small></div>';
    }
    const nr = A.nextRest(today);
    const nextFull = nr.full ? A.diff(today, nr.full) : null;
    const nextLight = nr.light ? A.diff(today, nr.light) : null;
    const quote = YT.quotes[A.diff(A.START, today) % YT.quotes.length];
    el.innerHTML =
      '<section class="side-card streak-card">' +
        '<div class="streak-top"><span class="side-kicker">连续打卡</span><span class="flame" aria-hidden="true">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21c4 0 6.5-2.4 6.5-6 0-4.5-4.2-6.8-4.2-11.5-2.8 1.9-3.6 4.6-3.6 6.6 0 1.7.8 2.7.8 2.7s-1.2-.7-2-1.8c-.9 1.3-3.5 3.1-3.5 6.2 0 2.2 1.3 3.8 3 4.5.5-.4 1.6-.8 3-.7Z" stroke="currentColor" stroke-width="1.4"/></svg>' +
        '</span></div>' +
        '<div class="streak-big">' + s.current + '<span>天</span></div>' +
        '<p class="streak-sub">最长 ' + s.longest + ' 天 · ' + (s.todayPassed ? '今日已达标' : '今日还差一点') + '</p>' +
        '<div class="week-dots">' + dots + '</div>' +
        '<div class="side-rule"></div>' +
        '<div class="rest-row"><span>本周完成</span><b>' + wk.done + '/' + wk.total + ' 项 · ' + wk.percent + '%</b></div>' +
      '</section>' +
      '<section class="side-card">' +
        '<p class="side-kicker">下一次休息</p>' +
        '<h3>' + (nr.full ? shortDate(nr.full) : '—') + ' <b>全休</b></h3>' +
        '<p class="side-copy">' + (nr.full ? '还有 ' + A.diff(today, nr.full) + ' 天。每周日下午半休，月底留一个完整周日。' : '按计划休息。') + '</p>' +
        '<div class="side-rule"></div>' +
        '<div class="rest-list">' +
          '<div class="rest-row"><span>下一个半休</span><b>' + (nr.light ? shortDate(nr.light) + ' · ' + (A.diff(today, nr.light) === 1 ? '明天' : A.diff(today, nr.light) + ' 天后') : '—') + '</b></div>' +
          '<div class="rest-row"><span>全休倒计时</span><b>' + (nextFull != null ? nextFull + ' 天' : '—') + '</b></div>' +
        '</div>' +
      '</section>' +
      '<blockquote class="quote-card"><p>「' + esc(quote) + '」</p><span>今日一句 · 写给一年后的你</span></blockquote>';
  }

  UI.esc = esc;
  UI.firstOfMonth = firstOfMonth;
  UI.monthLabel = monthLabel;
  UI.shortDate = shortDate;
  UI.weekdayName = weekdayName;
  UI.subjectName = subjectName;
  UI.groupsFor = groupsFor;
  UI.taskListHTML = taskListHTML;
  UI.statusChip = statusChip;
  UI.progressStrip = progressStrip;
  UI.restCardHTML = restCardHTML;
  UI.phaseRouteHTML = phaseRouteHTML;

  UI.getCurrentView = function () { return currentView; };
  UI.getSelected = function () { return selectedKey; };
  UI.setSelected = function (k) { selectedKey = k; };
  UI.getCalCursor = function () { return calCursor; };
  UI.setCalCursor = function (k) { calCursor = firstOfMonth(k); };

  UI.renderToday = function () {
    const today = A.activeToday();
    const day = A.getDay(today);
    const countdown = A.countdown();
    const prep = A.prepDay();
    document.getElementById('top-countdown').textContent = countdown;
    document.getElementById('hero-days').textContent = countdown;
    document.getElementById('prep-day').textContent = prep;
    document.getElementById('hero-sub').textContent = '今天是备考第 ' + prep + ' 天。计划排到 2027 年 12 月 26 日，休息日也算在计划里。别急，按节奏走。';
    document.getElementById('hero-side').innerHTML = ticketHTML(today, day);
    document.getElementById('phase-route').innerHTML = phaseRouteHTML();
    renderTodayHead(today, day);
    renderTodayTasks(today, day);
    renderTodaySide(today);
  };

  UI.refreshTodayParts = function () {
    const today = A.activeToday();
    const day = A.getDay(today);
    renderTodayHead(today, day);
    renderTodaySide(today);
  };

  UI.showToast = function (msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, ms || 2600);
  };

  UI.confetti = function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#c4472f', '#2e6b5a', '#a97c34', '#3f5d8c', '#7a5c8e'];
    const parts = [];
    for (let i = 0; i < 80; i++) {
      parts.push({
        x: W * (0.25 + Math.random() * 0.5), y: H * 0.36,
        vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 3,
        size: 4 + Math.random() * 6, color: colors[i % colors.length],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25, life: 1
      });
    }
    const start = performance.now();
    function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99;
        p.rot += p.vr; p.life = Math.max(0, 1 - t / 1900);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        ctx.restore();
      });
      if (t < 1900) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  };

  UI.applyTheme = function () {
    document.documentElement.dataset.theme = A.getState().theme || 'light';
  };

  UI.navigate = function (view, opts) {
    opts = opts || {};
    if (!['today', 'calendar', 'plan', 'stats'].includes(view)) view = 'today';
    currentView = view;
    document.querySelectorAll('.nav-tab').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(function (p) {
      const on = p.dataset.viewPanel === view;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    if (view === 'today') UI.renderToday();
    if (view === 'calendar' && UI.renderCalendar) UI.renderCalendar();
    if (view === 'plan' && UI.renderPlan) UI.renderPlan();
    if (view === 'stats' && UI.renderStats) UI.renderStats();
    if (!opts.silent) {
      try { history.replaceState(null, '', '#' + view); } catch (e) {}
    }
  };

  UI.syncTaskRows = function (id) {
    document.querySelectorAll('.task-check').forEach(function (cb) {
      if (cb.dataset.taskId !== id) return;
      const row = cb.closest('.task-row');
      if (row) row.classList.toggle('done', cb.checked);
    });
  };
})();
