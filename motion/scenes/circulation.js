// 체순환·폐순환 — 3D 심장·폐 그림 위로 피 한 방울(빛나는 큰 구슬)이 한 바퀴 돈다.
// 화면 왼쪽 = 환자 오른쪽(우심), 화면 오른쪽 = 환자 왼쪽(좌심). 파랑 = 산소 적은 피, 빨강 = 산소 많은 피.
// 온몸 모세혈관은 화면 밖이라 왼쪽 아래 카드(모세혈관 그림)로 보여 준다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;
  var DUR = 16;

  // ── 그림 배치 ──
  var HX = 135, HY = 4, HS = 330;                       // heart 그림
  function H(nx, ny) { return [HX + HS * nx, HY + HS * ny]; }
  function S(x, y) { return [x, y]; }

  // 점들을 부드러운 곡선 위 촘촘한 점으로(Catmull-Rom)
  function smooth(pts, n) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (var k = 0; k < n; k++) {
        var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // 경로: 구간(이름표 붙은 점) 목록 → 촘촘한 점 + 이름표 위치 비율
  function buildPath(segs, closed) {
    var key = [], tags = [];
    segs.forEach(function (s) { key.push(s[0]); tags.push(s[1] || null); });
    var tagIdx = {};
    var pts = smooth(key, 8);
    tags.forEach(function (tg, i) { if (tg) tagIdx[tg] = i * 8; });
    if (closed) pts.push(pts[0]);
    var cum = [0];
    for (var j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    var L = cum[cum.length - 1], F = {};
    Object.keys(tagIdx).forEach(function (k) { F[k] = cum[tagIdx[k]] / L; });
    return { pts: pts, cum: cum, L: L, F: F };
  }
  function posAt(path, f) {
    f = ((f % 1) + 1) % 1;
    var d = f * path.L, c = path.cum, p = path.pts, lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (c[mid] < d) lo = mid; else hi = mid; }
    var q = (d - c[lo]) / ((c[hi] - c[lo]) || 1);
    return [p[lo][0] + (p[hi][0] - p[lo][0]) * q, p[lo][1] + (p[hi][1] - p[lo][1]) * q];
  }

  // ── 피 한 방울이 도는 길(닫힌 고리) ──
  var MAIN = buildPath([
    [H(0.33, -0.16), 'vcStart'], [H(0.33, 0.02)], [H(0.335, 0.18)], [H(0.345, 0.30), 'raIn'],
    [H(0.37, 0.40), 'raMid'], [H(0.37, 0.505), 'tri'],
    [H(0.36, 0.62)], [H(0.40, 0.72), 'rvMid'], [H(0.46, 0.63)], [H(0.49, 0.50)], [H(0.50, 0.38), 'pulv'],
    [H(0.495, 0.28)], [H(0.54, 0.235)], [H(0.67, 0.225)], [H(0.80, 0.225)],
    [S(432, 70), 'lungStart'], [S(482, 54)], [S(532, 70)], [S(566, 110)], [S(572, 162)], [S(552, 206)], [S(508, 224)], [S(466, 210)], [S(446, 178), 'lungEnd'],
    [H(0.84, 0.36)], [H(0.76, 0.37), 'laIn'],
    [H(0.65, 0.40), 'laMid'], [H(0.63, 0.505), 'mit'],
    [H(0.64, 0.62)], [H(0.68, 0.78), 'lvMid'], [H(0.62, 0.71)], [H(0.565, 0.56)], [H(0.535, 0.40), 'aov'],
    [H(0.52, 0.28)], [H(0.50, 0.16)], [H(0.53, 0.07)], [H(0.585, 0.03)], [H(0.59, -0.16), 'bodyStart'],
    [H(0.46, -0.24)], [H(0.34, -0.20), 'bodyEnd']
  ], true);
  var F = MAIN.F;

  // 시각(초) → 피 한 방울의 위치(비율). 판막 앞에서 조금 머문다.
  var WARP = [
    [0.0, 0], [2.2, F.raMid], [2.5, F.raMid], [3.1, F.tri], [4.2, F.rvMid], [4.5, F.rvMid],
    [5.0, F.pulv], [6.5, F.lungStart], [8.5, F.lungEnd], [10.0, F.laMid], [10.5, F.mit],
    [11.3, F.lvMid], [11.5, F.lvMid], [12.0, F.aov], [13.5, F.bodyStart], [16.0, 1]
  ];
  function warp(t) {
    for (var i = 1; i < WARP.length; i++) if (t <= WARP[i][0]) {
      var a = WARP[i - 1], b = WARP[i];
      return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
    }
    return 1;
  }
  // 위치 → 산소 많음(0~1)
  function oxyAt(f) {
    f = ((f % 1) + 1) % 1;
    if (f >= F.lungStart && f <= F.lungEnd) return Math.min(1, (f - F.lungStart) / (F.lungEnd - F.lungStart) * 1.3);
    if (f > F.lungEnd && f < F.bodyStart) return 1;
    if (f >= F.bodyStart && f <= F.bodyEnd) return 1 - (f - F.bodyStart) / (F.bodyEnd - F.bodyStart);
    return 0;
  }
  var WHERE = [
    [F.raIn, '대정맥', 0], [F.tri - 0.004, '우심방', 0], [F.tri + 0.006, '삼첨판 통과', 0], [F.pulv - 0.004, '우심실', 0],
    [F.pulv + 0.006, '폐동맥판 통과', 0], [F.lungStart, '폐동맥', 0], [F.lungEnd, '폐 모세혈관', 2], [F.laIn, '폐정맥', 1],
    [F.mit - 0.004, '좌심방', 1], [F.mit + 0.006, '승모판 통과', 1], [F.aov - 0.004, '좌심실', 1], [F.aov + 0.006, '대동맥판 통과', 1],
    [F.bodyStart, '대동맥', 1], [1.01, '온몸 모세혈관', 3]
  ];
  function where(f) { for (var i = 0; i < WHERE.length; i++) if (f < WHERE[i][0]) return WHERE[i]; return WHERE[WHERE.length - 1]; }

  // 장식 흐름: 오른쪽 폐(화면 왼쪽) 왕복, 하대정맥 유입, 온몸 카드 속 모세혈관
  var RLUNG = buildPath([
    [H(0.47, 0.205)], [H(0.40, 0.16)], [H(0.30, 0.19)], [S(176, 64)], [S(120, 52)], [S(68, 86)], [S(42, 148)],
    [S(58, 210)], [S(108, 230)], [S(152, 196)], [S(168, 140)], [H(0.205, 0.31)], [H(0.26, 0.33)]
  ], false);
  var IVC = buildPath([[H(0.31, 1.06)], [H(0.31, 0.92)], [H(0.31, 0.80)]], false);

  // 카메라 [시각, x, y, 배율] — 무대 중앙(300,170)에 (x,y)가 오도록
  var CAM = [
    [0.0, 300, 170, 1.0], [0.6, H(0.40, 0.30)[0], H(0.40, 0.30)[1], 1.25], [2.5, H(0.40, 0.30)[0], H(0.40, 0.30)[1], 1.25],
    [3.1, H(0.40, 0.56)[0], H(0.40, 0.56)[1], 1.3], [4.5, H(0.40, 0.56)[0], H(0.40, 0.56)[1], 1.3],
    [5.1, H(0.62, 0.30)[0], H(0.62, 0.30)[1], 1.15], [6.5, H(0.62, 0.30)[0], H(0.62, 0.30)[1], 1.15],
    [7.1, 482, 142, 1.35], [8.5, 482, 142, 1.35],
    [9.1, H(0.72, 0.38)[0], H(0.72, 0.38)[1], 1.25], [10.0, H(0.72, 0.38)[0], H(0.72, 0.38)[1], 1.25],
    [10.6, H(0.64, 0.60)[0], H(0.64, 0.60)[1], 1.25], [11.5, H(0.64, 0.60)[0], H(0.64, 0.60)[1], 1.25],
    [12.1, H(0.54, 0.25)[0], H(0.54, 0.25)[1], 1.2], [13.5, H(0.54, 0.25)[0], H(0.54, 0.25)[1], 1.2],
    [14.1, 300, 170, 1.0], [16.0, 300, 170, 1.0]
  ];

  M.register({
    id: 'circulation',
    title: '체순환·폐순환 — 피 한 방울이 도는 길',
    system: '순환기',
    topics: ['htn', 'heart-failure', 'cardiovascular-patho', 'cardio-assessment', 'circulation-disorder', 'pvd'],
    duration: DUR,
    steps: [
      { at: 0.0, label: '대정맥→우심방', text: '온몸을 돈 **산소 적은 피(정맥혈)**가 **상·하대정맥**을 타고 **우심방**으로 돌아온다. 큰 점 하나가 이 피 한 방울이다.' },
      { at: 2.5, label: '삼첨판→우심실', text: '우심방의 피가 **삼첨판**을 지나 **우심실**로 내려간다. 우심실은 가까운 폐까지만 보내면 되는 **저압계**라 벽이 좌심실보다 얇다.' },
      { at: 4.5, label: '폐동맥', text: '우심실이 수축하면 **폐동맥판**이 열리고 피가 **폐동맥**으로 나간다. 시험 함정: 폐동맥은 이름이 동맥이어도 그 안에는 **산소 적은 피(정맥혈)**가 흐른다. 동맥·정맥은 **심장에서 나가느냐 들어오느냐**로 붙인 이름이다.' },
      { at: 6.5, label: '폐 가스교환', text: '폐포를 감싼 모세혈관에서 **산소는 폐포→혈액**, **이산화탄소는 혈액→폐포**로 확산한다. 파란 피가 여기서 붉게 바뀐다.' },
      { at: 8.5, label: '폐정맥→좌심방', text: '**폐정맥**에는 **산소 많은 피(동맥혈)**가 흐른다. 폐동맥과 짝을 이루는 대표 함정이다. 피는 **좌심방**으로 들어온다.' },
      { at: 10.0, label: '승모판→좌심실', text: '좌심방의 피가 **승모판(이첨판)**을 지나 **좌심실**로. 좌심실은 온몸으로 밀어내야 해서 **벽이 가장 두껍다**. 고혈압이 오래가면 이 벽이 더 두꺼워진다(좌심실 비대).' },
      { at: 11.5, label: '대동맥판→대동맥', text: '좌심실이 수축하면 **대동맥판**이 열리고 피가 **대동맥**으로 나간다. 혈압계로 재는 수축기·이완기 혈압이 바로 이 체순환 동맥의 압력이다.' },
      { at: 13.5, label: '온몸 모세혈관', text: '조직에 **산소·영양**을 내주고 **이산화탄소·노폐물**을 받아 다시 산소 적은 피가 된다. 정리: **체순환** = 좌심실→대동맥→온몸→대정맥→우심방, **폐순환** = 우심실→폐동맥→폐→폐정맥→좌심방.' }
    ],
    source: '판막 순서: 삼첨판→폐동맥판→승모판→대동맥판. 그림은 설명용으로 단순화했다(실제로는 좌우 심장이 동시에 수축하고, 판막이 열리는 시기도 다르다).',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var glow = K.glow(svg, 2.4), glowBig = K.glow(svg, 4), pillSh = K.shadow(svg, 1.5, 2, 0.25), cardSh = K.shadow(svg, 3, 5, 0.22);
      // 피 색 단계(구슬 그라데이션은 미리 만든다)
      var NC = 10, FILL = [];
      for (var c = 0; c <= NC; c++) FILL.push(K.sphere(svg, K.mix(C.deoxy, C.oxy, c / NC)));
      function fillOf(o) { return FILL[Math.round(K.clamp(o, 0, 1) * NC)]; }

      var stageClip = el('clipPath', { id: 'nmCirStage' }, defs);
      el('rect', { x: 0, y: 0, width: 600, height: 340 }, stageClip);
      var stage = el('g', { 'clip-path': 'url(#nmCirStage)' }, svg);
      var world = el('g', null, stage);

      // 폐(뒤) + 심장(앞): 심장 그림 바탕색은 darken으로 녹여 폐가 비치게
      var lungImg = K.image(world, 'lungs', -170, -150, 940, 627, { fade: false });
      lungImg.setAttribute('opacity', 0.8);
      var heartImg = K.image(world, 'heart', HX, HY, HS, HS, { fadeR: '64%' });
      heartImg.setAttribute('style', 'mix-blend-mode:darken');

      // 방 강조(심방·심실 모양 빛)
      function poly(pts) { return 'M' + pts.map(function (q) { var a = H(q[0], q[1]); return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L') + ' Z'; }
      var SH = {
        RA: poly([[0.24, 0.33], [0.30, 0.27], [0.42, 0.27], [0.49, 0.33], [0.50, 0.50], [0.40, 0.53], [0.27, 0.53], [0.22, 0.45]]),
        LA: poly([[0.53, 0.38], [0.58, 0.31], [0.70, 0.30], [0.77, 0.36], [0.77, 0.47], [0.70, 0.52], [0.58, 0.52], [0.53, 0.47]]),
        RV: poly([[0.24, 0.55], [0.50, 0.53], [0.53, 0.70], [0.60, 0.88], [0.45, 0.84], [0.32, 0.76], [0.24, 0.65]]),
        LV: poly([[0.53, 0.53], [0.80, 0.50], [0.84, 0.62], [0.79, 0.80], [0.67, 0.93], [0.60, 0.88], [0.53, 0.70]])
      };
      var gB = el('radialGradient', { id: 'nmCirHiB' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#9fb8ff', 'stop-opacity': 0.75 }, gB);
      el('stop', { offset: '100%', 'stop-color': '#6d8de0', 'stop-opacity': 0.15 }, gB);
      var gR = el('radialGradient', { id: 'nmCirHiR' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#ffd0b8', 'stop-opacity': 0.75 }, gR);
      el('stop', { offset: '100%', 'stop-color': '#ff9a7a', 'stop-opacity': 0.15 }, gR);
      var hi = {};
      Object.keys(SH).forEach(function (k) {
        hi[k] = el('path', { d: SH[k], fill: 'url(#' + (k === 'RA' || k === 'RV' ? 'nmCirHiB' : 'nmCirHiR') + ')', opacity: 0, style: 'mix-blend-mode:screen' }, world);
      });

      // 폐 모세혈관 고리(산소 받는 곳): 파랑→빨강으로 물드는 관 + 폐포 구슬
      // 비율 → 점 번호(누적 길이로 찾기)
      function idxOf(f) { var d = f * MAIN.L, i = 0; while (i < MAIN.cum.length - 1 && MAIN.cum[i] < d) i++; return i; }
      var lungIdx0 = idxOf(F.lungStart), lungIdx1 = idxOf(F.lungEnd);
      var capG = el('g', { fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, world);
      for (var s = lungIdx0; s < lungIdx1; s++) {
        var a = MAIN.pts[s], b = MAIN.pts[s + 1], o = (s - lungIdx0) / (lungIdx1 - lungIdx0);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: K.mix('#8fa2e0', '#f0908a', Math.min(1, o * 1.3)), 'stroke-width': 11 }, capG);
      }
      var alvG = el('g', null, world);
      var alv = [];
      var alvFill = K.sphere(svg, '#f7e9ec');
      for (var q = 0; q < 9; q++) {
        var pp = posAt(MAIN, F.lungStart + (F.lungEnd - F.lungStart) * (q + 0.5) / 9);
        var cx0 = 500, cy0 = 140, dx = pp[0] - cx0, dy = pp[1] - cy0, dl = Math.hypot(dx, dy) || 1;
        alv.push({ x: pp[0] + dx / dl * 15, y: pp[1] + dy / dl * 15, e: el('circle', { r: 9, fill: alvFill, stroke: '#e2b9c0', 'stroke-width': 1, opacity: 0.95 }, alvG) });
      }

      // 판막 빛
      var VALV = { tri: H(0.37, 0.505), pulv: H(0.50, 0.38), mit: H(0.63, 0.505), aov: H(0.535, 0.40) };
      var vglow = {};
      Object.keys(VALV).forEach(function (k) {
        vglow[k] = el('circle', { cx: VALV[k][0], cy: VALV[k][1], r: 7, fill: '#fff3b0', stroke: '#e0a02a', 'stroke-width': 2, filter: glowBig, opacity: 0 }, world);
      });

      // 피 알갱이(장식 흐름 → 본 흐름 → 피 한 방울)
      var partG = el('g', { filter: glow }, world);
      var NR = 22, rl = [];
      for (var r1 = 0; r1 < NR; r1++) rl.push(el('circle', { r: 3.6 }, partG));
      var NI = 4, iv = [];
      for (var r2 = 0; r2 < NI; r2++) iv.push(el('circle', { r: 3.8, fill: fillOf(0) }, partG));
      var N = 56, dots = [];
      for (var k2 = 1; k2 < N; k2++) dots.push(el('circle', { r: 4.2 }, partG));
      var ring = el('circle', { r: 12, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.9, filter: glow }, world);
      var tracer = el('circle', { r: 7.5, stroke: '#fff', 'stroke-width': 1.6, filter: glowBig }, world);

      // 이름표(흰 알약)
      function pill(parent, x, y, txt, color, size, anchor) {
        var g = el('g', null, parent);
        var fs = size || 12, w = txt.length * fs * 0.92 + 14;
        var x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        el('rect', { x: x0, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        K.label(g, x0 + w / 2, y + 0.5, txt, { size: fs, fill: color || C.ink, weight: 700 });
        return g;
      }
      var BLUE = '#3d4f8c', RED = '#9c3a32';
      var p;
      var chL = {};
      p = H(0.28, 0.43); chL.RA = pill(world, p[0], p[1], '우심방', BLUE);
      p = H(0.71, 0.455); chL.LA = pill(world, p[0], p[1], '좌심방', RED);
      p = H(0.40, 0.64); chL.RV = pill(world, p[0], p[1], '우심실', BLUE);
      p = H(0.74, 0.66); chL.LV = pill(world, p[0], p[1], '좌심실', RED);
      p = H(0.22, 0.12); pill(world, p[0], p[1], '상대정맥', BLUE, 11.5);
      p = H(0.27, 0.885); pill(world, p[0], p[1], '하대정맥', BLUE, 11.5);
      pill(world, 448, 40, '폐동맥', BLUE, 11.5);
      p = H(0.92, 0.43); pill(world, p[0], p[1], '폐정맥', RED, 11.5);
      p = H(0.75, 0.14); pill(world, p[0], p[1], '대동맥', RED, 11.5);
      pill(world, 506, 142, '폐 모세혈관', '#6b4a8a', 11.5);
      pill(world, 92, 34, '폐', '#9c3a32', 13);
      var vL = {};
      p = H(0.24, 0.52); vL.tri = pill(world, p[0], p[1], '삼첨판', '#8a5a12', 11.5);
      p = H(0.405, 0.375); vL.pulv = pill(world, p[0], p[1], '폐동맥판', '#8a5a12', 11.5);
      p = H(0.62, 0.555); vL.mit = pill(world, p[0], p[1], '승모판', '#8a5a12', 11.5);
      p = H(0.62, 0.40); vL.aov = pill(world, p[0], p[1], '대동맥판', '#8a5a12', 11.5);
      var gasL = el('g', { opacity: 0 }, world);
      pill(gasL, 488, 106, 'O₂ 들어옴', '#1f7a74', 11.5);
      pill(gasL, 516, 178, 'CO₂ 나감', '#6b3fa0', 11.5);
      // 화면 밖 온몸 안내
      var outL = pill(world, H(0.70, -0.005)[0], 14, '온몸으로 ↑', RED, 11.5);
      var inL = pill(world, H(0.20, -0.005)[0], 14, '↓ 온몸에서', BLUE, 11.5);

      // ── 고정 UI(카메라 밖) ──
      // 온몸 모세혈관 카드
      var card = el('g', null, svg);
      el('rect', { x: 8, y: 238, width: 176, height: 96, rx: 12, fill: '#fff', filter: cardSh }, card);
      var cclip = el('clipPath', { id: 'nmCirCard' }, defs);
      el('rect', { x: 14, y: 262, width: 164, height: 66, rx: 8 }, cclip);
      var capImg = K.image(card, 'capillary', -30, 222, 280, 187, { fade: false });
      capImg.setAttribute('clip-path', 'url(#nmCirCard)');
      K.label(card, 96, 251, '온몸 모세혈관(조직)', { size: 12, weight: 800, fill: '#5a4a38' });
      var cardDots = [], cardG = el('g', { filter: glow, 'clip-path': 'url(#nmCirCard)' }, card);
      for (var cd = 0; cd < 8; cd++) cardDots.push(el('circle', { r: 4 }, cardG));
      var cardGas = el('g', { opacity: 0 }, card);
      pill(cardGas, 58, 318, 'O₂ → 조직', RED, 11);
      pill(cardGas, 136, 318, 'CO₂ → 혈액', BLUE, 11);
      var cardRing = el('rect', { x: 8, y: 238, width: 176, height: 96, rx: 12, fill: 'none', stroke: C.gold, 'stroke-width': 2.5, opacity: 0 }, card);

      // 지금 위치 + 범례
      var now = el('g', null, svg);
      el('rect', { x: 448, y: 286, width: 144, height: 48, rx: 12, fill: '#fff', filter: cardSh }, now);
      K.label(now, 462, 300, '지금 위치', { size: 12, weight: 600, fill: C.muted, anchor: 'start' });
      var nowDot = el('circle', { cx: 468, cy: 320, r: 6, filter: glow }, now);
      var nowT = K.label(now, 480, 320, '', { size: 13, weight: 800, anchor: 'start' });
      var leg = el('g', null, svg);
      el('rect', { x: 448, y: 246, width: 144, height: 34, rx: 10, fill: 'rgba(255,255,255,.9)', filter: pillSh }, leg);
      el('circle', { cx: 461, cy: 263, r: 5, fill: fillOf(1) }, leg);
      K.label(leg, 469, 263, '산소 많은', { size: 11.5, anchor: 'start', weight: 700, fill: RED });
      el('circle', { cx: 527, cy: 263, r: 5, fill: fillOf(0) }, leg);
      K.label(leg, 535, 263, '산소 적은', { size: 11.5, anchor: 'start', weight: 700, fill: BLUE });

      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 300, 170);
          return;
        }
      }

      return function render(t) {
        t = ((t % DUR) + DUR) % DUR;
        cam(t);
        var ph = warp(t);
        // 본 흐름
        for (var k = 1; k < N; k++) {
          var f = ph + k / N, pt = posAt(MAIN, f), d = dots[k - 1];
          d.setAttribute('cx', pt[0].toFixed(1)); d.setAttribute('cy', pt[1].toFixed(1));
          d.setAttribute('fill', fillOf(oxyAt(f)));
        }
        var tp = posAt(MAIN, ph), to = oxyAt(ph);
        tracer.setAttribute('cx', tp[0].toFixed(1)); tracer.setAttribute('cy', tp[1].toFixed(1)); tracer.setAttribute('fill', fillOf(to));
        ring.setAttribute('cx', tp[0].toFixed(1)); ring.setAttribute('cy', tp[1].toFixed(1));
        ring.setAttribute('r', (11 + 2.5 * Math.sin(t * 6)).toFixed(2));
        // 장식 흐름(일정한 속도, 16초에 정수 바퀴)
        rl.forEach(function (e, i) {
          var f = (i / NR + t * 3 / DUR) % 1, pt = posAt(RLUNG, f);
          e.setAttribute('cx', pt[0].toFixed(1)); e.setAttribute('cy', pt[1].toFixed(1));
          var o = f < 0.3 ? 0 : f < 0.75 ? (f - 0.3) / 0.45 : 1;
          e.setAttribute('fill', fillOf(o));
          e.setAttribute('opacity', Math.min(1, (1 - f) * 12, f * 12).toFixed(2));
        });
        iv.forEach(function (e, i) {
          var f = (i / NI + t * 4 / DUR) % 1, pt = posAt(IVC, f);
          e.setAttribute('cx', pt[0].toFixed(1)); e.setAttribute('cy', pt[1].toFixed(1));
          e.setAttribute('opacity', Math.min(1, (1 - f) * 4, f * 6).toFixed(2));
        });
        // 방·판막 강조
        var inCh = { RA: ph >= F.raIn && ph < F.tri, RV: ph >= F.tri && ph < F.pulv, LA: ph >= F.laIn && ph < F.mit, LV: ph >= F.mit && ph < F.aov };
        Object.keys(hi).forEach(function (k) {
          hi[k].setAttribute('opacity', inCh[k] ? (0.55 + 0.25 * Math.sin(t * 5)).toFixed(2) : 0);
          chL[k].setAttribute('opacity', inCh[k] ? 1 : 0.8);
        });
        Object.keys(vglow).forEach(function (k) {
          var on = Math.abs(ph - F[k]) < 0.012;
          vglow[k].setAttribute('opacity', on ? 1 : 0);
          vL[k].setAttribute('opacity', on ? 1 : 0);
        });
        // 폐포 숨쉬기·가스교환 표시
        var br = 1 + 0.12 * Math.sin(t * Math.PI / 2);
        alv.forEach(function (a) { a.e.setAttribute('cx', a.x); a.e.setAttribute('cy', a.y); a.e.setAttribute('r', (8 * br).toFixed(2)); });
        gasL.setAttribute('opacity', t >= 6.3 && t < 8.8 ? 1 : 0);
        var bodyOn = t >= 13.4;
        outL.setAttribute('opacity', t >= 12.6 && t < 14.4 ? 1 : 0.55);
        inL.setAttribute('opacity', t < 1.2 || t > 15.4 ? 1 : 0.55);
        // 온몸 카드
        cardDots.forEach(function (e, i) {
          var f = (i / cardDots.length + t * 2 / DUR) % 1;
          e.setAttribute('cx', (14 + 164 * f).toFixed(1));
          e.setAttribute('cy', (296 + 3 * Math.sin(f * 12 + i)).toFixed(1));
          e.setAttribute('fill', fillOf(1 - f));
        });
        cardGas.setAttribute('opacity', bodyOn ? 1 : 0);
        cardRing.setAttribute('opacity', bodyOn ? 0.6 + 0.4 * Math.sin(t * 5) : 0);
        // 지금 위치
        var w = where(ph);
        nowT.textContent = w[1];
        nowT.setAttribute('font-size', w[1].length > 6 ? 12 : 13);
        nowT.setAttribute('fill', w[2] === 0 ? BLUE : w[2] === 1 ? RED : '#6b4a8a');
        nowDot.setAttribute('fill', fillOf(to));
      };
    }
  });
})();
