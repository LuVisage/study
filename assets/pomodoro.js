/* 研途 408 · 番茄钟 */
(function () {
  'use strict';

  const A = window.YTApp;
  const UI = window.YTUI;

  const MODES = {
    focus: { name: '专注', minutes: 25, tip: '只做一件事', cta: '开始专注' },
    short: { name: '短休', minutes: 5, tip: '起身走走，看看远处', cta: '开始休息' },
    long: { name: '长休', minutes: 15, tip: '离开屏幕，补点水', cta: '开始长休' }
  };
  const CYCLE = 4;
  const BASE_TITLE = document.title;

  let mode = 'focus';
  let remaining = MODES.focus.minutes * 60;
  let running = false;
  let endAt = 0;
  let ticker = null;
  let audioCtx = null;
  let panelOpen = false;

  function durationOf(m) { return MODES[m].minutes * 60; }
  function format(sec) {
    const s = Math.max(0, Math.round(sec));
    return A.pad(Math.floor(s / 60)) + ':' + A.pad(s % 60);
  }
  function localKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + A.pad(d.getMonth() + 1) + '-' + A.pad(d.getDate());
  }

  function el(id) { return document.getElementById(id); }

  function persist() {
    A.savePomoTimer({
      mode: mode,
      remaining: remaining,
      running: running,
      endAt: running ? endAt : null
    });
  }

  function render() {
    const m = MODES[mode];
    const total = durationOf(mode);
    const pct = total ? Math.max(0, Math.min(100, (1 - remaining / total) * 100)) : 0;
    const timeText = format(remaining);

    const time = el('pomo-time');
    if (time) time.textContent = timeText;
    const fabTime = el('pomo-fab-time');
    if (fabTime) fabTime.textContent = timeText;
    const fabLabel = el('pomo-fab-label');
    if (fabLabel) fabLabel.textContent = running ? m.name : '番茄钟';
    const fab = el('pomo-fab');
    if (fab) {
      fab.classList.toggle('is-running', running);
      fab.classList.toggle('is-break', mode !== 'focus');
    }

    const clock = el('pomo-clock');
    if (clock) {
      clock.style.setProperty('--p', pct.toFixed(1));
      clock.classList.toggle('is-break', mode !== 'focus');
      clock.setAttribute('aria-label', m.name + '剩余 ' + timeText);
    }
    const sub = el('pomo-clock-sub');
    if (sub) {
      sub.textContent = running ? (mode === 'focus' ? '保持专注' : '休息一下') : (remaining < total ? '已暂停' : m.tip);
    }
    const label = el('pomo-mode-label');
    if (label) label.textContent = m.name + ' · ' + m.minutes + ' 分钟';
    const toggle = el('pomo-toggle');
    if (toggle) {
      toggle.textContent = running ? '暂停' : (remaining < total && remaining > 0 ? '继续' : m.cta);
      toggle.classList.toggle('is-pause', running);
    }
    const root = el('pomo');
    if (root) root.dataset.mode = mode;

    document.querySelectorAll('[data-pomo-mode]').forEach(function (b) {
      const on = b.dataset.pomoMode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const t = A.pomoTotals();
    const today = el('pomo-today');
    if (today) today.textContent = String(t.todaySessions);
    const todayMin = el('pomo-today-min');
    if (todayMin) todayMin.textContent = String(t.todayMinutes);
    const totalEl = el('pomo-total');
    if (totalEl) totalEl.textContent = String(t.sessions);

    document.title = (running || remaining < total)
      ? timeText + ' · ' + m.name + ' · 研途 408'
      : BASE_TITLE;
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(tick, 500);
  }

  function tick() {
    if (!running) return;
    const left = Math.ceil((endAt - Date.now()) / 1000);
    if (left <= 0) { complete(false); return; }
    if (left !== remaining) {
      remaining = left;
      render();
    }
  }

  function start() {
    if (running) return;
    if (remaining <= 0) remaining = durationOf(mode);
    running = true;
    endAt = Date.now() + remaining * 1000;
    persist();
    startTicker();
    render();
    resumeAudio();
  }

  function pause() {
    if (!running) return;
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    running = false;
    endAt = 0;
    stopTicker();
    persist();
    render();
  }

  function setMode(next, opts) {
    if (!MODES[next]) next = 'focus';
    mode = next;
    running = false;
    endAt = 0;
    stopTicker();
    remaining = durationOf(mode);
    persist();
    render();
    if (!opts || !opts.silent) {
      const m = MODES[mode];
      UI.showToast(m.name + ' ' + m.minutes + ' 分钟，' + m.tip + '。', 2200);
    }
  }

  function reset() {
    const wasRunning = running;
    running = false;
    endAt = 0;
    stopTicker();
    remaining = durationOf(mode);
    persist();
    render();
    if (wasRunning) UI.showToast('计时已重置。', 1600);
  }

  function complete(restored) {
    const finished = mode;
    const finishedAt = endAt || Date.now();
    const mins = MODES[finished].minutes;
    running = false;
    endAt = 0;
    stopTicker();
    remaining = 0;

    if (finished === 'focus') {
      A.addPomoSession(localKey(finishedAt), mins);
      if (!restored) chime(3);
      const t = A.pomoTotals();
      const next = t.todaySessions % CYCLE === 0 ? 'long' : 'short';
      mode = next;
      remaining = durationOf(mode);
      running = false;
      persist();
      render();
      if (restored) {
        UI.showToast('上次专注已完成，已计入番茄统计。', 3600);
      } else {
        UI.showToast('番茄完成 · 今天第 ' + t.todaySessions + ' 个。' +
          (next === 'long' ? '该长休 15 分钟了。' : '短休 5 分钟，再继续。'), 4600);
      }
    } else {
      if (!restored) chime(1);
      mode = 'focus';
      remaining = durationOf(mode);
      running = false;
      persist();
      render();
      if (!restored) UI.showToast('休息结束，回到书桌。', 3000);
    }
    if (!restored) {
      const fab = el('pomo-fab');
      if (fab && !panelOpen) fab.classList.add('is-done');
      setTimeout(function () { if (fab) fab.classList.remove('is-done'); }, 2600);
    }
    if (UI.getCurrentView() === 'stats' && UI.renderStats) UI.renderStats();
  }

  function resumeAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  }

  function chime(times) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const notes = [880, 1174.66, 1567.98];
      for (let i = 0; i < (times || 2); i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t0 = now + i * 0.22;
        osc.type = 'sine';
        osc.frequency.value = notes[i % notes.length];
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.055, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.55);
      }
    } catch (e) {}
  }

  function restore() {
    const saved = A.getState().pomo && A.getState().pomo.timer;
    if (!saved || !MODES[saved.mode]) {
      remaining = durationOf(mode);
      render();
      return;
    }
    mode = saved.mode;
    const total = durationOf(mode);

    if (saved.running && saved.endAt) {
      const left = Math.ceil((saved.endAt - Date.now()) / 1000);
      if (left > 0 && left <= total + 5) {
        remaining = left;
        running = true;
        endAt = saved.endAt;
        startTicker();
        render();
        return;
      }
      if (left <= 0) {
        complete(true);
        return;
      }
      running = false;
      endAt = 0;
      remaining = total;
      persist();
      render();
      return;
    }

    running = false;
    endAt = 0;
    const savedLeft = Math.round(Number(saved.remaining) || 0);
    remaining = savedLeft > 0 && savedLeft <= total ? savedLeft : total;
    render();
  }

  function reloadFromState() {
    running = false;
    endAt = 0;
    stopTicker();
    mode = 'focus';
    remaining = durationOf(mode);
    restore();
  }

  function openPanel() {
    const panel = el('pomo-panel');
    const fab = el('pomo-fab');
    if (!panel || !fab) return;
    panelOpen = true;
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
    const first = panel.querySelector('[data-pomo-mode].is-active') || el('pomo-toggle');
    if (first) first.focus({ preventScroll: true });
  }

  function closePanel() {
    const panel = el('pomo-panel');
    const fab = el('pomo-fab');
    if (!panel || !fab) return;
    panelOpen = false;
    panel.hidden = true;
    panel.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  }

  function bind() {
    const fab = el('pomo-fab');
    if (fab) fab.addEventListener('click', function () {
      if (panelOpen) closePanel(); else openPanel();
    });
    const close = el('pomo-close');
    if (close) close.addEventListener('click', function () { closePanel(); fab && fab.focus(); });

    const toggle = el('pomo-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      if (running) pause(); else start();
    });
    const rst = el('pomo-reset');
    if (rst) rst.addEventListener('click', reset);

    document.querySelectorAll('[data-pomo-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.pomoMode === mode) { reset(); return; }
        setMode(b.dataset.pomoMode);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
        if (fab) fab.focus();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && running) tick();
    });
    window.addEventListener('focus', function () { if (running) tick(); });
    window.addEventListener('yantu:daychange', function () { render(); });
    window.addEventListener('yantu:statereload', reloadFromState);
  }

  function init() {
    if (!el('pomo')) return;
    bind();
    restore();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
