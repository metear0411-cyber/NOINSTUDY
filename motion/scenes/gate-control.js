// 통증 관문 통제 이론(Melzack & Wall) — 척수 후각의 관문이 열리고 닫히는 원리
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  // 시간에 따른 입력 세기
  function inputs(t, K) {
    var pain = K.seg(t, 2.0, 2.8);
    var rub = K.seg(t, 5.5, 6.3) * (1 - K.seg(t, 9.5, 10.2)) + K.seg(t, 13.5, 14.2);
    var desc = K.seg(t, 9.6, 10.6);
    var gate = pain * (1 - 0.72 * rub) * (1 - 0.66 * desc);
    return { pain: pain, rub: rub, desc: desc, gate: gate };
  }

  M.register({
    id: 'gate-control',
    title: '통증 관문 통제 이론 — 문지르면 왜 덜 아픈가',
    system: '신경',
    topics: ['pain-management', 'ltc-pain', 'analgesics-elderly'],
    duration: 16,
    steps: [
      { at: 0.0, label: '구조', text: '피부의 통증 신호는 **척수 후각**을 거쳐 뇌로 올라간다. 후각에는 신호를 통과시키거나 막는 **관문**이 있다는 것이 **관문 통제 이론**(Melzack & Wall, 1965)이다.' },
      { at: 2.0, label: '통증 신호', text: '가는 섬유가 통증을 나른다. **Aδ 섬유**(얇은 수초, 빠름)는 날카롭고 위치가 분명한 첫 통증, **C 섬유**(수초 없음, 느림)는 둔하고 타는 듯 오래가는 통증. 이 신호가 억제세포를 누르며 **관문을 열고** 전달세포를 거쳐 뇌로 간다.' },
      { at: 5.5, label: '문지르기', text: '부딪힌 곳을 문지르면 **굵은 Aβ 섬유**(촉각·압력·진동)가 흥분해 후각의 **교양질 억제세포**를 깨운다. 억제세포가 **관문을 닫아** 통증 신호가 덜 올라간다. **마사지·TENS·냉온요법**의 근거다.' },
      { at: 9.5, label: '하행 억제', text: '문지르기를 멈춰도 **뇌에서 내려오는 억제**가 관문을 닫는다. **주의 분산·이완·좋은 기분·신뢰**가 이 길을 켜고 **엔도르핀**(내인성 오피오이드)이 나온다. 반대로 **불안·우울·피로**는 관문을 연다.' },
      { at: 13.5, label: '비약물 중재', text: '두 길을 함께 쓰면 관문이 가장 많이 닫힌다. 노인 통증 간호에서 진통제와 함께 **피부 자극**(마사지·냉온·TENS)과 **인지행동 중재**(주의 분산·음악·심상·이완)를 쓰는 이유다. 통증 사정은 **환자의 자가 보고**가 기준이다.' }
    ],
    source: 'Melzack & Wall(1965) 관문 통제 이론. 신경 연결은 설명용으로 단순화(실제 회로는 더 복잡하며 이론 일부는 수정됨).',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var glowF = K.glow(svg, 2.4), bigGlow = K.glow(svg, 6), softSh = K.shadow(svg, 3, 4, 0.2), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        var r = el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, x: 0, y: 0, at: function (x, y) { this.x = x; this.y = y; g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); return this; },
          zoom: function (z) { g.setAttribute('transform', 'translate(' + this.x.toFixed(1) + ',' + this.y.toFixed(1) + ') scale(' + Math.pow(z, -0.8).toFixed(3) + ')'); },
          text: function (s2) { tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.95 + 14; r.setAttribute('x', -w2 / 2); r.setAttribute('width', w2); } };
      }
      function alongD(path, f) { var L = path.getTotalLength(); var q = path.getPointAtLength(K.clamp(f, 0, 1) * L); return { x: q.x, y: q.y }; }
      function smooth(a) { // 점 배열 → 부드러운 경로
        var d = 'M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1);
        for (var i = 0; i < a.length - 1; i++) {
          var p0 = a[i - 1] || a[i], p1 = a[i], p2 = a[i + 1], p3 = a[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
            (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
        return d;
      }

      // ── 척수 단면(카메라 층) ──
      var clipV = el('clipPath', { id: 'nmGcClip' }, defs);
      el('rect', { x: 0, y: 0, width: 600, height: 340 }, clipV);
      var view = el('g', { 'clip-path': 'url(#nmGcClip)' }, svg);
      var stage = el('g', null, view);
      var IX = 64, IY = 6, IW = 500, IH = 333;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      K.image(stage, 'spinal-cord', IX, IY, IW, IH, { fadeR: '66%' });

      // 신경섬유(피부 카드에서 후근을 타고 후각으로)
      function route(dy) { return [[0.10, 0.13 + dy], [0.19, 0.225 + dy * 0.6], [0.30, 0.205 + dy * 0.4], [0.40, 0.185 + dy * 0.3], [0.452, 0.212]].map(function (q) { return P(q[0], q[1]); }); }
      var RAb = route(-0.03), RAd = route(0.0), RC = route(0.03);
      var nAb = el('path', { fill: 'none', stroke: '#2aa198', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, stage);
      var nAbM = el('path', { fill: 'none', stroke: '#e8fffb', 'stroke-width': 2, 'stroke-dasharray': '16 6', opacity: 0.6 }, stage);
      var nAd = el('path', { fill: 'none', stroke: '#e0662f', 'stroke-width': 3, 'stroke-linecap': 'round' }, stage);
      var nC = el('path', { fill: 'none', stroke: '#e89a6e', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-dasharray': '5 3' }, stage);

      var SG = P(0.442, 0.20), GT = P(0.478, 0.262), TC = P(0.505, 0.315);
      // 굵은 섬유 → 억제세포, 가는 섬유 → 관문 → 전달세포
      var tipAb = el('path', { d: smooth([P(0.452, 0.212), SG]), fill: 'none', stroke: '#2aa198', 'stroke-width': 4, 'stroke-linecap': 'round' }, stage);
      var tipPain = el('path', { d: smooth([P(0.452, 0.212), P(0.466, 0.24), GT]), fill: 'none', stroke: '#e0662f', 'stroke-width': 3, 'stroke-linecap': 'round' }, stage);
      var gToT = el('path', { d: smooth([GT, TC]), fill: 'none', stroke: '#e0662f', 'stroke-width': 3, 'stroke-linecap': 'round' }, stage);
      var inh = el('path', { d: smooth([SG, P(0.462, 0.236)]), fill: 'none', stroke: '#2aa198', 'stroke-width': 2.6 }, stage);

      // 억제세포·전달세포(빛나는 구슬)
      var sgGlow = el('circle', { cx: SG[0], cy: SG[1], r: 16, fill: '#3fd4c2', opacity: 0, filter: bigGlow }, stage);
      var sgCell = el('circle', { cx: SG[0], cy: SG[1], r: 8, fill: K.sphere(svg, '#bff0e8'), stroke: '#1f8a7f', 'stroke-width': 1.6 }, stage);
      var tGlow = el('circle', { cx: TC[0], cy: TC[1], r: 18, fill: '#ff5a4a', opacity: 0, filter: bigGlow }, stage);
      el('circle', { cx: TC[0], cy: TC[1], r: 8.5, fill: K.sphere(svg, '#ffd2c8'), stroke: '#c8423b', 'stroke-width': 1.6 }, stage);
      // 관문(두 짝 문)
      var gateA = el('rect', { x: -2.5, y: 0, width: 5, height: 11, rx: 2, fill: C.navy }, stage);
      var gateB = el('rect', { x: -2.5, y: -11, width: 5, height: 11, rx: 2, fill: C.navy }, stage);

      // 상행: 전달세포 → 반대쪽 앞가쪽 백질 → 뇌, 하행: 뇌 → 후각
      var upFixed = [TC, P(0.56, 0.40), P(0.615, 0.49), P(0.72, 0.56), P(0.86, 0.58)];
      var nUp = el('path', { fill: 'none', stroke: '#ff4d3d', 'stroke-width': 3.6, 'stroke-linecap': 'round' }, stage);
      var nDown = el('path', { fill: 'none', stroke: '#8a4fd0', 'stroke-width': 3, 'stroke-dasharray': '7 5', 'stroke-linecap': 'round' }, stage);

      // 이름표(그림 위)
      var q;
      q = P(0.19, 0.225); var pDRG = pill(stage, '후근신경절', '#7a5a2a').at(q[0] + 30, q[1] + 32);
      var pSG = pill(stage, '억제세포(교양질)', '#1f8a7f'); pSG.at(SG[0] - 4, SG[1] - 26);
      var pGate = pill(stage, '관문(척수 후각)', C.navy, 12.5); pGate.at(GT[0] + 58, GT[1] - 6);
      var pGateS = pill(stage, '', C.clay); pGateS.at(GT[0] + 58, GT[1] + 18);
      var pT = pill(stage, '전달세포', '#c8423b'); pT.at(TC[0] - 30, TC[1] + 22);
      q = P(0.86, 0.58); var pUp = pill(stage, '척수시상로 → 뇌', '#c8423b').at(q[0] - 26, q[1] + 30);

      // 신호 알갱이
      function dots(n, r, color) { var a = []; for (var i = 0; i < n; i++) a.push(el('circle', { r: r, fill: K.sphere(svg, color), filter: glowF, opacity: 0 }, stage)); return a; }
      var sAb = dots(5, 4.6, '#3fd4c2'), sAd = dots(4, 3.8, '#ff9a4a'), sC = dots(4, 3.2, '#ffb48a'), sUp = dots(6, 4.2, '#ff5a4a'), sDown = dots(4, 4.2, '#a070f0');

      // ── 고정 카드: 피부, 뇌 ──
      var skin = el('g', null, svg);
      el('rect', { x: 6, y: 8, width: 128, height: 150, rx: 14, fill: '#fff', filter: softSh }, skin);
      var sk = el('linearGradient', { id: 'nmGcSkin', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      el('stop', { offset: '0', 'stop-color': '#f3c8ad' }, sk); el('stop', { offset: '1', 'stop-color': '#fbe6d8' }, sk);
      el('rect', { x: 14, y: 34, width: 24, height: 116, rx: 8, fill: 'url(#nmGcSkin)' }, skin);
      K.label(skin, 26, 22, '피부', { size: 13, fill: '#9a5a44', weight: 800 });
      el('ellipse', { cx: 50, cy: 62, rx: 7, ry: 10, fill: K.sphere(svg, '#7fd8cc'), stroke: '#1f8a7f', 'stroke-width': 1.2 }, skin);
      K.label(skin, 62, 54, '촉각', { size: 12, anchor: 'start', fill: '#1f8a7f', weight: 800 });
      K.label(skin, 62, 72, 'Aβ 굵은 섬유', { size: 12, anchor: 'start', fill: '#1f8a7f', weight: 700 });
      var noci = el('g', { stroke: '#e0662f', 'stroke-width': 2, 'stroke-linecap': 'round' }, skin);
      [[-8, -7], [-10, 2], [-7, 9], [-3, 12]].forEach(function (d) { el('line', { x1: 56, y1: 112, x2: 56 + d[0], y2: 112 + d[1] }, noci); });
      K.label(skin, 62, 104, '통각', { size: 12, anchor: 'start', fill: '#c0521f', weight: 800 });
      K.label(skin, 62, 122, 'Aδ 빠름', { size: 12, anchor: 'start', fill: '#c0521f', weight: 700 });
      K.label(skin, 62, 140, 'C 느림', { size: 12, anchor: 'start', fill: '#c0521f', weight: 700 });
      var hurt = el('path', { d: 'M22,110 l4,-9 l3,8 l8,-3 l-5,8 l8,4 l-9,1 l1,9 l-6,-6 l-6,6 l1,-9 l-9,-1 l8,-4 l-5,-8 z', fill: '#e0452f', filter: glowF }, skin);
      var hand = el('g', { filter: softSh }, skin);
      el('rect', { x: -18, y: -8, width: 36, height: 16, rx: 8, fill: K.sphere(svg, '#f1cdb6') }, hand);
      [-12, -4, 4, 12].forEach(function (x) { el('rect', { x: x - 3, y: -18, width: 6, height: 13, rx: 3, fill: K.sphere(svg, '#f1cdb6') }, hand); });
      var handP = pill(svg, '문지르기', '#1f8a7f', 12).at(92, 22);
      var tipsP = pill(svg, '마사지·냉온·TENS', '#1f8a7f', 12).at(70, 176);
      var anchAb = [134, 62], anchPain = [134, 116];

      var brain = el('g', null, svg);
      el('rect', { x: 486, y: 8, width: 106, height: 122, rx: 14, fill: '#fff', filter: softSh }, brain);
      var bGlow = el('ellipse', { cx: 539, cy: 50, rx: 38, ry: 28, fill: '#ff5a4a', opacity: 0, filter: bigGlow }, brain);
      el('ellipse', { cx: 539, cy: 50, rx: 32, ry: 24, fill: K.sphere(svg, '#e9b8d0'), stroke: '#8a4f8a', 'stroke-width': 1.2 }, brain);
      el('path', { d: 'M515,46 C522,34 532,52 539,38 C546,28 556,44 561,50 M519,62 C530,55 538,68 553,60', fill: 'none', stroke: '#8a4f8a', 'stroke-width': 1.4, opacity: 0.8 }, brain);
      K.label(brain, 539, 50, '뇌', { size: 14, fill: '#4a2a4a', weight: 800 });
      K.label(brain, 496, 90, '느끼는 통증', { size: 12, anchor: 'start', fill: C.ink, weight: 800 });
      el('rect', { x: 496, y: 100, width: 86, height: 12, rx: 6, fill: '#eef2f3' }, brain);
      var meter = el('rect', { x: 496, y: 100, width: 0, height: 12, rx: 6 }, brain);
      var descP = pill(svg, '하행 억제·엔도르핀', '#7a3fc0', 12).at(522, 148);
      var anchUp = [500, 70], anchDown = [490, 40];

      var CAM = [[0, 0.5, 0.42, 1], [1.6, 0.5, 0.42, 1], [2.5, 0.50, 0.33, 1.4], [5.4, 0.50, 0.33, 1.4], [6.2, 0.44, 0.27, 1.45], [9.4, 0.44, 0.27, 1.45],
        [10.2, 0.56, 0.30, 1.22], [13.4, 0.56, 0.30, 1.22], [14.2, 0.5, 0.42, 1], [16, 0.5, 0.42, 1]];
      var cs = { x: 0, y: 0, z: 1 };
      function camAt(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var c = P(K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e));
          cs = { x: c[0], y: c[1], z: K.lerp(a[3], b[3], e) };
          K.camera(stage, cs.x, cs.y, cs.z, 300, 170);
          return;
        }
      }
      function inv(p) { return [(p[0] - 300) / cs.z + cs.x, (p[1] - 170) / cs.z + cs.y]; }

      function run(arr, path, t, speed, on, passFn) {
        arr.forEach(function (n, i) {
          var u = ((t * speed + i / arr.length) % 1 + 1) % 1;
          var p = alongD(path, u);
          n.setAttribute('cx', p.x.toFixed(1)); n.setAttribute('cy', p.y.toFixed(1));
          n.setAttribute('opacity', (on * (passFn ? passFn(i, u) : 1)).toFixed(2));
        });
      }

      return function render(t) {
        var s = inputs(t, K);
        camAt(t);
        // 카드와 이어지는 경로(카메라가 움직여도 끊기지 않게 카드 끝점을 무대 좌표로 바꿔 잇는다)
        var a1 = inv(anchAb), a2 = inv(anchPain), a3 = inv([anchPain[0], anchPain[1] + 18]);
        nAb.setAttribute('d', smooth([a1, [a1[0] + 30 / cs.z, a1[1]]].concat(RAb)));
        nAbM.setAttribute('d', nAb.getAttribute('d'));
        nAd.setAttribute('d', smooth([a2, [a2[0] + 30 / cs.z, a2[1]]].concat(RAd)));
        nC.setAttribute('d', smooth([a3, [a3[0] + 30 / cs.z, a3[1]]].concat(RC)));
        var u1 = inv(anchUp), d1 = inv(anchDown);
        nUp.setAttribute('d', smooth(upFixed.concat([P(0.92, 0.42), u1])));
        nDown.setAttribute('d', smooth([d1, P(0.70, 0.04), P(0.52, 0.10), P(0.462, 0.20)]));

        // 통증 신호
        var hs = 1 + 0.15 * Math.sin(t * 8) * s.pain;
        hurt.setAttribute('opacity', s.pain);
        hurt.setAttribute('transform', 'translate(' + (30 * (1 - hs)).toFixed(1) + ',' + (110 * (1 - hs)).toFixed(1) + ') scale(' + hs.toFixed(3) + ')');
        run(sAd, nAd, t, 0.9, s.pain);
        run(sC, nC, t, 0.38, s.pain);
        [nAd, nC, tipPain].forEach(function (n) { n.setAttribute('opacity', (0.5 + 0.5 * s.pain).toFixed(2)); });

        // 문지르기
        hand.setAttribute('transform', 'translate(' + (26 + 6 * Math.sin(t * 9) * s.rub).toFixed(1) + ',' + (60 - 4 * (1 - s.rub)) + ')');
        hand.setAttribute('opacity', s.rub);
        handP.g.setAttribute('opacity', t < 13.5 ? s.rub : 0);
        tipsP.g.setAttribute('opacity', K.seg(t, 13.5, 14.2));
        run(sAb, nAb, t, 1.1, s.rub);
        [nAb, tipAb].forEach(function (n) { n.setAttribute('opacity', (0.5 + 0.5 * s.rub).toFixed(2)); });

        // 하행 억제
        run(sDown, nDown, t, 0.6, s.desc);
        nDown.setAttribute('opacity', (0.15 + 0.85 * s.desc).toFixed(2));
        nDown.setAttribute('stroke-dashoffset', (-t * 18).toFixed(1));
        descP.text(t >= 13.5 ? '하행 억제·주의 분산' : '하행 억제·엔도르핀');
        descP.g.setAttribute('opacity', s.desc);

        // 억제세포 활성
        var sgA = K.clamp(0.9 * s.rub + 0.75 * s.desc - 0.25 * s.pain * (1 - s.rub), 0, 1);
        sgGlow.setAttribute('opacity', (0.85 * sgA).toFixed(2));
        inh.setAttribute('opacity', (0.3 + 0.7 * sgA).toFixed(2));

        // 관문
        var open = s.gate, ang = 70 * open;
        gateA.setAttribute('transform', 'translate(' + GT[0] + ',' + GT[1] + ') rotate(' + (-ang).toFixed(1) + ',0,11)');
        gateB.setAttribute('transform', 'translate(' + GT[0] + ',' + GT[1] + ') rotate(' + ang.toFixed(1) + ',0,-11)');
        pGateS.text(s.pain < 0.05 ? '' : open > 0.6 ? '열림' : open > 0.25 ? '반쯤 닫힘' : '닫힘');
        pGateS.t.setAttribute('fill', open > 0.6 ? '#c8423b' : '#1f8a7f');
        pGateS.g.setAttribute('opacity', s.pain < 0.05 ? 0 : 1);
        gToT.setAttribute('opacity', (0.25 + 0.75 * open).toFixed(2));

        // 전달세포 → 뇌
        tGlow.setAttribute('opacity', (0.9 * open).toFixed(2));
        run(sUp, nUp, t, 0.55, 1, function (i) { return i < Math.round(open * sUp.length) ? 1 : 0; });
        nUp.setAttribute('opacity', (0.3 + 0.7 * open).toFixed(2));
        bGlow.setAttribute('opacity', (0.75 * open).toFixed(2));
        bGlow.setAttribute('fill', s.desc > 0.5 && open < 0.4 ? '#a070f0' : '#ff5a4a');
        meter.setAttribute('width', (86 * open).toFixed(1));
        meter.setAttribute('fill', K.sphere(svg, open > 0.6 ? '#e0452f' : open > 0.25 ? '#e0a630' : '#2aa198'));

        // 이름표: 구조 단계엔 섬유 이름, 그다음엔 회로 이름 위주
        var early = 1 - K.seg(t, 1.6, 2.2) + K.seg(t, 14.2, 14.8);
        [pDRG, pSG, pGate, pGateS, pT, pUp].forEach(function (p) { p.zoom(cs.z); });
      };
    }
  });
})();
