// 간경변과 문맥압 항진 — 간이 굳으면 문맥 피가 밀려 곁길로 돌고, 그 곁길이 터진다
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var STEPS = {
    normal: [
      { at: 0.0, label: '문맥 순환', text: '장과 비장에서 나온 정맥혈은 바로 심장으로 가지 않고 **문맥**으로 모여 **간을 먼저 거친다**. 간으로 들어오는 피의 약 **75%**가 문맥혈이다.' },
      { at: 4.0, label: '간이 하는 일', text: '간은 장에서 온 피를 걸러 **암모니아를 요소로 해독**하고, **알부민**과 **응고인자**를 만든다. 이 세 가지가 간경변 합병증을 푸는 열쇠다.' },
      { at: 8.0, label: '간정맥 → 하대정맥', text: '간을 지난 피는 **간정맥 → 하대정맥**을 거쳐 우심방으로 간다. 간 안의 저항이 낮아 문맥압은 낮게 유지된다.' },
      { at: 11.5, label: '닫힌 곁길', text: '**식도·위, 배꼽 주위, 직장**에는 문맥계와 전신 정맥이 만나는 연결이 있지만 평소엔 거의 흐르지 않는다. 아래에서 **간경변**을 눌러 이 곁길이 어떻게 열리는지 보자.' }
    ],
    cirr: [
      { at: 0.0, label: '문맥 순환', text: '장·비장의 정맥혈은 **문맥**으로 모여 간을 먼저 거친 뒤 **간정맥 → 하대정맥**으로 간다. 간 혈류의 약 75%가 문맥혈이다.' },
      { at: 2.0, label: '간경변', text: '만성 간염·알코올로 간세포가 죽고 **섬유화와 재생결절**이 생기면 간이 굳어 **피가 지나가기 어렵다**. 문맥에 피가 밀려 **문맥압이 오른다**.' },
      { at: 4.5, label: '식도·위 정맥류', text: '밀린 피가 위 정맥을 거꾸로 타고 **식도 정맥**으로 우회해 부풀어 오른다. 터지면 **대량 토혈·흑색변**으로 생명이 위험하다. 거친 음식·변비로 힘주기·심한 기침을 피하고, 출혈 시 **내시경 결찰**·혈관수축제를 쓴다.' },
      { at: 7.0, label: '배꼽·직장', text: '배꼽 주위 정맥이 다시 열려 방사형으로 부푼 **메두사 머리**, 직장에서는 **치핵(직장 정맥류)**이 생긴다. 모두 문맥과 전신 정맥이 만나는 자리다.' },
      { at: 9.0, label: '비장비대', text: '비장 피도 빠져나가지 못해 **비장이 커지고**, 커진 비장이 혈구를 가둬 파괴한다(비장기능항진) → **혈소판 감소**. 간의 **응고인자 합성↓**까지 겹쳐 출혈 경향(PT 연장)이 생긴다.' },
      { at: 11.0, label: '복수', text: '**복수** = 문맥압↑(정수압) + **알부민↓**(교질삼투압↓) + RAAS·ADH로 **나트륨·수분 저류**. 간호: **저염식**, 이뇨제(스피로노락톤), **매일 같은 시간 체중·복위** 측정, 숨차면 반좌위. 복수천자 뒤에는 저혈압을 살핀다.' },
      { at: 13.5, label: '간성뇌증', text: '장내 세균이 만든 **암모니아**를 간이 해독하지 못하고 곁길로 바로 전신에 돌아 **뇌**로 간다 → 혼돈·수면 역전·**날갯짓 떨림**. **락툴로오스**로 장을 산성화해 암모니아 흡수를 줄이고 배변을 늘린다. 위장관 출혈·변비·감염·저칼륨혈증은 유발 요인이다.' }
    ]
  };

  M.register({
    id: 'portal-htn',
    title: '간경변과 문맥압 항진 — 밀린 피가 곁길로 돈다',
    system: '소화기',
    topics: ['liver-cirrhosis', 'viral-hepatitis', 'circulation-disorder'],
    duration: 16,
    options: [{
      key: 'liver', label: '간 상태',
      choices: [{ value: 'cirr', label: '간경변' }, { value: 'normal', label: '정상' }],
      value: 'cirr'
    }],
    steps: STEPS.cirr,
    stepsFor: function (o) { return STEPS[o.liver] || STEPS.cirr; },
    source: '문맥혈 = 간 혈류의 약 75%. 혈관 위치·굵기는 설명용 모식도로 단순화(실제 해부 위치와 다름).',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var glowF = K.glow(svg, 2.2), bigGlow = K.glow(svg, 5), softSh = K.shadow(svg, 3, 4, 0.2), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        var r = el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, x: 0, y: 0, at: function (x, y) { this.x = x; this.y = y; g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); return this; },
          zoom: function (z) { g.setAttribute('transform', 'translate(' + this.x.toFixed(1) + ',' + this.y.toFixed(1) + ') scale(' + Math.pow(z, -0.8).toFixed(3) + ')'); },
          text: function (s2) { tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.95 + 14; r.setAttribute('x', -w2 / 2); r.setAttribute('width', w2); } };
      }
      function smooth(a) {
        var d = 'M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1);
        for (var i = 0; i < a.length - 1; i++) {
          var p0 = a[i - 1] || a[i], p1 = a[i], p2 = a[i + 1], p3 = a[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
            (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
        return d;
      }

      var clipV = el('clipPath', { id: 'nmPhClip' }, defs);
      el('rect', { x: 0, y: 0, width: 600, height: 340 }, clipV);
      var view = el('g', { 'clip-path': 'url(#nmPhClip)' }, svg);
      var stage = el('g', null, view);
      var IX = -20, IY = 0, IW = 510, IH = 340;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      function path(pts) { return smooth(pts.map(function (q) { return P(q[0], q[1]); })); }
      K.image(stage, 'abdomen-portal', IX, IY, IW, IH, { fadeR: '66%' });

      // 비장비대: 비장 부분만 잘라 한 장 더 겹치고 키운다
      var spC = P(0.79, 0.35);
      var cSp = el('clipPath', { id: 'nmPhSpl' }, defs);
      el('ellipse', { cx: spC[0], cy: spC[1], rx: 0.066 * IW, ry: 0.175 * IH }, cSp);
      var spleenBig = el('g', null, stage);
      var spleenIn = el('g', { 'clip-path': 'url(#nmPhSpl)' }, spleenBig);
      K.image(spleenIn, 'abdomen-portal', IX, IY, IW, IH, { fade: false });

      // 간경변: 간 모양으로 자른 결절·섬유띠
      var liverPts = [[0.19, 0.30], [0.21, 0.16], [0.28, 0.09], [0.40, 0.06], [0.52, 0.08], [0.60, 0.13], [0.62, 0.17], [0.55, 0.22], [0.49, 0.27],
        [0.44, 0.33], [0.38, 0.40], [0.32, 0.48], [0.27, 0.56], [0.23, 0.58], [0.20, 0.50]];
      var cLv = el('clipPath', { id: 'nmPhLiver' }, defs);
      el('path', { d: 'M' + liverPts.map(function (q) { var a = P(q[0], q[1]); return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L') + ' Z' }, cLv);
      var seed = 11;
      var fib = el('g', { 'clip-path': 'url(#nmPhLiver)', opacity: 0 }, stage);
      el('rect', { x: P(0.15, 0)[0], y: 0, width: 0.5 * IW, height: 0.62 * IH, fill: '#c9a24e', opacity: 0.32 }, fib);
      var sept = el('g', { fill: 'none', stroke: '#f3ead0', 'stroke-width': 1.6, opacity: 0.7 }, fib);
      for (var si = 0; si < 14; si++) { var sa = P(0.18 + rnd() * 0.44, 0.06 + rnd() * 0.5), sb = [sa[0] + (rnd() - 0.5) * 120, sa[1] + (rnd() - 0.5) * 70]; el('path', { d: 'M' + sa[0].toFixed(1) + ',' + sa[1].toFixed(1) + ' Q' + ((sa[0] + sb[0]) / 2 + 14).toFixed(1) + ',' + ((sa[1] + sb[1]) / 2 - 10).toFixed(1) + ' ' + sb[0].toFixed(1) + ',' + sb[1].toFixed(1) }, sept); }
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var nodF = K.sphere(svg, '#e2c27a');
      for (var ny = 0.07; ny < 0.6; ny += 0.045) for (var nx = 0.19; nx < 0.63; nx += 0.03) {
        var q0 = P(nx + (rnd() - 0.5) * 0.012 + ((ny * 100) % 2 ? 0.015 : 0), ny + (rnd() - 0.5) * 0.015);
        el('circle', { cx: q0[0], cy: q0[1], r: 3.2 + rnd() * 1.8, fill: nodF, stroke: '#f6eed8', 'stroke-width': 1, opacity: 0.6 }, fib);
      }

      // 혈관 길(입자용, 보이지 않음) + 곁순환 혈관(굵어짐)
      var pA1 = el('path', { d: path([[0.50, 0.70], [0.48, 0.56], [0.465, 0.46], [0.45, 0.405], [0.425, 0.35], [0.40, 0.31]]), fill: 'none' }, stage);
      var pB = el('path', { d: path([[0.79, 0.27], [0.74, 0.32], [0.66, 0.365], [0.57, 0.395], [0.47, 0.41]]), fill: 'none' }, stage);
      var pA2 = el('path', { d: path([[0.40, 0.31], [0.36, 0.24], [0.38, 0.15], [0.415, 0.10], [0.415, 0.00]]), fill: 'none' }, stage);
      function vessel(pts) {
        var d = path(pts);
        return { o: el('path', { d: d, fill: 'none', stroke: '#3b4fb8', 'stroke-linecap': 'round', opacity: 0 }, stage),
          i: el('path', { d: d, fill: 'none', stroke: '#8fa2ff', 'stroke-linecap': 'round', opacity: 0, filter: glowF }, stage),
          p: el('path', { d: d, fill: 'none' }, stage) };
      }
      var col = vessel([[0.50, 0.405], [0.545, 0.33], [0.565, 0.21], [0.565, 0.11], [0.555, 0.02]]);
      var para = vessel([[0.43, 0.35], [0.44, 0.48], [0.49, 0.60], [0.535, 0.665]]);
      var imv = vessel([[0.66, 0.37], [0.72, 0.52], [0.71, 0.74], [0.63, 0.90]]);

      // 정맥류·메두사·치핵(입체 구슬)
      var varF = K.sphere(svg, '#5a6fd8');
      var varices = [[0.548, 0.035], [0.566, 0.055], [0.550, 0.075], [0.567, 0.095], [0.553, 0.115]].map(function (q) {
        var a = P(q[0], q[1]); return el('ellipse', { cx: a[0], cy: a[1], rx: 0, ry: 0, fill: varF, filter: softSh }, stage);
      });
      var um = P(0.535, 0.665);
      var rays = [];
      for (var r = 0; r < 8; r++) rays.push({ a: (r / 8) * Math.PI * 2 + 0.2, n: el('path', { fill: 'none', stroke: '#4a5fc8', 'stroke-linecap': 'round', filter: glowF }, stage) });
      var navel = el('circle', { cx: um[0], cy: um[1], r: 5, fill: K.sphere(svg, '#e8b8a0'), stroke: '#b98d78', 'stroke-width': 1 }, stage);
      var rc = P(0.63, 0.92);
      var hemo = [[-12, 4], [10, -2], [-1, 12]].map(function (d) { return el('circle', { cx: rc[0] + d[0], cy: rc[1] + d[1], r: 0, fill: varF, filter: softSh }, stage); });

      // 복수
      var ag = el('linearGradient', { id: 'nmPhAsc', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#7cc0f0', 'stop-opacity': '0.25' }, ag);
      el('stop', { offset: '1', 'stop-color': '#3f86d8', 'stop-opacity': '0.55' }, ag);
      var asc = el('path', { fill: 'url(#nmPhAsc)', opacity: 0 }, stage);
      var ascLine = el('path', { fill: 'none', stroke: '#e8f6ff', 'stroke-width': 2, opacity: 0, filter: glowF }, stage);

      // 피 알갱이
      var bF = K.sphere(svg, '#4a63d8');
      function dots(n, f) { var a = []; for (var i = 0; i < n; i++) a.push(el('circle', { r: 3.4, fill: f || bF }, stage)); return a; }
      var dA1s = dots(14), dBs = dots(8), dA2s = dots(10), dCols = dots(7), dParas = dots(5), dImvs = dots(5);

      // 이름표(그림 속)
      var L = {};
      function lab(key, nx, ny, txt, color, size) { var a = P(nx, ny); L[key] = pill(stage, txt, color, size).at(a[0], a[1]); return L[key]; }
      lab('liver', 0.29, 0.25, '간', '#7a2a1a', 14);
      lab('ivc', 0.30, 0.03, '하대정맥 → 심장', C.blue);
      lab('portal', 0.39, 0.44, '문맥', C.blue, 13);
      lab('spl', 0.62, 0.43, '비장정맥', C.blue);
      lab('spleen', 0.90, 0.11, '비장', '#6a2a4a', 13);
      lab('stom', 0.66, 0.20, '위', '#9a4a3a', 13);
      lab('gut', 0.36, 0.80, '장', '#9a4a3a', 13);
      lab('eso', 0.625, 0.025, '식도', '#9a4a3a');
      lab('var', 0.44, 0.13, '식도·위 정맥류 · 터지면 토혈', C.clay, 12.5);
      lab('med', 0.53, 0.75, '메두사 머리', C.clay, 12.5);
      lab('hem', 0.76, 0.93, '치핵(직장 쪽)', C.clay, 12.5);
      lab('splBig', 0.83, 0.52, '비장비대 → 혈소판↓', C.clay, 12.5);
      lab('asc', 0.40, 0.92, '복수: 알부민↓·Na 저류', C.blue, 12.5);
      lab('jobs', 0.33, 0.15, 'NH₃→요소 · 알부민 · 응고인자', '#7a2a1a', 12);

      // ── 고정 카드: 문맥압, 뇌(간성뇌증) ──
      var gauge = el('g', null, svg);
      el('rect', { x: 446, y: 262, width: 146, height: 68, rx: 14, fill: '#fff', filter: softSh }, gauge);
      K.label(gauge, 458, 280, '문맥압', { size: 13, anchor: 'start', fill: C.ink, weight: 800 });
      el('rect', { x: 458, y: 291, width: 122, height: 12, rx: 6, fill: '#eef2f3' }, gauge);
      var gBar = el('rect', { x: 458, y: 291, width: 30, height: 12, rx: 6 }, gauge);
      var gTxt = K.label(gauge, 458, 318, '', { size: 12, anchor: 'start', weight: 700 });
      var he = el('g', null, svg);
      el('rect', { x: 470, y: 8, width: 122, height: 118, rx: 14, fill: '#fff', filter: softSh }, he);
      var heGlow = el('ellipse', { cx: 531, cy: 46, rx: 36, ry: 26, fill: '#a070f0', filter: bigGlow, opacity: 0.6 }, he);
      el('ellipse', { cx: 531, cy: 46, rx: 30, ry: 22, fill: K.sphere(svg, '#e3c2ee'), stroke: '#7a3fc0', 'stroke-width': 1.2 }, he);
      el('path', { d: 'M509,42 C516,30 526,48 533,34 C540,24 550,40 555,46 M513,58 C524,51 532,64 547,56', fill: 'none', stroke: '#7a3fc0', 'stroke-width': 1.4 }, he);
      K.label(he, 531, 86, '간성뇌증', { size: 13, fill: '#7a3fc0', weight: 800 });
      K.label(he, 531, 106, '날갯짓 떨림', { size: 12, fill: '#7a3fc0', weight: 700 });
      var nhPath = el('path', { fill: 'none', stroke: '#a070f0', 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: 0 }, svg);
      var nhP = pill(svg, 'NH₃', '#7a3fc0', 12.5);
      var nh = [];
      for (var k = 0; k < 6; k++) nh.push(el('circle', { r: 4.2, fill: K.sphere(svg, '#a070f0'), filter: glowF }, svg));

      var CAMS = {
        cirr: [[0, 0.5, 0.5, 1], [2.0, 0.5, 0.5, 1], [2.8, 0.38, 0.32, 1.32], [4.5, 0.38, 0.32, 1.32], [5.3, 0.56, 0.16, 1.55], [7.0, 0.56, 0.16, 1.55],
          [7.8, 0.58, 0.70, 1.2], [9.0, 0.58, 0.70, 1.2], [9.8, 0.74, 0.36, 1.35], [11.0, 0.74, 0.36, 1.35], [11.8, 0.5, 0.5, 1], [16, 0.5, 0.5, 1]],
        normal: [[0, 0.5, 0.5, 1], [3.6, 0.5, 0.5, 1], [4.4, 0.36, 0.28, 1.3], [7.6, 0.36, 0.28, 1.3], [8.4, 0.42, 0.2, 1.3], [11.0, 0.42, 0.2, 1.3], [11.8, 0.5, 0.5, 1], [16, 0.5, 0.5, 1]]
      };
      var cs = { x: 0, y: 0, z: 1 };
      function camAt(keys, t) {
        for (var i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
          var a = keys[i - 1], b = keys[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var c = P(K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e));
          cs = { x: c[0], y: c[1], z: K.lerp(a[3], b[3], e) };
          K.camera(stage, cs.x, cs.y, cs.z, 235, 170);
          return;
        }
      }
      function fwd(p) { return [(p[0] - cs.x) * cs.z + 235, (p[1] - cs.y) * cs.z + 170]; }

      function place(arr, pth, t, speed, warp, op) {
        arr.forEach(function (n, i) {
          var u = ((t * speed + i / arr.length) % 1 + 1) % 1;
          var p = K.along(pth, warp ? warp(u) : u);
          n.setAttribute('cx', p.x.toFixed(1)); n.setAttribute('cy', p.y.toFixed(1));
          n.setAttribute('opacity', typeof op === 'function' ? op(i, u) : op);
        });
      }

      return function render(t, o) {
        var cir = o.liver === 'cirr';
        camAt(CAMS[cir ? 'cirr' : 'normal'], t);
        var c = cir ? K.easeInOut(K.seg(t, 2.0, 3.6)) : 0;
        var v1 = cir ? K.easeOut(K.seg(t, 4.5, 6.0)) : 0;
        var v2 = cir ? K.easeOut(K.seg(t, 7.0, 8.4)) : 0;
        var v3 = cir ? K.easeOut(K.seg(t, 9.0, 10.4)) : 0;
        var v4 = cir ? K.easeInOut(K.seg(t, 11.0, 12.8)) : 0;
        var v5 = cir ? K.easeOut(K.seg(t, 13.5, 14.3)) : 0;

        fib.setAttribute('opacity', c.toFixed(2));
        L.liver.text(c > 0.5 ? '간경변: 굳은 간' : '간');
        var spS = 1 + 0.3 * v3;
        spleenBig.setAttribute('transform', 'translate(' + (spC[0] * (1 - spS)).toFixed(1) + ',' + (spC[1] * (1 - spS)).toFixed(1) + ') scale(' + spS.toFixed(3) + ')');
        spleenBig.setAttribute('opacity', v3 > 0.01 ? 1 : 0);

        // 곁순환
        [[col, v1], [para, v2], [imv, v2]].forEach(function (a) {
          var w = a[1];
          a[0].o.setAttribute('stroke-width', (2 + 7 * w).toFixed(1)); a[0].o.setAttribute('opacity', (0.9 * w).toFixed(2));
          a[0].i.setAttribute('stroke-width', (1 + 4 * w).toFixed(1)); a[0].i.setAttribute('opacity', (0.9 * w).toFixed(2));
        });
        varices.forEach(function (n, i) { var g = v1 * (1 + 0.08 * Math.sin(t * 4 + i)); n.setAttribute('rx', (5 * g).toFixed(1)); n.setAttribute('ry', (6.5 * g).toFixed(1)); });
        rays.forEach(function (rr) {
          var Ln = 6 + 22 * v2, a = rr.a, x0 = um[0] + 6 * Math.cos(a), y0 = um[1] + 6 * Math.sin(a);
          var x1 = um[0] + Ln * Math.cos(a), y1 = um[1] + Ln * Math.sin(a);
          var nx2 = -Math.sin(a) * 4 * v2, ny2 = Math.cos(a) * 4 * v2;
          rr.n.setAttribute('d', 'M' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' Q' + ((x0 + x1) / 2 + nx2).toFixed(1) + ',' + ((y0 + y1) / 2 + ny2).toFixed(1) + ' ' + x1.toFixed(1) + ',' + y1.toFixed(1));
          rr.n.setAttribute('stroke-width', (1 + 2.6 * v2).toFixed(1));
          rr.n.setAttribute('opacity', (0.9 * v2).toFixed(2));
        });
        navel.setAttribute('opacity', cir ? 0.4 + 0.6 * K.seg(t, 6.6, 7.2) : 0);
        hemo.forEach(function (h, i) { h.setAttribute('r', (6 * v2 * (1 + 0.08 * Math.sin(t * 4 + i))).toFixed(1)); });

        var top = K.lerp(345, 0.56 * IH, v4), d = 'M' + IX + ',360 L' + IX + ',' + top.toFixed(1), dl = '';
        for (var x = IX; x <= IX + IW; x += 16) {
          var yy = (top + 3 * Math.sin(x / 22 + t * 2.2)).toFixed(1);
          d += ' L' + x + ',' + yy; dl += (dl ? ' L' : 'M') + x + ',' + yy;
        }
        asc.setAttribute('d', d + ' L' + (IX + IW) + ',360 Z'); asc.setAttribute('opacity', v4.toFixed(2));
        ascLine.setAttribute('d', dl); ascLine.setAttribute('opacity', (0.8 * v4).toFixed(2));

        // 이름표 보이기
        var showN = function (k, v) { L[k].g.setAttribute('opacity', v); };
        showN('var', v1); showN('med', v2); showN('hem', v2); showN('splBig', v3); showN('asc', v4);
        showN('jobs', cir ? 0 : K.seg(t, 4.0, 4.5) * (1 - K.seg(t, 7.6, 8.0)));
        Object.keys(L).forEach(function (k) {
          var lb = L[k]; lb.zoom(cs.z);
          var sp = fwd([lb.x, lb.y]), wv = lb.t.textContent.length * 6.5;
          if (sp[0] - wv < 6 || sp[0] + wv > 594 || sp[1] < 8 || sp[1] > 334) lb.g.setAttribute('opacity', 0);
        });

        // 문맥압
        gBar.setAttribute('width', (30 + 92 * c).toFixed(1));
        gBar.setAttribute('fill', K.sphere(svg, c > 0.5 ? C.clay : C.teal));
        gTxt.textContent = c > 0.5 ? '상승 — 피가 밀림' : '정상(낮음)';
        gTxt.setAttribute('fill', c > 0.5 ? C.clay : C.teal);

        // 간성뇌증: 대정맥 위쪽에서 뇌 카드로
        he.setAttribute('opacity', v5);
        var s0 = fwd(P(0.415, 0.02)), b0 = [500, 40];
        nhPath.setAttribute('d', 'M' + s0[0].toFixed(1) + ',' + s0[1].toFixed(1) + ' C' + (s0[0] + 40) + ',' + (s0[1] - 30) + ' ' + (b0[0] - 60) + ',' + (b0[1] - 30) + ' ' + b0[0] + ',' + b0[1]);
        nhPath.setAttribute('opacity', 0.8 * v5);
        nhP.at(452, 74); nhP.g.setAttribute('opacity', v5);
        nh.forEach(function (n, i) {
          var u = (t * 0.4 + i / nh.length) % 1, p = K.along(nhPath, u);
          n.setAttribute('cx', p.x.toFixed(1)); n.setAttribute('cy', p.y.toFixed(1)); n.setAttribute('opacity', v5);
        });
        nhPath.__len = 0;

        // 피 흐름
        var kk = 1 + 1.6 * c;
        place(dA1s, pA1, t, 0.3 * (1 - 0.35 * c), function (u) { return 1 - Math.pow(1 - u, kk); }, 0.95);
        place(dBs, pB, t, 0.28 * (1 - 0.35 * c), function (u) { return 1 - Math.pow(1 - u, kk); }, 0.95);
        place(dA2s, pA2, t, 0.3 * (1 - 0.5 * c), null, function (i) { return (cir && c > 0.5 && i % 2) ? 0 : 0.95; });
        place(dCols, col.p, t, 0.35, null, v1);
        place(dParas, para.p, t, 0.3, null, v2);
        place(dImvs, imv.p, t, 0.3, null, v2);
      };
    }
  });
})();
