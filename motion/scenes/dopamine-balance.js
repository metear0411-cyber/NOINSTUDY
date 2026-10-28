// 파킨슨병: 흑질-선조체 도파민과 아세틸콜린의 시소
// 원리: 흑질 도파민 뉴런 소실 → 선조체 도파민↓ → ACh 상대 우세 → 운동 증상.
//       레보도파로 채우고, 항정신병제(D2 차단)는 같은 기울기를 약으로 만든다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  // 시각(초)별 상태
  function neurons(t, K) {
    if (t < 13.2) return 1 - 0.8 * K.easeInOut(K.seg(t, 1.8, 4.8));
    return 0.2 + 0.8 * K.seg(t, 13.2, 13.8);
  }
  // 선조체 도파민 양(그림의 점 수)
  function amount(t, K) {
    var n = neurons(t, K);
    if (t < 13.2) {
      var base = t < 4.0 ? 1 - 0.1 * K.seg(t, 1.8, 4.0) : K.lerp(0.9, 0.25, K.seg(t, 4.0, 5.2));
      var levo = 0.7 * K.easeInOut(K.seg(t, 8.0, 9.6));
      var a = base + levo;
      if (t >= 10.8) a = 0.95 + osc(t, K);
      return a;
    }
    return n;
  }
  function osc(t, K) {
    var A = 0.5 * K.seg(t, 10.8, 12.0);
    return A * Math.sin((t - 10.8) * 4.2);
  }
  // 수용체에서 실제로 내는 효과(시소에 쓰는 값)
  function effect(t, K) {
    if (t < 13.2) return amount(t, K);
    return K.lerp(0.95, 0.3, K.seg(t, 13.4, 14.4));
  }

  M.register({
    id: 'dopamine-balance',
    title: '파킨슨병: 도파민과 아세틸콜린의 시소',
    system: '신경계',
    topics: ['parkinson', 'cns-drugs', 'antipsychotics', 'dementia'],
    duration: 18,
    steps: [
      { at: 0, label: '정상', text: '중뇌 **흑질**의 도파민 뉴런이 **선조체**로 도파민을 보낸다(흑질-선조체 경로). 선조체에서는 **도파민과 아세틸콜린**이 시소처럼 균형을 이뤄 움직임을 부드럽게 조절한다.' },
      { at: 1.8, label: '뉴런 소실', text: '파킨슨병은 흑질 도파민 뉴런이 서서히 죽는 병이다(신경세포 안 **루이소체** 축적). 남은 뉴런이 버텨 주어 **뉴런의 60~80%가 사라진 뒤에야** 증상이 드러난다(교재에 따라 80% 이상으로 적는다).' },
      { at: 4.6, label: '균형 깨짐', text: '선조체 도파민이 줄면 **아세틸콜린이 상대적으로 우세**해진다. 4대 증상은 **안정 시 떨림·강직(톱니바퀴)·운동완만·자세 불안정**이며, 떨림은 쉴 때 심하고 움직이면 줄어든다.' },
      { at: 7.6, label: '레보도파', text: '도파민은 혈뇌장벽을 넘지 못해 전구물질 **레보도파**를 먹는다. 함께 든 **카르비도파**는 말초에서 레보도파가 도파민으로 바뀌는 것을 막아 **더 많이 뇌로 들어가게** 하고 오심 같은 말초 부작용을 줄인다.' },
      { at: 10.8, label: '장기 복용', text: '수년 복용하면 다음 복용 전에 약효가 떨어지는 **wearing-off**, 갑자기 켜졌다 꺼지는 **on-off**, 약효 최고점에 몸이 꼬이는 **이상운동증**이 생긴다. ACh 쪽을 덜어 내는 **항콜린제**는 노인에서 **섬망·변비·요저류**가 잦아 피한다.' },
      { at: 13.2, label: '항정신병제', text: '도파민이 충분해도 **항정신병제**가 선조체 **D2 수용체를 막으면** 같은 기울기가 생긴다. 이것이 **약물 유발 파킨슨증(추체외로 증상)**이며, 항구토제 메토클로프라미드도 같은 원리다.' },
      { at: 15.4, label: '루이소체 감별', text: '**루이소체 치매**는 생생한 **환시·인지 기복**·파킨슨 증상을 보이고 **항정신병제에 과민반응**이 심하다. **1년 규칙**: 인지장애가 먼저이거나 운동증상과 1년 이내면 루이소체 치매, 운동증상이 1년 이상 먼저면 **파킨슨병 치매**.' }
    ],
    source: '뉴런 소실 비율은 교재마다 60~80%·80% 이상으로 다르게 적는다. 시소 기울기·점 개수는 설명용으로 단순화.',


    setup: function (svg, K) {
      var el = K.el, C = K.C;
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var defs = svg.querySelector('defs') || el('defs', null, svg);
      var glowF = K.glow(svg, 2.2), sh = K.shadow(svg, 1.2, 1.2, 0.35);
      var cardSh = K.shadow(svg, 3, 4, 0.18), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function radial(id, stops) {
        var g = el('radialGradient', { id: id }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, g); });
        return 'url(#' + id + ')';
      }
      var gTeal = radial('nmDopTeal', [['0%', '#d9fffb', 0.9], ['60%', '#4fd8c8', 0.5], ['100%', '#1f7a74', 0]]);
      var gBlue = radial('nmDopBlue', [['0%', '#e6f0ff', 0.85], ['65%', '#7fa8e0', 0.55], ['100%', '#385f8a', 0]]);

      // ── 뇌(정중단면 그림) — 카메라 세계, 오른쪽 패널을 넘지 않게 자른다 ──
      var IX = -40, IY = 6, IW = 450, IH = 300;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      var clip = el('clipPath', { id: 'nmDopClip' }, defs);
      el('rect', { x: 0, y: 0, width: 346, height: 340 }, clip);
      var box = el('g', { 'clip-path': 'url(#nmDopClip)' }, svg);
      var world = el('g', null, box);
      K.image(world, 'brain-sagittal', IX, IY, IW, IH, { fadeR: '64%' });
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 16;
        var r = el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.9)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, r: r, t: tx, set: function (s2) {
          if (tx.textContent === s2) return;
          tx.textContent = s2;
          var w2 = s2.length * (size || 12) * 0.92 + 16;
          r.setAttribute('x', x - w2 / 2); r.setAttribute('width', w2);
        } };
      }

      var NIG = P(0.487, 0.545), STR = P(0.428, 0.372);
      // 선조체(정중면보다 바깥쪽 깊이에 있음 — 투영 위치)
      el('ellipse', { cx: STR[0], cy: STR[1], rx: 34, ry: 19, fill: gBlue, style: 'mix-blend-mode:multiply' }, world);
      el('ellipse', { cx: STR[0], cy: STR[1], rx: 28, ry: 15, fill: 'rgba(225,234,243,.55)', stroke: C.blue, 'stroke-width': 1.3, 'stroke-dasharray': '3 2' }, world);
      var RX = [-16, -8, 0, 8, 16].map(function (d) { return STR[0] + d; }), RY = STR[1] + 5;
      var recs = RX.map(function (x) { return el('circle', { cx: x, cy: RY, r: 2.8, fill: '#fff', stroke: C.blue, 'stroke-width': 1.1 }, world); });
      var daOn = RX.map(function (x) { return el('circle', { cx: x, cy: RY - 3.5, r: 2.6, fill: K.sphere(svg, '#1fa89a'), opacity: 0 }, world); });
      function hexPath(cx, cy, r) {
        var p = [];
        for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
        return 'M' + p.join(' L') + ' Z';
      }
      var blocks = RX.map(function (x) { return el('path', { d: hexPath(x, RY - 1, 3.4), fill: K.sphere(svg, C.purple), stroke: '#fff', 'stroke-width': 0.6, opacity: 0 }, world); });

      // 흑질-선조체 경로(빛나는 선)
      var path = el('path', { d: 'M' + NIG[0] + ',' + (NIG[1] - 4) + ' C' + (NIG[0] - 2) + ',' + (NIG[1] - 26) + ' ' + (STR[0] + 18) + ',' + (STR[1] + 26) + ' ' + (STR[0] + 6) + ',' + (STR[1] + 8),
        fill: 'none', stroke: '#7fd8cc', 'stroke-width': 2.2, 'stroke-linecap': 'round', filter: glowF, opacity: 0.9 }, world);
      var flow = [];
      for (var i = 0; i < 6; i++) flow.push(el('circle', { r: 2.6, fill: K.sphere(svg, '#1fa89a'), opacity: 0 }, world));

      // 흑질 도파민 뉴런(멜라닌으로 검은 구슬)
      el('ellipse', { cx: NIG[0], cy: NIG[1], rx: 22, ry: 10, fill: gTeal, opacity: 0.35, transform: 'rotate(-20 ' + NIG[0] + ' ' + NIG[1] + ')' }, world);
      var cells = [];
      for (var c = 0; c < 10; c++) {
        var side = c < 5 ? -1 : 1;
        var cx = NIG[0] - 14 + (c % 5) * 7, cy = NIG[1] + side * 3.6 - (c % 5 - 2) * 2.4;
        cells.push(el('circle', { cx: cx, cy: cy, r: 3, fill: K.sphere(svg, '#3a3340'), stroke: 'none' }, world));
      }

      // 이름표
      var q;
      q = P(0.43, 0.285); var strPill = pill(world, q[0], q[1], '선조체', C.blue);
      var pct = pill(world, 200, 198, '흑질 뉴런 100%', '#5d4f66', 12);

      // 레보도파: 말초(왼쪽 아래 카드) → 혈뇌장벽 → 선조체
      var bbb = el('g', { opacity: 0 }, world);
      q = P(0.43, 0.712);
      el('path', { d: 'M' + (q[0] - 34) + ',' + (q[1] + 2) + ' Q' + q[0] + ',' + (q[1] + 8) + ' ' + (q[0] + 30) + ',' + (q[1] - 2), fill: 'none', stroke: C.gold, 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }, bbb);
      var bp = pill(bbb, q[0] - 66, q[1] + 6, '혈뇌장벽', '#8a6526');
      var levoPath = el('path', { d: 'M64,298 C110,280 140,250 ' + q[0] + ',' + q[1] + ' C' + (q[0] + 14) + ',' + (q[1] - 30) + ' ' + (NIG[0] - 4) + ',' + (NIG[1] - 8) + ' ' + STR[0] + ',' + (STR[1] + 6), fill: 'none', stroke: 'none' }, world);
      var levo = [];
      for (var j = 0; j < 5; j++) levo.push(el('circle', { r: 3.4, fill: K.sphere(svg, C.gold), filter: sh, opacity: 0 }, world));

      // 카메라 [시각, 세계 x, 세계 y, 배율] — 화면 (180,165)에 그 점이 오도록
      var CAM = [[0, 180, 165, 1], [1.6, 180, 165, 1], [2.4, 165, 145, 1.6], [4.4, 165, 145, 1.6],
        [5.0, 175, 150, 1.25], [7.3, 175, 150, 1.25], [7.8, 180, 165, 1], [10.6, 180, 165, 1], [11.2, NIG[0] - 14, NIG[1] - 40, 1.5],
        [13.0, NIG[0] - 14, NIG[1] - 40, 1.5], [13.6, STR[0], STR[1] + 10, 1.8], [15.2, STR[0], STR[1] + 10, 1.8], [15.8, 180, 165, 1], [18, 180, 165, 1]];
      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 180, 165);
          return;
        }
      }

      // 말초 카드(레보도파 단계)
      var inset = el('g', { opacity: 0 }, svg);
      el('rect', { x: 8, y: 260, width: 190, height: 74, rx: 12, fill: 'rgba(255,248,238,.95)', filter: cardSh }, inset);
      K.label(inset, 20, 275, '혈액(말초)', { size: 12, anchor: 'start', fill: '#8a6526', weight: 800 });
      el('rect', { x: 22, y: 289, width: 34, height: 16, rx: 8, fill: K.sphere(svg, C.gold) }, inset);
      el('rect', { x: 39, y: 289, width: 17, height: 16, fill: '#fff', opacity: 0.85 }, inset);
      el('rect', { x: 22, y: 289, width: 34, height: 16, rx: 8, fill: 'none', stroke: '#a77a26', 'stroke-width': 1.3 }, inset);
      K.label(inset, 64, 297, '레보도파+카르비도파', { size: 12, anchor: 'start', weight: 800, fill: '#7a5a1c' });
      el('path', { d: hexPath(30, 320, 5.5), fill: K.sphere(svg, C.purple) }, inset);
      K.label(inset, 42, 320, '카르비도파: 말초 분해 차단', { size: 12, anchor: 'start', weight: 700, fill: C.purple });

      // ── 오른쪽: 시소 카드 ──
      el('rect', { x: 352, y: 8, width: 240, height: 180, rx: 14, fill: 'rgba(255,255,255,.94)', filter: cardSh }, svg);
      K.label(svg, 472, 26, '선조체 안 균형', { size: 13, fill: C.muted, weight: 700 });
      var fg = el('linearGradient', { id: 'nmDopFul', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#dfe6ea' }, fg); el('stop', { offset: '100%', 'stop-color': '#9aa8b1' }, fg);
      el('path', { d: 'M472,126 L452,158 L492,158 Z', fill: 'url(#nmDopFul)', filter: sh }, svg);
      el('ellipse', { cx: 472, cy: 160, rx: 40, ry: 4, fill: '#1a2b4a', opacity: 0.12 }, svg);
      var bg = el('linearGradient', { id: 'nmDopBeam', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#a6b4bd' }, bg); el('stop', { offset: '100%', 'stop-color': '#5c6c76' }, bg);
      var beam = el('g', null, svg);
      el('rect', { x: 374, y: 119, width: 196, height: 8, rx: 4, fill: 'url(#nmDopBeam)', filter: sh }, beam);
      var wDA = el('circle', { cx: 392, cy: 97, r: 22, fill: K.sphere(svg, '#1f9a8e'), filter: sh }, beam);
      el('circle', { cx: 552, cy: 97, r: 22, fill: K.sphere(svg, C.clay), filter: sh }, beam);
      var tDA = K.label(beam, 392, 142, '도파민', { size: 13, fill: C.teal, weight: 800 });
      K.label(beam, 552, 142, '아세틸콜린', { size: 13, fill: C.clay, weight: 800 });
      var status = K.label(svg, 472, 176, '', { size: 13.5, weight: 800 });

      // 증상 칩 2×2
      var SYM = [['안정 시 떨림', '환약말이 떨림'], ['강직', '톱니바퀴·납관'], ['운동완만', '가면얼굴·소서증'], ['자세 불안정', '종종걸음·낙상']];
      var chips = SYM.map(function (s, k) {
        var x = 352 + (k % 2) * 123, y = 196 + Math.floor(k / 2) * 70;
        var g = el('g', null, svg);
        var r = el('rect', { x: x, y: y, width: 117, height: 62, rx: 12, fill: '#fff', filter: cardSh }, g);
        var a = K.label(g, x + 58.5, y + 23, s[0], { size: 14, weight: 800 });
        var b = K.label(g, x + 58.5, y + 43, s[1], { size: 12, weight: 600, fill: C.muted });
        return { g: g, r: r, a: a };
      });
      // 정보 카드(칩 자리)
      var card = el('g', { opacity: 0 }, svg);
      var cardBox = el('rect', { x: 352, y: 196, width: 240, height: 136, rx: 14, fill: '#fff', filter: cardSh }, card);
      var cardBar = el('rect', { x: 352, y: 196, width: 6, height: 136, rx: 3, fill: C.clay }, card);
      var cardTitle = K.label(card, 368, 214, '', { size: 14, anchor: 'start', weight: 800 });
      var cardLines = [];
      for (var qq = 0; qq < 5; qq++) cardLines.push(K.label(card, 368, 238 + qq * 21, '', { size: 12, anchor: 'start', weight: 600 }));
      var tl = el('g', { opacity: 0 }, svg);
      function row(y, name, col, first, second, gapTxt, x2) {
        K.label(tl, 368, y, name, { size: 12.5, anchor: 'start', weight: 800, fill: col });
        el('line', { x1: 454, y1: y, x2: 584, y2: y, stroke: '#c5ced4', 'stroke-width': 2 }, tl);
        el('circle', { cx: 466, cy: y, r: 5, fill: K.sphere(svg, col) }, tl);
        el('circle', { cx: x2, cy: y, r: 5, fill: K.sphere(svg, col) }, tl);
        K.label(tl, 466, y + 16, first, { size: 12, weight: 700, fill: col });
        K.label(tl, x2, y + 16, second, { size: 12, weight: 700, fill: col });
        el('path', { d: 'M466,' + (y - 8) + ' L466,' + (y - 12) + ' L' + x2 + ',' + (y - 12) + ' L' + x2 + ',' + (y - 8), fill: 'none', stroke: C.muted, 'stroke-width': 1.3 }, tl);
        K.label(tl, (466 + x2) / 2, y - 22, gapTxt, { size: 12, weight: 700, fill: C.muted });
      }
      row(256, '루이소체 치매', C.purple, '인지↓', '운동', '1년 이내', 516);
      row(310, '파킨슨병 치매', C.blue, '운동', '인지↓', '1년 이상', 570);

      var CARDS = {
        long: { title: '장기 복용 문제', col: C.clay, lines: ['wearing-off: 다음 복용 전 약효↓', 'on-off: 갑자기 켜졌다 꺼짐', '이상운동증: 약효 최고점에 꼬임', '항콜린제: 노인 섬망·변비·요저류', ''] },
        anti: { title: '약물 유발 파킨슨증', col: C.purple, lines: ['항정신병제·메토클로프라미드', '= D2 수용체 차단', '→ 도파민이 있어도 효과↓', '추체외로: 근긴장이상·좌불안석', '지연성 운동이상증'] },
        dlb: { title: '치매 감별: 1년 규칙', col: C.purple, lines: ['', '', '', '', ''] }
      };

      return function render(t) {
        var n = neurons(t, K), amt = amount(t, K), eff = effect(t, K);
        cam(t);

        var alive = Math.round(n * 10);
        cells.forEach(function (c, k) {
          var on = k < alive;
          c.setAttribute('fill', on ? K.sphere(svg, '#3a3340') : 'rgba(255,255,255,.35)');
          c.setAttribute('stroke', on ? 'none' : '#8a7d92');
          c.setAttribute('stroke-width', 0.8);
          c.setAttribute('stroke-dasharray', on ? '' : '1.5 1.5');
        });
        pct.set('흑질 뉴런 ' + Math.round(n * 100) + '%');
        pct.g.setAttribute('opacity', 1 - K.seg(t, 13.2, 13.5) + K.seg(t, 15.4, 15.8));
        pct.t.setAttribute('fill', n < 0.5 ? C.clay : '#5d4f66');
        path.setAttribute('opacity', 0.25 + 0.7 * n);

        flow.forEach(function (f, k) {
          var ph = ((t * 0.55 + k / flow.length) % 1);
          var p = K.along(path, ph);
          f.setAttribute('cx', p.x); f.setAttribute('cy', p.y);
          f.setAttribute('opacity', k / flow.length < n ? 0.9 * Math.sin(ph * Math.PI) + 0.1 : 0);
        });

        var anti = t >= 13.2;
        var blockP = K.seg(t, 13.4, 14.2);
        var shown = Math.round(K.clamp(amt, 0, 1) * 5);
        daOn.forEach(function (d, k) {
          d.setAttribute('opacity', k < shown ? 1 : 0);
          d.setAttribute('cy', anti ? RY - 3.5 - 6 * blockP : RY - 3.5);
          d.setAttribute('cx', anti ? RX[k] + 3 * blockP * (k % 2 ? 1 : -1) : RX[k]);
        });
        blocks.forEach(function (b) { b.setAttribute('opacity', anti ? blockP : 0); });
        strPill.set(anti && blockP > 0.3 ? '선조체: D2 수용체 차단' : '선조체');
        strPill.t.setAttribute('fill', anti && blockP > 0.3 ? C.purple : C.blue);
        recs.forEach(function (r, k) { r.setAttribute('fill', !anti && k < shown ? '#bff0e8' : '#fff'); });

        var lv = t >= 7.6 && t < 10.8;
        inset.setAttribute('opacity', lv ? K.seg(t, 7.6, 8.0) * (1 - K.seg(t, 10.5, 10.8)) : 0);
        bbb.setAttribute('opacity', lv ? K.seg(t, 7.6, 8.0) * (1 - K.seg(t, 10.5, 10.8)) : 0);
        levo.forEach(function (d, k) {
          var st = 8.0 + 0.3 * k;
          var on = t >= st && t < st + 1.6 && t < 10.8;
          var p = K.seg(t, st, st + 1.6);
          var pt = K.along(levoPath, p);
          d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y);
          d.setAttribute('fill', p > 0.45 ? K.sphere(svg, '#1fa89a') : K.sphere(svg, C.gold));
          d.setAttribute('opacity', on ? 1 : 0);
        });

        // 시소
        var ang = K.clamp((1 - eff) * 18, -14, 15);
        beam.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ' 472 123)');
        var s = K.clamp(0.45 + 0.55 * eff, 0.4, 1.3);
        var r = 22 * Math.sqrt(s);
        wDA.setAttribute('r', r.toFixed(1)); wDA.setAttribute('cy', (119 - r).toFixed(1));
        wDA.setAttribute('fill', anti && blockP > 0.5 ? K.sphere(svg, '#9fb0bb') : K.sphere(svg, '#1f9a8e'));
        tDA.textContent = anti ? '도파민 효과' : '도파민';

        var st2 = '', col = C.ink;
        if (t < 1.8) { st2 = '균형: 움직임이 부드럽다'; col = C.teal; }
        else if (t < 4.6) { st2 = '뉴런이 줄어도 한동안 버틴다'; col = C.muted; }
        else if (t < 7.6) { st2 = '도파민↓ → ACh 상대적 우세'; col = C.clay; }
        else if (t < 10.8) { st2 = t < 9.6 ? '레보도파 → 뇌에서 도파민으로' : '균형 회복'; col = C.teal; }
        else if (t < 13.2) {
          var o = osc(t, K);
          if (o > 0.25) { st2 = '약효 최고점: 이상운동증'; col = C.purple; }
          else if (o < -0.25) { st2 = '약효 소진: wearing-off'; col = C.clay; }
          else { st2 = '약효 구간(on)'; col = C.teal; }
        }
        else if (t < 15.4) { st2 = 'D2 차단 → 도파민 있어도 효과↓'; col = C.purple; }
        else { st2 = '루이소체 치매: 항정신병제 과민'; col = C.purple; }
        status.textContent = st2; status.setAttribute('fill', col);

        var sym = K.clamp((0.75 - eff) / 0.35, 0, 1);
        var cd = t >= 15.4 ? CARDS.dlb : t >= 13.2 ? CARDS.anti : t >= 10.8 ? CARDS.long : null;
        chips.forEach(function (c) {
          c.g.setAttribute('opacity', cd ? 0 : 1);
          c.r.setAttribute('fill', K.mix('#ffffff', C.claySoft, sym));
          c.a.setAttribute('fill', K.mix('#9aa6ad', C.ink, 0.35 + 0.65 * sym));
        });
        card.setAttribute('opacity', cd ? 1 : 0);
        tl.setAttribute('opacity', cd === CARDS.dlb ? 1 : 0);
        if (cd) {
          cardTitle.textContent = cd.title; cardTitle.setAttribute('fill', cd.col);
          cardBar.setAttribute('fill', cd.col);
          cardLines.forEach(function (l, k) { l.textContent = cd.lines[k] || ''; });
        }
      };
    }
  });
})();
