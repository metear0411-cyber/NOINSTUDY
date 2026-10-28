// 심장 전도와 심전도 PQRST — 전기가 어느 방향으로 흐를 때 어느 유도에서 위·아래로 튀는가
// 원리: 그 순간 심장 전체 전기 흐름(평균 벡터)을 유도 축에 비춘 그림자 = 심전도 높이.
//       (+)전극 쪽으로 오면 위로, 멀어지면 아래로, 직각이면 거의 0.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  // 애니메이션 시각(초) → 실제 심장 시각(초) 대응표. 설명하느라 QRS를 길게 늘였다.
  var WARP = [
    [0.0, 0.00], [0.8, 0.04],   // 기준선
    [2.6, 0.13],                // P
    [4.2, 0.20],                // PR 분절
    [4.7, 0.215], [5.6, 0.25], [6.4, 0.285], // Q R S
    [7.6, 0.38],                // ST
    [10.0, 0.56],               // T
    [11.5, 0.80]                // 다음 박동까지
  ];
  function real(t) {
    for (var i = 1; i < WARP.length; i++) {
      if (t <= WARP[i][0]) {
        var a = WARP[i - 1], b = WARP[i];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return WARP[WARP.length - 1][1];
  }

  // 순간 평균 벡터 {ang(도, 0=환자 왼쪽·화면 오른쪽, +90=아래), mag}
  function spike(t, a, b) { var p = M.kit.seg(t, a, b); var x = 1 - Math.abs(2 * p - 1); return t < a || t > b ? 0 : Math.pow(x, 1.3); }
  function vector(t) {
    var K = M.kit;
    if (t >= 0.8 && t < 2.6) return { ang: 55, mag: 0.24 * K.pulse(t, 0.8, 2.6), part: 'P' };
    if (t >= 4.2 && t < 4.7) return { ang: 190, mag: 0.26 * spike(t, 4.2, 4.7), part: 'Q' };
    if (t >= 4.7 && t < 5.6) return { ang: 58, mag: 1.0 * spike(t, 4.7, 5.6), part: 'R' };
    if (t >= 5.6 && t < 6.4) return { ang: -105, mag: 0.32 * spike(t, 5.6, 6.4), part: 'S' };
    if (t >= 7.6 && t < 10.0) return { ang: 45, mag: 0.36 * K.pulse(t, 7.6, 10.0), part: 'T' };
    return { ang: 60, mag: 0, part: '' };
  }

  var LEADS = { I: 0, II: 60, aVF: 90, aVL: -30, aVR: -150 };
  var LEAD_HINT = {
    I: '오른팔(−) → 왼팔(+), 수평으로 본다',
    II: '오른팔(−) → 왼다리(+), 심장 축과 거의 같은 방향이라 파형이 가장 크고 또렷하다',
    aVF: '심장 가운데 → 발(+), 아래에서 올려다본다',
    aVL: '왼팔(+) 쪽에서 본다',
    aVR: '오른팔(+) 쪽에서 본다. 전기가 대부분 멀어지므로 P·QRS·T가 모두 뒤집혀 나온다'
  };

  M.register({
    id: 'ecg-pqrst',
    title: '심장 전도와 심전도 PQRST — 어느 방향에서 어떻게 튀나',
    system: '순환기',
    topics: ['acs', 'arrhythmia', 'cardio-assessment', 'cardiovascular-patho', 'antiarrhythmic-drugs', 'heart-failure'],
    duration: 11.5,
    options: [{
      key: 'lead', label: '보는 유도',
      choices: [{ value: 'II', label: 'II' }, { value: 'I', label: 'I' }, { value: 'aVF', label: 'aVF' }, { value: 'aVL', label: 'aVL' }, { value: 'aVR', label: 'aVR' }],
      value: 'II'
    }],
    steps: [
      { at: 0.0, label: '규칙', text: '심전도는 **심장 전기의 그림자**다. 전기가 **(+)전극 쪽으로 오면 위로**, **멀어지면 아래로**, 직각이면 거의 0. 왼쪽 위 나침반의 화살표(그 순간 전기 방향)가 유도 축에 드리운 그림자 길이가 곧 파형 높이다.' },
      { at: 0.8, label: 'P파', text: '**동방결절(SA)**이 먼저 발화해 **심방이 탈분극**한다. 전기가 오른쪽 위에서 왼쪽 아래(II유도 + 쪽)로 퍼지므로 II유도에서 **작고 둥근 위로 볼록**. 심방세동이면 이 질서가 깨져 **P파가 사라지고 잔물결(f파)**만 남는다.' },
      { at: 2.6, label: 'PR 분절', text: '전기가 **방실결절(AV)**에서 잠시 붙잡힌다(심실이 피를 채울 시간). 너무 작은 조직이라 몸 표면에선 안 보여 **기준선**. P 시작~QRS 시작 = **PR 간격 0.12~0.20초**(작은 칸 3~5개). 길어지면 **1도 방실차단**.' },
      { at: 4.2, label: 'Q파', text: '전기가 **히스속 → 좌·우각 → 푸르킨예 섬유**로 내려간다. 심실에서는 **중격이 먼저** 왼쪽에서 오른쪽으로 탈분극한다. II유도 (+)에서 **살짝 멀어지므로 작게 아래로**. 폭 넓고 깊은 Q(이상 Q파)는 **오래된 심근경색**의 흔적.' },
      { at: 4.7, label: 'R파', text: '**두꺼운 좌심실**이 한꺼번에 탈분극, 전기가 **심첨(왼쪽 아래)**으로 쏟아진다. II유도 축과 거의 나란해서 **크게 위로 솟는다**. 심방의 재분극은 이 큰 파형에 묻혀 보이지 않는다.' },
      { at: 5.6, label: 'S파', text: '마지막으로 **심실 위쪽(기저부)**이 탈분극, 전기가 위쪽으로 향해 **작게 아래로**. Q·R·S 합쳐 **QRS 폭 0.12초 미만**(작은 칸 3개). 넓어지면 각차단·심실성 박동을 의심.' },
      { at: 6.4, label: 'ST 분절', text: '심실 전체가 **같은 전위(탈분극 완료)**라 전압 차가 없어 **기준선**. 이 구간이 **올라가면 STEMI**(관상동맥이 막힘), **내려가면 허혈**. 심근경색 판독의 핵심 자리.' },
      { at: 7.6, label: 'T파', text: '심실 **재분극**. 재분극은 탈분극과 **반대 방향(바깥→안)**으로 진행하고 전기의 부호도 반대라, 결국 **QRS와 같은 방향**(II유도에선 위로)으로 둥글게 나온다. 높고 뾰족하면 **고칼륨혈증**, 뒤집히면 허혈.' },
      { at: 10.0, label: '정리', text: '아래 **유도 버튼**을 바꿔 보자. 같은 박동인데도 **aVR**에서는 전기가 대부분 멀어지므로 **P·QRS·T가 모두 뒤집힌다**. "어느 방향에서 보느냐"가 파형 모양을 정한다.' }
    ],
    source: '기준: PR 0.12~0.20초 · QRS <0.12초 · 작은 칸 1개 = 0.04초(종이 속도 25mm/s). 벡터 각도는 설명용으로 단순화한 값.',

    setup: function (svg, K, opt) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);

      // ── 심장(왼쪽): 3D 단면 그림 위에 전도로·탈분극 빛을 얹는다 ─ 화면 왼쪽 = 환자 오른쪽 ──
      var clipH = el('clipPath', { id: 'nmEcgClipH' }, defs);
      el('rect', { x: 0, y: 0, width: 282, height: 340, rx: 0 }, clipH);
      var heartBox = el('g', { 'clip-path': 'url(#nmEcgClipH)' }, svg);
      var heart = el('g', null, heartBox);
      var IX = -36, IY = 4, IS = 330;                 // 그림 위치·크기
      function P(nx, ny) { return [IX + IS * nx, IY + IS * ny]; }
      function poly(pts) { return 'M' + pts.map(function (q) { var a = P(q[0], q[1]); return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L') + ' Z'; }
      function curve(pts) { // 점들을 부드럽게 잇는 경로(Catmull-Rom → 베지어)
        var a = pts.map(function (q) { return P(q[0], q[1]); });
        var d = 'M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1);
        for (var i = 0; i < a.length - 1; i++) {
          var p0 = a[i - 1] || a[i], p1 = a[i], p2 = a[i + 1], p3 = a[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
            (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
        return d;
      }
      K.image(heart, 'heart', IX, IY, IS, IS, { fadeR: '62%' });

      var shapes = {
        RA: poly([[0.24, 0.33], [0.30, 0.27], [0.42, 0.27], [0.49, 0.33], [0.50, 0.50], [0.40, 0.53], [0.27, 0.53], [0.22, 0.45]]),
        LA: poly([[0.53, 0.38], [0.58, 0.31], [0.70, 0.30], [0.77, 0.36], [0.77, 0.47], [0.70, 0.52], [0.58, 0.52], [0.53, 0.47]]),
        RV: poly([[0.24, 0.55], [0.50, 0.53], [0.53, 0.70], [0.60, 0.88], [0.45, 0.84], [0.32, 0.76], [0.24, 0.65]]),
        LV: poly([[0.53, 0.53], [0.80, 0.50], [0.84, 0.62], [0.79, 0.80], [0.67, 0.93], [0.60, 0.88], [0.53, 0.70]])
      };
      // 탈분극 빛 — 심방·심실 모양으로 잘라 금빛이 퍼지게
      var clipA = el('clipPath', { id: 'nmEcgClipA' }, defs);
      el('path', { d: shapes.RA }, clipA); el('path', { d: shapes.LA }, clipA);
      var clipV = el('clipPath', { id: 'nmEcgClipV' }, defs);
      el('path', { d: shapes.RV }, clipV); el('path', { d: shapes.LV }, clipV);
      var wg = el('radialGradient', { id: 'nmEcgWave' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#ffe27a', 'stop-opacity': 0.85 }, wg);
      el('stop', { offset: '75%', 'stop-color': '#ffb238', 'stop-opacity': 0.55 }, wg);
      el('stop', { offset: '100%', 'stop-color': '#ff9a1f', 'stop-opacity': 0 }, wg);
      var sa0 = P(0.37, 0.30), av0 = P(0.485, 0.50);
      var waveA = el('circle', { cx: sa0[0], cy: sa0[1], r: 0, fill: 'url(#nmEcgWave)', 'clip-path': 'url(#nmEcgClipA)', style: 'mix-blend-mode:screen' }, heart);
      var waveV = el('circle', { cx: P(0.51, 0.58)[0], cy: P(0.51, 0.58)[1], r: 0, fill: 'url(#nmEcgWave)', 'clip-path': 'url(#nmEcgClipV)', style: 'mix-blend-mode:screen' }, heart);

      // 전도로(빛나는 선)
      var glowF = K.glow(svg, 2.2);
      var cond = el('g', { fill: 'none', stroke: '#ffd25a', 'stroke-width': 2.6, 'stroke-linecap': 'round', filter: glowF, opacity: 0.95 }, heart);
      var pInter = el('path', { d: curve([[0.37, 0.30], [0.43, 0.40], [0.485, 0.50]]) }, cond);          // 결절간 경로
      var pBach = el('path', { d: curve([[0.37, 0.30], [0.50, 0.31], [0.62, 0.35]]), 'stroke-dasharray': '4 5' }, cond); // 바흐만속
      var pHis = el('path', { d: curve([[0.485, 0.50], [0.505, 0.57]]) }, cond);
      var pRBB = el('path', { d: curve([[0.505, 0.57], [0.495, 0.70], [0.47, 0.80], [0.36, 0.78], [0.27, 0.66]]) }, cond);
      var pLBB = el('path', { d: curve([[0.505, 0.57], [0.55, 0.72], [0.61, 0.86], [0.74, 0.82], [0.81, 0.66]]) }, cond);
      var sa = el('circle', { cx: sa0[0], cy: sa0[1], r: 6, fill: '#fff2b0', stroke: '#e0862a', 'stroke-width': 2, filter: glowF }, heart);
      var av = el('circle', { cx: av0[0], cy: av0[1], r: 5.5, fill: '#fff2b0', stroke: '#e0862a', 'stroke-width': 2, filter: glowF }, heart);

      // 이름표(흰 알약) — 그림 위에서도 읽히게
      var pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(x, y, txt, color, size) {
        var g = el('g', null, heart);
        var w = txt.length * (size || 12) * 0.95 + 14;
        el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return g;
      }
      var q;
      q = P(0.38, 0.42); pill(q[0], q[1], '우심방', '#3d4a54');
      q = P(0.66, 0.43); pill(q[0], q[1], '좌심방', '#3d4a54');
      q = P(0.37, 0.66); pill(q[0], q[1], '우심실', '#3d4a54');
      q = P(0.68, 0.68); pill(q[0], q[1], '좌심실', '#3d4a54');
      q = P(0.30, 0.215); var saL = pill(q[0], q[1], 'SA결절', '#b4531f');
      q = P(0.36, 0.53); var avL = pill(q[0] - 4, q[1] - 6, 'AV결절', '#b4531f');
      q = P(0.60, 0.585); var hisL = pill(q[0], q[1], '히스속', '#b4531f', 11.5);
      q = P(0.50, 0.96); var pkL = pill(q[0], q[1] - 6, '푸르킨예 섬유', '#b4531f', 11.5);
      el('rect', { x: 4, y: 320, width: 96, height: 19, rx: 9.5, fill: 'rgba(255,255,255,.9)' }, svg);
      el('rect', { x: 224, y: 320, width: 56, height: 19, rx: 9.5, fill: 'rgba(255,255,255,.9)' }, svg);
      K.label(svg, 10, 330, '← 환자 오른쪽', { size: 12, fill: C.muted, weight: 600, anchor: 'start' });
      K.label(svg, 276, 330, '왼쪽 →', { size: 12, fill: C.muted, weight: 600, anchor: 'end' });

      // 흐르는 불꽃
      var spark = el('circle', { r: 5.5, fill: '#fffbe0', stroke: '#ff9a1f', 'stroke-width': 2, filter: glowF, opacity: 0 }, heart);
      var spark2 = el('circle', { r: 5.5, fill: '#fffbe0', stroke: '#ff9a1f', 'stroke-width': 2, filter: glowF, opacity: 0 }, heart);

      // 카메라: 단계마다 심장 안을 당겨 본다
      var CAM = [
        [0.0, 0.53, 0.55, 1.0], [0.8, 0.53, 0.55, 1.0], [1.4, 0.50, 0.42, 1.3], [2.6, 0.50, 0.42, 1.3],
        [3.1, 0.485, 0.52, 1.9], [4.2, 0.485, 0.52, 1.9], [4.8, 0.53, 0.66, 1.15], [6.4, 0.53, 0.66, 1.15],
        [7.2, 0.53, 0.55, 1.0], [11.5, 0.53, 0.55, 1.0]
      ];
      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var c = P(K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e));
          K.camera(heart, c[0], c[1], K.lerp(a[3], b[3], e), 141, 172);
          return;
        }
      }

      // ── 나침반: 평균 벡터와 유도 축 ──
      var cx = 350, cy = 92, R = 58;
      var comp = el('g', null, svg);
      el('circle', { cx: cx, cy: cy, r: R, fill: '#fff', stroke: C.line, 'stroke-width': 1.5 }, comp);
      var axes = {};
      Object.keys(LEADS).forEach(function (k) {
        var a = LEADS[k] * Math.PI / 180;
        axes[k] = el('line', { x1: cx - R * Math.cos(a), y1: cy - R * Math.sin(a), x2: cx + R * Math.cos(a), y2: cy + R * Math.sin(a), stroke: '#dfe5e8', 'stroke-width': 1.2 }, comp);
      });
      var leadNeg = el('line', { stroke: C.navy, 'stroke-width': 1.6, 'stroke-dasharray': '4 4', opacity: 0.6 }, comp);
      var leadAxis = el('line', { stroke: C.navy, 'stroke-width': 3, 'stroke-linecap': 'round' }, comp);
      var plus = K.label(comp, 0, 0, '+', { size: 20, weight: 800, fill: C.navy });
      var leadName = K.label(comp, 0, 0, 'II', { size: 13, weight: 700, fill: C.navy });
      var shadow = el('line', { stroke: C.teal, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }, comp);
      var perp = el('line', { stroke: '#8a98a3', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, comp);
      var vecId = K.arrowHead(svg, C.clay, 'nmEcgVec');
      var vec = el('line', { x1: cx, y1: cy, x2: cx, y2: cy, stroke: C.clay, 'stroke-width': 4, 'marker-end': 'url(#' + vecId + ')', 'stroke-linecap': 'round' }, comp);
      el('circle', { cx: cx, cy: cy, r: 3.5, fill: C.ink }, comp);
      K.label(comp, cx, cy + R + 14, '그 순간 전기 방향(화살표)', { size: 12, fill: C.muted, weight: 500 });

      // 규칙 글
      var rule = el('g', null, svg);
      K.label(rule, 422, 50, '(+)쪽으로 다가오면 ▲ 위로', { size: 13.5, anchor: 'start', fill: C.teal, weight: 700 });
      K.label(rule, 422, 76, '(+)에서 멀어지면 ▼ 아래로', { size: 13.5, anchor: 'start', fill: C.clay, weight: 700 });
      K.label(rule, 422, 102, '축과 직각이면 ─ 거의 0', { size: 13.5, anchor: 'start', fill: C.muted, weight: 700 });
      var nowTxt = K.label(rule, 422, 136, '', { size: 15, anchor: 'start', fill: C.ink, weight: 800 });

      // ── 심전도 띠(오른쪽 아래) ──
      var X0 = 296, W = 288, Y0 = 186, H = 140, BASE = 280, AMP = 72;
      var paper = el('g', null, svg);
      el('rect', { x: X0, y: Y0, width: W, height: H, fill: '#fff6f6', stroke: '#f0c9c9' }, paper);
      for (var gx = 0; gx <= W; gx += 16) el('line', { x1: X0 + gx, y1: Y0, x2: X0 + gx, y2: Y0 + H, stroke: gx % 80 === 0 ? '#efb8b8' : '#f8dcdc', 'stroke-width': gx % 80 === 0 ? 1.2 : 0.7 }, paper);
      for (var gy = 0; gy <= H; gy += 16) el('line', { x1: X0, y1: Y0 + H - gy, x2: X0 + W, y2: Y0 + H - gy, stroke: gy % 80 === 0 ? '#efb8b8' : '#f8dcdc', 'stroke-width': gy % 80 === 0 ? 1.2 : 0.7 }, paper);
      var leadTag = K.label(paper, X0 + 8, Y0 + 14, 'II', { size: 14, anchor: 'start', weight: 800, fill: C.navy });
      var clipE = el('clipPath', { id: 'nmEcgClipE' }, defs);
      var reveal = el('rect', { x: X0, y: Y0 - 10, width: 0, height: H + 20 }, clipE);
      var traceGhost = el('path', { fill: 'none', stroke: '#e6c3c3', 'stroke-width': 1.6 }, svg);
      var trace = el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'clip-path': 'url(#nmEcgClipE)' }, svg);
      var head = el('circle', { r: 4.5, fill: C.clay }, svg);
      // 파형 이름표
      var tags = {};
      ['P', 'Q', 'R', 'S', 'T'].forEach(function (k) { tags[k] = K.label(svg, 0, 0, k, { size: 15, weight: 800, fill: C.clay }); });
      // 구간 괄호
      var brk = el('g', { opacity: 0 }, svg);
      var brkLine = el('path', { fill: 'none', stroke: C.blue, 'stroke-width': 1.8 }, brk);
      var brkTxt = K.label(brk, 0, 0, '', { size: 12.5, fill: C.blue, weight: 700 });

      function xOf(t) { return X0 + 8 + (real(t) / 0.8) * (W - 16); }
      var curLead = null, pts = [];
      function build(lead) {
        curLead = lead;
        var la = LEADS[lead];
        pts = [];
        for (var t = 0; t <= 11.5; t += 0.02) {
          var v = vector(t);
          pts.push([xOf(t), BASE - AMP * v.mag * Math.cos((v.ang - la) * Math.PI / 180)]);
        }
        var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
        trace.setAttribute('d', d);
        traceGhost.setAttribute('d', d);
        leadTag.textContent = lead;
        var a = la * Math.PI / 180;
        leadNeg.setAttribute('x1', cx - R * Math.cos(a)); leadNeg.setAttribute('y1', cy - R * Math.sin(a));
        leadNeg.setAttribute('x2', cx); leadNeg.setAttribute('y2', cy);
        leadAxis.setAttribute('x1', cx); leadAxis.setAttribute('y1', cy);
        leadAxis.setAttribute('x2', cx + R * Math.cos(a)); leadAxis.setAttribute('y2', cy + R * Math.sin(a));
        plus.setAttribute('x', cx + (R + 12) * Math.cos(a)); plus.setAttribute('y', cy + (R + 12) * Math.sin(a));
        leadName.setAttribute('x', cx + (R - 14) * Math.cos(a) + 14 * Math.sin(a));
        leadName.setAttribute('y', cy + (R - 14) * Math.sin(a) - 14 * Math.cos(a));
        leadName.textContent = lead;
        // 파형 이름표 위치(각 파의 꼭짓점)
        var peaks = { P: 1.7, Q: 4.45, R: 5.15, S: 6.0, T: 8.8 };
        Object.keys(peaks).forEach(function (k) {
          var t = peaks[k], v = vector(t);
          var y = BASE - AMP * v.mag * Math.cos((v.ang - la) * Math.PI / 180);
          var up = y <= BASE;
          var big = Math.abs(y - BASE) < 3;
          tags[k].setAttribute('x', xOf(t) + (k === 'Q' ? -7 : k === 'S' ? 7 : 0));
          tags[k].setAttribute('y', big ? BASE - 14 : up ? y - 12 : y + 14);
        });
      }

      return function render(t, o) {
        if (o.lead !== curLead) build(o.lead);
        var la = LEADS[o.lead];
        var x = xOf(t);
        reveal.setAttribute('width', Math.max(0, x - X0));
        var v = vector(t);
        var y = BASE - AMP * v.mag * Math.cos((v.ang - la) * Math.PI / 180);
        head.setAttribute('cx', x); head.setAttribute('cy', y);
        // 이름표: 지나간 파형만
        var seen = { P: 0.8, Q: 4.2, R: 4.7, S: 5.6, T: 7.6 };
        Object.keys(seen).forEach(function (k) { tags[k].setAttribute('opacity', t >= seen[k] ? 1 : 0); });

        // 나침반 벡터·그림자
        var a = v.ang * Math.PI / 180, L = v.mag * (R - 6);
        var tx = cx + L * Math.cos(a), ty = cy + L * Math.sin(a);
        vec.setAttribute('x2', tx); vec.setAttribute('y2', ty);
        vec.setAttribute('opacity', v.mag > 0.02 ? 1 : 0);
        var ax = Math.cos(la * Math.PI / 180), ay = Math.sin(la * Math.PI / 180);
        var proj = L * Math.cos((v.ang - la) * Math.PI / 180);
        var sx = cx + proj * ax, sy = cy + proj * ay;
        shadow.setAttribute('x1', cx); shadow.setAttribute('y1', cy);
        shadow.setAttribute('x2', sx); shadow.setAttribute('y2', sy);
        shadow.setAttribute('stroke', proj >= 0 ? C.teal : C.clay);
        shadow.setAttribute('opacity', v.mag > 0.02 ? 0.75 : 0);
        perp.setAttribute('x1', tx); perp.setAttribute('y1', ty); perp.setAttribute('x2', sx); perp.setAttribute('y2', sy);
        perp.setAttribute('opacity', v.mag > 0.02 ? 1 : 0);
        var val = v.mag * Math.cos((v.ang - la) * Math.PI / 180);
        nowTxt.textContent = v.mag < 0.02 ? '지금 ' + o.lead + '유도: ─ 기준선' :
          val > 0.03 ? '지금 ' + o.lead + '유도: ▲ 위로' : val < -0.03 ? '지금 ' + o.lead + '유도: ▼ 아래로' : '지금 ' + o.lead + '유도: ─ 거의 0';
        nowTxt.setAttribute('fill', v.mag < 0.02 || Math.abs(val) <= 0.03 ? C.muted : val > 0 ? C.teal : C.clay);

        // 심장: 탈분극 물결
        var pA = K.seg(t, 0.8, 2.6);
        var aOn = t >= 0.8 && t < 4.7;
        waveA.setAttribute('r', aOn ? K.easeOut(pA) * 170 : 0);
        waveA.setAttribute('opacity', t < 4.7 ? 0.7 : 0.7 * (1 - K.seg(t, 4.7, 5.6)));
        if (t >= 4.7 && t < 5.6) waveA.setAttribute('r', 170);
        var pV = K.seg(t, 4.2, 6.4);
        var vOn = t >= 4.2 && t < 10.0;
        waveV.setAttribute('r', vOn ? K.easeOut(pV) * 190 : 0);
        waveV.setAttribute('opacity', t < 7.6 ? 0.72 : 0.72 * (1 - K.seg(t, 7.6, 10.0)));
        // 중격 먼저(Q): 물결 시작점을 중격 위쪽에 둔다
        var vc = P(0.51, t < 4.7 ? 0.58 : K.lerp(0.58, 0.80, K.seg(t, 4.7, 5.6)));
        waveV.setAttribute('cx', vc[0]); waveV.setAttribute('cy', vc[1]);

        // 불꽃 이동
        spark.setAttribute('opacity', 0); spark2.setAttribute('opacity', 0);
        if (t >= 0.8 && t < 2.6) {
          var q = K.seg(t, 0.8, 2.6);
          var p1 = K.along(pInter, q), p2 = K.along(pBach, Math.min(1, q * 1.4));
          spark.setAttribute('cx', p1.x); spark.setAttribute('cy', p1.y); spark.setAttribute('opacity', 1);
          spark2.setAttribute('cx', p2.x); spark2.setAttribute('cy', p2.y); spark2.setAttribute('opacity', q < 0.75 ? 1 : 0);
        } else if (t >= 2.6 && t < 4.2) {
          var w = 1 + 0.35 * Math.sin(t * 9);
          spark.setAttribute('cx', av0[0]); spark.setAttribute('cy', av0[1]); spark.setAttribute('r', 5.5 * w); spark.setAttribute('opacity', 1);
        } else if (t >= 4.2 && t < 6.4) {
          var r2 = K.seg(t, 4.2, 6.4);
          var hp = K.along(pHis, Math.min(1, r2 * 4));
          if (r2 < 0.25) { spark.setAttribute('cx', hp.x); spark.setAttribute('cy', hp.y); spark.setAttribute('opacity', 1); }
          else {
            var b1 = K.along(pRBB, (r2 - 0.25) / 0.75), b2 = K.along(pLBB, (r2 - 0.25) / 0.75);
            spark.setAttribute('cx', b1.x); spark.setAttribute('cy', b1.y); spark.setAttribute('opacity', 1);
            spark2.setAttribute('cx', b2.x); spark2.setAttribute('cy', b2.y); spark2.setAttribute('opacity', 1);
          }
        }
        if (!(t >= 2.6 && t < 4.2)) spark.setAttribute('r', 5.5);
        sa.setAttribute('r', t >= 0.8 && t < 1.4 ? 6 + 4 * K.pulse(t, 0.8, 1.4) : 6);
        cam(t);
        // 단계별 이름 강조
        saL.setAttribute('opacity', t < 4.2 ? 1 : 0.45);
        avL.setAttribute('opacity', t >= 2.6 && t < 4.7 ? 1 : 0.45);
        hisL.setAttribute('opacity', t >= 4.2 && t < 6.4 ? 1 : 0.45);
        pkL.setAttribute('opacity', t >= 4.7 && t < 6.4 ? 1 : 0.45);

        // 구간 괄호
        var show = null;
        if (t >= 2.6 && t < 4.2) show = { a: 0.8, b: 4.2, txt: 'PR 간격 0.12~0.20초' };
        else if (t >= 5.6 && t < 6.4) show = { a: 4.2, b: 6.4, txt: 'QRS < 0.12초' };
        else if (t >= 6.4 && t < 7.6) show = { a: 6.4, b: 7.6, txt: 'ST 분절 = 기준선 높이' };
        if (show) {
          var xa = xOf(show.a), xb = xOf(show.b), yb = Y0 + H - 12;
          brkLine.setAttribute('d', 'M' + xa + ',' + (yb - 6) + ' L' + xa + ',' + yb + ' L' + xb + ',' + yb + ' L' + xb + ',' + (yb - 6));
          brkTxt.setAttribute('x', Math.min(X0 + W - 70, Math.max(X0 + 70, (xa + xb) / 2)));
          brkTxt.setAttribute('y', yb - 14);
          brkTxt.textContent = show.txt;
          brk.setAttribute('opacity', 1);
        } else brk.setAttribute('opacity', 0);
      };
    }
  });
})();
