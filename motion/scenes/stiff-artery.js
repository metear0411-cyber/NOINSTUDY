// 노화 혈관과 맥압 — 윈드케셀(바람통) 효과.
// 젊은 대동맥: 수축기에 늘어나 피를 저장 → 이완기에 반동으로 밀어 줌 → 수축기압 완만, 이완기압 유지.
// 굳은 대동맥("굳어버린 고무호스"): 늘어나지 못함 → 수축기압↑, 이완기압↓ → 맥압↑(단독 수축기 고혈압).
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;
  var DUR = 15, T = 1.5, SYS = 0.35; // 한 박동 1.5초(느리게 보여 줌), 수축기 35%

  var V = {
    young: { dbp: 80, sbp: 120, notch: 104, k: 1.6, swell: 9 },
    old: { dbp: 70, sbp: 160, notch: 128, k: 3.6, swell: 1.5 }
  };
  // 한 박동 안 위치 x(0~1) → 대동맥 압력(mmHg)
  function press(v, x) {
    var amp = v.sbp - v.dbp;
    if (x < SYS) return v.dbp + amp * Math.pow(Math.sin(Math.PI * x / 0.44), 0.8);
    var atSys = v.dbp + amp * Math.pow(Math.sin(Math.PI * SYS / 0.44), 0.8);
    if (x < SYS + 0.05) { var q = (x - SYS) / 0.05; return atSys + (v.notch - atSys) * q - 4 * Math.sin(Math.PI * q); }
    var u = (x - SYS - 0.05) / (1 - SYS - 0.05);
    return v.dbp + (v.notch - v.dbp) * (Math.exp(-v.k * u) - Math.exp(-v.k)) / (1 - Math.exp(-v.k));
  }
  // 대동맥 벽이 늘어난 정도(0~1): 압력에 비례, 굳은 혈관은 거의 0
  function stretch(v, x) { return (press(v, x) - v.dbp) / (v.sbp - v.dbp); }
  // 흐름 속도(상대값): 수축기 박출 + 이완기 반동
  function flow(kind, x) {
    var ej = x < SYS ? Math.sin(Math.PI * x / SYS) : 0;
    if (kind === 'young') return 0.75 * ej + (x >= SYS ? 0.32 * Math.exp(-1.2 * (x - SYS) / (1 - SYS)) : 0.05);
    return 1.45 * ej + (x >= SYS ? 0.03 : 0);
  }

  M.register({
    id: 'stiff-artery',
    title: '노화 혈관과 맥압 — 굳어버린 고무호스',
    system: '순환기',
    topics: ['htn', 'aging-changes', 'cardiovascular-patho', 'pvd'],
    duration: DUR,
    steps: [
      { at: 0, label: '탄력 있는 대동맥', text: '젊은 대동맥은 고무풍선처럼 늘어난다. 수축기에 좌심실이 내보낸 피의 **일부를 벽이 늘어나며 저장**해 수축기압이 지나치게 치솟지 않는다(**윈드케셀 효과**).' },
      { at: 3, label: '이완기 반동', text: '이완기에는 늘어났던 벽이 **되돌아오며(반동)** 저장한 피를 앞으로 밀어 준다. 심장이 쉬는 동안에도 피가 흐르고 **이완기압이 유지**된다. 예: 120/80mmHg, 맥압 40.' },
      { at: 6, label: '굳은 고무호스', text: '노화로 **탄력섬유(엘라스틴)가 줄고 콜라겐·칼슘이 쌓여** 대동맥이 굳는다. 늘어나 받아 줄 곳이 없으니 내보낸 피가 한꺼번에 압력이 되어 **수축기압↑**.' },
      { at: 9, label: '이완기압↓·맥압↑', text: '반동이 없어 이완기에 압력이 **뚝 떨어진다(이완기압↓)**. 그래서 **맥압(수축기압−이완기압)이 커진다**. 노인에게 흔한 **단독 수축기 고혈압**(수축기 ≥140, 이완기 <90mmHg)이 이렇게 생긴다.' },
      { at: 12, label: '심장에 미치는 영향', text: '굳은 혈관에 피를 짜내야 하니 **후부하↑ → 좌심실 비대**. 관상동맥은 주로 **이완기에** 피를 받아서 이완기압이 낮아지면 심근 관류도 줄어든다. 노인에서는 **수축기압과 맥압**이 심혈관 위험을 더 잘 반영한다.' }
    ],
    source: '단독 수축기 고혈압: 수축기 ≥140 그리고 이완기 <90mmHg. 수치(120/80, 160/70)와 파형은 설명용 예시이며, 박동은 느리게(1.5초) 보여 준다.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var cardSh = K.shadow(svg, 3, 5, 0.16);
      var pillSh = K.shadow(svg, 1.5, 2, 0.22);
      var glowS = K.glow(svg, 2.2);
      var dotSh = K.shadow(svg, 1, 1.2, 0.3);

      // 흐름 누적 이동량 표(순수 함수용)
      var STEP = 0.01, NS = Math.round(DUR / STEP);
      function cumTable(kind) {
        var a = new Float32Array(NS + 1); a[0] = 0;
        for (var i = 1; i <= NS; i++) a[i] = a[i - 1] + flow(kind, (((i - 0.5) * STEP) % T) / T) * STEP;
        return a;
      }
      var CUM = { young: cumTable('young'), old: cumTable('old') };
      function disp(kind, t) { var i = Math.min(NS, Math.max(0, Math.round(t / STEP))); return CUM[kind][i]; }

      // ── 위: 대동맥 두 토막(3D 그림) ──
      var IX = 70, IY = -26, IW = 460, IH = 306.7;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      var clipS = el('clipPath', { id: 'nmStStage' }, defs);
      el('rect', { x: 0, y: 0, width: 600, height: 218 }, clipS);
      var stage = el('g', { 'clip-path': 'url(#nmStStage)' }, svg);
      var cam = el('g', null, stage);

      // 토막마다 그림을 따로 잘라 두어, 각자 부풀게 한다
      var TUBE = {
        young: { half: [0, 0.505], c: [0.215, 0.525], lum: [0.215, 0.52, 0.105, 0.145], vp: [0.27, 0.42], body: [0.29, 0.43], ox: 0 },
        old: { half: [0.505, 1], c: [0.665, 0.565], lum: [0.685, 0.545, 0.09, 0.135], vp: [0.73, 0.44], body: [0.73, 0.45], ox: 0 }
      };
      var parts = {};
      ['young', 'old'].forEach(function (kind) {
        var tb = TUBE[kind];
        var cp = el('clipPath', { id: 'nmStHalf' + kind }, defs);
        var x0 = P(tb.half[0], 0)[0], x1 = P(tb.half[1], 0)[0];
        el('rect', { x: x0, y: -40, width: x1 - x0, height: 320 }, cp);
        var wrap = el('g', { 'clip-path': 'url(#nmStHalf' + kind + ')' }, cam);
        var g = el('g', null, wrap);
        K.image(g, 'aorta', IX, IY, IW, IH, { fadeR: '64%' });
        // 혈류 구슬: 관 안쪽 깊은 곳(소실점)에서 입구 쪽으로 다가온다
        var lc = P(tb.lum[0], tb.lum[1]), lrx = IW * tb.lum[2], lry = IH * tb.lum[3];
        var lcp = el('clipPath', { id: 'nmStLum' + kind }, defs);
        el('ellipse', { cx: lc[0], cy: lc[1], rx: lrx, ry: lry }, lcp);
        var bg = el('g', { 'clip-path': 'url(#nmStLum' + kind + ')' }, g);
        var beads = [];
        for (var i = 0; i < 16; i++) beads.push(el('circle', { r: 3, fill: K.sphere(svg, C.oxy), filter: dotSh }, bg));
        parts[kind] = { g: g, beads: beads, lc: lc, lrx: lrx, lry: lry, vp: P(tb.vp[0], tb.vp[1]), body: P(tb.body[0], tb.body[1]) };
      });
      // 반동 화살표(젊은 대동맥, 이완기) — 관 바깥에서 축 쪽으로
      var arrT = K.arrowHead(svg, C.teal, 'nmStArrT');
      var arrC = K.arrowHead(svg, C.clay, 'nmStArrC');
      var recoil = el('g', { opacity: 0 }, cam), expand = el('g', { opacity: 0 }, cam);
      // [바깥 점, 벽 점] — 반동은 바깥→벽(안쪽으로), 늘어남은 벽→바깥
      [[[0.51, 0.10], [0.465, 0.175]], [[0.0, 0.58], [0.05, 0.56]]].forEach(function (a) {
        var p0 = P(a[0][0], a[0][1]), p1 = P(a[1][0], a[1][1]);
        el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: C.teal, 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': 'url(#' + arrT + ')', filter: dotSh }, recoil);
        el('line', { x1: p1[0], y1: p1[1], x2: p0[0], y2: p0[1], stroke: C.clay, 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': 'url(#' + arrC + ')', filter: dotSh }, expand);
      });

      // 흐린 막(지금 설명하지 않는 쪽)
      var veilY = el('rect', { x: 0, y: 0, width: 302, height: 218, fill: '#eff3f4', opacity: 0 }, stage);
      var veilO = el('rect', { x: 302, y: 0, width: 298, height: 218, fill: '#eff3f4', opacity: 0 }, stage);

      // 이름표(흰 알약)
      function pill(x, y, txt, color, size, weight) {
        var g = el('g', null, svg);
        var w = txt.length * (size || 12) * 0.95 + 16;
        var r = el('rect', { x: x - w / 2, y: y - 11.5, width: w, height: 23, rx: 11.5, fill: 'rgba(255,255,255,.93)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: weight || 700 });
        return { g: g, r: r, t: tx, set: function (s, col) {
          if (tx.textContent !== s) { tx.textContent = s; var ww = s.length * (size || 12) * 0.95 + 16; r.setAttribute('x', x - ww / 2); r.setAttribute('width', ww); }
          if (col) tx.setAttribute('fill', col);
          g.setAttribute('opacity', s ? 1 : 0);
        } };
      }
      var tY = pill(66, 22, '젊은 대동맥', C.teal, 13.5, 800);
      var sY = pill(66, 48, '탄력 있는 고무풍선', C.muted, 12, 600);
      var tO = pill(540, 22, '노화 대동맥', C.clay, 13.5, 800);
      var sO = pill(540, 48, '굳어버린 고무호스', C.muted, 12, 600);
      var calc = pill(540, 74, '석회화·콜라겐↑', '#8a6420', 12, 700);
      var nY = pill(176, 202, '', C.teal, 12.5, 800);
      var nO = pill(424, 202, '', C.clay, 12.5, 800);

      // ── 아래: 압력 그래프 카드 둘 ──
      function graph(kind, ox) {
        var v = V[kind], col = kind === 'young' ? C.teal : C.clay;
        var g = el('g', null, svg);
        el('rect', { x: ox, y: 222, width: 286, height: 112, rx: 14, fill: '#fff', filter: cardSh }, g);
        var gx0 = ox + 40, gx1 = ox + 196, gy0 = 244, gy1 = 322, P0 = 50, P1 = 170;
        function py(p) { return gy1 - (p - P0) / (P1 - P0) * (gy1 - gy0); }
        [60, 100, 140].forEach(function (p) {
          el('line', { x1: gx0, y1: py(p), x2: gx1, y2: py(p), stroke: '#eef2f3', 'stroke-width': 1 }, g);
          K.label(g, gx0 - 6, py(p), String(p), { size: 12, anchor: 'end', fill: C.muted, weight: 500 });
        });
        var WIN = 2 * T;
        function gx(tt) { return gx0 + 4 + tt / WIN * (gx1 - gx0 - 8); }
        var pts = [];
        for (var tt = 0; tt <= WIN + 1e-9; tt += 0.01) pts.push(gx(tt).toFixed(1) + ',' + py(press(v, (tt % T) / T)).toFixed(1));
        el('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: '#dfe5e8', 'stroke-width': 2 }, g);
        el('line', { x1: gx0, y1: py(v.sbp), x2: gx1, y2: py(v.sbp), stroke: C.clay, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, g);
        el('line', { x1: gx0, y1: py(v.dbp), x2: gx1, y2: py(v.dbp), stroke: C.blue, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, g);
        var live = el('path', { fill: 'none', stroke: col, 'stroke-width': 2.8, 'stroke-linejoin': 'round' }, g);
        var cur = el('circle', { r: 4.5, fill: '#fff', stroke: col, 'stroke-width': 2.4, filter: glowS }, g);
        // 맥압 괄호
        var bx = gx1 + 8;
        el('path', { d: 'M' + (bx - 4) + ',' + py(v.sbp) + ' L' + bx + ',' + py(v.sbp) + ' L' + bx + ',' + py(v.dbp) + ' L' + (bx - 4) + ',' + py(v.dbp), fill: 'none', stroke: C.ink, 'stroke-width': 1.6 }, g);
        K.label(g, bx + 6, py(v.sbp), '수축기 ' + v.sbp, { size: 12, anchor: 'start', fill: C.clay, weight: 700 });
        K.label(g, bx + 6, py(v.dbp), '이완기 ' + v.dbp, { size: 12, anchor: 'start', fill: C.blue, weight: 700 });
        var mid = (py(v.sbp) + py(v.dbp)) / 2;
        K.label(g, bx + 6, mid, '맥압 ' + (v.sbp - v.dbp), { size: 14, anchor: 'start', fill: C.ink, weight: 800 });
        K.label(g, ox + 12, 234, 'mmHg', { size: 12, anchor: 'start', fill: C.muted, weight: 500 });
        return {
          g: g, render: function (t) {
            var tw = t % WIN, pp = [];
            for (var tt = 0; tt <= tw + 1e-9; tt += 0.01) pp.push(gx(tt).toFixed(1) + ',' + py(press(v, (tt % T) / T)).toFixed(1));
            live.setAttribute('d', pp.length ? 'M' + pp.join(' L') : '');
            cur.setAttribute('cx', gx(tw)); cur.setAttribute('cy', py(press(v, (t % T) / T)));
          }
        };
      }
      var gY = graph('young', 8), gO = graph('old', 306);

      // 단계별 카메라: 설명하는 토막 쪽으로 살짝
      var CAMK = [[0, 300, 105, 1], [0.6, 210, 108, 1.08], [5.6, 210, 108, 1.08], [6.4, 400, 108, 1.08], [11.6, 400, 108, 1.08], [12.4, 300, 105, 1], [15, 300, 105, 1]];
      function camAt(t) {
        for (var i = 1; i < CAMK.length; i++) if (t <= CAMK[i][0]) {
          var a = CAMK[i - 1], b = CAMK[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var X = K.lerp(a[1], b[1], e), Y = K.lerp(a[2], b[2], e);
          K.camera(cam, X, Y, K.lerp(a[3], b[3], e), X, Y);   // 그 자리를 중심으로 살짝 당김
          return;
        }
      }

      function tube(kind, t) {
        var v = V[kind], pt = parts[kind];
        var x = (t % T) / T, s = stretch(v, x);
        var k = kind === 'young' ? 0.075 : 0.012;
        var sc = 1 + k * s;
        var b = pt.body;
        pt.g.setAttribute('transform', 'translate(' + b[0].toFixed(1) + ',' + b[1].toFixed(1) + ') scale(' + sc.toFixed(4) + ') translate(' + (-b[0]).toFixed(1) + ',' + (-b[1]).toFixed(1) + ')');
        // 혈류 구슬
        var tot = CUM[kind][NS];
        var D = disp(kind, t) * (Math.max(1, Math.round(tot * 1.6)) / tot);
        pt.beads.forEach(function (bd, i) {
          var d = ((i / pt.beads.length + D) % 1 + 1) % 1;
          var ang = i * 2.399, rr = 0.25 + 0.65 * ((i * 37) % 16) / 16;
          var ex = pt.lc[0] + Math.cos(ang) * pt.lrx * rr, ey = pt.lc[1] + Math.sin(ang) * pt.lry * rr;
          var e = d * d;
          bd.setAttribute('cx', K.lerp(pt.vp[0], ex, e).toFixed(1));
          bd.setAttribute('cy', K.lerp(pt.vp[1], ey, e).toFixed(1));
          bd.setAttribute('r', (1.6 + 4.4 * e).toFixed(2));
          bd.setAttribute('opacity', Math.min(1, d * 4, (1 - d) * 6).toFixed(2));
        });
        return { x: x, s: s };
      }

      return function render(t) {
        t = ((t % DUR) + DUR) % DUR;
        var ry = tube('young', t), ro = tube('old', t);
        gY.render(t); gO.render(t);
        var diaY = ry.x >= SYS + 0.04, diaO = ro.x >= SYS + 0.04;
        expand.setAttribute('opacity', diaY ? 0 : Math.min(1, ry.s * 1.6).toFixed(2));
        recoil.setAttribute('opacity', diaY ? (Math.min(1, (ry.x - SYS) * 8) * (1 - Math.max(0, ry.x - 0.85) * 6)).toFixed(2) : 0);
        nY.set(diaY ? '벽이 되돌아오며 피를 밀어 줌' : '벽이 늘어나며 피를 저장', C.teal);
        nO.set(diaO ? '반동 없음 → 압력 뚝' : '늘어나지 못함 → 압력 확', C.clay);
        camAt(t);
        // 지금 설명하는 쪽만 진하게
        var fy = t < 6 ? 1 : t < 11.6 ? 1 - 0.6 * K.seg(t, 6.0, 6.4) : 0.4 + 0.6 * K.seg(t, 11.6, 12);
        var fo = 0.4 + 0.6 * K.seg(t, 5.6, 6.0);
        veilY.setAttribute('opacity', ((1 - fy) / 0.6 * 0.55).toFixed(2));
        veilO.setAttribute('opacity', ((1 - fo) / 0.6 * 0.55).toFixed(2));
        gY.g.setAttribute('opacity', (0.45 + 0.55 * (fy - 0.4) / 0.6).toFixed(2));
        gO.g.setAttribute('opacity', (0.45 + 0.55 * (fo - 0.4) / 0.6).toFixed(2));
        [tY, sY, nY].forEach(function (p) { p.g.setAttribute('opacity', (0.5 + 0.5 * (fy - 0.4) / 0.6).toFixed(2)); });
        [tO, sO, nO, calc].forEach(function (p) { p.g.setAttribute('opacity', (0.5 + 0.5 * (fo - 0.4) / 0.6).toFixed(2)); });
      };
    }
  });
})();
