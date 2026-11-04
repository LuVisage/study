/* 研途 408 · 事件与启动 */
(function () {
  'use strict';

  const A = window.YTApp;
  const UI = window.YTUI;

  function refreshCurrent() {
    const v = UI.getCurrentView();
    if (v === 'today') UI.renderToday();
    else if (v === 'calendar') UI.renderCalendar();
    else if (v === 'plan') UI.renderPlan();
    else if (v === 'stats') UI.renderStats();
  }

  const noteTimers = new WeakMap();

  function saveJournal(el) {
    if (!el) return;
    const k = el.dataset.noteDate;
    if (!k) return;
    const v = A.setNote(k, el.value);
    const wrap = el.closest('.day-journal');
    if (wrap) {
      const count = wrap.querySelector('.day-journal-count b');
      if (count) count.textContent = String(v.length);
      const status = wrap.querySelector('.day-journal-status');
      if (status) status.textContent = '已保存 · 本机';
    }
    const cell = document.querySelector('[data-day-cell="' + k + '"]');
    if (cell) cell.classList.toggle('has-note', !!v);
  }

  function flushJournal() {
    const el = document.activeElement;
    if (el && el.classList && el.classList.contains('day-journal-input')) saveJournal(el);
  }

  function handleTaskChange(e) {
    const cb = e.target.closest('.task-check');
    if (!cb) return;
    const id = cb.dataset.taskId;
    if (!id) return;
    const date = id.slice(0, 10);
    const today = A.activeToday();
    const before = A.dayStats(A.getDay(date));
    A.toggleTask(id, cb.checked);
    UI.syncTaskRows(id);
    const after = A.dayStats(A.getDay(date));

    if (date === today) {
      if (after.percent === 100 && before.percent < 100) {
        UI.confetti();
        UI.showToast(after.allDone === after.allTotal
          ? '今日任务全部完成。现在可以去休息了。'
          : '今日必做任务全部完成，选做随意。', 3200);
      } else if (!before.passed && after.passed) {
        UI.showToast('今日已达标，连续打卡继续。', 2600);
      } else if (before.passed && !after.passed) {
        UI.showToast('今日还没达标，再补一项就回来。', 2600);
      }
    } else if (!before.passed && after.passed) {
      UI.showToast('补卡成功：' + date + ' 已达标。', 2200);
    }

    if (UI.getCurrentView() === 'today') UI.refreshTodayParts();
    else if (UI.getCurrentView() === 'calendar') UI.renderCalendar();
    else if (UI.getCurrentView() === 'stats') UI.renderStats();
  }

  function downloadExport() {
    const text = A.exportJSON();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yantu408-progress-' + A.localToday() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    UI.showToast('进度已导出。保存在一个你找得到的地方。', 2600);
  }

  function resetConfirm() {
    if (!window.confirm('确定清空全部打卡、每日记录和番茄统计吗？此操作不可撤销，建议先导出。')) return;
    A.resetData();
    window.dispatchEvent(new CustomEvent('yantu:statereload'));
    refreshCurrent();
    UI.showToast('打卡记录已清空，计划还在。', 2400);
  }

  function bindEvents() {
    document.querySelectorAll('.nav-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { UI.navigate(btn.dataset.view); });
    });
    document.querySelectorAll('[data-view-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        UI.navigate(a.dataset.viewLink);
      });
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      const next = (A.getState().theme === 'dark') ? 'light' : 'dark';
      A.setTheme(next);
      UI.applyTheme();
      UI.showToast(next === 'dark' ? '已切到夜间模式。' : '已切到纸感模式。', 1600);
    });

    document.addEventListener('change', function (e) {
      if (e.target.classList && e.target.classList.contains('task-check')) handleTaskChange(e);
    });

    document.addEventListener('input', function (e) {
      const el = e.target;
      if (!el.classList || !el.classList.contains('day-journal-input')) return;
      const wrap = el.closest('.day-journal');
      if (wrap) {
        const count = wrap.querySelector('.day-journal-count b');
        if (count) count.textContent = String(Math.min(el.value.length, 160));
        const status = wrap.querySelector('.day-journal-status');
        if (status) status.textContent = '正在保存…';
      }
      clearTimeout(noteTimers.get(el));
      noteTimers.set(el, setTimeout(function () { saveJournal(el); }, 320));
    });

    document.addEventListener('focusout', function (e) {
      const el = e.target;
      if (el && el.classList && el.classList.contains('day-journal-input')) {
        clearTimeout(noteTimers.get(el));
        saveJournal(el);
      }
    });

    window.addEventListener('beforeunload', flushJournal);

    const calPrev = document.getElementById('cal-prev');
    const calNext = document.getElementById('cal-next');
    const calToday = document.getElementById('cal-today');
    if (calPrev) calPrev.addEventListener('click', function () { UI.calShift(-1); });
    if (calNext) calNext.addEventListener('click', function () { UI.calShift(1); });
    if (calToday) calToday.addEventListener('click', UI.calToday);

    document.addEventListener('click', function (e) {
      const cell = e.target.closest('[data-day-cell]');
      if (cell) { UI.selectDay(cell.dataset.dayCell); return; }

      const jump = e.target.closest('[data-phase-jump]');
      if (jump) {
        const id = jump.dataset.phaseJump;
        if (UI.getCurrentView() !== 'plan') UI.navigate('plan', { silent: true });
        requestAnimationFrame(function () {
          const el = document.getElementById('phase-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
      }

      const exp = e.target.closest('#export-data');
      if (exp) { downloadExport(); return; }
      const imp = e.target.closest('#import-data');
      if (imp) { const input = document.getElementById('import-file'); if (input) input.click(); return; }
      const rst = e.target.closest('#reset-data');
      if (rst) { resetConfirm(); return; }
      const pr = e.target.closest('#print-plan');
      if (pr) { window.print(); }
    });

    const file = document.getElementById('import-file');
    if (file) file.addEventListener('change', function () {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          if (!window.confirm('导入会覆盖当前打卡、每日记录和番茄统计，继续吗？')) { file.value = ''; return; }
          const n = A.importJSON(reader.result);
          window.dispatchEvent(new CustomEvent('yantu:statereload'));
          refreshCurrent();
          UI.showToast('已导入 ' + n.checks + ' 条打卡、' + n.notes + ' 条每日记录。', 3000);
        } catch (err) {
          UI.showToast('导入失败：' + err.message, 3200);
        }
        file.value = '';
      };
      reader.readAsText(f);
    });

    window.addEventListener('hashchange', function () {
      const v = location.hash.replace('#', '');
      if (['today', 'calendar', 'plan', 'stats'].indexOf(v) >= 0) UI.navigate(v, { silent: true });
    });

    document.addEventListener('keydown', function (e) {
      if (e.altKey && !e.ctrlKey && !e.metaKey && ['1', '2', '3', '4'].indexOf(e.key) >= 0) {
        e.preventDefault();
        const views = ['today', 'calendar', 'plan', 'stats'];
        UI.navigate(views[Number(e.key) - 1]);
      }
    });
  }

  function start() {
    UI.applyTheme();
    bindEvents();
    const hash = location.hash.replace('#', '');
    const view = ['today', 'calendar', 'plan', 'stats'].indexOf(hash) >= 0 ? hash : 'today';
    UI.navigate(view, { silent: true });

    let lastDay = A.activeToday();
    function checkDayChange() {
      const now = A.activeToday();
      if (now === lastDay) return;
      lastDay = now;
      flushJournal();
      if (UI.getCurrentView() === 'calendar' && UI.calToday) UI.calToday();
      else refreshCurrent();
      window.dispatchEvent(new CustomEvent('yantu:daychange', { detail: { date: now } }));
      UI.showToast('新的一天，计划已更新。', 3000);
    }
    setInterval(checkDayChange, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) checkDayChange();
    });
    window.addEventListener('focus', checkDayChange);
    window.addEventListener('pageshow', checkDayChange);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
