// 모세혈관 Starling 힘과 부종 — 밀어내는 힘(정수압)과 당기는 힘(교질삼투압)의 줄다리기
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var TR0 = 7.8, TR1 = 9.2;   // 정상 → 선택한 상태로 바뀌는 구간
  // Pa: 동맥 쪽 정수압, Pv: 정맥 쪽 정수압, Pi: 당기는 힘(교질삼투압 차) — 단순화한 예시값(mmHg)
  var STATE = {
    normal: { Pa: 35, Pv: 15, Pi: 24, sev: 0, lymphOpen: true },
    hydro: { Pa: 44, Pv: 30, Pi: 24, sev: 0.85, lymphOpen: true },
    onc: { Pa: 35, Pv: 15, Pi: 12, sev: 0.9, lymphOpen: true },
    perm: { Pa: 35, Pv: 15, Pi: 15, sev: 0.75, lymphOpen: true },
    lymph: { Pa: 35, Pv: 15, Pi: 24, sev: 0.75, lymphOpen: false }
  };
  var TAG = {
    normal: '', hydro: '정수압↑ — 심부전·정맥 정체', onc: '교질삼투압↓ — 저알부민혈증',
    perm: '투과성↑ — 염증·화상', lymph: '림프 폐쇄 — 림프절 절제·종양'
  };

  var BASE = [
    { at: 0.0, label: '동맥 쪽: 여과', text: '모세혈관 **동맥 쪽**에서는 혈압이 만든 **정수압(밀어내는 힘)**이 알부민이 만든 **교질삼투압(당기는 힘)**보다 커서 물이 조직으로 **나간다**. 산소·영양분이 이 물을 타고 세포에 닿는다.' },
    { at: 2.6, label: '정맥 쪽: 재흡수', text: '피가 흐르는 동안 **정수압은 점점 떨어지지만** 단백질은 그대로라 **교질삼투압은 거의 일정**하다. 그래서 **정맥 쪽**에서는 당기는 힘이 이겨 물이 혈관으로 **돌아온다**.' },
    { at: 5.2, label: '림프', text: '나간 물이 전부 돌아오지는 않는다. **남는 물과 새어 나온 단백질은 림프관**이 거둬 정맥으로 돌려보낸다. 이 셋이 맞으면 조직에 물이 고이지 않는다.' }
  ];
  var MORE = {
    normal: [
      { at: TR0, label: '부종의 네 원인', text: '**부종**은 이 균형 중 하나가 무너질 때 생긴다: **정수압↑**, **교질삼투압↓**, **혈관 투과성↑**, **림프 폐쇄**. 아래에서 하나씩 바꿔 보자.' }
    ],
    hydro: [
      { at: TR0, label: '정수압↑', text: '**심부전**(특히 우심부전)·정맥 정체·수분 과다로 모세혈관 **정수압이 오르면** 정맥 쪽에서도 밀어내는 힘이 이긴다. 여과는 늘고 재흡수는 줄어 물이 조직에 고인다.' },
      { at: 11.0, label: '함요부종', text: '중력이 작용하는 **하지·천골 부위**에 **함요부종**이 생긴다. 눌러서 패인 깊이로 **1+~4+** 등급을 매긴다. 간호: 다리 올리기, **매일 같은 조건에서 체중**(하루 1kg 증가 ≈ 수분 1L), 염분 제한, 이뇨제.' }
    ],
    onc: [
      { at: TR0, label: '교질삼투압↓', text: '**알부민**은 혈관 안에 물을 붙잡아 두는 단백질이다. **간경변**(합성↓)·**신증후군**(소변으로 소실)·**영양불량**으로 줄면 정맥 쪽에서 물을 다시 끌어들이지 못한다.' },
      { at: 11.0, label: '전신부종', text: '눈 주위·얼굴부터 전신, **복수·흉수**까지 생긴다. 물이 혈관 밖으로 빠져 **혈관 안 용적은 오히려 줄어** 저혈압·소변 감소가 올 수 있다. 혈청 알부민 정상은 약 **3.5~5.0 g/dL**.' }
    ],
    perm: [
      { at: TR0, label: '투과성↑', text: '**염증·화상**·알레르기·패혈증에서는 혈관벽 틈이 벌어져 물뿐 아니라 **알부민까지 새어 나간다**. 조직 쪽 단백질이 늘어 당기는 힘의 차이가 줄어든다.' },
      { at: 11.0, label: '화상·염증', text: '염증 부위가 붓고 붉어진다. 넓은 **화상 초기 24~48시간**에는 혈관 안 체액이 대량으로 조직으로 빠져 **저혈량 쇼크** 위험이 있어 수액을 충분히 보충한다.' }
    ],
    lymph: [
      { at: TR0, label: '림프 폐쇄', text: '**유방암 수술의 액와 림프절 절제**·방사선·종양으로 림프 흐름이 막히면 남는 물과 **단백질**이 빠져나갈 길이 없어 조직에 쌓인다.' },
      { at: 11.0, label: '림프부종', text: '단백질이 많은 부종이라 시간이 지나면 섬유화되어 **잘 패이지 않는다(비함요)**. 수술한 쪽 팔에서 **혈압 측정·채혈·주사를 피하고**, 상처·감염을 막고, 압박·림프 마사지·팔 올리기를 한다.' }
    ]
  };

  M.register({
    id: 'starling-edema',
    title: '모세혈관 Starling 힘과 부종',
    system: '순환기',
    topics: ['circulation-disorder', 'fluid-electrolyte', 'heart-failure', 'ckd', 'liver-cirrhosis'],
    duration: 14,
    options: [{
      key: 'cause', label: '상태',
      choices: [
        { value: 'normal', label: '정상' }, { value: 'hydro', label: '정수압↑' }, { value: 'onc', label: '교질삼투압↓' },
        { value: 'perm', label: '투과성↑' }, { value: 'lymph', label: '림프 폐쇄' }
      ],
      value: 'normal'
    }],
    steps: BASE.concat(MORE.normal),
    stepsFor: function (o) { return BASE.concat(MORE[o.cause] || MORE.normal); },
    source: '고전적 단순화 예: 동맥 쪽 정수압 약 35, 정맥 쪽 약 15, 혈장 교질삼투압 약 25mmHg(교재마다 값이 조금 다름). 그래프 눈금은 생략한 모식도.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var WATER = '#3f86d8', ALB = '#e0a630';
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var glowF = K.glow(svg, 2.2), softSh = K.shadow(svg, 3, 4, 0.2), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        var r = el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, at: function (x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); return this; },
          text: function (s2) { tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.95 + 14; r.setAttribute('x', -w2 / 2); r.setAttribute('width', w2); } };
      }

      // ── 무대(카메라가 움직이는 층) ──
      var clipV = el('clipPath', { id: 'nmStClip' }, defs);
      el('rect', { x: 0, y: 0, width: 600, height: 340 }, clipV);
      var view = el('g', { 'clip-path': 'url(#nmStClip)' }, svg);
      var stage = el('g', null, view);
      var IX = 0, IY = -50, IW = 600, IH = 400;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      K.image(stage, 'capillary', IX, IY, IW, IH, { fadeR: '66%' });
      var WT = 0.372, WB = 0.578;               // 혈관벽 위·아래(정규화)
      var yWT = P(0, WT)[1], yWB = P(0, WB)[1];

      // 부종: 간질이 물로 차오름
      var eg = el('radialGradient', { id: 'nmStSwell', cx: '50%', cy: '50%', r: '50%' }, defs);
      el('stop', { offset: '0', 'stop-color': '#6fb0ea', 'stop-opacity': '0.55' }, eg);
      el('stop', { offset: '1', 'stop-color': '#6fb0ea', 'stop-opacity': '0' }, eg);
      var swellT = el('ellipse', { cx: 300, cy: P(0, 0.2)[1], rx: 330, ry: 70, fill: 'url(#nmStSwell)', opacity: 0 }, stage);
      var swellB = el('ellipse', { cx: 230, cy: P(0, 0.72)[1], rx: 260, ry: 52, fill: 'url(#nmStSwell)', opacity: 0 }, stage);

      // 내피세포 틈(투과성)
      var gaps = [];
      [0.16, 0.30, 0.44, 0.58, 0.72, 0.86].forEach(function (nx) {
        gaps.push(el('rect', { x: P(nx, 0)[0] - 1, y: yWT - 5, width: 2, height: 10, rx: 1, fill: '#fff8d0', filter: glowF, opacity: 0 }, stage));
      });

      // 힘 화살표(빛나는 화살)
      function head(color, id) {
        var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: '6', refY: '5', markerUnits: 'userSpaceOnUse', markerWidth: '14', markerHeight: '14', orient: 'auto' }, defs);
        el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
        return id;
      }
      var idOut = head(WATER, 'nmStOut'), idIn = head(ALB, 'nmStIn');
      var ARX = [0.14, 0.26, 0.38, 0.58, 0.72, 0.86];
      var arrows = ARX.map(function () { return el('line', { 'stroke-width': 4.5, 'stroke-linecap': 'round' }, stage); });

      // 림프관 길
      var lymD = (function () {
        var pts = [[0.60, 0.645], [0.70, 0.672], [0.80, 0.71], [0.90, 0.79], [0.99, 0.90]].map(function (q) { return P(q[0], q[1]); });
        return 'M' + pts.map(function (a) { return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L');
      })();
      var lymPath = el('path', { d: lymD, fill: 'none', stroke: 'none' }, stage);
      var block = el('g', null, stage);
      var bq = P(0.70, 0.672);
      el('path', { d: 'M' + (bq[0] - 13) + ',' + (bq[1] - 13) + ' L' + (bq[0] + 13) + ',' + (bq[1] + 13) + ' M' + (bq[0] + 13) + ',' + (bq[1] - 13) + ' L' + (bq[0] - 13) + ',' + (bq[1] + 13),
        stroke: C.clay, 'stroke-width': 5, 'stroke-linecap': 'round', filter: glowF }, block);
      pill(block, '막힘', C.clay, 12.5).at(bq[0] + 40, bq[1] - 20);

      // 알갱이
      var waterF = K.sphere(svg, WATER), albF = K.sphere(svg, ALB);
      var N = 16, water = [];
      for (var i = 0; i < N; i++) water.push(el('circle', { r: 4, fill: waterF }, stage));
      var seed = 5;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var pool = [];
      for (i = 0; i < 28; i++) {
        var up = i % 3 !== 0;
        var q = up ? P(0.04 + rnd() * 0.9, 0.12 + rnd() * 0.2) : P(0.04 + rnd() * 0.5, 0.63 + rnd() * 0.13);
        pool.push({ x: q[0], y: q[1], n: el('circle', { r: 4, fill: waterF, opacity: 0 }, stage) });
      }
      var albIn = [];
      for (i = 0; i < 10; i++) albIn.push(el('circle', { r: 5.5, fill: albF, filter: softSh }, stage));
      var albOut = [];
      for (i = 0; i < 6; i++) { var qa = P(0.10 + i * 0.12 + rnd() * 0.04, 0.17 + rnd() * 0.12); albOut.push({ x: qa[0], y: qa[1], n: el('circle', { r: 5.5, fill: albF, opacity: 0, filter: softSh }, stage) }); }

      // 이름표
      var q2;
      q2 = P(0.085, 0.47); pill(stage, '세동맥 쪽', '#9a2a24').at(q2[0], q2[1]);
      q2 = P(0.915, 0.47); pill(stage, '세정맥 쪽', '#2f3f8a').at(q2[0], q2[1]);
      q2 = P(0.86, 0.66); var lymL = pill(stage, '림프관 → 정맥으로', '#5d7a1e').at(q2[0] - 10, q2[1] - 18);
      q2 = P(0.13, 0.10); pill(stage, '조직(세포 사이)', C.green).at(q2[0] + 10, q2[1] + 8);
      var edemaL = pill(stage, '부종', C.blue, 14);
      q2 = P(0.30, 0.25); edemaL.at(q2[0], q2[1]);

      // 상태 표지(고정)
      var tag = pill(svg, '', C.clay, 13.5);
      tag.at(300, 20);

      // ── 그래프 카드(고정) ──
      var G = el('g', null, svg);
      el('rect', { x: 10, y: 252, width: 432, height: 82, rx: 12, fill: 'rgba(255,255,255,.95)', filter: softSh }, G);
      K.label(G, 22, 266, '모세혈관을 따라 두 힘', { size: 12.5, anchor: 'start', fill: C.ink, weight: 800 });
      el('line', { x1: 172, y1: 266, x2: 190, y2: 266, stroke: WATER, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, G);
      K.label(G, 194, 266, '정수압(밀어냄)', { size: 12, anchor: 'start', fill: WATER, weight: 800 });
      el('line', { x1: 290, y1: 266, x2: 308, y2: 266, stroke: ALB, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, G);
      var lbPi = K.label(G, 312, 266, '교질삼투압(당김)', { size: 12, anchor: 'start', fill: '#9a6a10', weight: 800 });
      var GX0 = 24, GX1 = 330, GY0 = 336, GK = 1.25;
      function gy(v) { return GY0 - v * GK; }
      function gx(f) { return GX0 + (GX1 - GX0) * f; }
      var areaOut = el('path', { fill: '#cfe2f6' }, G);
      var areaIn = el('path', { fill: '#f6e6c2' }, G);
      var lineP = el('line', { stroke: WATER, 'stroke-width': 3, 'stroke-linecap': 'round' }, G);
      var linePi = el('line', { stroke: ALB, 'stroke-width': 3, 'stroke-linecap': 'round' }, G);
      K.label(G, GX0, 326, '동맥 쪽', { size: 12, anchor: 'start', fill: C.muted, weight: 600 }).setAttribute('opacity', 0);
      var sumOut = K.label(G, 342, 290, '', { size: 12.5, anchor: 'start', fill: WATER, weight: 800 });
      var sumIn = K.label(G, 342, 310, '', { size: 12.5, anchor: 'start', fill: '#9a6a10', weight: 800 });

      var CAM = [[0, 0.26, 0.42, 1.28], [2.2, 0.26, 0.42, 1.28], [2.9, 0.68, 0.44, 1.28], [4.8, 0.68, 0.44, 1.28], [5.6, 0.66, 0.56, 1.22],
        [7.4, 0.66, 0.56, 1.22], [8.4, 0.5, 0.42, 1.0], [14, 0.5, 0.42, 1.0]];
      function cam(t) {
        for (var k = 1; k < CAM.length; k++) if (t <= CAM[k][0]) {
          var a = CAM[k - 1], b = CAM[k], e = K.easeInOut(K.seg(t, a[0], b[0]));
          return [K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e)];
        }
        var z = CAM[CAM.length - 1]; return [z[1], z[2], z[3]];
      }

      function lerpState(a, b, p) {
        return { Pa: K.lerp(a.Pa, b.Pa, p), Pv: K.lerp(a.Pv, b.Pv, p), Pi: K.lerp(a.Pi, b.Pi, p), sev: K.lerp(a.sev, b.sev, p) };
      }

      return function render(t, o) {
        var mode = o.cause, S1 = STATE[mode] || STATE.normal;
        var p = mode === 'normal' ? 0 : K.easeInOut(K.seg(t, TR0, TR1));
        var s = lerpState(STATE.normal, S1, p);
        var edema = S1.sev * K.easeInOut(K.seg(t, TR0 + 0.6, 12.4));
        var after = mode !== 'normal' && t >= TR0 + 0.6;
        var cz = cam(t), cc = P(cz[0], cz[1]);
        K.camera(stage, cc[0], cc[1], cz[2], 300, 128);

        // 그래프
        var yA = gy(s.Pa), yV = gy(s.Pv), yPi = gy(s.Pi);
        lineP.setAttribute('x1', GX0); lineP.setAttribute('y1', yA); lineP.setAttribute('x2', GX1); lineP.setAttribute('y2', yV);
        linePi.setAttribute('x1', GX0); linePi.setAttribute('y1', yPi); linePi.setAttribute('x2', GX1); linePi.setAttribute('y2', yPi);
        var fc = s.Pa === s.Pv ? 1 : K.clamp((s.Pa - s.Pi) / (s.Pa - s.Pv), 0, 1);
        var xc = gx(fc), yc = K.lerp(yA, yV, fc);
        areaOut.setAttribute('d', fc > 0 ? 'M' + GX0 + ',' + yA + ' L' + xc + ',' + yc + ' L' + xc + ',' + yPi + ' L' + GX0 + ',' + yPi + ' Z' : '');
        areaIn.setAttribute('d', fc < 1 ? 'M' + xc + ',' + yPi + ' L' + xc + ',' + yc + ' L' + GX1 + ',' + yV + ' L' + GX1 + ',' + yPi + ' Z' : '');
        areaOut.setAttribute('opacity', t < 2.6 ? 1 : 0.65); areaIn.setAttribute('opacity', t >= 2.6 && t < 5.2 ? 1 : 0.65);
        lbPi.textContent = mode === 'perm' && p > 0.5 ? '교질삼투압 차(혈장−조직)' : '교질삼투압(당김)';
        var outA = 0.5 * (s.Pa - s.Pi + Math.max(0, s.Pv - s.Pi)) , inA = Math.max(0, s.Pi - s.Pv);
        sumOut.textContent = '■ 여과(밖으로)';
        sumIn.textContent = inA > 2 ? '■ 재흡수(안으로)' : '■ 재흡수 거의 없음';
        sumIn.setAttribute('fill', inA > 2 ? '#9a6a10' : C.clay);

        // 화살표: 위쪽 벽에서 밖(위)으로 / 안(아래)으로
        ARX.forEach(function (nx, k) {
          var net = K.lerp(s.Pa, s.Pv, nx) - s.Pi;
          var L = K.clamp(Math.abs(net) * 2.4, 0, 60);
          var a = arrows[k], x = P(nx, 0)[0];
          a.setAttribute('x1', x); a.setAttribute('x2', x);
          if (Math.abs(net) < 1.5) { a.setAttribute('opacity', 0); return; }
          a.setAttribute('opacity', 0.95);
          if (net > 0) { a.setAttribute('y1', yWT - 4); a.setAttribute('y2', yWT - 8 - L); a.setAttribute('stroke', WATER); a.setAttribute('marker-end', 'url(#' + idOut + ')'); }
          else { a.setAttribute('y1', yWT - 8 - L); a.setAttribute('y2', yWT - 4); a.setAttribute('stroke', ALB); a.setAttribute('marker-end', 'url(#' + idIn + ')'); }
        });

        var gap = mode === 'perm' ? p : 0;
        gaps.forEach(function (g, k) { g.setAttribute('opacity', gap); g.setAttribute('width', (2 + 6 * gap).toFixed(1)); g.setAttribute('x', (P([0.16, 0.30, 0.44, 0.58, 0.72, 0.86][k], 0)[0] - 1 - 3 * gap).toFixed(1)); });

        swellT.setAttribute('opacity', edema.toFixed(2)); swellB.setAttribute('opacity', (0.9 * edema).toFixed(2));
        edemaL.text(mode === 'lymph' ? '림프부종' : '부종');
        edemaL.g.setAttribute('opacity', edema > 0.25 ? 1 : 0);
        tag.text(after ? TAG[mode] : '');
        tag.g.setAttribute('opacity', after ? 1 : 0);
        block.setAttribute('opacity', mode === 'lymph' ? p : 0);
        lymL.g.setAttribute('opacity', mode === 'lymph' && p > 0.5 ? 0 : 1);
        pool.forEach(function (q, k) {
          var on = k < Math.floor(edema * pool.length + 0.001);
          q.n.setAttribute('cx', (q.x + 3 * Math.sin(t * 1.3 + k)).toFixed(1));
          q.n.setAttribute('cy', (q.y + 2 * Math.cos(t * 1.1 + k * 2)).toFixed(1));
          q.n.setAttribute('opacity', on ? 0.9 : 0);
        });

        var albN = mode === 'onc' ? Math.round(K.lerp(10, 3, p)) : 10;
        albIn.forEach(function (n, k) {
          var u = (t * 0.08 + k / albIn.length) % 1;
          n.setAttribute('cx', (P(0.03 + u * 0.94, 0)[0]).toFixed(1));
          n.setAttribute('cy', P(0, k % 2 ? 0.42 : 0.53)[1].toFixed(1));
          n.setAttribute('opacity', k < albN ? 1 : 0);
        });
        albOut.forEach(function (q, k) {
          var pr = mode === 'perm' ? K.seg(t, TR0 + 0.4 + k * 0.35, TR0 + 1.4 + k * 0.35) : 0;
          q.n.setAttribute('cx', q.x); q.n.setAttribute('cy', K.lerp(yWT + 10, q.y, pr).toFixed(1));
          q.n.setAttribute('opacity', pr > 0 ? 1 : 0);
        });

        // 물 알갱이 순환: 동맥 쪽 벽으로 나가 정맥 쪽 벽으로 돌아오거나 림프관으로
        var lyIn = P(0.60, 0.645);
        water.forEach(function (n, k) {
          var u = ((t / 4.6 + k / N) % 1);
          var cycStart = t - u * 4.6;
          var m = cycStart >= TR0 ? mode : 'normal';
          var down = k % 2 === 0;
          var fate = (down && k % 4 === 0) ? 'lym' : 'ret';
          if (m === 'hydro' || m === 'onc' || m === 'perm') fate = (down && k % 4 === 0) ? 'lym' : (k % 3 === 0 ? 'ret' : 'pool');
          if (m === 'lymph' && fate === 'lym') fate = 'stuck';
          var fExit = (m === 'hydro' || m === 'onc') ? 0.08 + ((k * 37) % 100) / 100 * 0.6 : 0.08 + ((k * 37) % 100) / 100 * 0.32;
          var xE = P(fExit, 0)[0], xR = P(0.58 + ((k * 53) % 100) / 100 * 0.34, 0)[0];
          var yIn = P(0, down ? 0.53 : 0.42)[1];
          var yWall = down ? yWB : yWT;
          var yT = down ? P(0, 0.64 + ((k * 29) % 10) / 100)[1] : P(0, 0.14 + ((k * 29) % 16) / 100)[1];
          var x, y, op = 1;
          if (u < 0.15) { x = K.lerp(P(0.02, 0)[0], xE, u / 0.15); y = yIn; }
          else if (u < 0.35) { var a = (u - 0.15) / 0.2; x = xE + 8 * a; y = K.lerp(yWall, yT, K.easeOut(a)); }
          else if (u < 0.65) {
            var b = (u - 0.35) / 0.3;
            if (fate === 'ret') { x = K.lerp(xE + 8, xR, b); y = yT + 6 * Math.sin(b * 6); }
            else if (fate === 'lym' || fate === 'stuck') { x = K.lerp(xE + 8, lyIn[0] - 6, b); y = K.lerp(yT, lyIn[1], b); }
            else { x = xE + 8 + 30 * b; y = yT + 8 * Math.sin(b * 5); op = 1 - b; }
          } else {
            var c = (u - 0.65) / 0.35;
            if (fate === 'ret') {
              if (c < 0.55) { x = xR; y = K.lerp(yT, yIn, c / 0.55); }
              else { x = K.lerp(xR, P(0.98, 0)[0], (c - 0.55) / 0.45); y = yIn; }
            } else if (fate === 'lym') { var pp = K.along(lymPath, c); x = pp.x; y = pp.y; op = 1 - K.seg(c, 0.85, 1); }
            else if (fate === 'stuck') { x = lyIn[0] - 6 - 10 * c; y = lyIn[1] + 6 * c; op = 1 - c; }
            else { x = 0; y = 0; op = 0; }
          }
          n.setAttribute('cx', x.toFixed(1)); n.setAttribute('cy', y.toFixed(1));
          n.setAttribute('opacity', op.toFixed(2));
        });
      };
    }
  });
})();
