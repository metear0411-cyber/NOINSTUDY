// 폐포–모세혈관 가스 교환 — 분압 차이로 O₂는 폐포→혈액, CO₂는 혈액→폐포로 확산.
// 선택: 정상 / 폐렴(폐포에 삼출물 → 션트) / 폐부종(간질·폐포에 물 → 확산 거리↑).
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;
  var DUR = 14;

  var ST = {
    normal: { spo2: 97, pao2: 95, paco2: 40, satMax: 1, satLen: 0.33, o2Pass: 1, color: '#1f7a74' },
    pneumonia: { spo2: 88, pao2: 58, paco2: 34, satMax: 0.3, satLen: 0.9, o2Pass: 0.25, color: '#b75d45' },
    edema: { spo2: 89, pao2: 60, paco2: 36, satMax: 0.62, satLen: 1.0, o2Pass: 0.55, color: '#b75d45' }
  };

  var STEPS = {
    normal: [
      { at: 0, label: '분압 차이', text: '가스는 **분압이 높은 쪽 → 낮은 쪽**으로 확산한다. 폐포 PO₂ 약 **100**, 폐로 들어오는 정맥혈 PO₂ 약 **40**mmHg라서 산소는 폐포에서 혈액으로 간다.' },
      { at: 3.5, label: 'O₂ → 헤모글로빈', text: '혈액으로 들어온 산소는 대부분 **적혈구의 헤모글로빈**과 결합해 운반된다(혈장에 녹는 양은 아주 적다). 파란 적혈구가 붉게 바뀐다.' },
      { at: 7, label: 'CO₂ 배출', text: '정맥혈 PCO₂ 약 **46** → 폐포 **40**mmHg. 차이는 작지만 CO₂는 **O₂보다 약 20배 확산이 잘 돼** 충분히 빠져나간다.' },
      { at: 10.5, label: '빨리 평형', text: '정상이면 모세혈관의 **앞쪽 1/3 지점**에서 이미 평형에 이른다(아래 그래프). 동맥혈 **PaO₂ 80~100mmHg, SpO₂ 95% 이상**. 노인은 나이에 따라 PaO₂가 조금 낮다.' }
    ],
    pneumonia: [
      { at: 0, label: '폐포에 삼출물', text: '세균 등이 폐포에 염증을 일으켜 **삼출물(백혈구·단백질·액체)**이 폐포를 채운다. 공기가 들어갈 자리가 없어진다(**경화, consolidation**).' },
      { at: 3.5, label: '산소 전달↓', text: '공기가 닿지 않는 폐포를 지난 피는 산소를 받지 못한 채 그대로 나간다(**션트**). **PaO₂·SpO₂가 떨어지고** 숨이 가빠진다(빈호흡).' },
      { at: 7, label: 'CO₂는 덜 영향', text: 'CO₂는 확산이 잘 되고, 숨을 빨리 쉬어 다른 폐포로 더 내보내므로 초기 PaCO₂는 정상이거나 오히려 낮다. 그래서 **저산소혈증이 먼저** 나타난다.' },
      { at: 10.5, label: '노인 폐렴', text: '노인은 **발열·기침 없이 의식 변화(섬망)**, 식욕부진, 기력 저하, 낙상으로 오기도 한다. **호흡수 증가**가 먼저 보이는 경우가 많아 호흡수와 SpO₂를 꼭 잰다.' }
    ],
    edema: [
      { at: 0, label: '폐부종', text: '좌심부전 등으로 폐 모세혈관 압력이 오르면 액체가 **간질로 먼저**, 이어 **폐포 안으로** 새어 나온다.' },
      { at: 3.5, label: '확산 거리↑', text: '간질이 부어 **폐포막이 두꺼워지고** 폐포에 물이 차면 산소가 지나야 할 거리가 길어진다. 확산량은 **막 두께에 반비례**하므로 산소 전달이 줄어든다.' },
      { at: 7, label: '증상', text: '**수포음(crackles)**, 호흡곤란·기좌호흡, 심하면 **분홍 거품 객담**. SpO₂가 떨어진다.' },
      { at: 10.5, label: '간호', text: '**좌위·반좌위**(다리는 내림), **산소** 투여, 처방된 **이뇨제**, 섭취·배설량과 매일 체중을 확인한다.' }
    ]
  };

  M.register({
    id: 'gas-exchange',
    title: '폐포 가스 교환 — 산소는 어떻게 피로 들어가나',
    system: '호흡기',
    topics: ['pneumonia', 'respiratory-patho', 'copd', 'tb'],
    duration: DUR,
    options: [{
      key: 'state', label: '상태',
      choices: [{ value: 'normal', label: '정상' }, { value: 'pneumonia', label: '폐렴' }, { value: 'edema', label: '폐부종' }],
      value: 'normal'
    }],
    steps: STEPS.normal,
    stepsFor: function (o) { return STEPS[o.state] || STEPS.normal; },
    source: '분압(mmHg): 폐포 PO₂ ≈100(교재에 따라 104)·PCO₂ 40, 정맥혈 PO₂ 40·PCO₂ 46, 동맥혈 PaO₂ 80~100·PaCO₂ 35~45. 폐렴·폐부종의 수치는 설명용 예시다.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var O2C = '#1fa39a', CO2C = '#7b55b5';
      var STAGE_W = 446, SCX = 223, SCY = 160;

      // ── 무대: 3D 폐포 그림(카메라로 당겨 본다) ──
      var clipS = el('clipPath', { id: 'nmGxStage' }, defs);
      el('rect', { x: 0, y: 0, width: STAGE_W, height: 340 }, clipS);
      var stage = el('g', { 'clip-path': 'url(#nmGxStage)' }, svg);
      var world = el('g', null, stage);
      var IX = -70, IY = -40, IW = 560, IH = 373.3;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      K.image(world, 'alveoli', IX, IY, IW, IH, { fadeR: '64%' });

      // 잘린 폐포의 빈 방(타원)과 그 아래 모세혈관
      var AC = P(0.655, 0.505), ARX = 0.12 * IW, ARY = 0.15 * IH;
      var CAP = [[0.44, 0.53], [0.47, 0.60], [0.52, 0.655], [0.58, 0.69], [0.64, 0.71], [0.70, 0.705], [0.745, 0.68], [0.78, 0.63]].map(function (q) { return P(q[0], q[1]); });
      var capCum = [0];
      for (var i = 1; i < CAP.length; i++) capCum.push(capCum[i - 1] + Math.hypot(CAP[i][0] - CAP[i - 1][0], CAP[i][1] - CAP[i - 1][1]));
      var CAPL = capCum[capCum.length - 1];
      function capAt(f) {
        f = K.clamp(f, 0, 1); var d = f * CAPL;
        for (var i = 1; i < CAP.length; i++) if (d <= capCum[i] + 1e-9) {
          var q = (d - capCum[i - 1]) / (capCum[i] - capCum[i - 1]);
          return { x: CAP[i - 1][0] + (CAP[i][0] - CAP[i - 1][0]) * q, y: CAP[i - 1][1] + (CAP[i][1] - CAP[i - 1][1]) * q,
            a: Math.atan2(CAP[i][1] - CAP[i - 1][1], CAP[i][0] - CAP[i - 1][0]) };
        }
        var n = CAP.length - 1; return { x: CAP[n][0], y: CAP[n][1], a: 0 };
      }
      var capD = 'M' + CAP.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');

      var clipA = el('clipPath', { id: 'nmGxAlv' }, defs);
      el('ellipse', { cx: AC[0], cy: AC[1], rx: ARX, ry: ARY }, clipA);
      // 폐렴 삼출물 / 폐부종 물
      var fillG = el('linearGradient', { id: 'nmGxFill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      var fs1 = el('stop', { offset: '0%', 'stop-color': '#f3e3a0', 'stop-opacity': 0.75 }, fillG);
      var fs2 = el('stop', { offset: '100%', 'stop-color': '#d9b95a', 'stop-opacity': 0.9 }, fillG);
      var soft = el('filter', { id: 'nmGxSoft', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
      el('feGaussianBlur', { stdDeviation: 2.2 }, soft);
      var fillWrap = el('g', { filter: 'url(#nmGxSoft)' }, world);
      var fill = el('rect', { x: AC[0] - ARX, y: AC[1] + ARY, width: 2 * ARX, height: 0, fill: 'url(#nmGxFill)', 'clip-path': 'url(#nmGxAlv)' }, fillWrap);
      var surf = el('ellipse', { cx: AC[0], rx: ARX * 0.9, ry: 4, fill: '#ffffff', opacity: 0, 'clip-path': 'url(#nmGxAlv)' }, world);
      var wbcG = el('g', { 'clip-path': 'url(#nmGxAlv)', opacity: 0 }, world);
      var wbcFill = K.sphere(svg, '#efe6cf');
      [[-0.55, 0.45], [-0.15, 0.6], [0.3, 0.5], [0.62, 0.3], [-0.35, 0.1], [0.1, 0.18], [0.45, -0.05], [-0.6, -0.15], [0.0, -0.25]].forEach(function (d, k) {
        var x = AC[0] + d[0] * ARX, y = AC[1] + d[1] * ARY;
        el('circle', { cx: x, cy: y, r: 8, fill: wbcFill, stroke: '#b8a77a', 'stroke-width': 0.6 }, wbcG);
        el('path', { d: 'M' + (x - 4) + ',' + y + ' q1.5,-4 4,0 q2.5,4 4,0', fill: 'none', stroke: '#7a4fa6', 'stroke-width': 2, 'stroke-linecap': 'round' }, wbcG);
        if (k % 3 === 0) el('rect', { x: x + 9, y: y - 2, width: 8, height: 3.6, rx: 1.8, fill: '#7d8f4a' }, wbcG);
      });
      var bubG = el('g', { 'clip-path': 'url(#nmGxAlv)', opacity: 0 }, world);
      var bubs = [];
      for (var b = 0; b < 9; b++) bubs.push(el('circle', { r: 3 + (b % 3), fill: 'rgba(255,255,255,.75)', stroke: '#8fb9de', 'stroke-width': 0.8 }, bubG));

      // 막 두께(폐부종): 모세혈관 둘레의 부은 간질
      var memBand = el('path', { d: capD, fill: 'none', stroke: '#8fbfe6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, world);

      // 입자: O₂ / CO₂ 구슬, 적혈구
      var glowF = K.glow(svg, 1.6);
      var o2F = K.sphere(svg, O2C), co2F = K.sphere(svg, CO2C);
      var rnd = (function () { var s = 29; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
      var o2 = [], co2 = [];
      for (var k = 0; k < 14; k++) {
        var a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.75;
        o2.push({ sx: AC[0] + Math.cos(a) * rr * ARX, sy: AC[1] - Math.abs(Math.sin(a)) * rr * ARY * 0.9, f: 0.08 + 0.84 * (k / 13), e: el('circle', { r: 4.2, fill: o2F, filter: glowF }, world) });
      }
      for (var c = 0; c < 9; c++) {
        var a2 = rnd() * Math.PI * 2, r2 = Math.sqrt(rnd()) * 0.7;
        co2.push({ ex: AC[0] + Math.cos(a2) * r2 * ARX, ey: AC[1] - Math.abs(Math.sin(a2)) * r2 * ARY * 0.8, f: 0.12 + 0.76 * (c / 8), e: el('circle', { r: 4.2, fill: co2F, filter: glowF }, world) });
      }
      var rbcSh = K.shadow(svg, 1, 1.2, 0.35);
      var rbc = [];
      for (var r = 0; r < 9; r++) {
        var g = el('g', { filter: rbcSh }, world);
        var body = el('ellipse', { rx: 8.5, ry: 5.6 }, g);
        el('ellipse', { rx: 3.6, ry: 2, fill: '#000', opacity: 0.18 }, g);
        rbc.push({ g: g, body: body });
      }
      var rbcFill = {};
      for (var rk = 0; rk <= 10; rk++) rbcFill[rk] = K.sphere(svg, K.mix(C.deoxy, C.oxy, rk / 10)); // 미리 만든다(재생 중 요소 생성 없음)
      function rbcColor(sa) { return rbcFill[Math.round(K.clamp(sa, 0, 1) * 10)]; }

      // ── 이름표(화면 고정 크기, 카메라 따라 자리만 이동) ──
      var pillSh = K.shadow(svg, 1.5, 2, 0.25);
      var tags = el('g', null, svg);
      function textW(s, size) {
        var w = 0;
        for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); w += c >= 0x1100 ? 1.0 : c === 32 ? 0.3 : (c >= 0x2080 && c <= 0x209f) ? 0.45 : 0.6; }
        return w * size;
      }
      function pill(txt, color, size) {
        var g = el('g', null, tags);
        var r0 = el('rect', { height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var t0 = K.label(g, 0, 0, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        var o = { g: g, r: r0, t: t0, size: size || 12 };
        o.set = function (s) { t0.textContent = s; o.w = textW(s, o.size) + 16; r0.setAttribute('width', o.w); r0.setAttribute('x', -o.w / 2); r0.setAttribute('y', -11); };
        o.set(txt);
        return o;
      }
      var tAlv = pill('폐포(공기)', C.ink, 13);
      var tPA = pill('PAO₂ 100 · PACO₂ 40', '#4a5862', 12);
      var tCap = pill('모세혈관 (피 흐름 →)', '#8e3b35', 12);
      var tVen = pill('정맥혈 PO₂ 40 · PCO₂ 46', C.deoxy, 12);
      var tArt = pill('', C.oxy, 12);
      var tMem = pill('막이 두꺼워짐', '#2f5f86', 12);

      // ── 카드: 동맥혈 결과·범례·단서 / PO₂ 그래프 ──
      var cardSh = K.shadow(svg, 3, 4, 0.18);
      function card(x, y, w, h) { return el('rect', { x: x, y: y, width: w, height: h, rx: 12, fill: '#ffffff', filter: cardSh }, svg); }
      var RX = 522;
      card(454, 8, 138, 112);
      K.label(svg, RX, 25, '동맥혈 결과', { size: 12, weight: 700, fill: C.muted });
      K.label(svg, RX, 46, 'SpO₂', { size: 13, weight: 700, fill: C.ink });
      var spo2 = K.label(svg, RX, 74, '', { size: 28, weight: 800, fill: C.teal });
      var pao2 = K.label(svg, RX, 98, '', { size: 12.5, weight: 700, fill: C.ink });
      var paco2 = K.label(svg, RX, 113, '', { size: 12.5, weight: 700, fill: C.ink });
      card(454, 128, 138, 72);
      el('circle', { cx: 468, cy: 146, r: 5, fill: o2F }, svg);
      K.label(svg, 480, 146, '산소(O₂)', { size: 12, anchor: 'start', fill: C.ink, weight: 600 });
      el('circle', { cx: 468, cy: 165, r: 5, fill: co2F }, svg);
      K.label(svg, 480, 165, '이산화탄소(CO₂)', { size: 12, anchor: 'start', fill: C.ink, weight: 600 });
      el('ellipse', { cx: 468, cy: 184, rx: 8, ry: 5, fill: rbcColor(1) }, svg);
      K.label(svg, 480, 184, '적혈구(Hb)', { size: 12, anchor: 'start', fill: C.ink, weight: 600 });
      var noteG = el('g', null, svg);
      var noteBox = el('rect', { x: 454, y: 208, width: 138, height: 124, rx: 12, fill: '#ffffff', filter: cardSh }, noteG);
      var noteBar = el('rect', { x: 454, y: 208, width: 6, height: 124, rx: 3, fill: C.teal }, noteG);
      var noteT = K.label(noteG, RX + 2, 226, '', { size: 12.5, weight: 800, fill: '#8a3a26' });
      var noteRows = [0, 1, 2, 3].map(function (r) { return K.label(noteG, 466, 250 + r * 21, '', { size: 12, anchor: 'start', fill: C.ink, weight: 600 }); });
      var NOTES = {
        normal: { t: '노인 폐 변화', r: ['· PaO₂ 조금씩 감소', '· 기침 반사 약해짐', '· 섬모 운동 감소', '· 흡인 위험 증가'] },
        pneumonia: { t: '노인 폐렴 단서', r: ['· 열·기침 없을 수 있음', '· 의식 변화(섬망)', '· 식욕부진·낙상', '· 호흡수 증가'] },
        edema: { t: '폐부종 단서', r: ['· 수포음(crackles)', '· 기좌호흡', '· 분홍 거품 객담', '· SpO₂ 저하'] }
      };

      // PO₂ 그래프 카드
      card(8, 252, 204, 82);
      K.label(svg, 110, 266, '모세혈관을 따라 혈액 PO₂', { size: 12, weight: 700, fill: C.muted });
      var X0 = 42, X1 = 202, GY0 = 276, GY1 = 322;
      function gy(p) { return GY1 - (p - 30) / 80 * (GY1 - GY0); }
      el('line', { x1: X0, y1: gy(100), x2: X1, y2: gy(100), stroke: O2C, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, svg);
      el('line', { x1: X0, y1: GY1, x2: X1, y2: GY1, stroke: C.line, 'stroke-width': 1 }, svg);
      K.label(svg, X0 - 4, gy(100), '100', { size: 12, anchor: 'end', fill: O2C, weight: 600 });
      K.label(svg, X0 - 4, gy(40), '40', { size: 12, anchor: 'end', fill: C.deoxy, weight: 600 });
      var third = el('line', { x1: X0 + (X1 - X0) / 3, y1: GY0, x2: X0 + (X1 - X0) / 3, y2: GY1, stroke: C.gold, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, svg);
      var thirdT = K.label(svg, X0 + (X1 - X0) / 3 + 4, GY1 - 7, '1/3 지점', { size: 12, anchor: 'start', fill: '#8a6420', weight: 700 });
      var po2Curve = el('path', { fill: 'none', stroke: C.oxy, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, svg);

      function sat(s, f) {
        if (f <= 0) return 0;
        var q = Math.min(1, f / s.satLen);
        return s.satMax * (1 - Math.pow(1 - q, 2.2));
      }
      // 카메라: [시각, nx, ny, 배율]
      var CAM = [[0, 0.60, 0.50, 1.0], [3.5, 0.60, 0.50, 1.0], [4.2, 0.60, 0.62, 1.5], [7.0, 0.60, 0.62, 1.5], [7.6, 0.62, 0.55, 1.25], [10.5, 0.62, 0.55, 1.25], [11.1, 0.52, 0.63, 1.6], [14, 0.52, 0.63, 1.6]];
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
      function place(o, pt, dy, show) {
        var s = scr(pt), x = s[0], y = s[1] + (dy || 0);
        x = K.clamp(x, o.w / 2 + 4, STAGE_W - o.w / 2 - 4);
        y = K.clamp(y, 14, 326);
        o.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
        o.g.setAttribute('opacity', show == null ? 1 : show);
        return y;
      }
      var cur = null;

      return function render(t, o) {
        t = ((t % DUR) + DUR) % DUR;
        var state = o.state || 'normal', s = ST[state];
        var pn = state === 'pneumonia', ed = state === 'edema';
        cam(t);

        // 폐포 속 내용물
        var grow = K.easeInOut(K.seg(t, 0.2, 2.2));
        var lvl = (pn ? 1.85 : ed ? 0.95 : 0) * ARY * grow;
        fill.setAttribute('height', lvl.toFixed(1)); fill.setAttribute('y', (AC[1] + ARY - lvl).toFixed(1));
        fs1.setAttribute('stop-color', pn ? '#f3e3a0' : '#bcdcf2'); fs2.setAttribute('stop-color', pn ? '#d9b95a' : '#7fb1dc');
        surf.setAttribute('cy', (AC[1] + ARY - lvl).toFixed(1)); surf.setAttribute('opacity', lvl > 4 ? 0.45 : 0);
        wbcG.setAttribute('opacity', pn ? grow : 0);
        bubG.setAttribute('opacity', ed ? grow : 0);
        bubs.forEach(function (bb, k) {
          var x = AC[0] + ((k / 9) * 1.6 - 0.8) * ARX, ph = ((t * 0.5 + k * 0.29) % 1);
          bb.setAttribute('cx', x.toFixed(1)); bb.setAttribute('cy', (AC[1] + ARY - lvl * ph * 0.95).toFixed(1));
        });
        tAlv.set(pn ? '폐포(삼출물로 참)' : ed ? '폐포(물이 참)' : '폐포(공기)');
        tAlv.t.setAttribute('fill', pn || ed ? '#8a3a26' : C.ink);
        tPA.set(pn ? '공기가 닿지 못함' : 'PAO₂ 100 · PACO₂ 40');

        // 막 두께
        var th = ed ? K.easeInOut(K.seg(t, 1.0, 3.5)) : 0;
        memBand.setAttribute('stroke-width', (6 + 16 * th).toFixed(1));
        memBand.setAttribute('opacity', (0.55 * th).toFixed(2));

        // 적혈구(14초에 두 바퀴)
        rbc.forEach(function (r, i) {
          var f = ((i / rbc.length + t * 2 / DUR) % 1) * 1.12 - 0.06;
          var p = capAt(f);
          r.body.setAttribute('fill', rbcColor(sat(s, f)));
          r.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') rotate(' + (p.a * 180 / Math.PI).toFixed(1) + ')');
          r.g.setAttribute('opacity', Math.min(1, (f + 0.06) * 12, (1.06 - f) * 12).toFixed(2));
        });

        // O₂: 폐포 → 혈액
        o2.forEach(function (m, i) {
          var per = 2.4, ph = ((t + i * 0.41) % per) / per;
          var tp = capAt(m.f);
          var pass = (i % 4) / 4 < s.o2Pass;
          var x = K.lerp(m.sx, tp.x, ph), y = K.lerp(m.sy, tp.y, ph);
          var op = Math.min(1, ph * 6, (1 - ph) * 6);
          if (ed && !pass && ph > 0.7) { x = K.lerp(m.sx, tp.x, 0.7); y = K.lerp(m.sy, tp.y, 0.7); op *= 0.5; }
          if (pn) { op = pass ? op : 0; }
          m.e.setAttribute('cx', x.toFixed(1)); m.e.setAttribute('cy', y.toFixed(1)); m.e.setAttribute('opacity', op.toFixed(2));
        });
        // CO₂: 혈액 → 폐포
        co2.forEach(function (m, i) {
          var per = 2.8, ph = ((t * 1.05 + i * 0.53) % per) / per;
          var sp = capAt(m.f);
          var x = K.lerp(sp.x, m.ex, ph), y = K.lerp(sp.y, m.ey, ph);
          var op = Math.min(1, ph * 6, (1 - ph) * 6) * (pn && ph > 0.4 ? 0.5 : 1);
          m.e.setAttribute('cx', x.toFixed(1)); m.e.setAttribute('cy', y.toFixed(1)); m.e.setAttribute('opacity', op.toFixed(2));
        });

        // 이름표
        var ya = place(tAlv, P(0.655, 0.30), 0);
        var sa = scr(P(0.655, 0.30));
        tPA.g.setAttribute('transform', 'translate(' + K.clamp(sa[0], tPA.w / 2 + 4, STAGE_W - tPA.w / 2 - 4).toFixed(1) + ',' + (ya + 25).toFixed(1) + ')');
        place(tCap, P(0.74, 0.80), 0);
        place(tVen, P(0.40, 0.47), 0);
        tArt.set('동맥혈 PO₂ ' + (state === 'normal' ? '95' : s.pao2) + ' · PCO₂ ' + s.paco2);
        tArt.t.setAttribute('fill', state === 'normal' ? C.oxy : C.clay);
        place(tArt, P(0.80, 0.74), 0);
        place(tMem, P(0.50, 0.70), 6, ed && th > 0.5 ? 1 : 0);

        // PO₂ 곡선
        var pts = [];
        for (var q = 0; q <= 1.0001; q += 0.02) {
          var po = 40 + ((state === 'normal' ? 100 : s.pao2) - 40) * (sat(s, q) / s.satMax);
          pts.push((X0 + q * (X1 - X0)).toFixed(1) + ',' + gy(po).toFixed(1));
        }
        po2Curve.setAttribute('d', 'M' + pts.join(' L'));
        po2Curve.setAttribute('stroke', state === 'normal' ? C.oxy : C.clay);
        third.setAttribute('opacity', state === 'normal' ? 1 : 0.35);
        thirdT.setAttribute('opacity', state === 'normal' ? (t >= 10.5 ? 1 : 0.5) : 0);

        // 수치·단서
        spo2.textContent = s.spo2 + '%';
        spo2.setAttribute('fill', s.spo2 >= 95 ? C.teal : C.clay);
        pao2.textContent = 'PaO₂ ' + s.pao2 + ' mmHg';
        paco2.textContent = 'PaCO₂ ' + s.paco2 + ' mmHg';
        if (cur !== state) {
          cur = state;
          noteT.textContent = NOTES[state].t;
          NOTES[state].r.forEach(function (r, i) { noteRows[i].textContent = r; });
          noteBar.setAttribute('fill', state === 'normal' ? C.teal : C.clay);
          noteT.setAttribute('fill', state === 'normal' ? C.tealDark : '#8a3a26');
        }
        var hl = t >= 10.5 || (ed && t >= 7);
        noteG.setAttribute('opacity', hl ? 1 : 0.6);
      };
    }
  });
})();
