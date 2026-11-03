/* 研途 408 · 规划视图 */
(function () {
  'use strict';

  const A = window.YTApp;
  const YT = A.YT;
  const UI = window.YTUI;
  const PHASE_WEEKS = { P0: 3, P1: 14, P2: 8, P3: 9, P4: 9, P5: 9, P6: 8 };

  function dateRangeText(p) {
    return A.fmtDateDot(p.start) + ' — ' + A.fmtDateDot(p.end);
  }

  function renderPhaseRoute() {
    const today = A.activeToday();
    const active = A.phaseFor(today);
    return YT.phases.map(function (p, i) {
      return '<button type="button" class="plan-stop' + (active && active.id === p.id ? ' is-active' : '') + '" data-phase-jump="' + p.id + '" style="--c:' + p.color + ';--soft:' + p.soft + '">' +
        '<span class="plan-stop-no">0' + (i + 1) + '</span>' +
        '<span class="plan-stop-name">' + UI.esc(p.name) + '</span>' +
        '<span class="plan-stop-dates">' + dateRangeText(p) + '</span>' +
      '</button>';
    }).join('');
  }

  function renderPhaseCards() {
    return YT.phases.map(function (p, i) {
      return '<article class="phase-card" id="phase-' + p.id + '" data-no="0' + (i + 1) + '" style="--c:' + p.color + ';--soft:' + p.soft + '">' +
        '<div class="phase-left">' +
          '<div class="phase-index">0' + (i + 1) + '</div>' +
          '<h3>' + UI.esc(p.name) + '</h3>' +
          '<p class="phase-en">' + UI.esc(p.label) + '</p>' +
          '<div class="phase-facts"><span><b>' + dateRangeText(p) + '</b></span><span>' + p.weeks + ' · ' + p.hours + '</span></div>' +
        '</div>' +
        '<div class="phase-body">' +
          '<p class="phase-summary">' + UI.esc(p.summary) + '</p>' +
          '<ul class="phase-goals">' + p.goals.map(function (g) { return '<li>' + UI.esc(g) + '</li>'; }).join('') + '</ul>' +
          '<div class="phase-checkpoint"><b>通关标志 · </b>' + UI.esc(p.checkpoint) + '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderKeyDates() {
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>KEY DATES</p><h3>关键节点</h3><p class="panel-sub">日期以官方通知为准，提前一周设提醒。</p></div></div>' +
      '<div class="timeline">' + YT.keyDates.map(function (k) {
        return '<div class="timeline-item">' +
          '<div class="timeline-date">' + A.fmtDateDot(k.date).slice(5) + '</div>' +
          '<div><h4>' + UI.esc(k.title) + '</h4><p>' + UI.esc(k.note) + '</p></div>' +
        '</div>';
      }).join('') + '</div>';
  }

  function renderRhythm() {
    const rows = [
      ['工作日 · 早', '单词 / 背诵', '20–40 分钟。起床后先做最机械的一件事，把大脑叫醒。'],
      ['工作日 · 午', '长难句 / 六级听力', '20–30 分钟。碎片时间只做输入，不做整套题。'],
      ['工作日 · 晚', '数学 + 408 + 算法', '2.5–4 小时。先做数学和 408 的大块，再留 30–40 分钟给算法。'],
      ['周六 · 上午', '数学周测 / 套卷', '基础期 1.5 小时，真题期 3 小时。严格计时，做完立刻订正。'],
      ['周六 · 下午', '408 周测 / 六级模考', '与数学错开；六级模考放在 6 月前，之后换成英语套卷。'],
      ['周六 · 晚', '算法周赛 + 补题', 'ABC / CF Div3 / 洛谷周赛，赛后补 1 题，写 3 行总结。'],
      ['周日 · 上午', '周复盘 + 错题', '统计完成率、归类错题、写下下周最重要的三件事。1–2 小时。'],
      ['周日 · 下午', '半休 / 全休', '每周日下午晚上休息；每月最后一个周日全休，不补课。']
    ];
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>WEEKLY RHYTHM</p><h3>每周节奏</h3><p class="panel-sub">课多的时候做减法，不要打乱主线。</p></div></div>' +
      '<div class="rhythm-table">' + rows.map(function (r) {
        return '<div class="rhythm-row"><div class="rhythm-time">' + r[0] + '</div><div class="rhythm-content"><strong>' + r[1] + '</strong><span>' + r[2] + '</span></div></div>';
      }).join('') + '</div>';
  }

  function renderStrategy() {
    const items = [
      ['math', '数学一 · 120+', '基础跟武忠祥高数、李永乐线代、余丙森概率；强化用 880 题；真题 2010–2027 至少两遍。错题按“概念 / 计算 / 思路”分类。'],
      ['c408', '408 · 115+', '王道四本单科书 + 真题 2009–2027。选择题错题回标教材，大题写完整步骤；每章画一张思维导图。'],
      ['english', '英语一 · 70+', '单词滚到考前；真题 2005–2027 精读，阅读每道错题写错因；作文 9 月形成自己的模板，不背万能长文。'],
      ['politics', '政治 · 70+', '7 月开，徐涛 / 腿姐强化课 + 1000 题；10 月二刷错题与时政；11 月肖八，12 月肖四背诵。'],
      ['cet', '六级 · 500+', '12 月先考一次试水，6 月 19 日主目标。听力精听 + 阅读限时 + 翻译作文各 1 篇；过线即止，不挤占考研主线。'],
      ['algo', '算法 · 稳定手速', '每天 1–2 题，周六周赛。专题轮转：数据结构 → 图论 → DP → 数论/字符串。按当前 rating ±100 选题，重补题。']
    ];
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>SIX TRACKS</p><h3>六条线，一个目标</h3><p class="panel-sub">每一科都有明确的资料、动作和验收标准。</p></div></div>' +
      '<div class="strategy-grid">' + items.map(function (x) {
        const s = A.SUBJECTS[x[0]];
        return '<div class="strategy-card" style="--c:' + s.color + '"><h4><i></i>' + x[1] + '</h4><p>' + x[2] + '</p><small>对应每日任务：' + s.name + '</small></div>';
      }).join('') + '</div>';
  }

  function renderRestRules() {
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>REST IS PART OF THE PLAN</p><h3>休息日规则</h3></div></div>' +
      '<div class="rest-grid">' +
        '<div class="rest-rule"><h4>每周日 · 半休</h4><p>上午只做周复盘和错题，下午晚上不安排学习。周日晚写下周计划。</p></div>' +
        '<div class="rest-rule"><h4>每月最后一个周日 · 全休</h4><p>不补课、不内疚。睡饱、运动、见朋友，把电充满。</p></div>' +
        '<div class="rest-rule"><h4>春节 · 2/5–2/10</h4><p>连续 6 天全休；2/11 半休，2/12 归位。春节期间只保留可选的单词。 </p></div>' +
        '<div class="rest-rule"><h4>国庆 · 10/1–10/3</h4><p>10/1 全休，10/2–10/3 半休。真题阶段不追进度，休息完按原计划走。</p></div>' +
        '<div class="rest-rule"><h4>状态差 · 保底模式</h4><p>只做三件事：单词 100 个、算法 1 题、数学或 408 一小节。完成就算打卡。</p></div>' +
        '<div class="rest-rule"><h4>六级考后 · 6/20</h4><p>全休一天。之后不再安排六级任务，全部时间转考研英语。</p></div>' +
      '</div>';
  }

  function renderTarget() {
    const t = YT.target;
    return '<div class="panel-title"><div><p class="eyebrow"><span class="eyebrow-dot"></span>TARGET</p><h3>目标分</h3></div></div>' +
      '<div class="score-row"><div class="score-big">' + t.total + '</div><div class="score-unit">分 · 目标线</div></div>' +
      '<div class="score-grid">' +
        '<div class="score-item"><span>政治</span><b>' + t.politics + '</b></div>' +
        '<div class="score-item"><span>英语一</span><b>' + t.english + '</b></div>' +
        '<div class="score-item"><span>数学一</span><b>' + t.math + '</b></div>' +
        '<div class="score-item"><span>408</span><b>' + t.c408 + '</b></div>' +
      '</div>' +
      '<p class="score-note">保底 350，目标 375，冲刺 400。分数只用来倒推复习重点，不是每天的情绪指标。</p>';
  }

  UI.renderPlan = function () {
    const route = document.getElementById('phase-route-plan');
    if (route) route.innerHTML = renderPhaseRoute();
    const cards = document.getElementById('phase-cards');
    if (cards) cards.innerHTML = renderPhaseCards();
    const dates = document.getElementById('key-dates');
    if (dates) dates.innerHTML = renderKeyDates();
    const rhythm = document.getElementById('weekly-rhythm');
    if (rhythm) rhythm.innerHTML = renderRhythm();
    const strategy = document.getElementById('subject-strategy');
    if (strategy) strategy.innerHTML = renderStrategy();
    const rest = document.getElementById('rest-rules');
    if (rest) rest.innerHTML = renderRestRules();
    const target = document.getElementById('target-score');
    if (target) target.innerHTML = renderTarget();
  };
})();
