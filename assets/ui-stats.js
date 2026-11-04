/* 研途 408 · 数据视图 */
(function () {
  'use strict';

  const A = window.YTApp;
  const UI = window.YTUI;

  function renderOverview(o) {
    const s = o.streak;
    const cards = [
      ['连续打卡', s.current + '<small>天</small>', '最长 ' + s.longest + ' 天 · ' + (s.todayPassed ? '今日已达标' : '今日待打卡')],
      ['累计专注', A.fmtHours(o.minutes) + '<small>小时</small>', '已打卡 ' + o.passedDays + ' 天 · 已过 ' + o.elapsed + ' 天'],
      ['本周完成', o.week.percent + '<small>%</small>', o.week.done + ' / ' + o.week.total + ' 项必做'],
      ['日期进度', o.dayPercent + '<small>%</small>', '第 ' + o.elapsed + ' 天 / 共 ' + o.totalDays + ' 天']
    ];
    return cards.map(function (c) {
      return '<article class="stat-card"><p class="stat-label">' + c[0] + '</p><div class="stat-value">' + c[1] + '</div><p class="stat-sub">' + c[2] + '</p></article>';
    }).join('');
  }

  function monthLabels() {
    const labels = [];
    let last = null, start = 1;
    for (let col = 1; col <= 60; col++) {
      const k = A.addDays('2026-11-02', (col - 1) * 7);
      const d = A.parse(k);
      const m = d.getUTCFullYear() + '-' + d.getUTCMonth();
      if (last === null) { last = m; start = col; }
      else if (m !== last) {
        labels.push({ start: start, span: col - start, text: textFor(A.addDays('2026-11-02', (start - 1) * 7)) });
        last = m; start = col;
      }
    }
    labels.push({ start: start, span: 61 - start, text: textFor(A.addDays('2026-11-02', (start - 1) * 7)) });
    return labels;
  }
  function textFor(k) {
    const d = A.parse(k);
    return String(d.getUTCFullYear()).slice(2) + '.' + A.pad(d.getUTCMonth() + 1);
  }

  function renderHeatmap() {
    const today = A.activeToday();
    let cells = '';
    let labels = '';
    monthLabels().forEach(function (l) {
      labels += '<span style="grid-column:' + l.start + ' / span ' + l.span + '">' + l.text + '</span>';
    });
    for (let col = 1; col <= 60; col++) {
      for (let row = 0; row < 7; row++) {
        const k = A.addDays('2026-11-02', (col - 1) * 7 + row);
        if (k < A.START || k > A.PLAN_END) {
          cells += '<span class="heat-cell is-empty"></span>';
          continue;
        }
        const day = A.getDay(k);
        const ds = A.dayStats(day);
        const future = k > today;
        let cls = 'heat-cell';
        let status = '计划';
        if (future) { cls += ' is-future'; }
        else if (day.rest === 'full') { cls += ' is-rest'; status = '全休'; }
        else if (ds.percent >= 85) { cls += ' l4'; status = '完成 ' + ds.percent + '%'; }
        else if (ds.percent >= 60) { cls += ' l3'; status = '完成 ' + ds.percent + '%'; }
        else if (ds.percent >= 30) { cls += ' l2'; status = '完成 ' + ds.percent + '%'; }
        else if (ds.percent > 0) { cls += ' l1'; status = '完成 ' + ds.percent + '%'; }
        else { status = day.rest === 'full' ? '全休' : '未完成'; }
        if (k === today) cls += ' is-today';
        cells += '<span class="' + cls + '" title="' + UI.esc(A.fmtDate(k, { short: true }) + ' · ' + status) + '"></span>';
      }
    }
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>60 WEEKS</p><h3>学习热力图</h3><p class="panel-sub">每一格是一天。金色 = 全休日，描边 = 还没到。</p></div></div>' +
      '<div class="heatmap-scroll"><div class="heatmap-inner">' +
        '<div class="heatmap-months">' + labels + '</div>' +
        '<div class="heatmap-body">' +
          '<div class="heatmap-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>' +
          '<div class="heatmap-grid">' + cells + '</div>' +
        '</div>' +
        '<div class="heat-legend"><span>少</span><i style="background:var(--paper-2)"></i><i style="background:color-mix(in srgb, var(--jade) 24%, var(--paper-2))"></i><i style="background:color-mix(in srgb, var(--jade) 42%, var(--paper-2))"></i><i style="background:color-mix(in srgb, var(--jade) 62%, var(--paper-2))"></i><i style="background:var(--jade)"></i><span>多</span><span style="margin-left:8px">金色 = 休息</span></div>' +
      '</div></div>';
  }

  function renderSubjects() {
    const rows = A.subjectStats();
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>SUBJECTS</p><h3>分科进度</h3><p class="panel-sub">只统计必做项；选做不参与完成率。</p></div></div>' +
      rows.map(function (r) {
        const pct = r.percent;
        return '<div class="subject-row" style="--c:' + r.color + ';--p:' + pct + '%">' +
          '<div class="subject-row-top"><span><i></i>' + UI.esc(r.name) + '</span><b>' + r.done + ' / ' + r.total + ' 项 · ' + pct + '%</b></div>' +
          '<div class="subject-track"><i></i></div>' +
          '<div class="subject-row-sub">已投入 ' + A.fmtHours(r.minutes) + ' 小时 · 计划 ' + A.fmtHours(r.plannedMinutes) + ' 小时</div>' +
        '</div>';
      }).join('');
  }

  function renderMonths() {
    const rows = A.monthlyStats();
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>MONTHLY HOURS</p><h3>月度投入</h3><p class="panel-sub">灰色是计划，红色是已完成。</p></div></div>' +
      '<div class="month-chart">' + rows.map(function (m) {
        return '<div class="month-col"><div class="month-bar">' +
          '<span class="month-bar-plan" style="--plan:' + m.planPercent + '%"></span>' +
          '<span class="month-bar-done" style="--done:' + m.donePercent + '%"></span>' +
        '</div><span class="month-label">' + m.label + '</span></div>';
      }).join('') + '</div>' +
      '<div class="month-legend"><span><i style="background:var(--line)"></i>计划</span><span><i style="background:var(--red);opacity:.8"></i>已完成</span></div>';
  }

  function renderData() {
    const p = A.planTotals();
    const pm = A.pomoTotals();
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>LOCAL DATA</p><h3>数据管理</h3><p class="panel-sub">进度只存在这台设备的浏览器里。换设备前先导出。</p></div></div>' +
      '<div class="rest-grid">' +
        '<div class="rest-rule"><h4>全程计划量</h4><p>' + p.weeks + ' 周 · ' + p.days + ' 天 · 约 ' + p.hours + ' 小时 · ' + p.tasks + ' 项任务</p></div>' +
        '<div class="rest-rule"><h4>休息日</h4><p>' + p.restFull + ' 个全休日 · ' + p.restLight + ' 个半休日（含考前准备日）</p></div>' +
        '<div class="rest-rule"><h4>番茄钟</h4><p>今日 ' + pm.todaySessions + ' 个 · ' + pm.todayMinutes + ' 分钟；累计 ' + pm.sessions + ' 个 · 约 ' + A.fmtHours(pm.minutes) + ' 小时</p></div>' +
      '</div>' +
      '<div class="data-actions">' +
        '<button class="ghost-btn" type="button" id="export-data">导出进度 JSON</button>' +
        '<button class="ghost-btn" type="button" id="import-data">导入进度</button>' +
        '<button class="ghost-btn danger-btn" type="button" id="reset-data">清空进度</button>' +
      '</div>' +
      '<p class="data-note">导入会覆盖当前打卡、每日记录和番茄统计。建议每周日复盘后导出一次，文件名自带日期。</p>';
  }

  UI.renderStats = function () {
    const o = A.overallStats();
    const mini = document.getElementById('stats-mini');
    if (mini) mini.innerHTML = '<b>' + o.elapsed + ' / ' + o.totalDays + '</b><span>已过天数 · 距初试 ' + A.countdown() + ' 天</span>';
    const ov = document.getElementById('stats-overview');
    if (ov) ov.innerHTML = renderOverview(o);
    const heat = document.getElementById('heatmap-panel');
    if (heat) heat.innerHTML = renderHeatmap();
    const subj = document.getElementById('subject-stats');
    if (subj) subj.innerHTML = renderSubjects();
    const months = document.getElementById('monthly-chart');
    if (months) months.innerHTML = renderMonths();
    const data = document.getElementById('data-panel');
    if (data) data.innerHTML = renderData();
  };
})();
