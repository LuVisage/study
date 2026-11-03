/* 研途 408 · 每日任务生成 */
(function () {
  'use strict';

  const A = window.YTApp;
  const WEEKS = A.WEEKS;
  const PHASES = A.PHASES;
  const SUBJECTS = A.SUBJECTS;
  const START = A.START, PLAN_END = A.PLAN_END;
  const addDays = A.addDays, weekday = A.weekday, activeToday = A.activeToday;

  const TIME = {
    P0: { mathLecture: 55, mathPractice: 40, mathReview: 30, mathTest: 55, c408Study: 50, c408Practice: 35, c408Review: 30, c408Test: 55, engWord: 15, engLong: 20, engRead: 25, engWrite: 20, engTest: 35, cetListen: 15, cetRead: 15, cetWrite: 15, cetMock: 30, algoDaily: 30, algoContest: 55, polStudy: 0, polReview: 0, review: 20, mathExtra: 0, c408Extra: 0 },
    P1: { mathLecture: 80, mathPractice: 65, mathReview: 55, mathTest: 80, c408Study: 75, c408Practice: 55, c408Review: 50, c408Test: 75, engWord: 20, engLong: 25, engRead: 40, engWrite: 30, engTest: 45, cetListen: 20, cetRead: 20, cetWrite: 20, cetMock: 40, algoDaily: 35, algoContest: 70, polStudy: 0, polReview: 0, review: 25, mathExtra: 0, c408Extra: 0 },
    P2: { mathLecture: 85, mathPractice: 70, mathReview: 55, mathTest: 85, c408Study: 70, c408Practice: 55, c408Review: 50, c408Test: 70, engWord: 20, engLong: 25, engRead: 40, engWrite: 30, engTest: 45, cetListen: 20, cetRead: 20, cetWrite: 20, cetMock: 45, algoDaily: 35, algoContest: 70, polStudy: 0, polReview: 0, review: 25, mathExtra: 0, c408Extra: 0 },
    P3: { mathLecture: 90, mathPractice: 70, mathReview: 55, mathTest: 85, c408Study: 80, c408Practice: 60, c408Review: 50, c408Test: 80, engWord: 20, engLong: 25, engRead: 45, engWrite: 30, engTest: 55, cetListen: 25, cetRead: 25, cetWrite: 25, cetMock: 45, algoDaily: 35, algoContest: 75, polStudy: 0, polReview: 0, review: 25, mathExtra: 0, c408Extra: 0 },
    P4: { mathLecture: 105, mathPractice: 85, mathReview: 60, mathTest: 100, c408Study: 100, c408Practice: 75, c408Review: 60, c408Test: 90, engWord: 25, engLong: 30, engRead: 50, engWrite: 35, engTest: 60, cetListen: 0, cetRead: 0, cetWrite: 0, cetMock: 0, algoDaily: 35, algoContest: 90, polStudy: 55, polReview: 40, review: 25, mathExtra: 30, c408Extra: 30 },
    P5: { mathLecture: 100, mathPractice: 80, mathReview: 60, mathTest: 160, c408Study: 95, c408Practice: 70, c408Review: 55, c408Test: 160, engWord: 20, engLong: 30, engRead: 45, engWrite: 35, engTest: 60, cetListen: 0, cetRead: 0, cetWrite: 0, cetMock: 0, algoDaily: 30, algoContest: 50, polStudy: 60, polReview: 45, review: 25, mathExtra: 30, c408Extra: 30 },
    P6: { mathLecture: 95, mathPractice: 75, mathReview: 55, mathTest: 160, c408Study: 90, c408Practice: 70, c408Review: 50, c408Test: 160, engWord: 20, engLong: 30, engRead: 45, engWrite: 35, engTest: 60, cetListen: 0, cetRead: 0, cetWrite: 0, cetMock: 0, algoDaily: 25, algoContest: 45, polStudy: 65, polReview: 50, review: 25, mathExtra: 25, c408Extra: 25 }
  };

  const DETAIL = {
    mathLecture: {
      base: '武忠祥基础课对应章节：先自己推导一遍，再整理成一页笔记，最后做 3 道例题。',
      strength: '强化课 + 辅导讲义例题：遮住答案独立做，卡住再听讲解，重点记思路。',
      sprint: '不刷新课，只回看真题暴露的漏洞；把对应讲义例题再做一遍。'
    },
    mathPractice: {
      base: '课后题 / 660 题 8–10 道：先做后看答案，错题标注错因（概念、计算、思路）。',
      strength: '880 题 / 严选题 8–10 道：限时完成，记录卡壳点，做完立刻订正。',
      sprint: '只做错题与同类题；每道题写完整步骤，训练考场书写。'
    },
    mathReview: '重做本周错题 + 默写公式定理；不刷新题，把会做的做熟。',
    mathTest: {
      base: '限时 60–75 分钟，做完立刻订正，记录失分原因。',
      strength: '限时 90 分钟，按真题节奏；做完先自评，再对答案。',
      sprint: '全真限时 180 分钟；不查资料、不去厕所，模拟考场。'
    },
    c408Study: {
      base: '王道单科书 + 对应视频：画图、写笔记，别只划书；每节后合上书口述框架。',
      strength: '二轮不看视频：先回忆框架再翻书，补第一轮漏点，整理错题页码。',
      sprint: '只看错题与笔记，口述考点；不再从头看书。'
    },
    c408Practice: {
      base: '王道课后选择题：每个选项写出对 / 错原因，错题标回教材页码。',
      strength: '真题分类选择 + 大题：严格计时，大题写完整步骤。',
      sprint: '只做错题与高频题；控制在 40 分钟内，保持手感。'
    },
    c408Review: '画本章思维导图 + 重做本周错题；合上书口述本章框架。',
    c408Test: {
      base: '周测 60 分钟；大题写完整步骤，做完立刻订正。',
      strength: '真题分类 / 套卷限时；严格计时，训练答题顺序。',
      sprint: '全真 180 分钟；按考场顺序答题，先易后难。'
    },
    engWord: '墨墨 / 不背单词：50 新 + 150 复习；只记核心义，不抄写，滚动复习。',
    engLong: '田静《句句真研》2 句：划主干、标从句、翻成中文，再对照答案。',
    engRead: '真题精读：先限时做题，再逐句翻译；每个错项写出错因（偷换、过度、无中生有）。',
    engWrite: '翻译 1 段 / 作文 1 篇：对照范文改，积累 1 个可迁移功能句。',
    engTest: '套卷限时 / 二刷错题；阅读错题必须写原因，不只看分数。',
    cetListen: '六级听力精听 1 篇：先做题，再听写，最后跟读模仿语音语调。',
    cetRead: '六级阅读 1 篇，限时 12 分钟；精读错题所在句，积累高频词。',
    cetWrite: '六级翻译 / 作文 1 篇；对照范文改，背 1 个万能句型。',
    cetMock: '六级真题限时（不含作文 60 分钟）；作文另写，做完统一订正。',
    algo: '专题 1 个 + 2 题；做完必看题解，有余力再补 1 题。按当前 rating ±100 选题，宁少勿断。',
    polStudy: '徐涛 / 腿姐强化课 1 节 + 1000 题对应章节；只做选择，错题标页码。',
    polReview: '1000 题错题二刷 + 本周大题框架；口述关键词，不逐字背。',
    weeklyReview: '统计完成率；把本周错题归类；写下下周最重要的三件事。',
    rest: '不安排学习。睡到自然醒、运动 30 分钟、晒太阳；晚上花 10 分钟看一眼下周计划。'
  };

  function stage(phase) {
    if (phase.id === 'P0' || phase.id === 'P1' || phase.id === 'P2') return 'base';
    if (phase.id === 'P3' || phase.id === 'P4') return 'strength';
    return 'sprint';
  }
  function named(item) {
    if (!item) return '';
    return item.name === '408' ? item.topic : item.name + ' · ' + item.topic;
  }
  function band(phase) {
    return {
      P0: 'CF 800–1000', P1: 'CF 1000–1200', P2: 'CF 1200–1400',
      P3: 'CF 1300–1500', P4: 'CF 1400–1600', P5: 'CF 1400–1600（保持）', P6: '旧题 / 模板'
    }[phase.id];
  }
  function isLate(phase) { return phase.id === 'P4' || phase.id === 'P5' || phase.id === 'P6'; }

  function makeTask(k, subject, key, title, detail, minutes, core) {
    if (minutes == null || minutes <= 0) return null;
    return {
      id: k + ':' + key, subject: subject, key: key,
      title: title, detail: detail, minutes: minutes,
      core: core !== false
    };
  }

  function buildNormal(k, wp, phase) {
    const wd = weekday(k);
    const t = TIME[phase.id];
    const st = stage(phase);
    const cetActive = wp.cet && A.weekNo(k) <= 33 && !/结束/.test(wp.cet);
    const cetMockWeek = cetActive && /模考|真题|冲刺|考试/.test(wp.cet);
    const hasPol = !!wp.pol && k >= '2027-07-01';
    const tasks = [];
    const add = function (subject, key, title, detail, minutes, core) {
      const task = makeTask(k, subject, key, title, detail, minutes, core);
      if (task) tasks.push(task);
    };

    if (k === START) {
      add('review', 'setup', '开营 · 定目标 / 装工具 / 写作息', '写下目标分与作息；装好墨墨/不背单词、错题本、CF 账号；把 2027.12.25 写进日历。', 20);
      add('math', 'math-lecture', wp.math + ' · 听课 + 笔记', DETAIL.mathLecture[st], t.mathLecture);
      add('c408', 'c408-a', named(wp.a) + ' · 教材 + 笔记', DETAIL.c408Study[st], t.c408Study);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      if (cetActive) add('cet', 'cet-listen', '听力精听 1 篇', DETAIL.cetListen, t.cetListen);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
      return tasks;
    }

    if (wd === 1) {
      add('math', 'math-lecture', wp.math + ' · 听课 + 笔记', DETAIL.mathLecture[st], t.mathLecture);
      add('c408', 'c408-a', named(wp.a) + ' · 教材 + 笔记', DETAIL.c408Study[st], t.c408Study);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      add('english', 'eng-long', '长难句 2 句 · 田静句句真研', DETAIL.engLong, t.engLong);
      if (cetActive) add('cet', 'cet-listen', '听力精听 1 篇', DETAIL.cetListen, t.cetListen);
      if (hasPol) add('politics', 'pol-study', '强化课 + 1000 题 · ' + wp.pol, DETAIL.polStudy, t.polStudy);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
      if (isLate(phase)) add('math', 'math-extra', '加餐 · 660/880 错题 5 道', '只做错题，不刷新题；做完写 1 行错因。', t.mathExtra, false);
    } else if (wd === 2) {
      add('math', 'math-practice', wp.math + ' · 例题 + 习题', DETAIL.mathPractice[st], t.mathPractice);
      add('c408', 'c408-b', named(wp.b) + ' · 教材 + 笔记', DETAIL.c408Study[st], t.c408Study);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      if (phase.id === 'P0') add('english', 'eng-read', '长难句 3 句 + 语法', DETAIL.engLong, t.engRead);
      else add('english', 'eng-read', '真题精读 · ' + wp.eng, DETAIL.engRead, t.engRead);
      if (cetActive) add('cet', 'cet-read', '阅读 1 篇 · 限时 12 分钟', DETAIL.cetRead, t.cetRead);
      if (hasPol) add('politics', 'pol-study', '强化课 + 1000 题 · ' + wp.pol, DETAIL.polStudy, t.polStudy);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
      if (isLate(phase)) add('c408', 'c408-extra', '加餐 · 王道选择题 10 道', '只做当天章节，做完对答案，错题标页码。', t.c408Extra, false);
    } else if (wd === 3) {
      add('math', 'math-lecture', wp.math + ' · 听课 + 笔记', DETAIL.mathLecture[st], t.mathLecture);
      add('c408', 'c408-practice-a', named(wp.a) + ' · 王道选择题', DETAIL.c408Practice[st], t.c408Practice);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      add('english', 'eng-long', '长难句 2 句 · 田静句句真研', DETAIL.engLong, t.engLong);
      if (hasPol) add('politics', 'pol-study', '强化课 + 1000 题 · ' + wp.pol, DETAIL.polStudy, t.polStudy);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
    } else if (wd === 4) {
      add('math', 'math-practice', wp.math + ' · 例题 + 习题', DETAIL.mathPractice[st], t.mathPractice);
      add('c408', 'c408-practice-b', named(wp.b) + ' · 王道选择题', DETAIL.c408Practice[st], t.c408Practice);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      if (phase.id === 'P0') add('english', 'eng-read', '长难句 3 句 + 语法', DETAIL.engLong, t.engRead);
      else add('english', 'eng-read', '真题精读 · ' + wp.eng, DETAIL.engRead, t.engRead);
      if (cetActive) add('cet', 'cet-write', '翻译 / 作文 1 篇', DETAIL.cetWrite, t.cetWrite);
      if (hasPol) add('politics', 'pol-study', '强化课 + 1000 题 · ' + wp.pol, DETAIL.polStudy, t.polStudy);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
      if (isLate(phase)) add('math', 'math-extra', '加餐 · 660/880 错题 5 道', '只做错题，不刷新题；做完写 1 行错因。', t.mathExtra, false);
    } else if (wd === 5) {
      add('math', 'math-review', '本周错题重做 + 公式默写', DETAIL.mathReview, t.mathReview);
      add('c408', 'c408-review', '本周错题 + 思维导图', DETAIL.c408Review, t.c408Review);
      add('english', 'eng-word', '单词 50 新 + 150 复习', DETAIL.engWord, t.engWord);
      add('english', 'eng-write', '翻译 / 作文 · ' + wp.eng, DETAIL.engWrite, t.engWrite);
      if (hasPol) add('politics', 'pol-study', '强化课 + 1000 题 · ' + wp.pol, DETAIL.polStudy, t.polStudy);
      add('algo', 'algo-daily', '专题：' + wp.algo + ' · 2 题', DETAIL.algo + ' 当前区间：' + band(phase) + '。', t.algoDaily);
    } else if (wd === 6) {
      var mathTitle;
      if (phase.id === 'P0' || phase.id === 'P1' || phase.id === 'P2') mathTitle = '周测 · ' + wp.math;
      else if (phase.id === 'P3' || phase.id === 'P4') mathTitle = '强化周测 · ' + wp.math;
      else mathTitle = '全真限时 · ' + wp.math;
      add('math', 'math-test', mathTitle, DETAIL.mathTest[st], t.mathTest);
      var c408Title;
      if (phase.id === 'P0' || phase.id === 'P1' || phase.id === 'P2') c408Title = '周测 · ' + wp.a.name + ' + ' + wp.b.name;
      else if (phase.id === 'P3') c408Title = '强化周测 · ' + wp.a.name;
      else if (phase.id === 'P4') c408Title = '真题分类测 · ' + wp.a.name;
      else c408Title = '全真套卷 · ' + wp.a.topic;
      add('c408', 'c408-test', c408Title, DETAIL.c408Test[st], t.c408Test);
      if (phase.id === 'P0') add('english', 'eng-test', '本周复盘 · 单词 + 长难句', '把本周单词过一遍，长难句挑 2 句重译；不刷新题。', t.engTest);
      else add('english', 'eng-test', '套卷 / 二刷 · ' + wp.eng, DETAIL.engTest, t.engTest);
      if (cetMockWeek) add('cet', 'cet-mock', '模考 / 真题 · 六级', DETAIL.cetMock, t.cetMock);
      if (hasPol) add('politics', 'pol-review', '本周错题 + 背诵 · ' + wp.pol, DETAIL.polReview, t.polReview);
      add('algo', 'algo-contest', '周赛 · ABC / CF / 洛谷', '赛后补 1 题，写 3 行总结；不追求 rating，追求补题质量。', t.algoContest, !isLate(phase));
    }
    return tasks;
  }

  function buildLight(k, wp) {
    const tasks = [];
    const add = function (subject, key, title, detail, minutes, core) {
      const task = makeTask(k, subject, key, title, detail, minutes, core);
      if (task) tasks.push(task);
    };
    add('review', 'week-review', '周复盘 · 完成率 / 错题 / 下周计划', DETAIL.weeklyReview, 25);
    add('english', 'eng-word', '单词复习 100 个', '只过今天的复习词，不背新词。', 20, false);
    add('algo', 'algo-review', '补题 1 道 / 复习 1 个模板', '选最弱的一个点，30 分钟即可。', 30, false);
    return tasks;
  }

  function buildCET(k, event) {
    const last = k === '2027-06-19';
    return [
      makeTask(k, 'cet', 'cet-am', '上午 · 作文模板 + 听力热身', '9:00–11:00 轻量过一遍；不刷新题，保持耳朵热。', 90, true),
      makeTask(k, 'cet', 'cet-pm', '15:00–17:25 · 六级考试', '带准考证、学生证、耳机、电池、2B 铅笔；提前 30 分钟到考场。', 145, true),
      makeTask(k, 'review', 'cet-rest', '考后 · 只记 3 条', '不对答案、不纠结；晚上散步，早点睡。', 20, false)
    ];
  }

  function buildPre(k) {
    return [
      makeTask(k, 'review', 'prep-check', '看考场 · 备齐证件与文具', '准考证、身份证、2B 铅笔、黑色签字笔、橡皮、手表；确认路线与天气。', 60, true),
      makeTask(k, 'review', 'prep-review', '公式与错题速览', '只看数学公式、408 高频考点、英语作文模板；不做新题。', 30, true),
      makeTask(k, 'review', 'prep-sleep', '23:00 前睡觉', '不熬夜、不喝咖啡；把明天要穿的衣服放好。', 15, false)
    ];
  }

  function buildExam(k) {
    if (k === '2027-12-25') {
      return [
        makeTask(k, 'politics', 'exam-pol', '政治 · 8:30–11:30', '提前到考场；选择题先稳，分析题写满，字迹清楚。', 180, true),
        makeTask(k, 'english', 'exam-eng', '英语一 · 14:00–17:00', '按平时顺序作答；作文留足 50 分钟，最后 5 分钟涂卡。', 180, true),
        makeTask(k, 'review', 'exam-rest', '晚上 · 不对答案', '吃饭、散步、早睡；明天还有数学和 408。', 10, false)
      ];
    }
    return [
      makeTask(k, 'math', 'exam-math', '数学一 · 8:30–11:30', '先易后难；选填控制在 50 分钟内，大题写清步骤。', 180, true),
      makeTask(k, 'c408', 'exam-408', '408 · 14:00–17:00', '选择 40 分钟内完成；大题先写会做的，算法题写清思路。', 180, true),
      makeTask(k, 'review', 'exam-rest', '考后 · 先休息', '不立刻对答案；好好吃一顿，睡个整觉。', 10, false)
    ];
  }

  const cache = new Map();

  function buildDay(k) {
    if (cache.has(k)) return cache.get(k);
    if (k < START || k > PLAN_END) {
      const empty = { key: k, inPlan: false, tasks: [], rest: null, kind: 'out', theme: '', note: '', autoPass: false };
      cache.set(k, empty);
      return empty;
    }
    const wp = A.weekFor(k);
    const phase = wp ? A.PHASE_BY_ID[wp.phase] : null;
    const event = A.EVENTS[k] || null;
    let tasks = [], rest = null, kind = 'normal', autoPass = false;
    let theme = wp ? wp.theme : '';
    let note = wp ? wp.note : '';
    let restTip = null;

    if (event && event.type === 'exam') {
      tasks = buildExam(k); kind = 'exam'; autoPass = true; theme = '初试 · 把会做的做对';
      note = k === '2027-12-25' ? '今天只做一件事：把平时练的写出来。晚上不对答案。' : '最后一场。考完就解放，先别想结果。';
    } else if (event && event.type === 'cet') {
      tasks = buildCET(k, event); kind = 'event'; autoPass = true; theme = '六级考试日';
      note = k === '2026-12-19' ? '今天的主线只有一件事：把六级考完。' : '最后一次六级。考完即止，之后全部时间转考研英语。';
    } else if (event && event.type === 'pre') {
      tasks = buildPre(k); rest = 'light'; kind = 'pre'; theme = '考前一日 · 轻装';
      note = '明天初试。今天只做三件事：看考场、过一遍公式、早睡。';
    } else if (A.isFullRest(k)) {
      rest = 'full'; kind = 'rest'; tasks = []; theme = '全休 · 把电充满'; autoPass = true;
      note = (wp && wp.note ? wp.note + ' ' : '') + '不补课、不内疚。休息也是计划的一部分。';
      restTip = ['睡到自然醒', '运动 30 分钟', '晒太阳 / 散步', '晚上 10 分钟看一眼下周计划'];
    } else if (A.isLightRest(k)) {
      tasks = buildLight(k, wp); rest = 'light'; kind = 'light'; theme = (wp ? wp.theme : '半休');
      note = (wp && wp.note ? wp.note + ' ' : '') + '半休日：上午完成复盘，下午和晚上休息。';
    } else {
      tasks = buildNormal(k, wp, phase);
    }

    const totalMinutes = tasks.reduce(function (s, t) { return s + t.minutes; }, 0);
    const day = {
      key: k, inPlan: true, weekNo: A.weekNo(k), week: wp, phase: phase,
      phaseId: phase ? phase.id : '', theme: theme, note: note,
      tasks: tasks, rest: rest, kind: kind, autoPass: autoPass,
      event: event, restTip: restTip, totalMinutes: totalMinutes
    };
    cache.set(k, day);
    return day;
  }

  function dayStats(day) {
    const core = day.tasks.filter(function (t) { return t.core; });
    const optional = day.tasks.filter(function (t) { return !t.core; });
    const coreDone = core.filter(function (t) { return A.isChecked(t.id); }).length;
    const optDone = optional.filter(function (t) { return A.isChecked(t.id); }).length;
    const minutesDone = day.tasks.reduce(function (s, t) { return s + (A.isChecked(t.id) ? t.minutes : 0); }, 0);
    const coreTotal = core.length;
    const percent = coreTotal ? Math.round(coreDone / coreTotal * 100) : (day.rest === 'full' ? 100 : 0);
    const passLine = coreTotal ? Math.ceil(coreTotal * 0.6) : 0;
    const passed = isPassedDay(day);
    return {
      coreTotal: coreTotal, coreDone: coreDone, optTotal: optional.length, optDone: optDone,
      allTotal: day.tasks.length, allDone: coreDone + optDone,
      minutesDone: minutesDone, minutesTotal: day.totalMinutes,
      percent: percent, passLine: passLine, passed: passed
    };
  }

  function isPassedDay(day) {
    if (!day || !day.inPlan) return false;
    if (day.rest === 'full' || day.autoPass) return true;
    const core = day.tasks.filter(function (t) { return t.core; });
    if (!core.length) return day.tasks.some(function (t) { return A.isChecked(t.id); });
    const done = core.filter(function (t) { return A.isChecked(t.id); }).length;
    return done >= Math.ceil(core.length * 0.6);
  }

  function streakInfo() {
    const today = activeToday();
    if (today < START) return { current: 0, longest: 0, todayPassed: false, today: today };
    const todayDay = buildDay(today);
    const todayPassed = isPassedDay(todayDay);
    let cursor = today;
    if (!todayPassed) cursor = addDays(cursor, -1);
    let current = 0;
    while (cursor >= START) {
      const d = buildDay(cursor);
      if (isPassedDay(d)) { current++; cursor = addDays(cursor, -1); }
      else break;
    }
    let longest = 0, run = 0;
    let d = START;
    while (d <= today) {
      if (isPassedDay(buildDay(d))) { run++; if (run > longest) longest = run; }
      else run = 0;
      d = addDays(d, 1);
    }
    return { current: current, longest: longest, todayPassed: todayPassed, today: today };
  }

  function nextRest(k) {
    let nextFull = null, nextLight = null;
    for (let i = 1; i <= 120; i++) {
      const d = addDays(k, i);
      if (d > PLAN_END) break;
      if (!nextFull && A.isFullRest(d)) nextFull = d;
      if (!nextLight && A.isLightRest(d)) nextLight = d;
      if (nextFull && nextLight) break;
    }
    return { full: nextFull, light: nextLight };
  }

  A.getDay = buildDay;
  A.dayStats = dayStats;
  A.isPassedDay = isPassedDay;
  A.streakInfo = streakInfo;
  A.nextRest = nextRest;
  A.TIME = TIME;
})();
