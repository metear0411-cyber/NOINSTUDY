// 뇌경색: 중심부와 반음영, 시간이 곧 뇌
// 원리: 혈전이 뇌동맥을 막으면 중심부는 곧 죽고, 둘레의 반음영은 재관류하면 살릴 수 있다.
//       시간이 갈수록 중심부가 반음영을 먹어 들어간다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  // 애니메이션 시각 → 발생 후 시간(시간)
  function hours(t, K) {
    if (t < 2) return 0;
    if (t < 8.5) return K.lerp(0, 1.5, (t - 2) / 6.5);
    if (t < 11.5) return K.lerp(1.5, 6, (t - 8.5) / 3);
    return 6;
  }
  var R0 = 18, R1 = 104;   // 중심부 반지름: 시작 → 반음영을 다 먹었을 때
  function coreR(h) { return R0 + (R1 - R0) * Math.pow(Math.min(h, 6) / 6, 0.75); }

  var COMMON = [
    { at: 0, label: '혈전', text: '**심방세동**에서 생긴 혈전이나 경동맥 **죽상경화반** 조각이 떠내려가 뇌동맥(흔히 **중대뇌동맥**)을 막는다. 그 너머로 피가 가지 않는다.' },
    { at: 2, label: '중심부·반음영', text: '혈류가 거의 끊긴 **중심부(core)**는 몇 분 안에 죽어 되돌릴 수 없다. 둘레의 **반음영(penumbra)**은 기능만 멈췄을 뿐 살아 있어, 혈류를 되살리면 **살릴 수 있는 조직**이다.' },
    { at: 4, label: 'BE-FAST', text: '**BE-FAST**로 빨리 알아챈다: 균형(어지럼·비틀거림), 눈(시야 장애·복시), 얼굴 한쪽 처짐, 팔다리 한쪽 힘 빠짐, 말 어눌함, 그리고 시간(곧바로 119). 치료 시간은 **마지막으로 정상이던 시각**부터 센다.' },
    { at: 6.5, label: 'CT 먼저', text: '병원에서는 **비조영 뇌 CT**부터 찍어 **출혈을 배제**한다. 출혈이면 혈전용해제는 **금기**이고, 경색은 초기 CT에서 거의 정상으로 보일 수 있다. 저혈당도 뇌졸중처럼 보일 수 있어 혈당을 함께 잰다.' }
  ];
  var BY = {
    yes: { at: 8.5, label: '재관류', text: '**재관류**에 성공하면 막힌 혈관이 다시 열려 **반음영을 살린다**. 이미 죽은 중심부는 돌아오지 않으므로 빠를수록 남는 뇌가 많다(**time is brain**).' },
    no: { at: 8.5, label: '재관류 못 함', text: '재관류를 못 하면 시간이 갈수록 **중심부가 반음영을 먹어 들어가** 결국 대부분이 경색된다. 치료가 1분 늦을 때마다 신경세포 약 190만 개가 죽는다는 추정이 있다(**time is brain**).' }
  };
  var TAIL = [
    { at: 11.5, label: '치료 시간창', text: '**정맥 혈전용해제(tPA, 알테플라제)**는 최종 정상 확인 시각부터 **4.5시간 이내**, **기계적 혈전제거술**은 큰 혈관 폐색에서 대개 **6시간 이내**(선택된 환자는 **24시간까지**)에 한다. tPA 뒤 24시간은 항혈전제를 쓰지 않고 출혈 징후·혈압을 살핀다.' },
    { at: 14, label: '출혈·재발 예방', text: '**뇌출혈**은 CT에서 하얗게 보이며 혈전용해제·항응고제가 금기이고 혈압 조절·항응고 역전이 먼저다. 경색 재발 예방은 비심인성이면 **항혈소판제**(아스피린·클로피도그렐), **심방세동**이면 **항응고제**(와파린·NOAC)를 쓴다.' }
  ];

  M.register({
    id: 'stroke-penumbra',
    title: '뇌경색: 중심부와 반음영 — 시간이 곧 뇌',
    system: '신경계',
    topics: ['stroke', 'anticoagulants', 'neuro-assessment'],
    duration: 16,
    options: [{
      key: 'reperf', label: '재관류',
      choices: [{ value: 'yes', label: '함(1.5시간째)' }, { value: 'no', label: '안 함' }],
      value: 'yes'
    }],
    steps: [],
    stepsFor: function (o) { return COMMON.concat([BY[o.reperf] || BY.yes], TAIL); },
    source: '시간창: 정맥 tPA 4.5시간, 혈전제거술 6시간(선택 환자 24시간) — 국내외 뇌졸중 진료지침 기준. 분당 190만 개는 Saver(2006) 추정. 경색 크기 변화는 설명용으로 단순화.',

    setup: function (svg, K, opt) {
      var el = K.el, C = K.C;
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var defs = svg.querySelector('defs') || el('defs', null, svg);
      var glowF = K.glow(svg, 2.2), sh = K.shadow(svg, 1.2, 1.2, 0.3);
      var cardSh = K.shadow(svg, 3, 4, 0.18), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 14;
        el('rect', { x: x - w / 2, y: y - 10.5, width: w, height: 21, rx: 10.5, fill: 'rgba(255,255,255,.9)', filter: pillSh }, g);
        K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return g;
      }

      // ── 뇌 외측면 그림(카메라 세계) — webp 격자로 잰 위치 ──
      var IX = -46, IY = 4, IW = 450, IH = 300;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      function curve(pts) {
        var a = pts.map(function (q) { return P(q[0], q[1]); });
        var d = 'M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1);
        for (var i = 0; i < a.length - 1; i++) {
          var p0 = a[i - 1] || a[i], p1 = a[i], p2 = a[i + 1], p3 = a[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
            (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
        return d;
      }
      var clip = el('clipPath', { id: 'nmStrClip' }, defs);
      el('rect', { x: 0, y: 0, width: 346, height: 340 }, clip);
      var box = el('g', { 'clip-path': 'url(#nmStrClip)' }, svg);
      var world = el('g', null, box);
      K.image(world, 'brain-lateral', IX, IY, IW, IH, { fadeR: '66%' });

      // 중대뇌동맥 영역: 반음영(타원) 안에서 중심부(원)가 커진다
      var PC = P(0.50, 0.40), CC = P(0.45, 0.45);
      var pclip = el('clipPath', { id: 'nmStrPen' }, defs);
      el('ellipse', { cx: PC[0], cy: PC[1], rx: 92, ry: 76 }, pclip);
      var pg = el('radialGradient', { id: 'nmStrPenG' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#f7c94f', 'stop-opacity': 0.75 }, pg);
      el('stop', { offset: '80%', 'stop-color': '#f2b632', 'stop-opacity': 0.6 }, pg);
      el('stop', { offset: '100%', 'stop-color': '#f2b632', 'stop-opacity': 0 }, pg);
      var pen = el('ellipse', { cx: PC[0], cy: PC[1], rx: 96, ry: 80, fill: 'url(#nmStrPenG)', opacity: 0, style: 'mix-blend-mode:multiply' }, world);
      var penEdge = el('ellipse', { cx: PC[0], cy: PC[1], rx: 92, ry: 76, fill: 'none', stroke: '#d79a1c', 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0 }, world);
      var core = el('circle', { cx: CC[0], cy: CC[1], r: 0, fill: '#8c2416', opacity: 0.82, 'clip-path': 'url(#nmStrPen)', style: 'mix-blend-mode:multiply' }, world);

      // 혈관: 안쪽 내경동맥(점선) → 중대뇌동맥 줄기·가지(그림 속 빨간 혈관을 따라)
      var pICA = el('path', { d: curve([[0.375, 0.90], [0.365, 0.74], [0.355, 0.62], [0.358, 0.565]]), fill: 'none', stroke: '#c8423b', 'stroke-width': 4, 'stroke-dasharray': '6 5', opacity: 0.7 }, world);
      var pM = el('path', { d: curve([[0.358, 0.565], [0.372, 0.535], [0.392, 0.505]]), fill: 'none', stroke: 'none' }, world);
      var BR = [
        [[0.392, 0.505], [0.37, 0.43], [0.33, 0.34], [0.28, 0.26]],
        [[0.392, 0.505], [0.43, 0.43], [0.46, 0.33], [0.48, 0.22]],
        [[0.392, 0.505], [0.48, 0.46], [0.57, 0.40], [0.66, 0.31]],
        [[0.38, 0.54], [0.44, 0.53], [0.52, 0.55], [0.60, 0.56]]
      ];
      var br = BR.map(function (b) { return el('path', { d: curve(b), fill: 'none', stroke: 'none' }, world); });
      var flowProx = [], flowDist = [];
      for (var i = 0; i < 5; i++) flowProx.push(el('circle', { r: 2.6, fill: K.sphere(svg, '#e8584f'), opacity: 0 }, world));
      for (var j = 0; j < 8; j++) flowDist.push(el('circle', { r: 2.2, fill: '#ffe1dc', filter: glowF, opacity: 0 }, world));
      var clot = el('ellipse', { rx: 8, ry: 5.5, fill: K.sphere(svg, '#5a1a12'), filter: sh, opacity: 0 }, world);

      // 이름표
      var coreP = pill(world, CC[0], CC[1], '중심부', '#8c2416', 12.5);
      var penP = pill(world, PC[0] + 36, PC[1] - 62, '반음영', '#8a6526', 12.5);
      var q = P(0.255, 0.60); pill(world, q[0], q[1], '중대뇌동맥', '#a0362e');
      q = P(0.255, 0.82); var icaP = pill(world, q[0], q[1], '내경동맥(안쪽)', '#a0362e', 11);
      var clotP = pill(world, 0, 0, '혈전', '#4a1712');

      // 카메라 → 화면 (173,170)
      var O = P(0.37, 0.54);
      function camKeys(yes) {
        var k = [[0, O[0], O[1] + 10, 1.6], [1.8, O[0], O[1] + 10, 1.6], [2.5, 173, 160, 1.1], [3.9, 173, 160, 1.1], [4.4, 173, 170, 1], [8.5, 173, 170, 1]];
        if (yes) k.push([9.0, O[0] + 30, O[1] - 10, 1.25], [10.0, O[0] + 30, O[1] - 10, 1.25], [10.6, 173, 165, 1.05], [16, 173, 165, 1.05]);
        else k.push([9.0, 173, 160, 1.1], [16, 173, 160, 1.1]);
        return k;
      }
      function cam(t, yes) {
        var CAM = camKeys(yes);
        for (var i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) {
          var a = CAM[i - 1], b = CAM[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 173, 170);
          return;
        }
      }

      // 범례(왼쪽 아래)
      el('rect', { x: 8, y: 306, width: 160, height: 28, rx: 14, fill: 'rgba(255,255,255,.92)', filter: cardSh }, svg);
      el('circle', { cx: 24, cy: 320, r: 6, fill: K.sphere(svg, '#8c2416') }, svg);
      K.label(svg, 34, 320, '중심부', { size: 12, anchor: 'start', weight: 700 });
      el('circle', { cx: 94, cy: 320, r: 6, fill: K.sphere(svg, '#f2b632') }, svg);
      K.label(svg, 104, 320, '반음영', { size: 12, anchor: 'start', weight: 700 });

      // ── 시계 카드 ──
      el('rect', { x: 352, y: 8, width: 240, height: 176, rx: 14, fill: 'rgba(255,255,255,.95)', filter: cardSh }, svg);
      var CX = 418, CY = 76, R = 54;
      el('circle', { cx: CX, cy: CY, r: R, fill: '#fff', stroke: '#dfe5e8', 'stroke-width': 1.5, filter: sh }, svg);
      var wedge = el('path', { fill: C.claySoft, opacity: 0.9 }, svg);
      function arc(h0, h1, r) {
        var a0 = (h0 * 30 - 90) * Math.PI / 180, a1 = (h1 * 30 - 90) * Math.PI / 180;
        var large = (h1 - h0) * 30 > 180 ? 1 : 0;
        return 'M' + (CX + r * Math.cos(a0)).toFixed(1) + ',' + (CY + r * Math.sin(a0)).toFixed(1) +
          ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + (CX + r * Math.cos(a1)).toFixed(1) + ',' + (CY + r * Math.sin(a1)).toFixed(1);
      }
      el('path', { d: arc(0, 4.5, R - 4), fill: 'none', stroke: C.teal, 'stroke-width': 7 }, svg);
      el('path', { d: arc(4.5, 6, R - 4), fill: 'none', stroke: C.gold, 'stroke-width': 7 }, svg);
      for (var hh = 0; hh < 12; hh++) {
        var a = (hh * 30 - 90) * Math.PI / 180;
        el('line', { x1: CX + (R - 12) * Math.cos(a), y1: CY + (R - 12) * Math.sin(a), x2: CX + (R - 17) * Math.cos(a), y2: CY + (R - 17) * Math.sin(a), stroke: '#9aa6ad', 'stroke-width': 1.4 }, svg);
      }
      [[0, '0'], [3, '3'], [6, '6'], [9, '9']].forEach(function (p) {
        var a2 = (p[0] * 30 - 90) * Math.PI / 180;
        K.label(svg, CX + (R - 27) * Math.cos(a2), CY + (R - 27) * Math.sin(a2), p[1], { size: 12, weight: 700, fill: C.muted });
      });
      var hand = el('line', { x1: CX, y1: CY, x2: CX, y2: CY - 22, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      el('circle', { cx: CX, cy: CY, r: 4, fill: C.ink }, svg);
      K.label(svg, 486, 52, '발생 후', { size: 12, anchor: 'start', fill: C.muted, weight: 700 });
      var hTxt = K.label(svg, 486, 76, '', { size: 19, anchor: 'start', weight: 800 });
      K.label(svg, 486, 100, '(최종 정상 기준)', { size: 12, anchor: 'start', fill: C.muted, weight: 500 });
      el('rect', { x: 366, y: 144, width: 12, height: 7, rx: 2, fill: C.teal }, svg);
      K.label(svg, 384, 148, '정맥 혈전용해(tPA) 4.5시간', { size: 12, anchor: 'start', weight: 700, fill: C.teal });
      el('rect', { x: 366, y: 164, width: 12, height: 7, rx: 2, fill: C.gold }, svg);
      K.label(svg, 384, 168, '혈전제거술 6시간(선택 24시간)', { size: 12, anchor: 'start', weight: 700, fill: '#8a6526' });

      // ── 단계별 패널 카드 ──
      var PX = 352, PY = 192, PW = 240, PH = 142;
      el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 14, fill: 'rgba(255,255,255,.95)', filter: cardSh }, svg);
      var pBar = el('rect', { x: PX, y: PY, width: 6, height: PH, rx: 3, fill: C.clay }, svg);
      var pTitle = K.label(svg, PX + 16, PY + 20, '', { size: 14, anchor: 'start', weight: 800 });
      var pLines = [];
      for (var qq = 0; qq < 5; qq++) pLines.push(K.label(svg, PX + 16, PY + 45 + qq * 21, '', { size: 12, anchor: 'start', weight: 600 }));
      var bf = el('g', { opacity: 0 }, svg);
      [['B', '균형'], ['E', '눈'], ['F', '얼굴'], ['A', '팔'], ['S', '말'], ['T', '시간']].forEach(function (p, k) {
        var x = PX + 14 + k * 36.5;
        el('rect', { x: x, y: PY + 34, width: 32, height: 54, rx: 9, fill: K.sphere(svg, k === 5 ? '#f3c7b8' : '#c9daf0'), filter: sh }, bf);
        K.label(bf, x + 16, PY + 54, p[0], { size: 18, weight: 800, fill: k === 5 ? C.clay : C.blue });
        K.label(bf, x + 16, PY + 77, p[1], { size: 12, weight: 700, fill: C.ink });
      });
      K.label(bf, PX + 16, PY + 108, '한쪽 마비·말 어눌 → 바로 119', { size: 12.5, anchor: 'start', weight: 700, fill: C.clay });
      K.label(bf, PX + 16, PY + 128, '시각은 마지막 정상 확인 기준', { size: 12, anchor: 'start', weight: 600, fill: C.muted });
      var ct = el('g', { opacity: 0 }, svg);
      [[PX + 66, '경색', false], [PX + 180, '출혈', true]].forEach(function (p) {
        el('ellipse', { cx: p[0], cy: PY + 66, rx: 28, ry: 32, fill: '#2f3337', stroke: '#1a1d20', 'stroke-width': 2, filter: sh }, ct);
        el('ellipse', { cx: p[0], cy: PY + 66, rx: 22, ry: 26, fill: '#6d7278' }, ct);
        el('line', { x1: p[0], y1: PY + 41, x2: p[0], y2: PY + 91, stroke: '#575c62', 'stroke-width': 1.5 }, ct);
        if (p[2]) el('ellipse', { cx: p[0] + 8, cy: PY + 60, rx: 8, ry: 6.5, fill: '#f7f7f7', filter: K.glow(svg, 1.5) }, ct);
        K.label(ct, p[0], PY + 112, p[1] + (p[2] ? ': 하얀 고음영' : ': 초기 거의 정상'), { size: 12, weight: 700, fill: p[2] ? C.clay : C.ink });
      });
      K.label(ct, PX + PW / 2, PY + 132, '출혈이면 혈전용해제 금기', { size: 13, weight: 800, fill: C.clay });

      var PANEL = {
        none: { title: '혈전이 뇌동맥을 막음', col: '#4a1712', lines: ['심방세동 → 심장에서 생긴 혈전', '경동맥 죽상경화반 → 떨어진 조각', '→ 막힌 곳 너머로 혈류 끊김', '', ''] },
        zone: { title: '막힌 곳 너머', col: C.clay, lines: ['중심부: 혈류 거의 0', '→ 몇 분 안에 괴사(비가역)', '반음영: 기능만 멈춤', '→ 재관류하면 살릴 수 있음', ''] },
        yes: { title: '재관류 성공', col: C.teal, lines: ['혈전 녹음·제거 → 혈류 재개', '반음영 회복', '중심부는 그대로 남음', '빠를수록 남는 뇌가 많다', ''] },
        no: { title: '재관류 못 함', col: C.clay, lines: ['중심부가 반음영을 먹어 들어감', '→ 몇 시간 뒤 대부분 경색', '분당 신경세포 약 190만 개', '', ''] },
        win: { title: '치료 시간창', col: C.teal, lines: ['tPA 정맥: 4.5시간 이내', '혈전제거술: 6시간(선택 24시간)', '기준 = 최종 정상 확인 시각', 'tPA 뒤 24시간 항혈전제 금지', ''] },
        bleed: { title: '출혈 vs 경색 · 재발 예방', col: C.purple, lines: ['출혈: 혈전용해·항응고 금기', '→ 혈압 조절·항응고 역전', '경색 재발 예방', '비심인성: 항혈소판제', '심방세동: 항응고제(와파린·NOAC)'] }
      };

      return function render(t, o) {
        var yes = o.reperf === 'yes';
        var H = hours(t, K);
        cam(t, yes);

        // 혈전: 내경동맥(안쪽) → 중대뇌동맥 줄기에 걸림
        var cp = K.seg(t, 0.3, 1.8);
        var cpos = cp < 0.75 ? K.along(pICA, cp / 0.75) : K.along(pM, 0.55 * (cp - 0.75) / 0.25);
        var lysis = yes ? K.seg(t, 8.8, 9.8) : 0;
        clot.setAttribute('cx', cpos.x.toFixed(1)); clot.setAttribute('cy', cpos.y.toFixed(1));
        clot.setAttribute('transform', 'rotate(-55 ' + cpos.x.toFixed(1) + ' ' + cpos.y.toFixed(1) + ')');
        clot.setAttribute('rx', (8 * (1 - lysis)).toFixed(2)); clot.setAttribute('ry', (5.5 * (1 - lysis)).toFixed(2));
        clot.setAttribute('opacity', t >= 0.3 ? 1 - lysis : 0);
        clotP.setAttribute('transform', 'translate(' + (cpos.x - 26).toFixed(1) + ',' + (cpos.y - 12).toFixed(1) + ')');
        clotP.setAttribute('opacity', t >= 0.3 && lysis < 0.6 ? 1 : 0);
        var occluded = t >= 1.8 && lysis < 1;
        var perf = !occluded;
        icaP.setAttribute('opacity', t < 2.5 ? 1 : 0.6);

        flowProx.forEach(function (d, k) {
          var ph = (t * 0.5 + k / flowProx.length) % 1;
          var lim = occluded ? 0.9 : 1;
          var p = K.along(pICA, Math.min(ph, lim));
          d.setAttribute('cx', p.x.toFixed(1)); d.setAttribute('cy', p.y.toFixed(1));
          d.setAttribute('opacity', 0.85);
        });
        flowDist.forEach(function (d, k) {
          var ph = (t * 0.6 + k / flowDist.length) % 1;
          var p = K.along(br[k % 4], ph);
          d.setAttribute('cx', p.x.toFixed(1)); d.setAttribute('cy', p.y.toFixed(1));
          d.setAttribute('opacity', perf ? 0.95 * Math.sin(ph * Math.PI) : 0);
        });
        
        var hCore = yes ? Math.min(H, 1.6) : H;
        var appear = K.seg(t, 2.0, 2.8);
        core.setAttribute('r', (coreR(hCore) * appear).toFixed(1));
        var rescued = yes ? K.seg(t, 9.6, 11.0) : 0;
        var fullCore = !yes ? K.seg(H, 4.5, 6) : 0;
        pen.setAttribute('opacity', appear * (1 - rescued));
        penEdge.setAttribute('opacity', appear * (1 - rescued * 0.7));
        penP.setAttribute('opacity', appear * (1 - rescued) * (1 - fullCore));
        coreP.setAttribute('opacity', appear);

        var ang = (H * 30 - 90) * Math.PI / 180;
        hand.setAttribute('x2', (CX + 24 * Math.cos(ang)).toFixed(1));
        hand.setAttribute('y2', (CY + 24 * Math.sin(ang)).toFixed(1));
        if (H > 0.01) wedge.setAttribute('d', 'M' + CX + ',' + CY + ' L' + CX + ',' + (CY - 42) + ' ' + arc(0, H, 42).replace(/^M[^A]+/, '') + ' Z');
        else wedge.setAttribute('d', '');
        hTxt.textContent = (Math.round(H * 10) / 10) + '시간';
        hTxt.setAttribute('fill', H > 4.5 ? C.clay : C.ink);

        var mode = t >= 14 ? 'bleed' : t >= 11.5 ? 'win' : t >= 8.5 ? (yes ? 'yes' : 'no') : t >= 6.5 ? 'ct' : t >= 4 ? 'bf' : t >= 2 ? 'zone' : 'none';
        bf.setAttribute('opacity', mode === 'bf' ? 1 : 0);
        ct.setAttribute('opacity', mode === 'ct' ? 1 : 0);
        var cd = PANEL[mode];
        if (cd) {
          pTitle.textContent = cd.title; pTitle.setAttribute('fill', cd.col);
          pBar.setAttribute('fill', cd.col);
          pLines.forEach(function (l, k) { l.textContent = cd.lines[k] || ''; });
        } else {
          pTitle.textContent = mode === 'bf' ? 'BE-FAST: 빨리 알아채기' : '비조영 CT로 출혈 배제';
          pTitle.setAttribute('fill', mode === 'ct' ? C.ink : C.blue);
          pBar.setAttribute('fill', mode === 'ct' ? C.ink : C.blue);
          pLines.forEach(function (l) { l.textContent = ''; });
        }
      };
    }
  });
})();
