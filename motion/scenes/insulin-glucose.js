// 인슐린 = 열쇠, GLUT4 = 문
// 원리: 인슐린이 수용체에 붙으면 세포 안 GLUT4가 막으로 올라와 포도당이 들어간다.
//       제1형은 열쇠가 없고, 제2형은 자물쇠가 뻑뻑하다(인슐린 저항성). 운동은 인슐린 없이 문을 올린다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var DUR = 16;
  var DOOR_X = [376, 302, 238];      // GLUT4 문(0번은 그림 속 소포에서 올라온다)
  var REC_X = 175;                    // 인슐린 수용체 결합 자리(Y자 사이)

  // 혈당 곡선(시각, mg/dL)
  var GLU = {
    normal: [[0, 92], [1.8, 165], [5.4, 168], [9.0, 102], [16, 92]],
    t1: [[0, 110], [1.8, 220], [5.4, 250], [9.6, 300], [10.6, 296], [12.2, 150], [12.4, 140], [12.9, 58], [13.9, 58], [15.0, 92], [16, 110]],
    t2: [[0, 120], [1.8, 200], [5.4, 205], [9.6, 182], [10.4, 180], [12.2, 140], [12.4, 135], [12.9, 60], [13.9, 60], [15.0, 92], [16, 120]]
  };
  function glucose(t, mode) {
    var a = GLU[mode];
    for (var i = 1; i < a.length; i++) {
      if (t <= a[i][0]) { var p = (t - a[i - 1][0]) / (a[i][0] - a[i - 1][0]); return a[i - 1][1] + (a[i][1] - a[i - 1][1]) * p; }
    }
    return a[a.length - 1][1];
  }
  // 문(GLUT4) 열림 정도 0~1
  function doorOpen(k, t, mode, K) {
    var o = 0;
    if (mode === 'normal') o = K.easeInOut(K.seg(t, 4.6, 5.4));
    else if (mode === 't1') o = K.easeInOut(K.seg(t, 10.6, 11.4));
    else o = k === 0 ? K.easeInOut(K.seg(t, 5.0, 6.6)) : K.easeInOut(K.seg(t, 10.0, 11.0));
    return o * (1 - K.seg(t, 15.2, 15.9));
  }
  // 열쇠(인슐린)가 수용체에 꽂히는 시각
  function keyTimes(mode) {
    if (mode === 't1') return { from: 9.6, bind: 10.6 };
    return { from: 1.8, bind: 3.6 };
  }

  var S_COMMON = {
    start: { at: 0, label: '식후 혈당', text: '식사 뒤 포도당이 혈액으로 들어와 **혈당이 오른다**. 근육·지방 세포의 포도당 문(**GLUT4**)은 평소 세포 안에 숨어 있어 그냥은 들어가지 못한다.' },
    hypo: { at: 12.4, label: '노인 저혈당', text: '인슐린·설폰요소제 치료 중에는 **저혈당(70 mg/dL 미만)**을 늘 경계한다. 노인은 떨림·발한 같은 경고 증상이 약하고 **혼돈·행동 변화·낙상**으로만 나타나 치매·섬망으로 오인되기 쉽다.' },
    rule: { at: 13.6, label: '15-15 규칙', text: '의식이 있으면 **당 15g**(속효성 당질)을 먹고 **15분 뒤 혈당을 다시 잰다**. 여전히 70 미만이면 되풀이하고, 의식이 없으면 입으로 주지 않는다(글루카곤·정맥 포도당).' }
  };
  var S_MODE = {
    normal: [
      { at: 1.8, label: '인슐린 분비', text: '혈당이 오르면 **췌장 β세포**가 **인슐린**을 내보낸다. 인슐린은 세포 문을 여는 **열쇠**다.' },
      { at: 3.6, label: '열쇠·자물쇠', text: '인슐린이 세포막의 **인슐린 수용체**(자물쇠)에 붙으면 세포 안으로 신호가 전달된다.' },
      { at: 5.4, label: 'GLUT4 문', text: '신호를 받은 **GLUT4**가 세포 안 저장소에서 **세포막으로 올라와** 문이 열린다. 포도당이 세포로 들어가 쓰이고 혈당이 내려온다.' },
      { at: 9.6, label: '기준값', text: '정상 혈당은 **공복 100 mg/dL 미만**이다. 당뇨병 진단은 **공복 126 이상, 당부하 2시간 200 이상, 당화혈색소 6.5% 이상**, 또는 증상과 함께 무작위 200 이상이다.' }
    ],
    t1: [
      { at: 1.8, label: 'β세포 파괴', text: '**제1형**은 자가면역으로 **β세포가 파괴**돼 인슐린(열쇠)이 거의 없다. 대개 젊은 나이에 갑자기 생기고 **케톤산증** 위험이 크다.' },
      { at: 3.6, label: '빈 자물쇠', text: '열쇠가 없어 수용체가 비어 있다. 신호가 없으니 GLUT4 문도 올라오지 않는다.' },
      { at: 5.4, label: '혈당 계속 상승', text: '포도당이 혈액에 쌓여 혈당이 계속 오른다. 세포는 굶어 지방을 태우고 **케톤**이 생긴다.' },
      { at: 9.6, label: '인슐린 주사', text: '제1형은 **인슐린 주사가 필수**다. 밖에서 넣은 열쇠가 수용체에 꽂히면 문이 올라오고 혈당이 내려간다.' }
    ],
    t2: [
      { at: 1.8, label: '인슐린 과다 분비', text: '**제2형**은 인슐린이 나오는데도 세포가 잘 반응하지 않는다(**인슐린 저항성**). 췌장은 혈당을 내리려고 인슐린을 **더 짜낸다**.' },
      { at: 3.6, label: '뻑뻑한 자물쇠', text: '열쇠는 꽂히는데 **자물쇠가 뻑뻑**해 신호가 약하게만 들어간다. 비만·운동 부족·노화가 저항성을 키운다.' },
      { at: 5.4, label: '문 일부만', text: '문이 일부만 열려 혈당이 덜 내려온다. 오래 더 짜내던 **β세포가 지치면** 인슐린 분비까지 줄어든다. 노인 당뇨의 대부분이 제2형이다.' },
      { at: 9.6, label: '운동', text: '**운동**은 근육 수축만으로 **인슐린 없이도 GLUT4를 막으로 올린다**. 저항성을 돌아가 혈당을 내리고 인슐린 감수성도 높여, 식사요법과 함께 치료의 바탕이 된다.' }
    ]
  };

  M.register({
    id: 'insulin-glucose',
    title: '인슐린은 열쇠, GLUT4는 문',
    system: '내분비',
    topics: ['diabetes'],
    duration: DUR,
    options: [{
      key: 'type', label: '보기',
      choices: [{ value: 'normal', label: '정상' }, { value: 't1', label: '제1형' }, { value: 't2', label: '제2형' }],
      value: 'normal'
    }],
    steps: [],
    stepsFor: function (o) {
      var m = S_MODE[o.type] || S_MODE.normal;
      return [S_COMMON.start].concat(m, [S_COMMON.hypo, S_COMMON.rule]);
    },
    source: '기준: 저혈당 70 mg/dL 미만, 15-15 규칙(당 15g → 15분 뒤 재측정), 진단 기준은 대한당뇨병학회 기준. 혈당 곡선은 설명용으로 단순화.',


    setup: function (svg, K, opt) {
      var el = K.el, C = K.C;
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var defs = svg.querySelector('defs') || el('defs', null, svg);
      var glowF = K.glow(svg, 2.4), sh = K.shadow(svg, 1.5, 1.5, 0.3);
      var cardSh = K.shadow(svg, 3, 4, 0.18), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 16;
        var r = el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.9)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, set: function (s2) {
          if (tx.textContent === s2) return;
          tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.92 + 16;
          r.setAttribute('x', x - w2 / 2); r.setAttribute('width', w2);
        } };
      }

      // ── 세포막 그림(카메라 세계) — 그림 오른쪽 통로 단백질은 오른쪽 카드 뒤로 숨긴다 ──
      var IX = 40, IY = -60, IW = 600, IH = 400;
      var MEM = 174;                                   // 세포막 가운데 높이(그림 기준 ny 0.585)
      var world = el('g', null, svg);
      K.image(world, 'cell-membrane', IX, IY, IW, IH, { fadeR: '72%' });

      // 혈장 속 포도당
      var GN = 22, gd = [];
      var seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < GN; i++) {
        gd.push({ x0: rnd() * 220, y: 16 + rnd() * 92, v: 10 + rnd() * 8,
          n: el('circle', { r: 4.4, fill: K.sphere(svg, '#e0a52e'), filter: sh, opacity: 0 }, world) });
      }

      // 인슐린 신호(세포 안으로 번지는 빛줄기)
      var sig = el('path', { d: 'M178,214 C196,250 250,256 ' + DOOR_X[0] + ',236', fill: 'none', stroke: '#8fb6ff', 'stroke-width': 3,
        'stroke-dasharray': '6 6', 'stroke-linecap': 'round', filter: glowF, opacity: 0 }, world);

      // GLUT4 문: 저장 소포 안(작게) → 막으로 올라와 박힘(크게)
      var tealB = K.sphere(svg, '#25b3a3');
      var doors = DOOR_X.map(function (x, k) {
        var vy = k === 0 ? 276 : k === 1 ? 292 : 300;
        var ves = el('circle', { cx: x, cy: vy, r: 22, fill: 'rgba(255,255,255,.28)', stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1.5 }, world);
        var g = el('g', { filter: sh }, world);
        el('rect', { x: -16, y: -40, width: 12, height: 80, rx: 6, fill: tealB }, g);
        el('rect', { x: 4, y: -40, width: 12, height: 80, rx: 6, fill: tealB }, g);
        return { x: x, vy: vy, ves: ves, g: g };
      });
      var flows = [];
      DOOR_X.forEach(function (x, k) {
        for (var j = 0; j < 3; j++) flows.push({ k: k, j: j, n: el('circle', { r: 4.2, fill: K.sphere(svg, '#e0a52e'), opacity: 0 }, world) });
      });

      // 운동(제2형) — 아령
      var ex = el('g', { opacity: 0 }, world);
      var navyB = K.sphere(svg, '#2a3f66');
      el('rect', { x: 62, y: 296, width: 64, height: 7, rx: 3.5, fill: navyB, filter: sh }, ex);
      el('rect', { x: 54, y: 284, width: 12, height: 31, rx: 4, fill: navyB, filter: sh }, ex);
      el('rect', { x: 122, y: 284, width: 12, height: 31, rx: 4, fill: navyB, filter: sh }, ex);
      pill(ex, 94, 266, '운동 → GLUT4↑', C.navy, 12.5);

      // 열쇠(인슐린)
      var blueB = K.sphere(svg, '#4a6fb0');
      function keyShape() {
        var g = el('g', { opacity: 0, filter: sh }, world);
        el('circle', { cx: 0, cy: -12, r: 7.5, fill: blueB }, g);
        el('circle', { cx: 0, cy: -12, r: 2.6, fill: '#eef3ff' }, g);
        el('rect', { x: -2.2, y: -5, width: 4.4, height: 18, rx: 1.5, fill: '#3d5f9e' }, g);
        el('rect', { x: 2, y: 5, width: 4.5, height: 3, fill: '#3d5f9e' }, g);
        el('rect', { x: 2, y: 9.5, width: 3.5, height: 3, fill: '#3d5f9e' }, g);
        return g;
      }
      var lockGlow = el('ellipse', { cx: REC_X, cy: 96, rx: 18, ry: 16, fill: '#9cc0ff', opacity: 0, filter: K.glow(svg, 5), style: 'mix-blend-mode:screen' }, world);
      var mainKey = keyShape();
      var floatKeys = [];
      for (var f = 0; f < 6; f++) floatKeys.push(keyShape());

      // 이름표
      pill(world, 262, 70, '인슐린 수용체', C.blue);
      var stiff = pill(world, 262, 96, '자물쇠가 뻑뻑함', C.clay);
      pill(world, 330, 20, '혈액(혈장)', '#a0574f');
      pill(world, 412, 150, '세포막', '#9a5a3a');
      var store = pill(world, 300, 326, 'GLUT4 저장 소포', C.teal);
      var cellPill = pill(world, 96, 326, '근육·지방 세포', C.green);

      // 카메라
      var CAM = [[0, 224, 170, 1], [3.4, 224, 170, 1], [4.0, 196, 122, 1.45], [5.2, 196, 122, 1.45], [5.9, 224, 170, 1], [16, 224, 170, 1]];
      function cam(t, o) {
        var list = o.type === 't1' ? [[0, 224, 170, 1], [9.6, 224, 170, 1], [10.1, 196, 122, 1.45], [10.7, 196, 122, 1.45], [11.2, 224, 170, 1], [16, 224, 170, 1]] : CAM;
        for (var i = 1; i < list.length; i++) if (t <= list[i][0]) {
          var a = list[i - 1], b = list[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 224, 170);
          return;
        }
      }

      // ── 오른쪽 카드: 췌장 + 혈당 ──
      el('rect', { x: 452, y: 6, width: 142, height: 328, rx: 14, fill: 'rgba(255,255,255,.95)', filter: cardSh }, svg);
      K.label(svg, 523, 24, '췌장 β세포', { size: 13, weight: 800, fill: '#8a6526' });
      var beta = [495, 523, 551].map(function (x) {
        var g = el('g', null, svg);
        var c = el('circle', { cx: x, cy: 52, r: 11, fill: K.sphere(svg, '#f0c27a'), filter: sh }, g);
        var x1 = el('path', { d: 'M' + (x - 8) + ',44 L' + (x + 8) + ',60 M' + (x + 8) + ',44 L' + (x - 8) + ',60', stroke: C.clay, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, g);
        return { g: g, c: c, x: x1, cx: x };
      });
      var syr = el('g', { opacity: 0, filter: sh }, svg);
      el('rect', { x: 484, y: 44, width: 54, height: 16, rx: 3, fill: '#fff', stroke: C.blue, 'stroke-width': 2 }, syr);
      el('rect', { x: 486, y: 46, width: 30, height: 12, fill: '#cfe0f7' }, syr);
      el('line', { x1: 538, y1: 52, x2: 552, y2: 52, stroke: C.blue, 'stroke-width': 3 }, syr);
      el('line', { x1: 552, y1: 52, x2: 572, y2: 52, stroke: C.muted, 'stroke-width': 1.5 }, syr);
      el('line', { x1: 472, y1: 52, x2: 484, y2: 52, stroke: C.blue, 'stroke-width': 3 }, syr);
      el('line', { x1: 472, y1: 44, x2: 472, y2: 60, stroke: C.blue, 'stroke-width': 3 }, syr);
      var panTxt = K.label(svg, 523, 82, '', { size: 12, weight: 800 });
      el('line', { x1: 464, y1: 98, x2: 582, y2: 98, stroke: C.line, 'stroke-width': 1.2 }, svg);

      var GT = 146, GB = 304, GX = 526, GW = 28;
      function gy(v) { return GB - (K.clamp(v, 40, 320) - 40) / 280 * (GB - GT); }
      K.label(svg, GX + GW / 2, 114, '혈당', { size: 12, fill: C.muted, weight: 700 });
      var gVal = K.label(svg, GX + GW / 2, 132, '', { size: 16, weight: 800 });
      el('rect', { x: GX, y: GT, width: GW, height: GB - GT, rx: 8, fill: '#eef2f3' }, svg);
      el('rect', { x: GX, y: gy(140), width: GW, height: gy(70) - gy(140), fill: C.greenSoft }, svg);
      el('rect', { x: GX, y: gy(70), width: GW, height: GB - gy(70), rx: 8, fill: C.claySoft }, svg);
      el('rect', { x: GX + 4, y: GT + 3, width: 6, height: GB - GT - 6, rx: 3, fill: '#fff', opacity: 0.45 }, svg);
      [70, 140, 200, 300].forEach(function (v) {
        el('line', { x1: GX - 4, y1: gy(v), x2: GX, y2: gy(v), stroke: C.muted, 'stroke-width': 1.2 }, svg);
        K.label(svg, GX - 8, gy(v), String(v), { size: 12, anchor: 'end', fill: v === 70 ? C.clay : C.muted, weight: 700 });
      });
      var gMark = el('rect', { x: GX - 4, y: 0, width: GW + 8, height: 7, rx: 3.5, fill: C.ink, filter: sh }, svg);
      K.label(svg, GX + GW / 2, 320, 'mg/dL', { size: 12, fill: C.muted, weight: 500 });

      // 저혈당 카드(세포질 위)
      var card = el('g', { opacity: 0 }, svg);
      el('rect', { x: 40, y: 216, width: 400, height: 118, rx: 14, fill: 'rgba(255,255,255,.96)', filter: cardSh }, card);
      el('rect', { x: 40, y: 216, width: 6, height: 118, rx: 3, fill: C.clay }, card);
      var cTitle = K.label(card, 58, 238, '', { size: 14, anchor: 'start', weight: 800, fill: C.clay });
      var cl = [
        K.label(card, 58, 262, '노인: 혼돈·행동 변화·낙상으로만 보일 수 있다(경고 증상 약함)', { size: 12.5, anchor: 'start', weight: 600 }),
        K.label(card, 58, 288, '', { size: 13, anchor: 'start', weight: 800, fill: C.teal }),
        K.label(card, 58, 312, '', { size: 12.5, anchor: 'start', weight: 600 })
      ];

      return function render(t, o) {
        var mode = o.type;
        var G = glucose(t, mode);
        cam(t, o);

        var vis = Math.round(GN * K.clamp(G / 300, 0, 1));
        gd.forEach(function (d, k) {
          var x = 224 + ((d.x0 + d.v * t) % 222);
          d.n.setAttribute('cx', x.toFixed(1)); d.n.setAttribute('cy', d.y.toFixed(1));
          d.n.setAttribute('opacity', k < vis ? 1 : 0);
        });

        var t1 = mode === 't1', t2 = mode === 't2';
        var inj = t1 && t >= 9.6 && t < 15.6;
        beta.forEach(function (b, k) {
          var s = t2 && t >= 1.8 && t < 12.4 ? 1 + 0.12 * Math.sin(t * 11 + k) : 1;
          b.g.setAttribute('transform', 'translate(' + b.cx * (1 - s) + ',' + 52 * (1 - s) + ') scale(' + s + ')');
          b.c.setAttribute('fill', t1 ? K.sphere(svg, '#cfc6bb') : K.sphere(svg, '#f0c27a'));
          b.x.setAttribute('opacity', t1 ? 1 : 0);
          b.g.setAttribute('opacity', inj ? 0 : 1);
        });
        syr.setAttribute('opacity', inj ? K.seg(t, 9.6, 9.9) : 0);
        panTxt.textContent = t1 ? (inj ? '인슐린 주사' : 'β세포 파괴') : t2 ? '더 짜냄 → 지침' : '인슐린 분비';
        panTxt.setAttribute('fill', t1 && !inj ? C.clay : t2 ? C.clay : C.blue);

        // 열쇠
        var kt = keyTimes(mode);
        var hasKey = !t1 || (t >= kt.from && t < 15.6);
        var kx = 0, ky = 0, ka = 0, kop = 0;
        if (hasKey && t >= kt.from) {
          var p1 = K.seg(t, kt.from, kt.bind - 0.6), p2 = K.seg(t, kt.bind - 0.6, kt.bind);
          kx = K.lerp(470, REC_X, K.easeInOut(p1)); ky = 46 + 6 * Math.sin(p1 * 9);
          if (p1 >= 1) { kx = REC_X; ky = K.lerp(46, 84, K.easeInOut(p2)); }
          kop = 1 - K.seg(t, 15.2, 15.8);
          if (t >= kt.bind && t2) ka = 12 * Math.sin((t - kt.bind) * 7) * (1 - K.seg(t, kt.bind, kt.bind + 4));
        }
        mainKey.setAttribute('opacity', kop);
        if (kop > 0) mainKey.setAttribute('transform', 'translate(' + kx.toFixed(1) + ',' + ky.toFixed(1) + ') rotate(' + ka.toFixed(1) + ')');
        var nf = t1 ? 3 : t2 ? 6 : 3;
        floatKeys.forEach(function (fk, k) {
          var on = hasKey && k < nf && t >= kt.from + 0.4 + 0.2 * k;
          var x = 440 - ((t - kt.from) * 30 + k * 40) % 220;
          fk.setAttribute('opacity', on ? 0.85 * (1 - K.seg(t, 15.2, 15.8)) : 0);
          if (on) fk.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + (30 + (k % 3) * 30) + ') rotate(' + (20 * Math.sin(t * 2 + k)) + ')');
        });

        var bound = hasKey && t >= kt.bind && kop > 0;
        var strength = bound ? (t2 ? 0.35 : 1) * K.seg(t, kt.bind, kt.bind + 0.5) : 0;
        lockGlow.setAttribute('opacity', strength * 0.6);
        stiff.g.setAttribute('opacity', t2 && t >= 3.6 && t < 12.4 ? 1 : 0);
        sig.setAttribute('opacity', strength);
        sig.setAttribute('stroke-dashoffset', (-t * 18).toFixed(1));

        var opens = DOOR_X.map(function (x, k) { return doorOpen(k, t, mode, K); });
        doors.forEach(function (d, k) {
          var e = opens[k];
          var y = K.lerp(d.vy, MEM, e), s = K.lerp(0.42, 1, e);
          d.g.setAttribute('transform', 'translate(' + d.x + ',' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')');
          d.ves.setAttribute('opacity', 1 - e);
        });
        flows.forEach(function (f) {
          if (opens[f.k] < 0.98) { f.n.setAttribute('opacity', 0); return; }
          var ph = (t * 0.7 + f.j / 3 + f.k * 0.17) % 1;
          var dx = DOOR_X[f.k], x0 = dx - 18 + f.j * 18, x2 = dx + (f.j - 1) * 24;
          var x, y;
          if (ph < 0.5) { var a = ph / 0.5; x = K.lerp(x0, dx, a); y = K.lerp(100, MEM, a); }
          else { var b = (ph - 0.5) / 0.5; x = K.lerp(dx, x2, b); y = K.lerp(MEM, 248, b); }
          f.n.setAttribute('cx', x.toFixed(1)); f.n.setAttribute('cy', y.toFixed(1));
          f.n.setAttribute('opacity', ph > 0.8 ? (1 - ph) / 0.2 : 1);
        });
        store.g.setAttribute('opacity', t >= 12.4 ? 0 : 1 - Math.max.apply(null, opens) * 0.6);
        cellPill.g.setAttribute('opacity', t >= 12.4 ? 0 : 1);
        ex.setAttribute('opacity', t2 && t >= 9.6 && t < 12.4 ? K.seg(t, 9.6, 10.0) : 0);

        gMark.setAttribute('y', gy(G) - 3.5);
        var col = G < 70 ? C.clay : G <= 140 ? C.green : G < 200 ? '#8a6526' : C.clay;
        gMark.setAttribute('fill', col);
        gVal.textContent = Math.round(G);
        gVal.setAttribute('fill', col);

        card.setAttribute('opacity', t >= 12.4 ? K.seg(t, 12.4, 12.7) : 0);
        cTitle.textContent = mode === 'normal' ? '치료 중 저혈당: 70 mg/dL 미만' : '저혈당: 70 mg/dL 미만';
        cl[1].textContent = t >= 13.6 ? '15-15: 당 15g → 15분 뒤 재측정, 70 미만이면 반복' : '';
        cl[2].textContent = t >= 13.6 ? '의식이 없으면 입으로 주지 않는다(글루카곤·정맥 포도당)' : '';
      };
    }
  });
})();
