// 아세틸콜린 시냅스와 콜린에스테라제 억제제
// 원리: ACh가 수용체에 붙어 있는 동안 신호가 넘어가고, AChE가 잘라 끝낸다.
//       알츠하이머는 ACh 양이 적고, 억제제는 AChE를 막아 남은 ACh를 오래 머물게 한다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  // 바탕 그림(synapse.webp, 3:2) 위치 — 그림 속 정규화 좌표 P(nx, ny) → 장면 좌표
  var IX = 30, IY = -46, IW = 540, IH = 360;
  function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
  // 그림 속 해부 위치(정규화)
  var REC_N = [[0.234, 0.684], [0.404, 0.697], [0.527, 0.704], [0.635, 0.694], [0.781, 0.680]]; // 수용체 윗면
  var ACHE_N = [[0.318, 0.700], [0.466, 0.712], [0.581, 0.712], [0.708, 0.700]];               // 수용체 사이 막 위
  var VES_N = [[0.3125, 0.493], [0.521, 0.503], [0.706, 0.479]];                                // 막에 붙은 소포
  var REL_N = [[0.3125, 0.560], [0.521, 0.578], [0.706, 0.552]];                                // 말단 바깥막(방출 자리)
  var REC_X = REC_N.map(function (q) { return P(q[0], q[1])[0]; });
  var REC_YS = REC_N.map(function (q) { return P(q[0], q[1])[1] - 3; });
  var ACHE_X = ACHE_N.map(function (q) { return P(q[0], q[1])[0]; });
  var ACHE_Y = ACHE_N.map(function (q) { return P(q[0], q[1])[1]; });

  // 상태별 분자 배치: 수용체 번호·자리(0 왼쪽, 1 오른쪽)
  function plan(mode) {
    var list = [];
    if (mode === 'normal') {
      for (var i = 0; i < 10; i++) list.push({ rec: i % 5, site: i < 5 ? 0 : 1 });
    } else {
      [[0, 0], [2, 1], [4, 1], [1, 0]].forEach(function (a) { list.push({ rec: a[0], site: a[1] }); });
    }
    var ves = mode === 'normal' ? [0, 1, 2] : [0, 2];
    list.forEach(function (m, i) {
      m.i = i;
      m.ts = 1.5 + 0.1 * i;                     // 방출
      m.ta = m.ts + 0.9;                        // 수용체 도착
      m.tu = 5.6 + 0.13 * (i % 5);              // 수용체에서 떨어짐
      var rp = P(REL_N[ves[i % ves.length]][0], REL_N[ves[i % ves.length]][1]);
      m.rx = rp[0] + ((i * 7) % 11) - 5; m.ry = rp[1];
      m.sx = REC_X[m.rec] + (m.site ? 6 : -6); m.sy = REC_YS[m.rec];
      // 가위: 왼쪽 자리는 왼쪽 효소, 오른쪽 자리는 오른쪽 효소(끝이면 안쪽)
      var e = m.site ? m.rec : m.rec - 1;
      m.enz = Math.max(0, Math.min(ACHE_X.length - 1, e));
      m.te = m.tu + 0.6;                        // 가위에 도착
      m.tc = m.te + 0.35;                       // 잘림
      // 억제제: 이웃 수용체로 옮겨 다시 붙음
      var nb = m.rec === 4 ? 3 : m.rec + 1;
      m.nb = nb;
      m.hx = REC_X[nb] + (m.site ? -6 : 6); m.hy = REC_YS[nb];
      m.tb2 = 8.6 + 0.12 * i;
      m.fade = 9.8 + 0.25 * i;
    });
    return list;
  }
  function boundIntervals(m, mode) {
    if (mode === 'drug') return [[m.ta, m.tu], [m.tu + 0.7, m.tb2]];
    return [[m.ta, m.tu]];
  }
  var NORMAL_TOTAL = (function () {
    var s = 0;
    plan('normal').forEach(function (m) { s += m.tu - m.ta; });
    return s;
  })();

  var CARD = {
    normal: { title: '정상', lines: ['ACh 넉넉함', '쓰고 나면', '곧바로 분해', '', '', ''] },
    ad: { title: '알츠하이머', lines: ['콜린성 뉴런 소실', 'ACh 생성↓', '신호 약함', '', '', ''] },
    drug: { title: '억제제 복용', lines: ['AChE를 막아', 'ACh가 오래 머묾', '신호 일부 회복', '약: 도네페질', '리바스티그민', '갈란타민'] },
    side: { title: '부작용: 콜린성 과다', lines: ['오심·구토·설사', '식욕부진·체중감소', '서맥·실신 → 낙상', '불면·생생한 꿈', '근경련·요실금', ''] },
    other: { title: '기전 비교', lines: ['메만틴', '= NMDA 길항제', '항콜린제(Beers)', '= ACh 차단', '→ 인지 악화·섬망', ''] }
  };

  var COMMON = {
    release: { at: 0.6, label: '방출', text: '신경 자극(활동전위)이 말단에 닿으면 소포가 막과 합쳐지며 ACh가 **시냅스 틈**으로 쏟아진다.' },
    bind: { at: 2.4, label: '수용체 결합', text: 'ACh가 시냅스 후 막의 **수용체**에 붙어 있는 동안 신호가 다음 뉴런으로 넘어간다. 오른쪽 막대는 전달된 신호의 **누적량**이다(점선 = 정상).' },
    side: { at: 10.4, label: '부작용', text: '억제제 부작용은 **콜린성 과다**로 묶인다. **오심·구토·설사·식욕부진·체중감소**가 가장 흔하고, 미주신경 항진으로 **서맥·실신 → 낙상**이 생길 수 있으며, **불면·생생한 꿈**·근경련·요실금도 있어 저용량에서 천천히 올린다.' },
    other: { at: 12.2, label: '메만틴·항콜린제', text: '**메만틴**은 기전이 다른 **NMDA 수용체 길항제**로 중등도~중증에 쓰며 억제제와 함께 쓰기도 한다. 반대로 **항콜린제**(1세대 항히스타민·과민성 방광약·삼환계 항우울제 등, Beers 기준)는 ACh를 막아 **인지 악화·섬망**을 부르고 억제제 효과를 깎는다.' }
  };
  var BY_MODE = {
    normal: [
      { at: 0, label: '축삭 말단', text: '**아세틸콜린(ACh)**은 기억·학습·주의를 맡는 콜린성 신경의 전달물질이다. 축삭 말단의 소포에 저장돼 있다.' },
      { at: 5.6, label: '분해(AChE)', text: '시냅스 틈의 **아세틸콜린에스테라제(AChE)**가 ACh를 **콜린+아세트산**으로 잘라 신호를 끝낸다. 콜린은 말단으로 되돌아가 다시 ACh 원료가 된다.' },
      { at: 8.2, label: '정리', text: '정상 시냅스는 넉넉한 ACh로 신호를 주고받고 곧바로 정리한다. 아래 **상태** 버튼으로 알츠하이머·억제제 복용과 비교해 보자.' }
    ],
    ad: [
      { at: 0, label: 'ACh 부족', text: '알츠하이머병에서는 ACh를 만드는 **콜린성 뉴런(마이네르트 기저핵)**이 일찍 줄어 ACh 양 자체가 적다(**콜린성 가설**). 그림의 ACh 분자 수가 정상보다 적다.' },
      { at: 5.6, label: '분해(AChE)', text: '적은 ACh마저 **아세틸콜린에스테라제(AChE)**가 곧바로 **콜린+아세트산**으로 잘라 신호가 짧게 끝난다.' },
      { at: 8.2, label: '약한 신호', text: 'ACh가 적어 누적 신호가 정상의 절반에 못 미친다. 이것이 **기억력·주의력 저하**로 나타난다.' }
    ],
    drug: [
      { at: 0, label: '억제제 자리', text: '알츠하이머라 ACh 양은 여전히 적다. 다만 분해효소(가위) 위에 **억제제(보라색)**가 앉아 효소를 막고 있다.' },
      { at: 5.6, label: 'AChE 막힘', text: 'AChE가 억제제에 막혀 ACh가 잘리지 않고 이웃 수용체에 **다시 붙는다**. 적은 ACh로 신호를 더 오래 낸다.' },
      { at: 8.2, label: '신호 회복', text: '**도네페질·리바스티그민·갈란타민**이 이 **콜린에스테라제 억제제**다. 증상을 일부 되돌리고 악화를 늦추지만 신경세포 소실 자체를 막지는 못한다.' }
    ]
  };

  M.register({
    id: 'ach-synapse',
    title: '아세틸콜린 시냅스와 콜린에스테라제 억제제',
    system: '신경계',
    topics: ['dementia', 'cns-drugs', 'polypharmacy-drug', 'dementia-family-care'],
    duration: 14,
    options: [{
      key: 'state', label: '상태',
      choices: [{ value: 'normal', label: '정상' }, { value: 'ad', label: '알츠하이머' }, { value: 'drug', label: '억제제 복용' }],
      value: 'normal'
    }],
    steps: [],
    stepsFor: function (o) {
      var b = BY_MODE[o.state] || BY_MODE.normal;
      return [b[0], COMMON.release, COMMON.bind, b[1], b[2], COMMON.side, COMMON.other];
    },
    source: '기전 그림은 설명용으로 단순화(분자 수·시간 비율은 실제 값이 아님). 부작용·약물 분류는 노인간호학·약리학 교재 기준.',


    setup: function (svg, K, opt) {
      var el = K.el, C = K.C;
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var defs = svg.querySelector('defs') || el('defs', null, svg);
      var glowF = K.glow(svg, 2.4), softGlow = K.glow(svg, 5);
      var sh = K.shadow(svg, 1.5, 1.5, 0.35), cardSh = K.shadow(svg, 3, 4, 0.18), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function radial(id, stops) {
        var g = el('radialGradient', { id: id }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, g); });
        return 'url(#' + id + ')';
      }
      var gGold = radial('nmAchGold', [['0%', '#fff4b8', 0.95], ['60%', '#ffc547', 0.6], ['100%', '#ff9a1f', 0]]);
      var gCyan = radial('nmAchCyan', [['0%', '#d9fffb', 0.95], ['55%', '#4fd8c8', 0.6], ['100%', '#1f7a74', 0]]);

      // ── 카메라가 움직이는 세계 ──
      var world = el('g', null, svg);
      K.image(world, 'synapse', IX, IY, IW, IH, { fadeR: '64%' });

      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 16;
        el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.9)', filter: pillSh }, g);
        K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return g;
      }

      // 시냅스 후 신호(세포 안으로 번지는 빛)
      var sp = P(0.52, 0.82);
      var sigGlow = el('ellipse', { cx: sp[0], cy: sp[1], rx: 170, ry: 30, fill: gCyan, opacity: 0, style: 'mix-blend-mode:screen' }, world);
      // 수용체 켜짐 빛
      var recGlow = REC_X.map(function (x, k) {
        return el('ellipse', { cx: x, cy: REC_YS[k] + 8, rx: 17, ry: 13, fill: gCyan, opacity: 0, style: 'mix-blend-mode:screen' }, world);
      });
      // 소포 융합 빛
      var fuse = VES_N.map(function (q) { var a = P(q[0], q[1]); return el('circle', { cx: a[0], cy: a[1] + 8, r: 16, fill: gGold, opacity: 0, style: 'mix-blend-mode:screen' }, world); });
      // 활동전위(축삭을 타고 내려오는 빛)
      var apTop = P(0.5, 0.0), apBot = P(0.5, 0.30);
      var ap = el('circle', { cx: apTop[0], cy: apTop[1], r: 8, fill: '#fff6c8', stroke: '#ffb238', 'stroke-width': 2, filter: glowF, opacity: 0 }, world);

      // 분해효소(가위) — 흰 테두리 + 그림자로 그림 위에서 또렷하게
      function scissors(parent, x, y, s) {
        var g = el('g', { filter: sh }, parent);
        var b1 = el('g', null, g), b2 = el('g', null, g);
        [b1, b2].forEach(function (b) {
          el('line', { x1: x, y1: y + 6 * s, x2: x, y2: y - 18 * s, stroke: '#fff', 'stroke-width': 5 * s, 'stroke-linecap': 'round' }, b);
          el('line', { x1: x, y1: y + 6 * s, x2: x, y2: y - 18 * s, stroke: C.navy, 'stroke-width': 2.6 * s, 'stroke-linecap': 'round' }, b);
          el('circle', { cx: x, cy: y + 9.5 * s, r: 3.2 * s, fill: '#fff', stroke: C.navy, 'stroke-width': 1.8 * s }, b);
        });
        el('circle', { cx: x, cy: y, r: 2 * s, fill: C.gold }, g);
        return { g: g, b1: b1, b2: b2, x: x, y: y };
      }
      var enz = ACHE_X.map(function (x, k) { return scissors(world, x, ACHE_Y[k] - 4, 1); });
      function hexPath(cx, cy, r) {
        var p = [];
        for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
        return 'M' + p.join(' L') + ' Z';
      }
      var blockers = ACHE_X.map(function (x, k) {
        return el('path', { d: hexPath(x, ACHE_Y[k] - 18, 7.5), fill: K.sphere(svg, C.purple), stroke: '#fff', 'stroke-width': 1.2, filter: sh, opacity: 0 }, world);
      });

      // 분자(최대 10개): 입체 구슬
      var mols = [];
      for (var i = 0; i < 10; i++) {
        mols.push({
          whole: el('circle', { r: 4.6, fill: K.sphere(svg, '#1fa89a'), filter: sh, opacity: 0 }, world),
          cho: el('circle', { r: 3.3, fill: K.sphere(svg, '#1fa89a'), opacity: 0 }, world),
          ace: el('circle', { r: 2.8, fill: K.sphere(svg, C.gold), opacity: 0 }, world)
        });
      }

      // 그림 위 이름표
      var q;
      q = P(0.5, 0.16); pill(world, q[0], q[1], '축삭 말단', '#7a4a2a');
      q = P(0.20, 0.60); pill(world, q[0], q[1], '시냅스 틈', C.muted);
      q = P(0.234, 0.84); pill(world, q[0], q[1], '수용체', C.blue);
      q = P(0.64, 0.79); var sigPill = pill(world, q[0], q[1], '시냅스 후 뉴런: 신호 전달', C.teal);

      // 카메라: 단계마다 시냅스 틈을 당겨 본다 [시각, nx, ny, 배율]
      var CAM = [[0, 0.5, 0.6, 1], [0.6, 0.5, 0.6, 1], [1.3, 0.5, 0.5, 1.25], [2.2, 0.5, 0.5, 1.25], [3.0, 0.5, 0.63, 1.4],
        [5.4, 0.5, 0.63, 1.4], [6.0, 0.5, 0.65, 1.5], [8.0, 0.5, 0.65, 1.5], [8.8, 0.5, 0.6, 1], [14, 0.5, 0.6, 1]];
      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var c = P(K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e));
          K.camera(world, c[0], c[1], K.lerp(a[3], b[3], e), 300, 170);
          return;
        }
      }

      // ── 고정 패널: 범례(왼쪽 위) ──
      var lg = el('g', null, svg);
      el('rect', { x: 8, y: 8, width: 140, height: 82, rx: 12, fill: 'rgba(255,255,255,.92)', filter: cardSh }, lg);
      el('circle', { cx: 24, cy: 27, r: 5.5, fill: K.sphere(svg, '#1fa89a') }, lg);
      K.label(lg, 36, 27, '아세틸콜린(ACh)', { size: 12.5, anchor: 'start', weight: 700 });
      scissors(lg, 24, 54, 0.62);
      K.label(lg, 36, 50, '분해효소(AChE)', { size: 12.5, anchor: 'start', weight: 700 });
      el('path', { d: hexPath(24, 73, 6.5), fill: K.sphere(svg, C.purple) }, lg);
      K.label(lg, 36, 73, '억제제', { size: 12.5, anchor: 'start', weight: 700 });

      // ── 누적 신호 막대(오른쪽 위) ──
      var GX = 538, GW = 32, GT = 58, GB = 150;
      el('rect', { x: 514, y: 8, width: 80, height: 174, rx: 12, fill: 'rgba(255,255,255,.92)', filter: cardSh }, svg);
      K.label(svg, 554, 26, '누적 신호', { size: 12.5, weight: 800 });
      K.label(svg, 554, 43, '점선 = 정상', { size: 12, fill: C.muted, weight: 500 });
      el('rect', { x: GX, y: GT, width: GW, height: GB - GT, rx: 7, fill: '#e6ecee' }, svg);
      var gFill = el('rect', { x: GX, y: GB, width: GW, height: 0, rx: 7, fill: C.teal }, svg);
      el('rect', { x: GX + 4, y: GT + 2, width: 7, height: GB - GT - 4, rx: 3.5, fill: '#fff', opacity: 0.35 }, svg);
      el('line', { x1: GX - 7, y1: GT, x2: GX + GW + 7, y2: GT, stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
      var gTxt = K.label(svg, 554, 166, '0%', { size: 15, weight: 800, fill: C.teal });

      // ── 아래 띠(상태·부작용) ──
      el('rect', { x: 8, y: 290, width: 584, height: 44, rx: 12, fill: 'rgba(255,255,255,.94)', filter: cardSh }, svg);
      var stTitle = K.label(svg, 22, 312, '', { size: 13.5, anchor: 'start', weight: 800 });
      el('line', { x1: 170, y1: 298, x2: 170, y2: 326, stroke: C.line, 'stroke-width': 1.5 }, svg);
      var stL1 = K.label(svg, 182, 303, '', { size: 12.5, anchor: 'start', weight: 700 });
      var stL2 = K.label(svg, 182, 322, '', { size: 12.5, anchor: 'start', weight: 600, fill: '#3d4a54' });
      var STRIP = {
        normal: { title: '정상', a: 'ACh가 넉넉하다', b: '쓰고 나면 AChE가 곧바로 분해' },
        ad: { title: '알츠하이머', a: '콜린성 뉴런 소실 → ACh 생성↓', b: '누적 신호가 정상의 절반에 못 미침' },
        drug: { title: '억제제 복용', a: 'AChE를 막아 ACh가 오래 머묾', b: '도네페질·리바스티그민·갈란타민' },
        side: { title: '부작용: 콜린성 과다', a: '오심·구토·설사·식욕부진·체중감소', b: '서맥·실신 → 낙상 · 불면·생생한 꿈 · 근경련·요실금' },
        other: { title: '기전 비교', a: '메만틴 = NMDA 수용체 길항제(기전이 다름)', b: '항콜린제(Beers) = ACh 차단 → 인지 악화·섬망' }
      };

      var curMode = null, ms = [];
      function build(mode) { curMode = mode; ms = plan(mode); }

      return function render(t, o) {
        var mode = o.state;
        if (mode !== curMode) build(mode);
        var drug = mode === 'drug';
        cam(t);

        // 활동전위
        var pa = K.seg(t, 0.5, 1.3);
        ap.setAttribute('cy', K.lerp(apTop[1], apBot[1], pa));
        ap.setAttribute('opacity', t >= 0.5 && t < 1.5 ? 1 - K.seg(t, 1.3, 1.5) : 0);
        // 소포 융합
        var used = mode === 'normal' ? [0, 1, 2] : [0, 2];
        fuse.forEach(function (f, k) { f.setAttribute('opacity', used.indexOf(k) >= 0 ? K.pulse(t, 1.2, 2.2) : 0); });

        var boundNow = REC_X.map(function () { return 0; });
        var cum = 0, nb = 0;
        var cut = ACHE_X.map(function () { return 0; });
        ms.forEach(function (m, k) {
          var n = mols[k];
          var x = 0, y = 0, op = 0;
          boundIntervals(m, mode).forEach(function (iv) { cum += K.clamp(t - iv[0], 0, iv[1] - iv[0]); });
          n.cho.setAttribute('opacity', 0); n.ace.setAttribute('opacity', 0);
          if (t < m.ts) { op = 0; }
          else if (t < m.ta) {
            var p = K.easeOut(K.seg(t, m.ts, m.ta));
            x = K.lerp(m.rx, m.sx, p) + 8 * Math.sin(p * Math.PI) * (k % 3 - 1);
            y = K.lerp(m.ry, m.sy, p) + 5 * Math.sin(p * Math.PI) * (k % 2 ? 1 : -1);
            op = 1;
          } else if (t < m.tu) {
            x = m.sx; y = m.sy; op = 1; boundNow[m.rec] += 1; nb += 1;
          } else if (!drug) {
            var ex = ACHE_X[m.enz], ty = ACHE_Y[m.enz] - 16;
            if (t < m.te) {
              var q2 = K.easeInOut(K.seg(t, m.tu, m.te));
              x = K.lerp(m.sx, ex, q2); y = K.lerp(m.sy, ty, q2) - 9 * Math.sin(q2 * Math.PI); op = 1;
            } else if (t < m.tc) {
              x = ex; y = ty; op = 1;
            } else {
              var r = K.seg(t, m.tc, m.tc + 1.4);
              n.cho.setAttribute('cx', K.lerp(ex, m.rx, r)); n.cho.setAttribute('cy', K.lerp(ty - 2, m.ry + 2, K.easeInOut(r)));
              n.cho.setAttribute('opacity', r < 1 ? 1 - 0.6 * r : 0);
              var a = K.seg(t, m.tc, m.tc + 1.0);
              n.ace.setAttribute('cx', ex + 6 + 10 * a); n.ace.setAttribute('cy', ty - 12 * a);
              n.ace.setAttribute('opacity', 1 - a);
            }
            cut[m.enz] = Math.max(cut[m.enz], K.pulse(t, m.te, m.tc + 0.2));
          } else {
            if (t < m.tu + 0.7) {
              var h = K.easeInOut(K.seg(t, m.tu, m.tu + 0.7));
              x = K.lerp(m.sx, m.hx, h); y = K.lerp(m.sy, m.hy, h) - 24 * Math.sin(h * Math.PI); op = 1;
            } else if (t < m.tb2) {
              x = m.hx; y = m.hy; op = 1; boundNow[m.nb] += 1; nb += 1;
            } else {
              var w = t - m.tb2;
              x = m.hx + 14 * Math.sin(w * 1.6 + k); y = m.hy - 26 * K.seg(t, m.tb2, m.tb2 + 1.2) + 5 * Math.sin(w * 2.3 + k);
              op = 1 - K.seg(t, m.fade, m.fade + 1.2);
            }
          }
          n.whole.setAttribute('cx', x.toFixed(1)); n.whole.setAttribute('cy', y.toFixed(1));
          n.whole.setAttribute('opacity', op);
        });
        for (var z = ms.length; z < mols.length; z++) {
          mols[z].whole.setAttribute('opacity', 0); mols[z].cho.setAttribute('opacity', 0); mols[z].ace.setAttribute('opacity', 0);
        }

        recGlow.forEach(function (g, k) { g.setAttribute('opacity', Math.min(1, boundNow[k] / 2) * 0.95); });
        enz.forEach(function (e, k) {
          var ang = drug ? 16 : 16 * (1 - cut[k]);
          e.b1.setAttribute('transform', 'rotate(' + ang + ' ' + e.x + ' ' + e.y + ')');
          e.b2.setAttribute('transform', 'rotate(' + (-ang) + ' ' + e.x + ' ' + e.y + ')');
          e.g.setAttribute('opacity', drug ? 0.6 : 1);
          blockers[k].setAttribute('opacity', drug ? 1 : 0);
        });

        var now = nb / 10;
        sigGlow.setAttribute('opacity', Math.min(1, now * 1.7));
        sigPill.setAttribute('opacity', nb > 0 ? 1 : 0.55);
        var frac = cum / NORMAL_TOTAL;
        gFill.setAttribute('y', GB - (GB - GT) * frac);
        gFill.setAttribute('height', (GB - GT) * frac);
        var col = mode === 'ad' ? C.clay : drug ? C.purple : C.teal;
        gFill.setAttribute('fill', col);
        gTxt.textContent = Math.round(frac * 100) + '%';
        gTxt.setAttribute('fill', col);

        var st = t >= 12.2 ? STRIP.other : t >= 10.4 ? STRIP.side : STRIP[mode];
        stTitle.textContent = st.title; stL1.textContent = st.a; stL2.textContent = st.b;
        stTitle.setAttribute('fill', t >= 10.4 ? C.clay : col);
      };
    }
  });
})();
