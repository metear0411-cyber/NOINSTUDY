// 정상 vs 천식 vs 폐기종(COPD) — 들숨·날숨 때 세기관지와 폐포가 어떻게 달라지나.
// 왼쪽: 세기관지 단면(평활근·점막·점액·폐포 부착), 가운데: 기도~폐포 세로 그림, 오른쪽: 가슴 모양 + 폐활량 곡선.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;
  var DUR = 14, CYC = 3.5, INS = 1.3;

  function phase(t) { return (t % CYC); }
  function isInsp(t) { return phase(t) < INS; }
  // 폐 부피(0~1)
  function vol(t, type) {
    var u = phase(t);
    var floor = 0;
    if (type === 'emphysema') floor = t >= 10.5 ? 0.35 - 0.2 * Math.min(1, (t - 10.5) / 1.5) : 0.35;
    if (u < INS) {
      // 들숨은 직전 날숨이 끝난 높이(floor)에서 시작
      return floor + (1 - floor) * K0.easeInOut(u / INS);
    }
    var q = (u - INS) / (CYC - INS);
    var shape = type === 'emphysema' ? 1 - Math.pow(1 - q, 0.55) : K0.easeInOut(q);
    return 1 - (1 - floor) * shape;
  }
  var K0 = M.kit;

  var SPIRO = {
    normal: { fvc: 3.4, ratio: 0.80 },
    asthma: { fvc: 3.2, ratio: 0.60 },
    asthmaBD: { fvc: 3.3, ratio: 0.78 },
    emphysema: { fvc: 2.9, ratio: 0.50 }
  };

  var STEPS = {
    normal: [
      { at: 0, label: '들숨', text: '횡격막이 내려가며 흉강 압력이 낮아져 공기가 들어온다. 세기관지 둘레의 폐포 벽이 **기도를 사방에서 잡아당겨(방사 견인)** 기도가 열려 있다.' },
      { at: 3.5, label: '날숨', text: '조용한 날숨은 **수동적**이다. 늘어났던 폐의 **탄성 반동**으로 공기가 빠져나가고, 기도는 끝까지 열려 있다.' },
      { at: 7, label: '폐활량 검사', text: '힘껏 내쉬면 **1초 안에 FVC의 대부분(약 75~80%)**을 내뿜는다. **FEV1/FVC 0.7 이상**이 정상 범위다.' },
      { at: 10.5, label: '노화 변화', text: '나이가 들면 폐 탄성 반동↓, 흉벽이 굳고 호흡근이 약해져 **잔기량↑·폐활량↓**, 총폐용량은 거의 그대로다. 기침 반사도 약해져 흡인 위험이 커진다.' }
    ],
    asthma: [
      { at: 0, label: '좁아진 기도', text: '알레르겐·찬 공기·운동·감염 같은 자극에 기도가 과민하게 반응한다. **기관지 평활근 수축 + 점막 부종 + 끈적한 점액**, 세 가지가 겹쳐 기도가 좁아진다.' },
      { at: 3.5, label: '호기성 천명음', text: '날숨 때 기도가 더 좁아져 공기가 잘 빠지지 않는다. 좁은 관을 빠져나가는 **호기성 천명음(wheezing)**이 들리고 **날숨이 길어진다**.' },
      { at: 7, label: '폐기능', text: '발작 중 **FEV1과 FEV1/FVC가 떨어진다**. 기관지확장제 흡입 뒤 FEV1이 **12% 이상(그리고 200mL 이상)** 좋아지면 **가역성** 양성으로 천식을 시사한다.' },
      { at: 10.5, label: '기관지확장제', text: '**속효성 β2 작용제(살부타몰)**를 흡입하면 평활근이 풀려 기도가 다시 열린다(**가역적**). 부종·점액 같은 염증은 **흡입 스테로이드**로 조절하고, 흡입 뒤에는 **입을 헹군다**(구강 칸디다 예방).' }
    ],
    emphysema: [
      { at: 0, label: '파괴된 폐포', text: '흡연 등으로 **폐포벽이 파괴**되어 작은 방들이 큰 주머니로 합쳐진다. 가스교환 면적이 줄고 폐의 **탄성(반동력)이 사라진다**.' },
      { at: 3.5, label: '날숨 때 기도 닫힘', text: '기도를 잡아당겨 주던 폐포벽이 없어, 날숨 때 흉강 압력에 **작은 기도가 눌려 일찍 닫힌다**. 공기가 다 빠지지 못하고 갇힌다(**공기 갇힘, air trapping**).' },
      { at: 7, label: '과팽창·술통형 가슴', text: '갇힌 공기로 폐가 늘 부풀어 **잔기량↑**, 가슴 앞뒤 지름이 커져 **술통형 가슴**이 된다. 기관지확장제 뒤에도 **FEV1/FVC <0.7**이면 COPD(지속적 기류 제한)다.' },
      { at: 10.5, label: '입술 오므리기 호흡', text: '**코로 들이마시고 입술을 오므려 천천히** 내쉰다(들숨:날숨 1:2 이상). 입술의 저항이 **기도 안 압력을 유지**해 작은 기도가 닫히지 않게 받쳐 주고, 갇힌 공기가 더 빠져나간다.' }
    ]
  };

  M.register({
    id: 'airway-obstruction',
    title: '천식 vs 폐기종 — 기도는 왜, 언제 좁아지나',
    system: '호흡기',
    topics: ['asthma', 'copd', 'respiratory-patho', 'respiratory-drugs'],
    duration: DUR,
    options: [{
      key: 'type', label: '보기',
      choices: [{ value: 'normal', label: '정상' }, { value: 'asthma', label: '천식' }, { value: 'emphysema', label: '폐기종(COPD)' }],
      value: 'asthma'
    }],
    steps: STEPS.asthma,
    stepsFor: function (o) { return STEPS[o.type] || STEPS.asthma; },
    source: 'COPD 진단: 기관지확장제 후 FEV1/FVC <0.7. 천식 가역성: FEV1 12% 이상·200mL 이상 개선. 폐활량 곡선 수치는 설명용 예시다.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var AIRC = '#3fa7c9', STALE = '#9aa3ab', MUCUS = '#d9c95e';
      var glowF = K.glow(svg, 1.4);
      var airF = K.sphere(svg, AIRC), staleF = K.sphere(svg, STALE), mucF = K.sphere(svg, MUCUS);
      var pillSh = K.shadow(svg, 1.5, 2, 0.25), cardSh = K.shadow(svg, 3, 4, 0.18), deepSh = K.shadow(svg, 5, 6, 0.28);
      function textW(s, size) {
        var w = 0;
        for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); w += c >= 0x1100 ? 1.0 : c === 32 ? 0.3 : (c >= 0x2080 && c <= 0x209f) ? 0.45 : 0.6; }
        return w * size;
      }
      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var r0 = el('rect', { height: 22, rx: 11, fill: 'rgba(255,255,255,.93)', filter: pillSh }, g);
        var t0 = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        var o = { g: g, t: t0, size: size || 12 };
        o.set = function (s) { t0.textContent = s; o.w = textW(s, o.size) + 16; r0.setAttribute('width', o.w); r0.setAttribute('x', -o.w / 2); r0.setAttribute('y', -11); g.setAttribute('display', s ? 'inline' : 'none'); };
        o.at = function (x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); };
        o.set(txt);
        return o;
      }
      function card(x, y, w, h) { return el('rect', { x: x, y: y, width: w, height: h, rx: 12, fill: '#ffffff', filter: cardSh }, svg); }
      function grad(id, stops, fx, fy) {
        var g = el('radialGradient', { id: id, cx: '50%', cy: '50%', r: '50%', fx: fx || '50%', fy: fy || '50%' }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, g); });
        return 'url(#' + id + ')';
      }

      // ── 왼쪽: 3D 폐 그림 + 기관지 속 공기 ──
      var LW = 300, LH = 212, SCX = 150, SCY = 104;
      var clipL = el('clipPath', { id: 'nmAwLung' }, defs);
      el('rect', { x: 0, y: 0, width: LW, height: LH }, clipL);
      var lungBox = el('g', { 'clip-path': 'url(#nmAwLung)' }, svg);
      var world = el('g', null, lungBox);
      var IX = -6, IY = -2, IW = 312, IH = 208;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      K.image(world, 'lungs', IX, IY, IW, IH, { fadeR: '62%' });
      var TREE = [
        [[0.497, 0.04], [0.497, 0.32], [0.47, 0.35], [0.43, 0.40], [0.39, 0.46], [0.35, 0.53], [0.32, 0.60], [0.29, 0.68]],
        [[0.497, 0.04], [0.497, 0.32], [0.53, 0.35], [0.57, 0.40], [0.61, 0.46], [0.64, 0.53], [0.67, 0.60], [0.70, 0.68]]
      ].map(function (pl) { return pl.map(function (q) { return P(q[0], q[1]); }); });
      function polyAt(pts, f) {
        var L = 0, segs = [];
        for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); L += l; }
        var d = K.clamp(f, 0, 1) * L;
        for (var j = 0; j < segs.length; j++) { if (d <= segs[j]) { var q = d / segs[j]; return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * q, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * q]; } d -= segs[j]; }
        return pts[pts.length - 1];
      }
      var flow = [];
      TREE.forEach(function (pl) { for (var k = 0; k < 9; k++) flow.push({ pl: pl, k: k, e: el('circle', { r: 3.2, fill: airF, filter: glowF }, world) }); });
      var plusG = el('g', { opacity: 0 }, world);
      [0.12, 0.19, 0.26].forEach(function (ny) { var q = P(0.497, ny); K.label(plusG, q[0] + 12, q[1], '+', { size: 15, weight: 800, fill: C.teal }); });
      var lips = el('g', { opacity: 0 }, world);
      var lq = P(0.497, 0.035);
      el('path', { d: 'M' + (lq[0] - 15) + ',' + lq[1] + ' Q' + lq[0] + ',' + (lq[1] - 7) + ' ' + (lq[0] + 15) + ',' + lq[1] + ' Q' + lq[0] + ',' + (lq[1] + 7) + ' ' + (lq[0] - 15) + ',' + lq[1] + ' Z', fill: K.sphere(svg, '#e08a80'), stroke: '#a8524a', 'stroke-width': 1 }, lips);
      el('ellipse', { cx: lq[0], cy: lq[1], rx: 2.6, ry: 1.3, fill: '#5a2420' }, lips);
      var spot = P(0.33, 0.58);
      var marker = el('circle', { cx: spot[0], cy: spot[1], r: 7, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.2, filter: glowF }, world);

      // 카메라(폐 그림만)
      var CAM = [[0, 0.5, 0.5, 1], [3.5, 0.5, 0.5, 1], [4.1, 0.37, 0.56, 1.45], [7, 0.37, 0.56, 1.45], [7.6, 0.5, 0.5, 1], [10.5, 0.5, 0.5, 1], [11.1, 0.5, 0.3, 1.3], [14, 0.5, 0.3, 1.3]];
      var camX, camY, camZ;
      function cam(t) {
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          var c = P(K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e));
          camX = c[0]; camY = c[1]; camZ = K.lerp(a[3], b[3], e);
          K.camera(world, camX, camY, camZ, SCX, SCY);
          return;
        }
      }
      function scr(pt) { return [SCX + (pt[0] - camX) * camZ, SCY + (pt[1] - camY) * camZ]; }

      // 고정 이름표(폐 그림 위)
      var phaseP = pill(svg, '들숨 ↓', C.teal, 14);
      phaseP.at(44, 18);
      var tTra = pill(svg, '기관', '#4a5862', 12);
      var tWh = pill(svg, '천명음', C.clay, 12);
      var wheeze = el('g', { opacity: 0 }, svg);
      var wz = [];
      [0, 1, 2].forEach(function (k) { wz.push(el('path', { fill: 'none', stroke: C.clay, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, wheeze)); });
      var tLip = pill(svg, '입술 오므리기', C.teal, 12);
      var tPress = pill(svg, '기도 안 압력 유지', C.teal, 12);
      var tBD = pill(svg, 'β2 작용제 흡입', C.teal, 12);

      // 폐 그림 오른쪽·아래 가장자리를 무대색으로 녹인다
      var fadeR = el('linearGradient', { id: 'nmAwFadeR', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#eff3f4', 'stop-opacity': 0 }, fadeR);
      el('stop', { offset: '100%', 'stop-color': '#eff3f4', 'stop-opacity': 1 }, fadeR);
      var fadeB = el('linearGradient', { id: 'nmAwFadeB', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#eff3f4', 'stop-opacity': 0 }, fadeB);
      el('stop', { offset: '100%', 'stop-color': '#eff3f4', 'stop-opacity': 1 }, fadeB);
      el('rect', { x: LW - 34, y: 0, width: 34, height: LH, fill: 'url(#nmAwFadeR)' }, svg);
      el('rect', { x: 0, y: LH - 26, width: LW, height: 26, fill: 'url(#nmAwFadeB)' }, svg);
      [wheeze, phaseP.g, tTra.g, tWh.g, tLip.g, tPress.g, tBD.g].forEach(function (n) { svg.appendChild(n); });

      // 단면으로 잇는 선
      var callout = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-dasharray': '4 4', opacity: 0.9 }, svg);

      // ── 가운데: 세기관지 단면(입체) ──
      var CX = 372, CY = 96;
      var gMus = grad('nmAwMus', [['0%', '#e7a08a'], ['70%', '#c46a55'], ['100%', '#8f3f31']], '40%', '35%');
      var gMuc = grad('nmAwMuc', [['0%', '#fde3df'], ['80%', '#f2bdb5'], ['100%', '#d99a92']], '42%', '38%');
      var gMucEd = grad('nmAwMucE', [['0%', '#fbd9d3'], ['70%', '#efaaa0'], ['100%', '#cf857b']], '42%', '38%');
      var gLum = grad('nmAwLum', [['0%', '#3a2228'], ['55%', '#6d3b42'], ['100%', '#b77d7d']], '50%', '58%');
      var gAlvE = grad('nmAwAlvE', [['0%', '#fff6f5'], ['75%', '#f7dcd9'], ['100%', '#e9bdb8']], '40%', '35%');
      var alvF = K.sphere(svg, '#f2c4bf');
      var sec = el('g', { filter: deepSh }, svg);
      var tethG = el('g', null, sec), teth = [], alvS = [];
      for (var i = 0; i < 12; i++) {
        teth.push(el('line', { stroke: '#d7a6a2', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, tethG));
        alvS.push(el('circle', { r: 11, fill: alvF }, tethG));
      }
      var bigAlv = [];
      for (var b2 = 0; b2 < 4; b2++) bigAlv.push(el('path', { fill: gAlvE, stroke: '#d39b95', 'stroke-width': 1.3, 'stroke-dasharray': '7 5' }, sec));
      var muscle = el('circle', { cx: CX, cy: CY, fill: gMus }, sec);
      var bands = el('g', null, sec), bandL = [];
      for (var bb = 0; bb < 16; bb++) bandL.push(el('line', { stroke: '#9b4637', 'stroke-width': 1.2, opacity: 0.5 }, bands));
      var mucosa = el('circle', { cx: CX, cy: CY, fill: gMuc }, sec);
      var lumen = el('path', { fill: gLum, stroke: '#c58b86', 'stroke-width': 1 }, sec);
      var hiLite = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.45 }, sec);
      var mucus = [[-0.5, -0.4, 8, 5.5], [0.48, 0.32, 7, 5], [0.05, 0.6, 6.5, 4.5]].map(function (m) { return { m: m, e: el('ellipse', { fill: mucF }, sec) }; });
      var secAir = [];
      for (var s = 0; s < 6; s++) secAir.push(el('circle', { r: 3, fill: airF, filter: glowF }, sec));
      var secT = pill(svg, '세기관지 단면', C.ink, 12.5);
      secT.at(CX, 12);
      var noteP = pill(svg, '', C.clay, 12.5);
      noteP.at(CX, 192);

      // ── 가운데 아래: 폐포 카드 ──
      card(300, 206, 154, 128);
      var alvT = pill(svg, '폐포', C.ink, 12);
      alvT.at(334, 220);
      var AX = 377, AY = 276;
      var HEX = [[0, 0], [-22, -13], [0, -26], [22, -13], [22, 13], [0, 26], [-22, 13]];
      var nAlv = HEX.map(function (h) { return el('circle', { cx: AX + h[0], cy: AY + h[1], r: 13, fill: alvF }, svg); });
      var eAlvG = el('g', null, svg);
      var eAlv = [el('circle', { cx: AX - 20, cy: AY, fill: gAlvE, stroke: '#d39b95', 'stroke-width': 1.3 }, eAlvG), el('circle', { cx: AX + 22, cy: AY + 2, fill: gAlvE, stroke: '#d39b95', 'stroke-width': 1.3 }, eAlvG)];
      [[-6, -14], [4, 12], [-30, 18]].forEach(function (p) { el('path', { d: 'M' + (AX + p[0]) + ',' + (AY + p[1]) + ' l5,-4 m3,6 l5,-5', stroke: '#c98a84', 'stroke-width': 1.4, fill: 'none' }, eAlvG); });
      var rnd = (function () { var sd = 11; return function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; })();
      var alvDots = [];
      for (var d = 0; d < 16; d++) {
        var h = HEX[d % HEX.length], ang = rnd() * Math.PI * 2, rr = rnd() * 6;
        alvDots.push({ nx: AX + h[0] + rr * Math.cos(ang), ny: AY + h[1] + rr * Math.sin(ang), ex: AX + (d % 2 ? 22 : -20) + (rnd() - 0.5) * 30, ey: AY + (rnd() - 0.5) * 34, e: el('circle', { r: 3, filter: glowF }, svg) });
      }
      var alvNote = pill(svg, '', '#6b7680', 12);
      alvNote.at(AX, 322);

      // ── 왼쪽 아래: 범례 + 핵심 ──
      card(8, 222, 284, 112);
      function legRow(x, y, fillv, txt) {
        el('circle', { cx: x + 6, cy: y, r: 6, fill: fillv }, svg);
        return K.label(svg, x + 16, y, txt, { size: 12, anchor: 'start', fill: C.ink, weight: 600 });
      }
      legRow(18, 240, K.sphere(svg, '#c46a55'), '평활근');
      var legMuc = legRow(88, 240, K.sphere(svg, '#f2bdb5'), '점막');
      var legMus = legRow(18, 262, mucF, '점액');
      legRow(88, 262, alvF, '폐포(기도를 당겨 줌)');
      legRow(222, 240, airF, '공기');
      el('line', { x1: 18, y1: 278, x2: 282, y2: 278, stroke: C.line }, svg);
      var key1 = K.label(svg, 18, 298, '', { size: 13, weight: 800, anchor: 'start', fill: C.navy });
      var key2 = K.label(svg, 18, 318, '', { size: 12.5, weight: 700, anchor: 'start', fill: C.teal });
      var KEY = {
        normal: ['방사 견인으로 기도가 열려 있음', '탄성 반동으로 날숨 · FEV1/FVC ≥0.7'],
        asthma: ['평활근 수축 + 점막 부종 + 점액', '호기성 천명음 · 가역적(기관지확장제)'],
        emphysema: ['폐포벽 파괴·탄성↓ → 날숨 때 기도 닫힘', '공기 갇힘 · FEV1/FVC <0.7']
      };

      // ── 오른쪽: 가슴 단면 카드 / 폐활량 카드 ──
      var chX = 527;
      card(462, 8, 130, 108);
      K.label(svg, chX, 24, '가슴 단면(위에서)', { size: 12, weight: 700, fill: C.muted });
      var chest = el('ellipse', { cx: chX, cy: 64, rx: 54, ry: 26, fill: K.sphere(svg, '#ead9c6'), stroke: '#b9a58f', 'stroke-width': 1.5 }, svg);
      el('circle', { cx: chX, cy: 84, r: 5, fill: K.sphere(svg, '#cdbca4') }, svg);
      var chestT = K.label(svg, chX, 106, '', { size: 12, weight: 700, fill: C.ink });
      card(462, 124, 130, 210);
      K.label(svg, chX, 140, '힘껏 내쉬기', { size: 12, weight: 700, fill: C.muted });
      var gx0 = 482, gx1 = 584, gy0 = 156, gy1 = 258;
      function sx(tt) { return gx0 + tt / 6 * (gx1 - gx0); }
      function sy(v) { return gy1 - v / 4 * (gy1 - gy0); }
      el('rect', { x: gx0, y: gy0, width: gx1 - gx0, height: gy1 - gy0, fill: '#f7f9f8', stroke: C.line }, svg);
      [2, 3, 4, 5].forEach(function (k) { el('line', { x1: sx(k), y1: gy0, x2: sx(k), y2: gy1, stroke: '#e8edef' }, svg); });
      K.label(svg, sx(1), gy1 + 11, '1초', { size: 12, fill: C.muted, weight: 600 });
      K.label(svg, gx1, gy1 + 11, '6초', { size: 12, fill: C.muted, weight: 500, anchor: 'end' });
      K.label(svg, gx0 - 4, gy0 + 6, 'L', { size: 12, fill: C.muted, anchor: 'end', weight: 600 });
      el('line', { x1: sx(1), y1: gy0, x2: sx(1), y2: gy1, stroke: C.gold, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, svg);
      var refCurve = el('path', { fill: 'none', stroke: '#c9d2d7', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
      var curve = el('path', { fill: 'none', stroke: C.teal, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, svg);
      var fev1Dot = el('circle', { r: 4.5, fill: K.sphere(svg, C.gold), filter: glowF }, svg);
      var fev1T = K.label(svg, 0, 0, 'FEV1', { size: 12, weight: 800, fill: '#8a6420', anchor: 'start' });
      var fvcT = K.label(svg, gx1 - 3, 0, 'FVC', { size: 12, weight: 800, fill: C.teal, anchor: 'end' });
      var ratioT = K.label(svg, chX, 292, '', { size: 13.5, weight: 800, fill: C.ink });
      var refT = K.label(svg, chX, 314, '', { size: 12, weight: 600, fill: C.muted });
      function curveD(sp, upto) {
        var tau = -1 / Math.log(1 - sp.ratio), pts = [];
        for (var tt = 0; tt <= upto + 1e-9; tt += 0.05) pts.push(sx(tt).toFixed(1) + ',' + sy(sp.fvc * (1 - Math.exp(-tt / tau))).toFixed(1));
        return pts.length ? 'M' + pts.join(' L') : '';
      }
      refCurve.setAttribute('d', curveD(SPIRO.normal, 6));

      return function render(t, o) {
        t = ((t % DUR) + DUR) % DUR;
        var type = o.type || 'asthma';
        var v = vol(t, type), insp = isInsp(t);
        var u = phase(t), expQ = insp ? 0 : (u - INS) / (CYC - INS);
        var bd = type === 'asthma' ? K.easeInOut(K.seg(t, 10.5, 11.5)) : 0;
        var pl = type === 'emphysema' ? K.easeInOut(K.seg(t, 10.5, 11.3)) : 0;
        var collapse = type === 'emphysema' && !insp ? Math.min(1, expQ * 2.2) * (1 - 0.75 * pl) : 0;
        var em = type === 'emphysema';
        cam(t);

        // 폐 속 공기
        flow.forEach(function (p) {
          var fr = ((p.k / 9 + v * 0.9) % 1 + 1) % 1;
          var q = polyAt(p.pl, fr);
          p.e.setAttribute('cx', q[0].toFixed(1)); p.e.setAttribute('cy', q[1].toFixed(1));
          p.e.setAttribute('opacity', Math.min(1, fr * 8, (1 - fr) * 8).toFixed(2));
        });
        plusG.setAttribute('opacity', pl * (insp ? 0.35 : 1));
        lips.setAttribute('opacity', pl);
        marker.setAttribute('r', (6 + 2 * Math.sin(t * 4)).toFixed(1));
        phaseP.set(insp ? '들숨 ↓' : '날숨 ↑');
        phaseP.t.setAttribute('fill', insp ? C.teal : C.clay);
        var tq = scr(P(0.56, 0.17));
        tTra.at(K.clamp(tq[0] + 18, 30, LW - 30), K.clamp(tq[1], 40, LH - 14));
        // 천명음
        var wOn = type === 'asthma' && !insp ? (1 - bd) : 0;
        var wb = scr(P(0.43, 0.10));
        wz.forEach(function (pz, k) { var x = wb[0] - 26 - k * 9, y = wb[1] - 6 + k * 7; pz.setAttribute('d', 'M' + x.toFixed(1) + ',' + y.toFixed(1) + ' q-4,-5 -8,0 t-8,0'); });
        wheeze.setAttribute('opacity', wOn * (0.55 + 0.45 * Math.abs(Math.sin(t * 9))));
        tWh.at(K.clamp(wb[0] - 60, 36, LW - 36), K.clamp(wb[1] + 26, 40, LH - 14));
        tWh.g.setAttribute('opacity', wOn);
        var lp = scr(P(0.497, 0.035));
        tLip.at(K.clamp(lp[0] + 76, 60, LW - 54), K.clamp(lp[1] + 4, 14, LH - 14)); tLip.g.setAttribute('opacity', pl);
        var pp = scr(P(0.497, 0.20));
        tPress.at(K.clamp(pp[0] + 80, 64, LW - 64), K.clamp(pp[1] + 14, 40, LH - 14)); tPress.g.setAttribute('opacity', pl * (insp ? 0.4 : 1));
        tBD.at(K.clamp(lp[0] + 74, 60, LW - 54), K.clamp(lp[1] + 14, 30, LH - 14)); tBD.g.setAttribute('opacity', bd);
        // 단면으로 잇는 선
        var ms = scr(spot);
        callout.setAttribute('d', 'M' + ms[0].toFixed(1) + ',' + ms[1].toFixed(1) + ' C' + (ms[0] + 60).toFixed(1) + ',' + (ms[1] - 10).toFixed(1) + ' ' + (CX - 120) + ',' + (CY + 10) + ' ' + (CX - 82) + ',' + CY);

        // ── 단면 ──
        var Rm, muc;
        if (type === 'asthma') { Rm = K.lerp(34 + 4 * v, 46 + 4 * v, bd); muc = K.lerp(12, 9, bd); }
        else if (em) { Rm = 46 + 3 * v; muc = 4; }
        else { Rm = 46 + 4 * v; muc = 6; }
        var mw = type === 'asthma' ? K.lerp(12, 8, bd) : em ? 5 : 8;
        muscle.setAttribute('r', (Rm + mw / 2).toFixed(1));
        mucosa.setAttribute('r', (Rm - mw / 2).toFixed(1));
        mucosa.setAttribute('fill', type === 'asthma' ? gMucEd : gMuc);
        bandL.forEach(function (ln, k) {
          var a = k / 16 * Math.PI * 2;
          ln.setAttribute('x1', (CX + (Rm - mw / 2) * Math.cos(a)).toFixed(1)); ln.setAttribute('y1', (CY + (Rm - mw / 2) * Math.sin(a)).toFixed(1));
          ln.setAttribute('x2', (CX + (Rm + mw / 2) * Math.cos(a + 0.12)).toFixed(1)); ln.setAttribute('y2', (CY + (Rm + mw / 2) * Math.sin(a + 0.12)).toFixed(1));
        });
        var lr = Rm - mw / 2 - muc;
        var fold = type === 'asthma' ? (1 - bd) * 0.13 : 0;
        var sqY = 1 - 0.82 * collapse;
        var pts = [];
        for (var k = 0; k <= 48; k++) {
          var a = k / 48 * Math.PI * 2, rr = lr * (1 + fold * Math.sin(8 * a));
          pts.push((CX + rr * Math.cos(a)).toFixed(1) + ',' + (CY + rr * Math.sin(a) * sqY).toFixed(1));
        }
        lumen.setAttribute('d', 'M' + pts.join(' L') + ' Z');
        var Rh = Rm + mw / 2 - 2;
        hiLite.setAttribute('d', 'M' + (CX + Rh * Math.cos(3.6)).toFixed(1) + ',' + (CY + Rh * Math.sin(3.6)).toFixed(1) + ' A' + Rh + ',' + Rh + ' 0 0 1 ' + (CX + Rh * Math.cos(4.7)).toFixed(1) + ',' + (CY + Rh * Math.sin(4.7)).toFixed(1));
        mucus.forEach(function (m) {
          m.e.setAttribute('cx', (CX + m.m[0] * lr).toFixed(1)); m.e.setAttribute('cy', (CY + m.m[1] * lr * sqY).toFixed(1));
          m.e.setAttribute('rx', m.m[2]); m.e.setAttribute('ry', m.m[3]);
          m.e.setAttribute('opacity', type === 'asthma' ? 1 - 0.4 * bd : 0);
        });
        secAir.forEach(function (p, i) {
          var a = i / 6 * Math.PI * 2 + t * 0.7;
          p.setAttribute('cx', (CX + Math.cos(a) * lr * 0.5).toFixed(1));
          p.setAttribute('cy', (CY + Math.sin(a) * lr * 0.5 * sqY).toFixed(1));
          p.setAttribute('opacity', lr * sqY > 7 ? 0.95 : 0);
        });
        for (var i = 0; i < 12; i++) {
          var a2 = i / 12 * Math.PI * 2, R0 = Rm + mw / 2, R1 = Rm + mw / 2 + 24;
          var broken = em && i % 3 !== 0;
          teth[i].setAttribute('x1', (CX + R0 * Math.cos(a2)).toFixed(1)); teth[i].setAttribute('y1', (CY + R0 * Math.sin(a2)).toFixed(1));
          teth[i].setAttribute('x2', (CX + (broken ? R0 + 8 : R1 - 9) * Math.cos(a2)).toFixed(1)); teth[i].setAttribute('y2', (CY + (broken ? R0 + 8 : R1 - 9) * Math.sin(a2)).toFixed(1));
          alvS[i].setAttribute('cx', (CX + R1 * Math.cos(a2)).toFixed(1)); alvS[i].setAttribute('cy', (CY + R1 * Math.sin(a2)).toFixed(1));
          alvS[i].setAttribute('r', (9.5 + 2 * v).toFixed(1));
          alvS[i].setAttribute('opacity', em ? 0 : 1);
        }
        bigAlv.forEach(function (p, k) {
          var a0 = k / 4 * Math.PI * 2 + 0.3, a1 = a0 + 1.2, Ri = Rm + mw / 2 + 4, Ro = Rm + mw / 2 + 30;
          var dd = 'M' + (CX + Ri * Math.cos(a0)).toFixed(1) + ',' + (CY + Ri * Math.sin(a0)).toFixed(1) +
            ' L' + (CX + Ro * Math.cos(a0)).toFixed(1) + ',' + (CY + Ro * Math.sin(a0)).toFixed(1) +
            ' A' + Ro + ',' + Ro + ' 0 0 1 ' + (CX + Ro * Math.cos(a1)).toFixed(1) + ',' + (CY + Ro * Math.sin(a1)).toFixed(1) +
            ' L' + (CX + Ri * Math.cos(a1)).toFixed(1) + ',' + (CY + Ri * Math.sin(a1)).toFixed(1) + ' Z';
          p.setAttribute('d', dd); p.setAttribute('opacity', em ? 1 : 0);
        });
        legMuc.textContent = type === 'asthma' ? '점막(부종)' : '점막';
        legMus.setAttribute('opacity', type === 'asthma' ? 1 : 0.35);

        // 단면 아래 설명
        var nt = '', ncol = C.clay;
        if (type === 'asthma') { nt = bd > 0.5 ? '평활근 풀림 → 다시 열림' : '평활근 수축·부종·점액'; ncol = bd > 0.5 ? C.teal : C.clay; }
        else if (em) {
          if (pl >= 0.5) { nt = '입술 저항 → 기도 열린 채 유지'; ncol = C.teal; }
          else nt = collapse > 0.5 ? '날숨 때 눌려 닫힘(공기 갇힘)' : '폐포벽 파괴 → 당겨 주지 못함';
        } else { nt = '폐포가 기도를 당겨 열어 둠'; ncol = C.teal; }
        noteP.set(nt); noteP.t.setAttribute('fill', ncol);
        noteP.at(Math.min(CX, 454 - noteP.w / 2), 192);

        // 폐포 카드
        nAlv.forEach(function (c) { c.setAttribute('r', (11 + 3.5 * v).toFixed(1)); c.setAttribute('opacity', em ? 0 : 1); });
        eAlvG.setAttribute('opacity', em ? 1 : 0);
        eAlv[0].setAttribute('r', (24 + 6 * v).toFixed(1)); eAlv[1].setAttribute('r', (22 + 6 * v).toFixed(1));
        var shown = Math.round(v * alvDots.length), staleN = em ? Math.round(0.35 * alvDots.length) : 0;
        alvDots.forEach(function (p, k) {
          p.e.setAttribute('cx', (em ? p.ex : p.nx).toFixed(1)); p.e.setAttribute('cy', (em ? p.ey : p.ny).toFixed(1));
          p.e.setAttribute('opacity', k < shown ? 1 : 0);
          p.e.setAttribute('fill', k < staleN ? staleF : airF);
        });
        alvNote.set(em ? (pl > 0.5 ? '갇힌 공기가 더 빠져나감' : '갇힌 공기(회색)') : '');
        alvT.set(em ? '폐포(합쳐진 큰 주머니)' : '폐포');
        alvT.at(300 + alvT.w / 2 + 8, 220);

        // 핵심
        key1.textContent = KEY[type][0]; key2.textContent = KEY[type][1];

        // 가슴 모양
        var barrel = em ? (t < 7 ? 0.35 : 0.35 + 0.65 * K.easeInOut(K.seg(t, 7.0, 8.0))) : 0;
        chest.setAttribute('ry', (22 + 10 * barrel + 2 * v).toFixed(1));
        chest.setAttribute('rx', (54 - 18 * barrel).toFixed(1));
        chestT.textContent = barrel > 0.6 ? '앞뒤:좌우 ≈ 1:1 술통형' : '앞뒤:좌우 ≈ 1:2';
        chestT.setAttribute('fill', barrel > 0.6 ? C.clay : C.ink);

        // 폐활량 곡선
        var sp = type === 'asthma' ? (bd > 0.5 ? SPIRO.asthmaBD : SPIRO.asthma) : SPIRO[type];
        var draw = t >= 7 && t < 10.5 ? K.seg(t, 7.2, 9.6) * 6 : 6;
        curve.setAttribute('d', curveD(sp, draw));
        var good = type === 'normal' || bd > 0.5;
        curve.setAttribute('stroke', good ? C.teal : C.clay);
        var tau = -1 / Math.log(1 - sp.ratio), f1 = sp.fvc * (1 - Math.exp(-1 / tau));
        var show1 = draw >= 1;
        fev1Dot.setAttribute('cx', sx(1)); fev1Dot.setAttribute('cy', sy(f1)); fev1Dot.setAttribute('opacity', show1 ? 1 : 0);
        fev1T.setAttribute('x', sx(1) + 7); fev1T.setAttribute('y', sy(f1) + 12); fev1T.setAttribute('opacity', show1 ? 1 : 0);
        fvcT.setAttribute('y', sy(sp.fvc * (1 - Math.exp(-6 / tau))) - 9); fvcT.setAttribute('opacity', draw >= 5.9 ? 1 : 0);
        fvcT.setAttribute('fill', good ? C.teal : C.clay);
        ratioT.textContent = 'FEV1/FVC ≈ ' + sp.ratio.toFixed(2);
        ratioT.setAttribute('fill', sp.ratio < 0.7 ? C.clay : C.teal);
        refT.textContent = type === 'normal' ? '정상: 0.7 이상' : type === 'asthma' ? (bd > 0.5 ? '흡입 후 회복(가역적)' : '점선 = 정상 곡선') : '0.7 미만 = COPD';
        refCurve.setAttribute('opacity', type === 'normal' ? 0 : 1);
      };
    }
  });
})();
