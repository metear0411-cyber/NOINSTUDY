// 시상하부–뇌하수체–갑상선 축과 음성 되먹임
// 원리: TRH → TSH → T4·T3, T4·T3가 위를 억제한다.
//       원발성 저하증은 T4↓ → 브레이크 풀려 TSH↑, 그레이브스병은 항체 자극 → T4↑ → TSH↓.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var LV = {
    normal: { trh: 1, tsh: 1, t4: 1 },
    hypo: { trh: 1.5, tsh: 2.6, t4: 0.3 },
    hyper: { trh: 0.5, tsh: 0.1, t4: 2.4 }
  };

  var COMMON = [
    { at: 0, label: '축', text: '**시상하부**가 TRH를 내면 **뇌하수체**가 TSH를 내고, TSH가 **갑상선**을 자극해 **T4(대부분)·T3(활성형)**를 만든다. 이것이 시상하부–뇌하수체–갑상선 축이다.' },
    { at: 2.4, label: '조직', text: 'T4는 조직에서 활성형 **T3**로 바뀌어 **대사 속도**를 정한다. 열 생산·심박수·장운동·생각의 속도가 모두 여기에 맞춰진다.' },
    { at: 4.6, label: '음성 되먹임', text: '혈중 T4·T3가 충분하면 시상하부·뇌하수체를 **억제(음성 되먹임)**해 TRH·TSH가 줄고, 부족하면 브레이크가 풀려 늘어난다. 그래서 **TSH가 갑상선 기능의 가장 민감한 선별검사**다.' }
  ];
  var BY = {
    normal: [
      { at: 7, label: '검사 해석', text: '정상은 TSH·FT4가 모두 기준 범위 안이다. 아래 **상태** 버튼으로 갑상선이 고장 난 경우(저하증)와 과하게 일하는 경우(항진증)를 비교해 보자.' },
      { at: 10, label: '노인에서', text: '노인에서는 두 질환 모두 전형 증상이 흐리다. 저하증은 피로·우울·인지저하·변비로 **노화처럼** 보이고, 항진증은 **무감동형**으로 빈맥·심방세동·체중감소만 보이기 쉽다.' },
      { at: 12.6, label: '치료', text: '저하증은 **레보티록신을 저용량부터·아침 공복**에, 항진증은 **항갑상선제·방사성 요오드**와 증상 조절용 **β차단제**가 기본이다. 상태 버튼을 바꾸면 각각의 치료 설명이 나온다.' }
    ],
    hypo: [
      { at: 7, label: '원발성 저하증', text: '갑상선 자체가 고장 나 **T4가 줄면**(흔한 원인은 **하시모토 갑상선염**) 브레이크가 풀려 **TSH가 오른다**. **TSH↑·FT4↓**가 원발성 갑상선기능저하증의 검사 소견이다.' },
      { at: 10, label: '노인 저하증', text: '노인 저하증은 **피로·우울·인지저하·변비·추위 못 견딤·피부 건조**가 서서히 와서 **나이 탓으로 넘기기 쉽다**. 기운·기억이 떨어진 노인은 TSH를 확인한다.' },
      { at: 12.6, label: '레보티록신', text: '**레보티록신**은 노인·관상동맥질환자에서 협심증·부정맥을 피하려고 **저용량(12.5~25 μg)에서 시작해 천천히** 올린다. **아침 공복**(식전 30~60분)에 먹고 칼슘·철분제와는 4시간 띄우며, 6~8주 뒤 TSH로 용량을 맞춘다.' }
    ],
    hyper: [
      { at: 7, label: '그레이브스병', text: '**TSH 수용체 항체**가 TSH 대신 갑상선을 계속 자극해 **T4·T3가 늘고**, 되먹임으로 **TSH는 거의 0까지 억제**된다. **TSH↓·FT4↑**가 항진증의 검사 소견이다.' },
      { at: 10, label: '노인 항진증', text: '노인 항진증은 떨림·더위·흥분 없이 **무감동형(apathetic)**으로 와서 무기력·우울처럼 보인다. **빈맥·심방세동·체중감소**만 단서인 경우가 많아 원인 모를 심방세동은 갑상선 검사를 한다.' },
      { at: 12.6, label: '항진증 치료', text: '**항갑상선제**(메티마졸·PTU), **방사성 요오드**, 수술로 치료하고 **β차단제**로 빈맥·떨림을 먼저 가라앉힌다. 항갑상선제 복용 중 **발열·인후통**이 생기면 무과립구증을 의심한다.' }
    ]
  };

  var CARD = {
    old: {
      normal: { title: '노인: 증상이 흐리다', lines: ['저하증: 피로·우울·인지↓·변비', '→ 노화로 오인', '항진증: 무감동형', '→ 빈맥·심방세동·체중↓만'] },
      hypo: { title: '노인 저하증 = 노화처럼', lines: ['피로·우울·인지저하', '변비·추위 못 견딤·피부 건조', '→ 기운·기억 떨어지면 TSH', ''] },
      hyper: { title: '노인 항진증 = 무감동형', lines: ['떨림·흥분 없이 무기력', '빈맥·심방세동·체중감소만', '→ 원인 모를 심방세동: 갑상선 검사', ''] }
    },
    tx: {
      normal: { title: '치료 한눈에', lines: ['저하증: 레보티록신', '저용량부터·아침 공복', '항진증: 항갑상선제·방사성 요오드', 'β차단제로 증상 조절'] },
      hypo: { title: '레보티록신(T4)', lines: ['12.5~25 μg로 시작, 천천히↑', '아침 공복(식전 30~60분)', '칼슘·철분제와 4시간 간격', '6~8주 뒤 TSH로 조절'] },
      hyper: { title: '항진증 치료', lines: ['메티마졸·PTU / 방사성 요오드', 'β차단제: 빈맥·떨림 조절', '발열·인후통 → 무과립구증', ''] }
    }
  };

  M.register({
    id: 'thyroid-feedback',
    title: '갑상선 축과 음성 되먹임 — TSH가 거꾸로 가는 이유',
    system: '내분비',
    topics: ['thyroid'],
    duration: 15,
    options: [{
      key: 'state', label: '상태',
      choices: [{ value: 'normal', label: '정상' }, { value: 'hypo', label: '원발성 저하증' }, { value: 'hyper', label: '항진증(그레이브스)' }],
      value: 'normal'
    }],
    steps: [],
    stepsFor: function (o) { return COMMON.concat(BY[o.state] || BY.normal); },
    source: '레보티록신 시작 용량·복용법은 노인간호학·약리학 교재 기준. 호르몬 양과 화살표 굵기는 설명용으로 단순화.',

    setup: function (svg, K, opt) {
      var el = K.el, C = K.C;
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var defs = svg.querySelector('defs') || el('defs', null, svg);
      var glowF = K.glow(svg, 2.2), sh = K.shadow(svg, 1.2, 1.2, 0.3);
      var cardSh = K.shadow(svg, 3, 4, 0.18), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function radial(id, stops) {
        var g = el('radialGradient', { id: id }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, g); });
        return 'url(#' + id + ')';
      }
      var gOrange = radial('nmThyOr', [['0%', '#fff1c4', 0.95], ['55%', '#ffb15c', 0.6], ['100%', '#ff7a3d', 0]]);
      var gGrey = radial('nmThyGr', [['0%', '#e9e4e2', 0.85], ['70%', '#cfc8c5', 0.6], ['100%', '#cfc8c5', 0]]);
      function marker(id, color) {
        var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '9', markerHeight: '9',
          markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs);
        el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
      }
      marker('nmThyA', '#1f9a8e');

      // ── 머리·목 그림(카메라 세계) ──
      var IX = -119, IY = -12, IW = 570, IH = 380;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      var clip = el('clipPath', { id: 'nmThyClip' }, defs);
      el('rect', { x: 0, y: 0, width: 346, height: 340 }, clip);
      var box = el('g', { 'clip-path': 'url(#nmThyClip)' }, svg);
      var world = el('g', null, box);
      K.image(world, 'neck-endocrine', IX, IY, IW, IH, { fadeR: '66%' });
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 14;
        var r = el('rect', { x: x - w / 2, y: y - 10.5, width: w, height: 21, rx: 10.5, fill: 'rgba(255,255,255,.9)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, set: function (s2) {
          if (tx.textContent === s2) return;
          tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.92 + 14;
          r.setAttribute('x', x - w2 / 2); r.setAttribute('width', w2);
        } };
      }

      var HY = P(0.475, 0.281), PI = P(0.471, 0.338), TH = P(0.471, 0.800);   // webp 격자로 잰 위치
      // 기관 빛(분비량만큼)
      var hyGlow = el('circle', { cx: HY[0], cy: HY[1], r: 9, fill: gOrange, style: 'mix-blend-mode:screen' }, world);
      var piGlow = el('circle', { cx: PI[0], cy: PI[1], r: 8, fill: gOrange, style: 'mix-blend-mode:screen' }, world);
      var thGlow = el('ellipse', { cx: TH[0], cy: TH[1], rx: 26, ry: 30, fill: gOrange, style: 'mix-blend-mode:screen' }, world);
      var thDim = el('ellipse', { cx: TH[0], cy: TH[1], rx: 22, ry: 26, fill: gGrey, opacity: 0 }, world);
      var lymph = el('g', { opacity: 0 }, world);
      [[-12, -10], [-6, 8], [-14, 14], [10, -12], [14, 6], [6, 16], [-2, -2], [12, 20]].forEach(function (d) {
        el('circle', { cx: TH[0] + d[0], cy: TH[1] + d[1], r: 2.8, fill: K.sphere(svg, C.purple) }, lymph);
      });
      var abs = [];
      [[-30, -18, -60], [-30, 18, -120], [30, -18, 60], [30, 18, 120], [0, -32, 0]].forEach(function (a) {
        var g = el('g', { opacity: 0 }, world);
        el('path', { d: 'M0,7 L0,0 M0,0 L-4.5,-6 M0,0 L4.5,-6', stroke: '#fff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M0,7 L0,0 M0,0 L-4.5,-6 M0,0 L4.5,-6', stroke: C.purple, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }, g);
        abs.push({ g: g, x: TH[0] + a[0], y: TH[1] + a[1], r: a[2] });
      });

      // 경로
      var P2 = {
        trh: el('path', { d: 'M' + (HY[0] - 1) + ',' + (HY[1] + 5) + ' L' + (PI[0] + 0.5) + ',' + (PI[1] - 7), fill: 'none', stroke: '#1f9a8e', 'stroke-linecap': 'round', 'marker-end': 'url(#nmThyA)', filter: glowF }, world),
        tsh: el('path', { d: 'M' + PI[0] + ',' + (PI[1] + 8) + ' C' + (PI[0] + 10) + ',' + (PI[1] + 50) + ' ' + (TH[0] + 8) + ',' + (TH[1] - 70) + ' ' + TH[0] + ',' + (TH[1] - 32), fill: 'none', stroke: '#1f9a8e', 'stroke-linecap': 'round', 'marker-end': 'url(#nmThyA)', filter: glowF }, world),
        t4: el('path', { d: 'M' + (TH[0] + 22) + ',' + TH[1] + ' C' + (TH[0] + 90) + ',' + (TH[1] - 6) + ' 260,' + (TH[1] - 4) + ' 352,' + (TH[1] - 2), fill: 'none', stroke: '#1f9a8e', 'stroke-linecap': 'round', filter: glowF }, world),
        fbP: el('path', { d: 'M' + (TH[0] - 22) + ',' + (TH[1] - 6) + ' C' + (TH[0] - 60) + ',' + (TH[1] - 40) + ' ' + (PI[0] - 46) + ',' + (PI[1] + 30) + ' ' + (PI[0] - 8) + ',' + (PI[1] + 2), fill: 'none', stroke: C.clay, 'stroke-linecap': 'round', 'stroke-dasharray': '5 4', filter: glowF }, world),
        fbH: el('path', { d: 'M' + (TH[0] - 22) + ',' + (TH[1] + 6) + ' C' + (TH[0] - 110) + ',' + (TH[1] - 20) + ' ' + (HY[0] - 90) + ',' + (HY[1] - 10) + ' ' + (HY[0] - 9) + ',' + (HY[1] - 2), fill: 'none', stroke: C.clay, 'stroke-linecap': 'round', 'stroke-dasharray': '5 4', filter: glowF }, world)
      };
      function brake(x, y) {
        var g = el('g', { filter: sh }, world);
        el('circle', { cx: x, cy: y, r: 6, fill: '#fff', stroke: C.clay, 'stroke-width': 1.8 }, g);
        el('line', { x1: x - 3.2, y1: y, x2: x + 3.2, y2: y, stroke: C.clay, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
        return g;
      }
      var brH = brake(HY[0] - 11, HY[1] - 2), brP = brake(PI[0] - 10, PI[1] + 2);
      var parts = {};
      ['trh', 'tsh', 't4', 'fbP', 'fbH'].forEach(function (k) {
        parts[k] = [];
        var col = k.indexOf('fb') === 0 ? C.clay : k === 't4' ? '#e0862a' : '#1fa89a';
        for (var i = 0; i < 8; i++) parts[k].push(el('circle', { r: k === 'trh' ? 1.8 : 3, fill: K.sphere(svg, col), opacity: 0 }, world));
      });

      // 이름표
      var lHy = pill(world, HY[0] + 38, HY[1] - 12, '시상하부', C.blue, 11);
      var lPi = pill(world, PI[0] + 38, PI[1] + 8, '뇌하수체', C.purple, 11);
      el('line', { x1: HY[0] + 4, y1: HY[1] - 3, x2: HY[0] + 18, y2: HY[1] - 10, stroke: '#fff', 'stroke-width': 1.2 }, world);
      el('line', { x1: PI[0] + 5, y1: PI[1] + 3, x2: PI[0] + 18, y2: PI[1] + 7, stroke: '#fff', 'stroke-width': 1.2 }, world);
      var lTrh = pill(world, HY[0] - 30, HY[1] + 14, 'TRH', '#1f7a74', 10.5);
      var lTsh = pill(world, TH[0] + 32, (PI[1] + TH[1]) / 2 - 6, 'TSH', '#1f7a74');
      var lT4 = pill(world, 232, TH[1] - 20, 'T4·T3 → 온몸', '#1f7a74');
      pill(world, TH[0] - 52, TH[1] + 2, '갑상선', C.clay, 12.5);
      var fbPill = pill(world, 52, 178, 'T4·T3 되먹임(−)', C.clay);
      var thyNote = pill(world, TH[0] + 70, TH[1] + 26, '', C.purple, 11);

      // 카메라 [시각, 세계 x, y, 배율] → 화면 (175,170)
      var CAM = [[0, HY[0] - 2, HY[1] + 12, 2.0], [0.9, HY[0] - 2, HY[1] + 12, 2.0], [1.9, 175, 170, 1], [7.0, 175, 170, 1],
        [7.6, TH[0] + 30, TH[1] - 4, 1.5], [9.4, TH[0] + 30, TH[1] - 4, 1.5], [10.0, 175, 170, 1], [15, 175, 170, 1]];
      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 175, 170);
          return;
        }
      }

      // ── 혈액 검사 카드 ──
      el('rect', { x: 352, y: 8, width: 240, height: 146, rx: 14, fill: 'rgba(255,255,255,.95)', filter: cardSh }, svg);
      K.label(svg, 366, 28, '혈액 검사', { size: 14, anchor: 'start', weight: 800 });
      var SX0 = 412, SX1 = 520;
      function scaleRow(y, name) {
        K.label(svg, 366, y, name, { size: 15, anchor: 'start', weight: 800 });
        el('rect', { x: SX0, y: y - 6, width: 36, height: 12, rx: 4, fill: C.blueSoft }, svg);
        el('rect', { x: SX0 + 36, y: y - 6, width: 36, height: 12, fill: C.greenSoft }, svg);
        el('rect', { x: SX0 + 72, y: y - 6, width: 36, height: 12, rx: 4, fill: C.claySoft }, svg);
        var dot = el('circle', { cx: 466, cy: y, r: 8, fill: C.ink, filter: sh }, svg);
        var txt = K.label(svg, 528, y, '', { size: 14, anchor: 'start', weight: 800 });
        return { dot: dot, txt: txt };
      }
      var rTSH = scaleRow(66, 'TSH'), rT4 = scaleRow(106, 'FT4');
      K.label(svg, 430, 136, '낮음', { size: 12, fill: C.blue, weight: 600 });
      K.label(svg, 466, 136, '정상', { size: 12, fill: C.green, weight: 600 });
      K.label(svg, 502, 136, '높음', { size: 12, fill: C.clay, weight: 600 });

      // ── 조직/카드 ──
      var boxBar = el('rect', { x: 352, y: 166, width: 6, height: 166, rx: 3, fill: C.teal }, svg);
      el('rect', { x: 352, y: 166, width: 240, height: 166, rx: 14, fill: 'rgba(255,255,255,.95)', filter: cardSh }, svg);
      boxBar = el('rect', { x: 352, y: 166, width: 6, height: 166, rx: 3, fill: C.teal }, svg);
      var boxTitle = K.label(svg, 368, 186, '', { size: 14, anchor: 'start', weight: 800 });
      var meter = el('g', null, svg);
      el('rect', { x: 368, y: 214, width: 212, height: 12, rx: 6, fill: '#eef2f3' }, meter);
      el('rect', { x: 439, y: 214, width: 70, height: 12, fill: C.greenSoft }, meter);
      K.label(meter, 368, 240, '느림', { size: 12, anchor: 'start', fill: C.blue, weight: 700 });
      K.label(meter, 580, 240, '빠름', { size: 12, anchor: 'end', fill: C.clay, weight: 700 });
      var mDot = el('circle', { cx: 474, cy: 220, r: 8.5, fill: K.sphere(svg, C.teal), filter: sh }, meter);
      var lines = [];
      for (var q = 0; q < 4; q++) lines.push(K.label(svg, 368, 214 + q * 27, '', { size: 12.5, anchor: 'start', weight: 600 }));
      var symA = K.label(svg, 368, 274, '', { size: 13, anchor: 'start', weight: 700 });
      var symB = K.label(svg, 368, 300, '', { size: 12.5, anchor: 'start', weight: 600, fill: C.muted });

      function levelX(v) {
        if (v >= 1) return 466 + Math.min(1, (v - 1) / 1.4) * 50;
        return 466 - Math.min(1, (1 - v) / 0.9) * 50;
      }

      return function render(t, o) {
        var st = o.state;
        cam(t);
        var d = K.easeInOut(K.seg(t, 7, 8.6));
        var L = {};
        ['trh', 'tsh', 't4'].forEach(function (k) { L[k] = K.lerp(LV.normal[k], LV[st][k], d); });

        var on = { trh: K.seg(t, 0.2, 0.7), tsh: K.seg(t, 1.0, 1.6), t4: K.seg(t, 1.8, 2.4), fb: K.seg(t, 4.6, 5.2) };
        function setPath(p, lvl, a, base) {
          p.setAttribute('stroke-width', (base + 1.6 * Math.min(lvl, 2.6)).toFixed(2));
          p.setAttribute('opacity', (0.1 + 0.9 * a) * (lvl < 0.2 ? 0.35 : 1));
        }
        setPath(P2.trh, L.trh, on.trh, 0.6); setPath(P2.tsh, L.tsh, on.tsh, 1.2); setPath(P2.t4, L.t4, on.t4, 1.2);
        ['fbP', 'fbH'].forEach(function (k) {
          P2[k].setAttribute('stroke-width', (1 + 1.4 * L.t4).toFixed(2));
          P2[k].setAttribute('opacity', 0.12 + 0.88 * on.fb * (L.t4 < 0.5 ? 0.45 : 1));
        });
        var zoomTh = K.seg(t, 7.0, 7.5) * (1 - K.seg(t, 9.4, 9.9));
        fbPill.g.setAttribute('opacity', on.fb * (1 - zoomTh));
        lTsh.g.setAttribute('opacity', on.tsh);
        lT4.g.setAttribute('opacity', on.t4);
        [brH, brP].forEach(function (b, k) {
          var s = 0.7 + 0.35 * Math.min(L.t4, 2.4);
          var c = k ? [PI[0] - 10, PI[1] + 2] : [HY[0] - 11, HY[1] - 2];
          b.setAttribute('transform', 'translate(' + c[0] * (1 - s) + ',' + c[1] * (1 - s) + ') scale(' + s + ')');
          b.setAttribute('opacity', on.fb * (L.t4 < 0.5 ? 0.35 : 1));
        });
        hyGlow.setAttribute('r', (6 + 5 * L.trh).toFixed(1));
        hyGlow.setAttribute('opacity', 0.4 + 0.3 * Math.min(L.trh, 1.6) + 0.15 * Math.sin(t * 5));
        piGlow.setAttribute('r', (5 + 5 * Math.min(L.tsh, 2.6)).toFixed(1));
        piGlow.setAttribute('opacity', K.clamp(0.25 + 0.35 * L.tsh, 0.1, 1));

        function flow(key, pathEl, lvl, a, speed) {
          var n = Math.round(K.clamp(lvl * 3, 0, 8));
          parts[key].forEach(function (c, i) {
            if (i >= n || a < 1) { c.setAttribute('opacity', 0); return; }
            var ph = (t * speed + i / n) % 1;
            var pt = K.along(pathEl, ph);
            c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1));
            c.setAttribute('opacity', Math.sin(ph * Math.PI));
          });
        }
        flow('trh', P2.trh, L.trh, on.trh, 0.9);
        flow('tsh', P2.tsh, L.tsh, on.tsh, 0.6);
        flow('t4', P2.t4, L.t4, on.t4, 0.5);
        flow('fbP', P2.fbP, L.t4, on.fb, 0.4);
        flow('fbH', P2.fbH, L.t4, on.fb, 0.3);

        var hypo = st === 'hypo', hyper = st === 'hyper';
        thGlow.setAttribute('opacity', K.clamp(0.15 + 0.35 * L.t4 * on.t4 + (hyper ? 0.1 * Math.sin(t * 6) * d : 0), 0, 1));
        thGlow.setAttribute('rx', (24 + (hyper ? 8 * d : 0)).toFixed(1));
        thGlow.setAttribute('ry', (28 + (hyper ? 8 * d : 0)).toFixed(1));
        thDim.setAttribute('opacity', hypo ? 0.75 * d : 0);
        lymph.setAttribute('opacity', hypo ? d : 0);
        abs.forEach(function (a, k) {
          var p = hyper ? K.easeOut(K.seg(t, 7.2 + 0.15 * k, 8.2 + 0.15 * k)) : 0;
          var ang = a.r * Math.PI / 180;
          var x = a.x + Math.sin(ang) * 16 * (1 - p), y = a.y - Math.cos(ang) * 16 * (1 - p);
          a.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (a.r + 180) + ')');
          a.g.setAttribute('opacity', p > 0 ? Math.min(1, p * 2) : 0);
        });
        thyNote.set(hypo ? '하시모토 갑상선염' : hyper ? 'TSH 수용체 항체가 자극' : '');
        thyNote.g.setAttribute('opacity', st === 'normal' ? 0 : d);
        lTrh.g.setAttribute('opacity', 1 - K.seg(t, 1.2, 1.8));

        function badge(row, v) {
          row.dot.setAttribute('cx', levelX(v).toFixed(1));
          var s = v > 1.3 ? '↑ 높음' : v < 0.7 ? '↓ 낮음' : '정상';
          var c = v > 1.3 ? C.clay : v < 0.7 ? C.blue : C.green;
          row.txt.textContent = s; row.txt.setAttribute('fill', c); row.dot.setAttribute('fill', K.sphere(svg, c));
        }
        badge(rTSH, L.tsh); badge(rT4, L.t4);

        var mode = t >= 12.6 ? 'tx' : t >= 10 ? 'old' : 'meta';
        if (mode === 'meta') {
          boxTitle.textContent = '온몸 조직: 대사 속도'; boxTitle.setAttribute('fill', C.teal);
          boxBar.setAttribute('fill', C.teal);
          meter.setAttribute('opacity', on.t4);
          mDot.setAttribute('cx', (474 + K.clamp((L.t4 - 1) / 1.4, -1, 1) * 100).toFixed(1));
          lines.forEach(function (l) { l.textContent = ''; });
          var hv = L.t4 < 0.7, hp = L.t4 > 1.3;
          mDot.setAttribute('fill', K.sphere(svg, hv ? C.blue : hp ? C.clay : C.teal));
          symA.textContent = hv ? '느려짐: 피로·추위 못 견딤' : hp ? '빨라짐: 빈맥·더위 못 견딤' : t >= 2.4 ? '적정: 체온·심박·장운동 유지' : '';
          symB.textContent = hv ? '서맥·변비·체중 증가·부종' : hp ? '체중감소·떨림·설사·불안' : '';
          symA.setAttribute('fill', hv ? C.blue : hp ? C.clay : C.teal);
        } else {
          var cd = CARD[mode][st];
          var col = mode === 'tx' ? C.teal : C.clay;
          boxTitle.textContent = cd.title; boxTitle.setAttribute('fill', col);
          boxBar.setAttribute('fill', col);
          meter.setAttribute('opacity', 0);
          lines.forEach(function (l, k) { l.textContent = cd.lines[k] || ''; });
          symA.textContent = ''; symB.textContent = '';
        }
      };
    }
  });
})();
