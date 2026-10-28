// 부정맥 리듬 띠 비교 — II유도 띠가 흘러가고, 아래 사다리 그림(심방–AV결절–심실)이
// 같은 시간축으로 P와 QRS의 관계(전도·지연·탈락·해리)를 보여 준다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var DT = 0.004;            // 표본 간격(초)
  var PXS = 100;             // 1초 = 100px → 작은 칸(0.04초) = 4px, 큰 칸(0.2초) = 20px
  var X0 = 56, X1 = 448;     // 띠 가로 범위
  var NOW = X1 - 8;          // 지금(기록 펜) 위치
  var WIN = (NOW - X0) / PXS; // 화면에 보이는 시간(초)
  var BASE = 124, AMP = 60;  // 기준선 y, 1.0 = 60px

  // 결정적 의사난수
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ── 리듬별 박동 일정 ── P:[{t}], Q:[{t, wide, p(전도한 P 시각 또는 null)}], drop:[P 시각]
  function schedule(kind) {
    var P = [], Q = [], drop = [], per, i;
    if (kind === 'nsr' || kind === 'avb1') {
      per = 12; var pr = kind === 'nsr' ? 0.16 : 0.30;
      for (i = 0; i < 15; i++) { var tp = 0.1 + i * 0.8; P.push(tp); Q.push({ t: tp + pr, p: tp }); }
    } else if (kind === 'af') {
      per = 12; var r = rng(7), rr = [], sum = 0;
      for (i = 0; i < 15; i++) { var v = 0.46 + r() * 0.62; rr.push(v); sum += v; }
      var k = per / sum, acc = 0.2;
      rr.forEach(function (v) { Q.push({ t: acc, p: null }); acc += v * k; });
    } else if (kind === 'mobitz1') {
      per = 12.8; var prs = [0.18, 0.28, 0.34, null];
      for (i = 0; i < 16; i++) { var t1 = 0.1 + i * 0.8, q = prs[i % 4]; P.push(t1); if (q == null) drop.push(t1); else Q.push({ t: t1 + q, p: t1 }); }
    } else if (kind === 'mobitz2') {
      per = 12.8; var dr = { 3: 1, 8: 1, 13: 1 };
      for (i = 0; i < 16; i++) { var t2 = 0.1 + i * 0.8; P.push(t2); if (dr[i]) drop.push(t2); else Q.push({ t: t2 + 0.18, p: t2 }); }
    } else { // avb3
      per = 11.2;
      for (i = 0; i < 16; i++) P.push(0.05 + i * 0.7);
      for (i = 0; i < 7; i++) Q.push({ t: 0.4 + i * 1.6, p: null, wide: true });
    }
    return { per: per, P: P, Q: Q, drop: drop, kind: kind };
  }

  function qrsShape(x, wide) {
    var pts = wide ? [[0, 0], [0.3, 0.7], [0.55, 0.82], [0.85, -0.12], [1, 0]] : [[0, 0], [0.15, -0.1], [0.45, 1.0], [0.75, -0.25], [1, 0]];
    for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
    return 0;
  }
  var PDUR = 0.10, QN = 0.08, QW = 0.16;

  function buildSamples(S) {
    var n = Math.round(S.per / DT), v = new Float32Array(n), per = S.per;
    function addAt(t0, dur, fn) {
      var i0 = Math.floor(t0 / DT), i1 = Math.ceil((t0 + dur) / DT);
      for (var i = i0; i <= i1; i++) {
        var x = (i * DT - t0) / dur; if (x < 0 || x > 1) continue;
        var j = ((i % n) + n) % n; v[j] += fn(x);
      }
    }
    S.P.forEach(function (t) { addAt(t, PDUR, function (x) { return 0.17 * Math.sin(Math.PI * x); }); });
    S.Q.forEach(function (q) {
      var d = q.wide ? QW : QN;
      addAt(q.t, d, function (x) { return qrsShape(x, q.wide); });
      addAt(q.t + d + (q.wide ? 0.1 : 0.08), q.wide ? 0.22 : 0.18, function (x) { return (q.wide ? -0.3 : 0.27) * Math.sin(Math.PI * x); });
    });
    if (S.kind === 'af') {
      for (var i = 0; i < n; i++) {
        var t = i * DT, w = 2 * Math.PI / per;
        v[i] += (0.035 + 0.015 * Math.sin(w * 3 * t)) * Math.sin(w * 75 * t + 0.4) + 0.022 * Math.sin(w * 107 * t + 1.3) + 0.014 * Math.sin(w * 49 * t + 2.1);
      }
    }
    S.v = v; S.n = n;
    return S;
  }
  function sample(S, tau) { var i = Math.round(tau / DT); return S.v[((i % S.n) + S.n) % S.n]; }

  var CACHE = {};
  function get(kind) { return CACHE[kind] || (CACHE[kind] = buildSamples(schedule(kind))); }

  var INFO = {
    nsr: { name: '정상 동율동', hr: '75회/분', k1: 'PR 0.12~0.20초 · QRS <0.12초 · 모든 P 뒤에 QRS', k2: 'RR 일정 · 심박수 60~100회/분' },
    af: { name: '심방세동(AF)', hr: '약 75회/분, 불규칙', k1: 'P파 없음 · 잔물결(f파) · RR 완전히 불규칙', k2: '뇌졸중 예방 항응고(와파린 INR 2~3 / NOAC) · 맥박 결손' },
    avb1: { name: '1도 방실차단', hr: '75회/분', k1: 'PR > 0.20초, 박동마다 같은 값', k2: '빠지는 QRS 없음 · 대개 경과 관찰' },
    mobitz1: { name: '2도 방실차단 Mobitz I(웬케바흐)', hr: '약 56회/분', k1: 'PR 점점 길어짐 → QRS 탈락 → 다시 짧아짐', k2: '주로 AV결절 수준 · 비교적 양성' },
    mobitz2: { name: '2도 방실차단 Mobitz II', hr: '약 61회/분', k1: 'PR 일정 + 예고 없이 QRS 탈락', k2: '3도로 진행 위험 → 인공심박조율기' },
    avb3: { name: '3도(완전) 방실차단', hr: '심방 86 · 심실 37회/분', k1: 'P–P 일정 · R–R 일정 · PR은 제멋대로(방실해리)', k2: '느리고 넓은 이탈 QRS → 응급, 인공심박조율기' }
  };

  var STEPS = {
    nsr: [
      { at: 0, label: '정상 동율동', text: '**동방결절**이 박동을 만들고 모든 **P파 뒤에 QRS**가 하나씩 따라온다. 심박수 **60~100회/분**, RR 간격이 일정하다.' },
      { at: 3, label: 'PR 간격', text: 'P 시작~QRS 시작 = **PR 간격 0.12~0.20초**(작은 칸 3~5개). 아래 사다리 그림에서 심방→AV→심실로 내려가는 사선의 기울기가 PR이다.' },
      { at: 6, label: 'QRS 폭', text: '**QRS 0.12초 미만**(작은 칸 3개 미만)이면 정상 경로(히스속·각)로 내려온 것이다. 넓으면 각차단이나 심실에서 시작된 박동을 의심한다.' },
      { at: 9, label: '심박수 세기', text: '규칙적이면 **300 ÷ R–R 사이 큰 칸 수**(또는 1500 ÷ 작은 칸 수). 불규칙하면 **6초 동안의 QRS 수 × 10**.' }
    ],
    af: [
      { at: 0, label: '심방세동', text: '심방 곳곳에서 전기가 제멋대로 튀어(분당 350~600회) **P파가 사라지고** 기준선이 **잔물결(f파)**로 떨린다.' },
      { at: 3, label: '불규칙한 RR', text: 'AV결절이 그중 일부만 들쭉날쭉 통과시켜 **RR 간격이 완전히 불규칙(irregularly irregular)**하다. 띠 위쪽 숫자(RR, 초)가 매번 다르다.' },
      { at: 6, label: '맥박 결손', text: 'RR이 짧은 박동은 심실이 덜 차서 손목까지 맥이 잘 전달되지 않는다. **심첨맥박 > 요골맥박(맥박 결손)**. 심첨맥박을 **1분 동안** 청진한다.' },
      { at: 9, label: '뇌졸중 예방', text: '심방이 떨기만 해 **좌심방이**에 피가 고여 **혈전 → 뇌졸중** 위험. **와파린(INR 2~3)** 또는 **NOAC**로 항응고하고, 심박수 조절(베타차단제·디곡신 등)을 한다. 와파린은 비타민 K 음식·출혈 징후 교육이 따라온다.' }
    ],
    avb1: [
      { at: 0, label: '1도 방실차단', text: '모든 P 뒤에 QRS가 따라오지만 **PR이 0.20초보다 길고 매번 같다**. AV결절 통과가 느려졌을 뿐 빠지는 박동은 없다.' },
      { at: 4, label: 'PR 재기', text: '여기서는 PR **0.30초**(작은 칸 7.5개). 박동마다 같은 값이다. 대개 **증상이 없어 경과 관찰**한다.' },
      { at: 8, label: '원인·약물', text: '노화에 따른 전도계 변화, 하벽 심근경색, **AV결절을 늦추는 약(디곡신·베타차단제·비디하이드로피리딘계 칼슘통로차단제)**이 흔한 원인이다. 투약 전 맥박을 확인한다.' }
    ],
    mobitz1: [
      { at: 0, label: 'Mobitz I', text: '**웬케바흐(Wenckebach)**. PR이 박동마다 **점점 길어지다가** P 뒤에 **QRS 하나가 빠진다**. 그 뒤 PR이 다시 짧아지며 같은 묶음이 반복된다.' },
      { at: 3.2, label: 'PR 점점 길어짐', text: 'PR 0.18 → 0.28 → 0.34초. 사다리 그림의 사선이 박동마다 더 눕는다. AV결절이 점점 지쳐 가는 모양이다.' },
      { at: 6.4, label: 'QRS 탈락', text: 'P는 제때 나왔는데 **QRS가 없다**. 한 번 쉬고 나면 AV결절이 회복해 PR이 다시 짧아진다. RR은 묶음 단위로 불규칙하다.' },
      { at: 9.6, label: '위험도', text: '대개 **AV결절** 수준의 차단이라 **비교적 양성**이다. 하벽 심근경색·약물(디곡신·베타차단제)을 확인하고, 증상이 있는 서맥이면 **아트로핀**을 쓴다.' }
    ],
    mobitz2: [
      { at: 0, label: 'Mobitz II', text: '**PR은 일정**한데(0.18초) 예고 없이 **갑자기 QRS가 빠진다**. Mobitz I과 달리 빠지기 전에 PR이 늘어나지 않는다.' },
      { at: 4.3, label: 'PR 고정', text: '사다리 그림에서 전도되는 박동의 사선 기울기가 **모두 같다**. 차단 위치가 주로 **히스속 아래**라 QRS가 넓은 경우가 많다.' },
      { at: 8.6, label: '위험', text: '**3도(완전) 방실차단으로 진행**하거나 갑자기 심정지가 올 수 있다. 어지럼·실신을 관찰하고, **인공심박조율기**가 필요한 경우가 많다. 아트로핀 효과는 기대하기 어렵다.' }
    ],
    avb3: [
      { at: 0, label: '3도 방실차단', text: '심방의 전기가 **하나도 심실로 내려가지 못한다**. P파는 자기 박자(86회/분)대로, QRS는 따로 자기 박자(37회/분)대로 뛴다. 이것이 **방실해리**다.' },
      { at: 3.7, label: 'P·QRS 따로', text: 'P–P 간격도 일정, R–R 간격도 일정한데 **PR 간격은 제멋대로**다. P가 QRS나 T파 속에 묻히기도 한다. 사다리 그림에서 위아래가 끊겨 있다.' },
      { at: 7.4, label: '느리고 넓은 QRS', text: '심실에서 나온 **이탈 박동**이라 **느리고(20~40회/분) QRS가 넓다**. 심박출량이 떨어져 어지럼·실신(**아담스-스토크스 발작**)이 온다.' },
      { at: 9.3, label: '치료', text: '**응급**이다. 경피 심박조율 → **영구 인공심박조율기**. 조율기 환자는 매일 맥박 측정, 강한 자기장 주의를 교육한다.' }
    ]
  };
  var DURS = { nsr: 12, af: 12, avb1: 12, mobitz1: 12.8, mobitz2: 12.8, avb3: 11.2 };

  M.register({
    id: 'arrhythmia-strips',
    title: '부정맥 리듬 띠 비교 — P와 QRS의 관계 읽기',
    system: '순환기',
    topics: ['arrhythmia', 'antiarrhythmic-drugs', 'anticoagulants', 'cardio-assessment'],
    duration: 12,
    options: [{
      key: 'rhythm', label: '리듬',
      choices: [
        { value: 'nsr', label: '정상' }, { value: 'af', label: '심방세동' }, { value: 'avb1', label: '1도 차단' },
        { value: 'mobitz1', label: '2도 Mobitz I' }, { value: 'mobitz2', label: '2도 Mobitz II' }, { value: 'avb3', label: '3도 차단' }
      ],
      value: 'nsr'
    }],
    steps: STEPS.nsr,
    stepsFor: function (o) { return STEPS[o.rhythm] || STEPS.nsr; },
    durationFor: function (o) { return DURS[o.rhythm] || 12; },
    source: '기준: 작은 칸 0.04초·큰 칸 0.2초(25mm/s), PR 0.12~0.20초, QRS <0.12초. 리듬 띠는 설명용으로 단순화한 그림이다.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var PC = C.clay, QC = C.blue, LINK = C.gold;
      var cardSh = K.shadow(svg, 3, 5, 0.16);
      var pillSh = K.shadow(svg, 1.5, 2, 0.22);
      var glowS = K.glow(svg, 2.4);
      var glowL = K.glow(svg, 1.2);

      // ── 머리글 ──
      var head = K.label(svg, 14, 12, '', { size: 15, weight: 800, anchor: 'start', fill: C.ink });
      var name = el('tspan', null, head);
      var hr = el('tspan', { dx: 10, 'font-size': 12.5, 'font-weight': 600, fill: C.muted }, head);

      // ── 심전도 카드 ──
      var PY0 = 30, PY1 = 176;
      el('rect', { x: 10, y: 22, width: 446, height: 162, rx: 14, fill: '#fff', filter: cardSh }, svg);
      var clipP = el('clipPath', { id: 'nmArPaper' }, defs);
      el('rect', { x: X0, y: PY0, width: X1 - X0, height: PY1 - PY0, rx: 8 }, clipP);
      el('rect', { x: X0, y: PY0, width: X1 - X0, height: PY1 - PY0, rx: 8, fill: '#fffafa', stroke: '#f3d9d9' }, svg);
      var gridWrap = el('g', { 'clip-path': 'url(#nmArPaper)' }, svg);
      var grid = el('g', null, gridWrap);
      for (var j = -110; j <= 6; j++) {
        var gx = NOW + 4 * j, big = j % 5 === 0;
        el('line', { x1: gx, y1: PY0, x2: gx, y2: PY1, stroke: big ? '#f5cfcf' : '#fbeaea', 'stroke-width': big ? 1 : 0.6 }, grid);
      }
      for (var gy = PY0 + ((BASE - PY0) % 4); gy <= PY1; gy += 4) {
        var bigY = Math.round((BASE - gy) / 4) % 5 === 0;
        el('line', { x1: X0, y1: gy, x2: X1, y2: gy, stroke: bigY ? '#f5cfcf' : '#fbeaea', 'stroke-width': bigY ? 1 : 0.6 }, gridWrap);
      }
      K.label(svg, 33, BASE - 6, 'II', { size: 14, weight: 800, fill: C.navy });
      K.label(svg, 33, BASE + 12, '유도', { size: 12, weight: 600, fill: C.muted });

      var traceG = el('g', { 'clip-path': 'url(#nmArPaper)' }, svg);
      var nowLine = el('line', { x1: NOW, y1: PY0, x2: NOW, y2: PY1, stroke: '#e8b04a', 'stroke-width': 1, opacity: 0.35 }, traceG);
      var rrLine = el('path', { fill: 'none', stroke: '#a7b2bd', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, traceG);
      var trace = el('path', { fill: 'none', stroke: '#22323b', 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, traceG);
      var pOver = el('path', { fill: 'none', stroke: PC, 'stroke-width': 3.4, 'stroke-linecap': 'round', filter: glowL }, traceG);
      var qOver = el('path', { fill: 'none', stroke: QC, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: glowL }, traceG);
      var prBr = el('path', { fill: 'none', stroke: LINK, 'stroke-width': 2 }, traceG);
      var pen = el('circle', { r: 4.6, fill: '#fff4cf', stroke: '#e0862a', 'stroke-width': 2, filter: glowS }, svg);

      function pool(n, o) { var a = []; for (var i = 0; i < n; i++) a.push(K.label(traceG, -99, -99, '', o)); return a; }
      var pTags = pool(10, { size: 12, weight: 800, fill: PC });
      var prTxt = pool(8, { size: 12, weight: 700, fill: '#8a6420' });
      var dropTxt = pool(4, { size: 12, weight: 800, fill: C.clay });
      var rrTxt = pool(8, { size: 12, weight: 700, fill: C.muted });
      var fTag = K.label(traceG, -99, -99, 'f파(잔물결)', { size: 12, weight: 700, fill: PC });

      // ── 사다리 카드 ──
      var LY = { a0: 200, a1: 218, v0: 252, v1: 270 };
      el('rect', { x: 10, y: 192, width: 446, height: 86, rx: 14, fill: '#fff', filter: cardSh }, svg);
      var band = el('g', null, svg);
      el('rect', { x: X0, y: LY.a0, width: X1 - X0, height: LY.a1 - LY.a0, rx: 4, fill: '#fbf1ee' }, band);
      el('rect', { x: X0, y: LY.a1, width: X1 - X0, height: LY.v0 - LY.a1, fill: '#f7f8f6' }, band);
      el('rect', { x: X0, y: LY.v0, width: X1 - X0, height: LY.v1 - LY.v0, rx: 4, fill: '#eef3f8' }, band);
      K.label(svg, 33, (LY.a0 + LY.a1) / 2, '심방', { size: 12, fill: PC, weight: 700 });
      K.label(svg, 33, (LY.a1 + LY.v0) / 2, 'AV', { size: 12, fill: C.muted, weight: 700 });
      K.label(svg, 33, (LY.v0 + LY.v1) / 2, '심실', { size: 12, fill: QC, weight: 700 });
      var clipL = el('clipPath', { id: 'nmArLad' }, defs);
      el('rect', { x: X0, y: LY.a0 - 6, width: X1 - X0, height: LY.v1 - LY.a0 + 12 }, clipL);
      var ladG = el('g', { 'clip-path': 'url(#nmArLad)' }, svg);
      el('line', { x1: NOW, y1: LY.a0, x2: NOW, y2: LY.v1, stroke: '#e8b04a', 'stroke-width': 1, opacity: 0.35 }, ladG);
      var lA = el('path', { fill: 'none', stroke: PC, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, ladG);
      var lAV = el('path', { fill: 'none', stroke: '#3a4a54', 'stroke-width': 1.9, 'stroke-linecap': 'round' }, ladG);
      var lBlk = el('path', { fill: 'none', stroke: C.clay, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, ladG);
      var lV = el('path', { fill: 'none', stroke: QC, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, ladG);
      var lEsc = el('path', { fill: K.sphere(svg, QC) }, ladG);
      var beads = [];
      for (var bi = 0; bi < 4; bi++) beads.push(el('circle', { r: 5, fill: '#fff4cf', stroke: '#e0862a', 'stroke-width': 1.8, filter: glowS, opacity: 0 }, svg));

      // ── 오른쪽: 작은 심장(그 순간 어디가 뛰나) ──
      var heart = el('g', null, svg);
      var IX = 448, IY = 14, IS = 152;
      function P(nx, ny) { return [IX + IS * nx, IY + IS * ny]; }
      function poly(pts) { return 'M' + pts.map(function (q) { var a = P(q[0], q[1]); return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L') + ' Z'; }
      K.image(heart, 'heart', IX, IY, IS, IS, { fadeR: '62%' });
      var wg = el('radialGradient', { id: 'nmArWave' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#ffe27a', 'stop-opacity': 0.95 }, wg);
      el('stop', { offset: '70%', 'stop-color': '#ffb238', 'stop-opacity': 0.6 }, wg);
      el('stop', { offset: '100%', 'stop-color': '#ff9a1f', 'stop-opacity': 0.15 }, wg);
      var atria = el('path', { d: poly([[0.24, 0.33], [0.30, 0.27], [0.42, 0.27], [0.49, 0.33], [0.50, 0.50], [0.40, 0.53], [0.27, 0.53], [0.22, 0.45]]) + ' ' +
        poly([[0.53, 0.38], [0.58, 0.31], [0.70, 0.30], [0.77, 0.36], [0.77, 0.47], [0.70, 0.52], [0.58, 0.52], [0.53, 0.47]]), fill: 'url(#nmArWave)', opacity: 0, filter: glowL }, heart);
      var vents = el('path', { d: poly([[0.24, 0.55], [0.50, 0.53], [0.53, 0.70], [0.60, 0.88], [0.45, 0.84], [0.32, 0.76], [0.24, 0.65]]) + ' ' +
        poly([[0.53, 0.53], [0.80, 0.50], [0.84, 0.62], [0.79, 0.80], [0.67, 0.93], [0.60, 0.88], [0.53, 0.70]]), fill: 'url(#nmArWave)', opacity: 0, filter: glowL }, heart);
      var avP = P(0.485, 0.50), saP = P(0.37, 0.30);
      var avDot = el('circle', { cx: avP[0], cy: avP[1], r: 4, fill: '#fff2b0', stroke: '#e0862a', 'stroke-width': 1.6, filter: glowS, opacity: 0.5 }, heart);
      var saDot = el('circle', { cx: saP[0], cy: saP[1], r: 4, fill: '#fff2b0', stroke: '#e0862a', 'stroke-width': 1.6, filter: glowS, opacity: 0.5 }, heart);
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        var r = el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, r: r, t: tx };
      }
      var q = P(0.17, 0.30); pill(heart, q[0] + 6, q[1], '심방', PC);
      q = P(0.17, 0.74); pill(heart, q[0] + 6, q[1], '심실', QC);
      var nowPill = pill(svg, 524, 176, '', C.ink, 12);

      // ── 오른쪽 아래: 범례 카드 ──
      el('rect', { x: 466, y: 192, width: 124, height: 86, rx: 14, fill: '#fff', filter: cardSh }, svg);
      el('line', { x1: 480, y1: 210, x2: 496, y2: 210, stroke: PC, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      K.label(svg, 502, 210, 'P파(심방)', { size: 12, anchor: 'start', fill: PC, weight: 700 });
      el('line', { x1: 480, y1: 230, x2: 496, y2: 230, stroke: QC, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      K.label(svg, 502, 230, 'QRS(심실)', { size: 12, anchor: 'start', fill: QC, weight: 700 });
      K.label(svg, 480, 252, '작은 칸 0.04초', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });
      K.label(svg, 480, 268, '큰 칸 0.2초', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });

      // 핵심 줄
      var k1 = K.label(svg, 14, 300, '', { size: 13, weight: 700, anchor: 'start', fill: C.ink });
      var k2 = K.label(svg, 14, 322, '', { size: 13, weight: 700, anchor: 'start', fill: C.teal });

      var cur = null, S = null;
      function xOf(tau, t) { return NOW - (t - tau) * PXS; }
      function inWin(tau, t, pad) {
        var out = [];
        for (var k = -1; k <= 1; k++) { var x = tau + k * S.per; if (x >= t - WIN - (pad || 0) && x <= t + (pad || 0)) out.push(x); }
        return out;
      }
      function seg(t0, t1, t) {
        var d = '';
        for (var tau = t0; tau <= t1 + 1e-9; tau += DT) d += (d ? ' L' : 'M') + xOf(tau, t).toFixed(1) + ',' + (BASE - AMP * sample(S, tau)).toFixed(1);
        return d;
      }
      // 주기 감은 사건 중 지금(t) 기준으로 가장 최근(t 이하) 시각
      function lastBefore(list, t) {
        var best = -1e9;
        list.forEach(function (x0) { for (var k = -1; k <= 0; k++) { var x = x0 + k * S.per; if (x <= t && x > best) best = x; } });
        return best;
      }

      return function render(t, o) {
        var kind = o.rhythm || 'nsr';
        if (kind !== cur) {
          cur = kind; S = get(kind);
          name.textContent = INFO[kind].name;
          hr.textContent = INFO[kind].hr;
          k1.textContent = INFO[kind].k1; k2.textContent = INFO[kind].k2;
        }
        t = ((t % S.per) + S.per) % S.per;
        var s = (t * PXS) % 20;
        grid.setAttribute('transform', 'translate(' + (-s).toFixed(2) + ',0)');
        trace.setAttribute('d', seg(t - WIN, t, t));
        pen.setAttribute('cx', NOW); pen.setAttribute('cy', (BASE - AMP * sample(S, t)).toFixed(1));

        var dP = '', dQ = '', dBr = '', dRR = '';
        var la = '', lav = '', lb = '', lv = '', le = '';
        var pi = 0, pri = 0, di = 0, ri = 0;
        var bd = [];   // 사다리 구슬 [y]
        S.P.forEach(function (p0) {
          inWin(p0, t, 0.3).forEach(function (p) {
            dP += ' ' + seg(p, Math.min(p + PDUR, t), t);
            var x = xOf(p + PDUR / 2, t);
            if (pi < pTags.length && p + PDUR / 2 <= t) { pTags[pi].setAttribute('x', x.toFixed(1)); pTags[pi].setAttribute('y', BASE - 24); pTags[pi].textContent = 'P'; pi++; }
            var xa = xOf(p, t);
            if (p <= t) la += 'M' + xa.toFixed(1) + ',' + LY.a0 + ' L' + xa.toFixed(1) + ',' + LY.a1;
            if (t >= p && t < p + PDUR) bd.push((LY.a0 + LY.a1) / 2);
            if (kind === 'avb3' && p <= t) {
              var tb = Math.min(t, p + 0.1), xb3 = xOf(tb, t), ym3 = LY.a1 + ((LY.a1 + LY.v0) / 2 - LY.a1) * (tb - p) / 0.1;
              lb += 'M' + xa.toFixed(1) + ',' + LY.a1 + ' L' + xb3.toFixed(1) + ',' + ym3.toFixed(1);
              if (tb === p + 0.1) lb += ' M' + (xb3 - 5).toFixed(1) + ',' + (ym3 + 5) + ' L' + (xb3 + 5).toFixed(1) + ',' + (ym3 - 5);
              else bd.push(ym3);
            }
          });
        });
        S.drop.forEach(function (p0) {
          inWin(p0, t, 0.3).forEach(function (p) {
            if (p > t) return;
            var tb = Math.min(t, p + 0.14), xa = xOf(p, t), xb = xOf(tb, t);
            var ym = LY.a1 + ((LY.a1 + LY.v0) / 2 + 4 - LY.a1) * (tb - p) / 0.14;
            lb += 'M' + xa.toFixed(1) + ',' + LY.a1 + ' L' + xb.toFixed(1) + ',' + ym.toFixed(1);
            if (tb === p + 0.14) lb += ' M' + (xb - 6).toFixed(1) + ',' + (ym + 5) + ' L' + (xb + 6).toFixed(1) + ',' + (ym - 5);
            else bd.push(ym);
            if (di < dropTxt.length && t >= p + 0.3) { dropTxt[di].setAttribute('x', xOf(p + 0.3, t).toFixed(1)); dropTxt[di].setAttribute('y', BASE + 38); dropTxt[di].textContent = 'QRS 없음'; di++; }
          });
        });
        var rs = [];
        S.Q.forEach(function (q0) {
          inWin(q0.t, t, 0.8).forEach(function (qt) {
            var d = q0.wide ? QW : QN;
            var pt = q0.p != null ? qt - (q0.t - q0.p) : null;
            // 전도 사선(AV): 지금까지 진행한 만큼만
            if (pt != null && pt <= t) {
              var tb = Math.min(t, qt), xp = xOf(pt, t), xq = xOf(tb, t);
              var yb = LY.a1 + (LY.v0 - LY.a1) * (tb - pt) / (qt - pt);
              lav += 'M' + xp.toFixed(1) + ',' + LY.a1 + ' L' + xq.toFixed(1) + ',' + yb.toFixed(1);
              if (t < qt) bd.push(yb);
            } else if (kind === 'af' && qt - 0.1 <= t) {
              var ts = qt - 0.1, tb2 = Math.min(t, qt), yb2 = LY.a1 + (LY.v0 - LY.a1) * (tb2 - ts) / 0.1;
              lav += 'M' + xOf(ts, t).toFixed(1) + ',' + LY.a1 + ' L' + xOf(tb2, t).toFixed(1) + ',' + yb2.toFixed(1);
              if (t < qt) bd.push(yb2);
            }
            if (qt > t) return;
            dQ += ' ' + seg(qt, Math.min(qt + d, t), t);
            var xq2 = xOf(qt, t);
            rs.push(qt + d * 0.45);
            lv += 'M' + xq2.toFixed(1) + ',' + LY.v0 + ' L' + xq2.toFixed(1) + ',' + LY.v1;
            if (t >= qt && t < qt + d + 0.04) bd.push((LY.v0 + LY.v1) / 2);
            if (pt != null) {
              var xp2 = xOf(pt, t), ybr = BASE + 22;
              dBr += 'M' + xp2.toFixed(1) + ',' + (ybr - 5) + ' L' + xp2.toFixed(1) + ',' + ybr + ' L' + xq2.toFixed(1) + ',' + ybr + ' L' + xq2.toFixed(1) + ',' + (ybr - 5);
              if (pri < prTxt.length) {
                prTxt[pri].setAttribute('x', ((xp2 + xq2) / 2).toFixed(1)); prTxt[pri].setAttribute('y', ybr + 14);
                prTxt[pri].textContent = (q0.t - q0.p).toFixed(2) + '초'; pri++;
              }
            } else if (kind !== 'af') {
              le += 'M' + xq2.toFixed(1) + ',' + (LY.v1 - 3) + ' m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0';
            }
          });
        });
        if (kind === 'af' || kind === 'avb3') {
          rs.sort(function (a, b) { return a - b; });
          for (var i = 1; i < rs.length; i++) {
            var xa2 = xOf(rs[i - 1], t), xb2 = xOf(rs[i], t);
            dRR += 'M' + xa2.toFixed(1) + ',' + 46 + ' L' + xb2.toFixed(1) + ',' + 46;
            if (ri < rrTxt.length) { rrTxt[ri].setAttribute('x', ((xa2 + xb2) / 2).toFixed(1)); rrTxt[ri].setAttribute('y', 38); rrTxt[ri].textContent = (rs[i] - rs[i - 1]).toFixed(2) + '초'; ri++; }
          }
        }
        if (kind === 'af') {
          var dd = '', w = 2 * Math.PI / S.per;
          for (var tau = t - WIN; tau <= t; tau += 0.02) {
            var y = (LY.a0 + LY.a1) / 2 + 6 * Math.sin(w * 75 * tau * 1.9 + 0.4) * Math.sin(w * 49 * tau + 1);
            dd += (dd ? ' L' : 'M') + xOf(tau, t).toFixed(1) + ',' + y.toFixed(1);
          }
          la = dd;
          fTag.setAttribute('x', X0 + 110); fTag.setAttribute('y', BASE + 30); fTag.setAttribute('opacity', 1);
        } else fTag.setAttribute('opacity', 0);

        pOver.setAttribute('d', dP); qOver.setAttribute('d', dQ); prBr.setAttribute('d', dBr); rrLine.setAttribute('d', dRR);
        lA.setAttribute('d', la); lAV.setAttribute('d', lav); lBlk.setAttribute('d', lb); lV.setAttribute('d', lv); lEsc.setAttribute('d', le);
        for (; pi < pTags.length; pi++) pTags[pi].textContent = '';
        for (; pri < prTxt.length; pri++) prTxt[pri].textContent = '';
        for (; di < dropTxt.length; di++) dropTxt[di].textContent = '';
        for (; ri < rrTxt.length; ri++) rrTxt[ri].textContent = '';
        bd.sort(function (a, b) { return a - b; });
        bd = bd.filter(function (y, k) { return k === 0 || y - bd[k - 1] > 8; });
        beads.forEach(function (b, k) {
          if (k < bd.length) { b.setAttribute('cx', NOW); b.setAttribute('cy', bd[k].toFixed(1)); b.setAttribute('opacity', 1); }
          else b.setAttribute('opacity', 0);
        });

        // 작은 심장: 최근 P → 심방, 최근 QRS → 심실이 빛난다
        var lp = S.P.length ? lastBefore(S.P, t) : -1e9;
        var lq = lastBefore(S.Q.map(function (x) { return x.t; }), t);
        var aI = kind === 'af' ? 0.35 + 0.25 * Math.abs(Math.sin(t * 23) * Math.sin(t * 7.3)) : Math.exp(-Math.max(0, t - lp - 0.1) / 0.15);
        var vI = Math.exp(-Math.max(0, t - lq - 0.14) / 0.2);
        atria.setAttribute('opacity', (0.9 * aI).toFixed(2));
        vents.setAttribute('opacity', (0.9 * vI).toFixed(2));
        saDot.setAttribute('opacity', kind === 'af' ? 0.2 : (0.4 + 0.6 * aI).toFixed(2));
        // AV결절: 전도 중이면 빛남
        var cond = false, blocked = false;
        S.Q.forEach(function (q0) { if (q0.p == null) return; for (var k = -1; k <= 0; k++) { var pp = q0.p + k * S.per, qq = q0.t + k * S.per; if (t >= pp + 0.04 && t < qq) cond = true; } });
        S.drop.forEach(function (d0) { for (var k = -1; k <= 0; k++) { var pp = d0 + k * S.per; if (t >= pp && t < pp + 0.5) blocked = true; } });
        if (kind === 'avb3') S.P.forEach(function (d0) { for (var k = -1; k <= 0; k++) { var pp = d0 + k * S.per; if (t >= pp && t < pp + 0.2) blocked = true; } });
        avDot.setAttribute('opacity', cond ? 1 : 0.45);
        avDot.setAttribute('r', cond ? 5 : 4);
        avDot.setAttribute('stroke', blocked && !cond ? C.clay : '#e0862a');
        // 지금 상태 알약
        var st = '';
        if (vI > 0.4) st = 'QRS · 심실 수축';
        else if (cond) st = 'AV결절 통과 중';
        else if (blocked && kind !== 'avb3') st = 'AV에서 막힘';
        else if (kind === 'af') st = '심방 잔떨림';
        else if (aI > 0.4) st = 'P파 · 심방 수축';
        else st = kind === 'avb3' ? '심방·심실 따로' : '기준선';
        if (nowPill.t.textContent !== st) {
          nowPill.t.textContent = st;
          var wpx = st.length * 12 * 0.95 + 14;
          nowPill.r.setAttribute('x', 524 - wpx / 2); nowPill.r.setAttribute('width', wpx);
        }
        nowPill.t.setAttribute('fill', vI > 0.4 ? QC : (blocked && kind !== 'avb3' && !cond) ? C.clay : aI > 0.4 || kind === 'af' ? PC : C.ink);
      };
    }
  });
})();
