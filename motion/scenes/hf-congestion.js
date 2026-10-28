// 좌심부전 vs 우심부전 — 펌프가 약해진 쪽의 "상류"로 피가 밀려 고인다(후방 부전),
// 앞으로 나가는 피도 줄어 신장이 RAAS를 켜고 물을 붙잡는다(전방 부전 → 악순환).
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;
  var DUR = 15;

  var STEPS = {
    left: [
      { at: 0.0, label: '좌심실 펌프↓', text: '**좌심실**이 피를 충분히 내보내지 못한다(고혈압·심근경색·판막질환 등). 나가지 못한 피는 **상류**로 밀린다. 좌심실의 상류는 **좌심방→폐정맥→폐**다.' },
      { at: 2.2, label: '폐정맥 정체', text: '좌심방 압력이 오르고 **폐정맥**이 부푼다. 피가 폐에서 빠져나가지 못해 **폐 모세혈관 압력**이 올라간다(**폐 울혈**).' },
      { at: 4.4, label: '폐부종', text: '모세혈관 압력이 높아지면 액체가 **폐 간질과 폐포로 새어 나온다**. 공기 자리에 물이 차서 **호흡곤란**, 청진하면 **수포음(crackles)**이 들린다.' },
      { at: 6.8, label: '기좌호흡·PND', text: '누우면 다리 쪽 피가 심장·폐로 더 돌아와 울혈이 심해진다. 그래서 **앉아야 숨이 편하고(기좌호흡)**, 자다가 숨이 차서 깨는 **발작성 야간 호흡곤란**이 생긴다. 베개를 몇 개 베고 자는지 묻는 이유다.' },
      { at: 9.0, label: '급성 폐부종', text: '폐포가 물로 가득 차면 **분홍색 거품 객담**, 심한 호흡곤란, 청색증이 온다. **응급**이다. 앉히고 다리를 내린 자세(**좌위·반좌위**)에서 산소와 이뇨제를 쓴다.' },
      { at: 11.0, label: '전방 부전·RAAS', text: '앞으로 나가는 피도 줄어(**심박출량↓**) **신장 혈류**가 줄면 **RAAS**가 켜진다. **안지오텐신 II**는 혈관을 조이고(후부하↑), **알도스테론**은 **나트륨·수분을 붙잡아**(전부하↑) 울혈을 더 키운다. **ACE억제제·ARB·알도스테론 길항제·이뇨제**가 이 고리를 끊는다.' },
      { at: 13.4, label: '간호 포인트', text: '**매일 같은 시간 체중**과 섭취·배설량 측정, **나트륨·수분 제한**, 반좌위. **푸로세미드** 같은 루프 이뇨제는 **저칼륨혈증**을 만들고, 저칼륨은 **디곡신 독성**을 높인다.' }
    ],
    right: [
      { at: 0.0, label: '우심실 펌프↓', text: '**우심실**이 피를 폐로 충분히 보내지 못한다. 가장 흔한 원인은 **좌심부전**, 그다음이 **COPD 같은 폐질환(폐성심)**이다. 우심실의 상류는 **우심방→대정맥→온몸 정맥**이다.' },
      { at: 2.2, label: '대정맥 정체', text: '우심방 압력과 **중심정맥압(CVP)**이 오르고, 온몸 정맥이 피를 비우지 못해 부푼다(**전신 울혈**). 우심부전만 단독으로 있으면 폐 울혈 증상은 적다.' },
      { at: 4.4, label: '경정맥 팽대', text: '상체를 **30~45도** 올린 자세에서도 **목 정맥(경정맥)이 부풀어** 보인다. 간을 누르면 경정맥이 더 부푸는 **간경정맥 역류**도 같은 원리다.' },
      { at: 6.4, label: '간비대·복수', text: '간에 피가 고여 **간비대**, 우상복부 불편감, **식욕부진·소화불량**이 생긴다. 복강으로 액체가 새면 **복수**가 찬다.' },
      { at: 8.4, label: '하지 함요부종', text: '중력 때문에 아래쪽부터 붓는다(**의존성 부종**). 손가락으로 누르면 **자국이 남는 함요부종**. 누워 지내는 노인은 다리보다 **천골부·등**에 먼저 고인다.' },
      { at: 10.4, label: '체중 증가', text: '부종이 눈에 띄기 전에 **체중이 먼저 는다**. 매일 아침 같은 조건으로 재고, 갑자기 늘면(흔히 **하루 1kg·일주일 2kg 이상**, 교재마다 조금 다름) 보고한다.' },
      { at: 12.0, label: 'RAAS 악순환', text: '**심박출량↓ → 신장 혈류↓ → RAAS**. **알도스테론**이 나트륨·수분을 붙잡아 혈액량이 늘고 울혈이 더 심해진다. 좌·우 어느 쪽이든 이 고리 때문에 부종이 커지고, **이뇨제·ACE억제제·ARB·알도스테론 길항제**가 이 고리를 끊는다.' }
    ]
  };

  M.register({
    id: 'hf-congestion',
    title: '좌심부전 vs 우심부전 — 피가 어디에 고이나',
    system: '순환기',
    topics: ['heart-failure', 'heart-failure-drugs', 'cardiovascular-patho', 'diuretics-renal'],
    duration: DUR,
    options: [{
      key: 'side', label: '약해진 쪽',
      choices: [{ value: 'left', label: '좌심부전' }, { value: 'right', label: '우심부전' }],
      value: 'left'
    }],
    steps: STEPS.left,
    stepsFor: function (o) { return STEPS[o.side] || STEPS.left; },
    source: '기억법: **좌심부전 = 폐(Lung)**, **우심부전 = 온몸 정맥**. 그림은 설명용으로 단순화했다.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var glowF = K.glow(svg, 2.4), glowS = K.glow(svg, 1.4);
      var cardSh = K.shadow(svg, 3, 4, 0.16), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      var arrId = K.arrowHead(svg, '#9aa6b4', 'nmHfArr');
      var arrHot = K.arrowHead(svg, C.clay, 'nmHfArrHot');

      // ── 좌표: 심장 그림(H)·폐 그림(L)의 정규화 좌표 → 화면 ──
      var HX = 136, HY = 60, HS = 220;           // heart.webp (정사각)
      var LX = 76, LY = -18, LW = 340, LH = 227; // lungs.webp (3:2)
      function H(nx, ny) { return [HX + HS * nx, HY + HS * ny]; }
      function L(nx, ny) { return [LX + LW * nx, LY + LH * ny]; }
      function polyD(pts, f) { return 'M' + pts.map(function (q) { var a = f(q[0], q[1]); return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' L') + ' Z'; }
      function smooth(a) { // 화면 좌표 점들 → 부드러운 곡선
        var d = 'M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1);
        for (var i = 0; i < a.length - 1; i++) {
          var p0 = a[i - 1] || a[i], p1 = a[i], p2 = a[i + 1], p3 = a[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
            (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
        return d;
      }
      function pill(parent, x, y, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.92 + 14;
        el('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, x, y + 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        g.__t = tx;
        return g;
      }
      function card(parent, x, y, w, h) {
        return el('rect', { x: x, y: y, width: w, height: h, rx: 12, fill: 'rgba(255,255,255,.95)', filter: cardSh }, parent);
      }
      function grad(id, stops, radial) {
        var g = el(radial ? 'radialGradient' : 'linearGradient', radial ? { id: id, cx: '38%', cy: '32%', r: '75%' } : { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, g); });
        return 'url(#' + id + ')';
      }
      var SKIN = grad('nmHfSkin', [['0%', '#fbeee2'], ['60%', '#efd2bd'], ['100%', '#d6ad92']], true);
      var LIVER = grad('nmHfLiver', [['0%', '#e9a493'], ['55%', '#b65a4a'], ['100%', '#7c3328']], true);
      var WATER = grad('nmHfWater', [['0%', '#bcdcf2', 0.55], ['100%', '#5d97c9', 0.85]]);

      // ── 무대(카메라가 움직이는 세계) ──
      var clipS = el('clipPath', { id: 'nmHfStage' }, defs);
      el('rect', { x: 96, y: 0, width: 298, height: 340 }, clipS);
      var stageBox = el('g', { 'clip-path': 'url(#nmHfStage)' }, svg);
      var world = el('g', null, stageBox);

      // 폐(뒤)
      var lungImg = K.image(world, 'lungs', LX, LY, LW, LH, { fadeR: '64%' });
      var LOBE_R = [[0.37, 0.17], [0.30, 0.20], [0.245, 0.32], [0.215, 0.50], [0.21, 0.70], [0.22, 0.87], [0.27, 0.87], [0.35, 0.82], [0.445, 0.775], [0.455, 0.60], [0.445, 0.40], [0.425, 0.23]];
      var LOBE_L = LOBE_R.map(function (p) { return [1 - p[0], p[1]]; });
      function lobeD(pts) { var a = pts.concat([pts[0], pts[1]]).map(function (p) { return L(p[0], p[1]); }); return smooth(a) + ' Z'; }
      var clipLung = el('clipPath', { id: 'nmHfLung' }, defs);
      el('path', { d: lobeD(LOBE_R) }, clipLung); el('path', { d: lobeD(LOBE_L) }, clipLung);
      var lungG = el('g', { 'clip-path': 'url(#nmHfLung)' }, world);
      var congest = el('rect', { x: LX, y: LY, width: LW, height: LH, fill: '#9b2c63', opacity: 0, style: 'mix-blend-mode:multiply' }, lungG);
      var water = el('rect', { x: LX, width: LW, fill: WATER, opacity: 0 }, lungG);
      var surf = el('rect', { x: LX, height: 2, width: LW, fill: '#e8f4fc', opacity: 0 }, lungG);
      // 폐포 속 물방울·거품(보이는 바깥 가장자리와 위쪽 폐에)
      var DROP = [[0.24, 0.62], [0.27, 0.48], [0.31, 0.34], [0.36, 0.24], [0.22, 0.78], [0.76, 0.62], [0.73, 0.48], [0.69, 0.34], [0.64, 0.24], [0.78, 0.78], [0.40, 0.30], [0.60, 0.30]];
      var drops = DROP.map(function (p) { var a = L(p[0], p[1]); return el('circle', { cx: a[0], cy: a[1], r: 0, fill: K.sphere(svg, '#6fa6d6'), opacity: 0.9 }, lungG); });
      var frothG = el('g', { opacity: 0 }, lungG);
      [[0.30, 0.30], [0.34, 0.27], [0.27, 0.36], [0.38, 0.22], [0.66, 0.30], [0.62, 0.26], [0.71, 0.36], [0.58, 0.21], [0.25, 0.55], [0.75, 0.55], [0.33, 0.42], [0.67, 0.42]].forEach(function (p, i) {
        var a = L(p[0], p[1]);
        el('circle', { cx: a[0], cy: a[1], r: 3 + (i % 3) * 0.8, fill: K.sphere(svg, '#f4bfd0'), stroke: '#fff', 'stroke-width': 0.6 }, frothG);
        el('circle', { cx: a[0] + 5, cy: a[1] + 3, r: 2.2, fill: K.sphere(svg, '#fbe3ea') }, frothG);
      });

      // 심장(앞)
      var heartG = el('g', null, world);
      el('ellipse', { cx: H(0.5, 0.95)[0], cy: H(0.5, 0.95)[1], rx: 70, ry: 8, fill: '#1a2b4a', opacity: 0.12 }, heartG);
      K.image(heartG, 'heart', HX, HY, HS, HS, { fadeR: '62%' });
      var CH = {
        RA: [[0.24, 0.33], [0.30, 0.27], [0.42, 0.27], [0.49, 0.33], [0.50, 0.50], [0.40, 0.53], [0.27, 0.53], [0.22, 0.45]],
        LA: [[0.53, 0.38], [0.58, 0.31], [0.70, 0.30], [0.77, 0.36], [0.77, 0.47], [0.70, 0.52], [0.58, 0.52], [0.53, 0.47]],
        RV: [[0.24, 0.55], [0.50, 0.53], [0.53, 0.70], [0.60, 0.88], [0.45, 0.84], [0.32, 0.76], [0.24, 0.65]],
        LV: [[0.53, 0.53], [0.80, 0.50], [0.84, 0.62], [0.79, 0.80], [0.67, 0.93], [0.60, 0.88], [0.53, 0.70]]
      };
      function centroid(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return H(x / pts.length, y / pts.length); }
      var dil = grad('nmHfDil', [['0%', '#ffd36b', 0.55], ['70%', '#ff8a3d', 0.35], ['100%', '#ff6a2a', 0.0]], true);
      function overlay(k) {
        var c = centroid(CH[k]);
        var g = el('g', null, heartG);
        var p = el('path', { d: polyD(CH[k], H), fill: 'none' }, g);
        return { g: g, p: p, cx: c[0], cy: c[1] };
      }
      var ov = { RA: overlay('RA'), LA: overlay('LA'), RV: overlay('RV'), LV: overlay('LV') };
      var lbl = {
        RA: pill(heartG, H(0.38, 0.42)[0], H(0.38, 0.42)[1], '우심방', '#3d4a54'),
        LA: pill(heartG, H(0.66, 0.43)[0], H(0.66, 0.43)[1], '좌심방', '#3d4a54'),
        RV: pill(heartG, H(0.37, 0.66)[0], H(0.37, 0.66)[1], '우심실', '#3d4a54'),
        LV: pill(heartG, H(0.68, 0.68)[0], H(0.68, 0.68)[1], '좌심실', '#3d4a54')
      };
      var weakTag = pill(heartG, 0, 0, '펌프 ↓', C.clay, 12);

      // 정맥 부풂(우심부전): 상·하대정맥 위에 푸른 빛
      var vcG = el('g', { fill: 'none', 'stroke-linecap': 'round', filter: glowS, opacity: 0 }, heartG);
      var svcP = el('path', { d: smooth([H(0.36, 0.30), H(0.335, 0.18), H(0.33, 0.07)]), stroke: '#6f86d6' }, vcG);
      var ivcP = el('path', { d: smooth([H(0.22, 0.56), H(0.215, 0.70), H(0.26, 0.79), H(0.31, 0.84)]), stroke: '#6f86d6' }, vcG);
      // 폐정맥 부풂(좌심부전)
      var pvG = el('g', { fill: 'none', 'stroke-linecap': 'round', filter: glowS, opacity: 0 }, world);
      var pvR = el('path', { d: smooth([H(0.70, 0.36), H(0.80, 0.33), L(0.70, 0.52), L(0.68, 0.40)]), stroke: '#e0604f' }, pvG);
      var pvL = el('path', { d: smooth([H(0.25, 0.31), L(0.30, 0.50), L(0.32, 0.40)]), stroke: '#e0604f' }, pvG);

      // 이름표(혈관·폐)
      var pvTag = pill(world, H(0.90, 0.30)[0], H(0.90, 0.30)[1] + 18, '폐정맥', '#8e3b35');
      var lungTag = pill(world, L(0.20, 0.17)[0], L(0.20, 0.17)[1], '폐', '#8e3b35');
      var svcTag = pill(world, H(0.20, 0.12)[0], H(0.20, 0.12)[1], '상대정맥', '#3d4f7c', 11.5);
      var ivcTag = pill(world, 247, 274, '하대정맥', '#3d4f7c', 11.5);

      // 밀려 고이는 방향(빛나는 갈매기) — 무대 안
      var chevW = el('g', { filter: glowF }, world);
      var PATHS_W = {
        left: [[H(0.66, 0.42), H(0.80, 0.33), L(0.70, 0.52), L(0.68, 0.36), L(0.64, 0.24)], [H(0.62, 0.40), H(0.25, 0.31), L(0.30, 0.50), L(0.32, 0.36), L(0.36, 0.24)]],
        right: [[H(0.37, 0.40), H(0.335, 0.20), H(0.33, 0.03)], [H(0.33, 0.47), H(0.22, 0.56), H(0.215, 0.70), H(0.26, 0.79), H(0.31, 0.86)]]
      };
      // 무대 밖(카드로 이어지는 선) — 카메라가 원위치일 때만
      var linkG = el('g', { opacity: 0 }, svg);
      var NECK = [92, 36], LIV = [92, 100], LEG = [92, 228];
      var top0 = H(0.33, 0.03), bot0 = H(0.31, 0.86);
      var LINKS = [
        [top0, [top0[0], 36], NECK],
        [bot0, [bot0[0], 262], [128, 262], [128, LIV[1]], LIV],
        [[128, 262], [128, LEG[1]], LEG]
      ];
      LINKS.forEach(function (pts) {
        el('path', { d: 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'), fill: 'none', stroke: '#7d93d6', 'stroke-width': 5, 'stroke-linejoin': 'round', opacity: 0.35 }, linkG);
      });
      var chevL = el('g', { filter: glowF }, linkG);
      function mkChev(parent, n) { var a = []; for (var i = 0; i < n; i++) a.push(el('path', { d: 'M-4,-5 L3,0 L-4,5', fill: 'none', stroke: '#ff9a1f', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, parent)); return a; }
      var chevsW = mkChev(chevW, 16), chevsL = mkChev(chevL, 12);
      function polyLen(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
      function polyAt(pts, f) {
        var d = polyLen(pts) * f;
        for (var i = 1; i < pts.length; i++) {
          var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          if (d <= l) { var q = d / l; return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q, a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) }; }
          d -= l;
        }
        var n = pts.length - 1;
        return { x: pts[n][0], y: pts[n][1], a: Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]) };
      }
      function runChev(list, paths, t, on, speed) {
        var per = Math.floor(list.length / paths.length);
        list.forEach(function (cv, i) {
          var pi = Math.floor(i / per);
          if (!on || pi >= paths.length) { cv.setAttribute('opacity', 0); return; }
          var f = ((i % per) / per + t * speed) % 1;
          var p = polyAt(paths[pi], f);
          cv.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') rotate(' + (p.a * 180 / Math.PI).toFixed(1) + ')');
          cv.setAttribute('opacity', (on * Math.min(1, f * 5, (1 - f) * 5)).toFixed(2));
        });
      }

      // ── 왼쪽 세로 카드 ──
      // 우심부전: 경정맥·간·복수·다리·체중
      var rCol = el('g', null, svg);
      var CW = 86, CX0 = 6;
      function slot(i) { return 6 + i * 66; }
      [0, 1, 2, 3, 4].forEach(function (i) { card(rCol, CX0, slot(i), CW, 60); });
      // 1 목
      var y0 = slot(0);
      el('circle', { cx: 34, cy: y0 + 16, r: 10, fill: SKIN }, rCol);
      el('path', { d: 'M27,' + (y0 + 24) + ' L26,' + (y0 + 42) + ' L44,' + (y0 + 42) + ' L42,' + (y0 + 24) + ' Z', fill: SKIN }, rCol);
      var jvd = el('path', { d: 'M37,' + (y0 + 25) + ' C40,' + (y0 + 31) + ' 35,' + (y0 + 35) + ' 38,' + (y0 + 42), fill: 'none', stroke: '#4a5fa8', 'stroke-width': 2, 'stroke-linecap': 'round', filter: glowS }, rCol);
      var neckT = K.label(rCol, 70, y0 + 24, '목', { size: 12, fill: C.muted, weight: 700 });
      var neckT2 = K.label(rCol, CX0 + CW / 2, y0 + 51, '', { size: 12, fill: C.clay, weight: 800 });
      // 2 간
      y0 = slot(1);
      var liver = el('path', { d: 'M16,' + (y0 + 22) + ' C18,' + (y0 + 8) + ' 60,' + (y0 + 5) + ' 84,' + (y0 + 13) + ' C80,' + (y0 + 22) + ' 64,' + (y0 + 34) + ' 40,' + (y0 + 40) + ' C26,' + (y0 + 41) + ' 15,' + (y0 + 34) + ' 16,' + (y0 + 22) + ' Z', fill: LIVER }, rCol);
      var liverT = K.label(rCol, CX0 + CW / 2, y0 + 51, '간', { size: 12, fill: C.muted, weight: 700 });
      // 3 배
      y0 = slot(2);
      var bellyCy = y0 + 25;
      var belly = el('ellipse', { cx: 49, cy: bellyCy, rx: 26, ry: 14, fill: SKIN }, rCol);
      var clipB = el('clipPath', { id: 'nmHfBelly' }, defs);
      var bellyClip = el('ellipse', { cx: 49, cy: bellyCy, rx: 26, ry: 14 }, clipB);
      var ascites = el('rect', { x: 15, width: 70, height: 0, fill: WATER, 'clip-path': 'url(#nmHfBelly)' }, rCol);
      var bellyT = K.label(rCol, CX0 + CW / 2, y0 + 51, '복부', { size: 12, fill: C.muted, weight: 700 });
      // 4 다리
      y0 = slot(3);
      var legA = el('rect', { y: y0 + 6, height: 36, rx: 6, fill: SKIN }, rCol);
      var legB = el('rect', { y: y0 + 6, height: 36, rx: 6, fill: SKIN }, rCol);
      var dent = el('ellipse', { cy: y0 + 26, rx: 0, ry: 0, fill: '#c69a7e' }, rCol);
      var finger = el('rect', { y: y0 + 21, width: 18, height: 9, rx: 4.5, fill: K.sphere(svg, '#e7b99d'), opacity: 0 }, rCol);
      var legT = K.label(rCol, CX0 + CW / 2, y0 + 51, '다리', { size: 12, fill: C.muted, weight: 700 });
      // 5 체중계
      y0 = slot(4);
      el('rect', { x: 22, y: y0 + 8, width: 54, height: 30, rx: 8, fill: K.sphere(svg, '#e6ecef') }, rCol);
      el('path', { d: 'M36,' + (y0 + 26) + ' A13,13 0 0 1 62,' + (y0 + 26), fill: '#fff', stroke: '#b9c4cb', 'stroke-width': 1 }, rCol);
      var needle = el('line', { x1: 49, y1: y0 + 27, x2: 49, y2: y0 + 15, stroke: C.clay, 'stroke-width': 2, 'stroke-linecap': 'round' }, rCol);
      el('circle', { cx: 49, cy: y0 + 27, r: 2.2, fill: C.ink }, rCol);
      var scaleT = K.label(rCol, CX0 + CW / 2, y0 + 51, '체중', { size: 12, fill: C.muted, weight: 700 });

      // 좌심부전: 기좌호흡 두 장면
      var lCol = el('g', null, svg);
      card(lCol, CX0, 6, CW, 158); card(lCol, CX0, 172, CW, 158);
      // 누운 사람
      el('rect', { x: 14, y: 96, width: 70, height: 8, rx: 3, fill: K.sphere(svg, '#d8e0e4') }, lCol);
      el('rect', { x: 24, y: 84, width: 52, height: 12, rx: 6, fill: K.sphere(svg, '#9fb0bb') }, lCol);
      el('circle', { cx: 20, cy: 86, r: 7, fill: SKIN }, lCol);
      var breath = el('g', { filter: glowS }, lCol);
      [0, 1, 2].forEach(function (i) { el('path', { d: 'M' + (22 + 7 * i) + ',' + (70 - 5 * i) + ' q-4,-4 0,-8', stroke: C.clay, 'stroke-width': 1.8, fill: 'none' }, breath); });
      K.label(lCol, 49, 128, '누우면', { size: 12.5, fill: C.clay, weight: 800 });
      K.label(lCol, 49, 146, '숨참', { size: 12.5, fill: C.clay, weight: 800 });
      // 앉은 사람
      el('rect', { x: 14, y: 262, width: 70, height: 8, rx: 3, fill: K.sphere(svg, '#d8e0e4') }, lCol);
      el('rect', { x: 18, y: 206, width: 8, height: 58, rx: 3, fill: K.sphere(svg, '#d8e0e4') }, lCol);
      el('path', { d: 'M34,222 L38,256 L74,258', stroke: '#9fb0bb', 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lCol);
      el('circle', { cx: 34, cy: 212, r: 7, fill: SKIN }, lCol);
      K.label(lCol, 49, 296, '앉으면', { size: 12.5, fill: C.teal, weight: 800 });
      K.label(lCol, 49, 314, '편함', { size: 12.5, fill: C.teal, weight: 800 });

      // ── 오른쪽 위: 증상 카드 ──
      var symG = el('g', null, svg);
      card(symG, 400, 8, 194, 124);
      var symTitle = K.label(symG, 412, 26, '', { size: 13, weight: 800, anchor: 'start', fill: C.navy });
      var symRows = [];
      for (var s = 0; s < 5; s++) {
        var ry = 47 + s * 19;
        symRows.push({ dot: el('circle', { cx: 416, cy: ry, r: 4, fill: K.sphere(svg, '#c8423b') }, symG), t: K.label(symG, 426, ry, '', { size: 12.5, anchor: 'start', fill: C.ink, weight: 700 }) });
      }
      var LIST = {
        left: { title: '폐 울혈 증상', rows: [['호흡곤란', 4.4], ['수포음(crackles)', 5.2], ['기좌호흡', 6.8], ['발작성 야간 호흡곤란', 7.6], ['분홍 거품 객담', 9.0]] },
        right: { title: '우심부전 원인', rows: [['좌심부전(가장 흔함)', 0.3], ['COPD 등 폐질환(폐성심)', 0.9], ['폐색전증·폐고혈압', 1.5], ['', 99], ['', 99]] }
      };

      // ── 오른쪽 아래: RAAS 고리 ──
      var cyc = el('g', null, svg);
      card(cyc, 400, 140, 194, 194);
      K.label(cyc, 412, 157, '전방 부전 → RAAS', { size: 13, weight: 800, anchor: 'start', fill: C.navy });
      var ITEMS = ['심박출량 ↓', '신장 혈류 ↓ → 레닌', '안지오텐신 II → 혈관 수축', '알도스테론 → Na·물 저류', '혈액량 ↑ → 울혈 악화'];
      var boxes = ITEMS.map(function (txt, i) {
        var y = 180 + i * 31;
        var r = el('rect', { x: 408, y: y - 12, width: 166, height: 24, rx: 8, fill: '#f3f6f7', stroke: '#dfe6e9', 'stroke-width': 1 }, cyc);
        var tx = K.label(cyc, 491, y, txt, { size: 12, weight: 700, fill: C.muted });
        if (i < ITEMS.length - 1) el('line', { x1: 491, y1: y + 12, x2: 491, y2: y + 18, stroke: '#9aa6b4', 'stroke-width': 1.4, 'marker-end': 'url(#' + arrId + ')' }, cyc);
        return { r: r, t: tx };
      });
      var back = el('path', { d: 'M574,304 L585,304 L585,180 L578,180', fill: 'none', stroke: '#9aa6b4', 'stroke-width': 1.6, 'marker-end': 'url(#' + arrId + ')' }, cyc);

      // 카메라
      var CAMS = {
        left: [[0, 245, 170, 1], [2.2, 245, 170, 1], [2.9, 292, 128, 1.35], [4.4, 292, 128, 1.35], [5.0, 246, 104, 1.2], [6.8, 246, 104, 1.2], [7.4, 245, 170, 1], [15, 245, 170, 1]],
        right: [[0, 245, 170, 1], [2.2, 245, 170, 1], [2.9, 214, 160, 1.35], [4.0, 214, 160, 1.35], [4.6, 245, 170, 1], [15, 245, 170, 1]]
      };
      function cam(t, L) {
        var k = CAMS[L ? 'left' : 'right'];
        for (var i = 1; i < k.length; i++) if (t <= k[i][0]) {
          var a = k[i - 1], b = k[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          K.camera(world, K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e), 245, 170);
          return K.lerp(a[3], b[3], e);
        }
        return 1;
      }

      function beat(t) { var x = (t % 1.1) / 1.1; return x < 0.35 ? Math.sin(Math.PI * x / 0.35) : 0; }

      return function render(t, o) {
        t = ((t % DUR) + DUR) % DUR;
        var Lf = o.side !== 'right', R = !Lf;
        var cong = K.easeInOut(K.seg(t, 2.2, 4.4));
        var z = cam(t, Lf);

        // 심실 박동 빛 / 약한 쪽 어둡게
        var b = beat(t);
        ['LV', 'RV'].forEach(function (k) {
          var weak = (k === 'LV') === Lf;
          var p = ov[k].p;
          if (weak) {
            p.setAttribute('fill', '#2a0a14'); p.setAttribute('fill-opacity', (0.16 + 0.05 * b).toFixed(3));
            p.setAttribute('stroke', '#ff9a1f'); p.setAttribute('stroke-width', 2); p.setAttribute('stroke-dasharray', '5 4');
            p.setAttribute('filter', glowS); p.removeAttribute('style');
          } else {
            p.setAttribute('fill', '#fff7e0'); p.setAttribute('fill-opacity', (0.32 * b).toFixed(3));
            p.setAttribute('stroke', 'none'); p.removeAttribute('filter');
            p.setAttribute('style', 'mix-blend-mode:screen');
          }
        });
        // 상류 심방 부풂
        ['LA', 'RA'].forEach(function (k) {
          var on = (k === 'LA') === Lf;
          var o2 = ov[k], s = on ? 1 + 0.13 * cong : 1;
          o2.g.setAttribute('transform', 'translate(' + o2.cx + ',' + o2.cy + ') scale(' + s.toFixed(3) + ') translate(' + (-o2.cx) + ',' + (-o2.cy) + ')');
          o2.p.setAttribute('fill', on ? dil : 'none'); o2.p.setAttribute('fill-opacity', on ? cong : 0);
          o2.p.setAttribute('stroke', on && cong > 0 ? '#ffd25a' : 'none'); o2.p.setAttribute('stroke-width', 2);
          if (on) o2.p.setAttribute('filter', glowS); else o2.p.removeAttribute('filter'); o2.p.setAttribute('stroke-dasharray', '4 3');
        });
        var wc = Lf ? H(0.68, 0.68) : H(0.37, 0.66);
        weakTag.setAttribute('transform', 'translate(' + wc[0] + ',' + (wc[1] + 24) + ')');
        weakTag.setAttribute('opacity', (0.6 + 0.4 * Math.abs(Math.sin(t * 2.2))).toFixed(2));

        // 정맥 부풂
        vcG.setAttribute('opacity', R ? cong : 0);
        [svcP, ivcP].forEach(function (p) { p.setAttribute('stroke-width', (3 + 6 * cong).toFixed(1)); p.setAttribute('stroke-opacity', 0.55); });
        pvG.setAttribute('opacity', Lf ? cong : 0);
        [pvR, pvL].forEach(function (p) { p.setAttribute('stroke-width', (3 + 5 * cong).toFixed(1)); p.setAttribute('stroke-opacity', 0.5); });
        pvTag.setAttribute('opacity', Lf ? 1 : 0); lungTag.setAttribute('opacity', Lf ? 1 : 0);
        svcTag.setAttribute('opacity', R ? 1 : 0); ivcTag.setAttribute('opacity', R ? 1 : 0);

        // 폐 울혈·폐부종(좌)
        var edema = Lf ? K.seg(t, 4.4, 10.0) : 0;
        congest.setAttribute('opacity', Lf ? (0.22 * cong).toFixed(3) : 0);
        var top = L(0, 0.93)[1] - (L(0, 0.93)[1] - L(0, 0.30)[1]) * K.easeInOut(edema);
        water.setAttribute('y', top.toFixed(1)); water.setAttribute('height', (L(0, 0.95)[1] - top).toFixed(1));
        water.setAttribute('opacity', edema > 0 ? 0.9 : 0);
        surf.setAttribute('y', (top - 1).toFixed(1)); surf.setAttribute('opacity', edema > 0 ? 0.7 : 0);
        drops.forEach(function (d, i) {
          var on = Lf && t >= 4.4 + (i % 6) * 0.35;
          d.setAttribute('r', on ? (2.6 + 1.6 * Math.abs(Math.sin(t * 1.7 + i))).toFixed(2) : 0);
        });
        frothG.setAttribute('opacity', Lf ? K.seg(t, 9.0, 9.8) : 0);
        // 폐에 집중할 땐 심장을 반투명하게(엑스선처럼)
        var see = Lf ? K.seg(t, 4.2, 4.9) * (1 - K.seg(t, 10.6, 11.2)) : 0;
        heartG.setAttribute('opacity', (1 - 0.6 * see).toFixed(2));

        // 갈매기: 무대 안
        runChev(chevsW, PATHS_W[Lf ? 'left' : 'right'], t, t >= 2.2 ? K.seg(t, 2.2, 2.8) : 0, 0.13);
        // 무대 밖 연결(우심부전, 카메라 원위치 후)
        var linkOn = R && z < 1.02 ? K.seg(t, 4.3, 4.9) : 0;
        linkG.setAttribute('opacity', linkOn.toFixed(2));
        runChev(chevsL, LINKS, t, linkOn, 0.12);

        // 왼쪽 세로 카드
        rCol.setAttribute('display', R ? 'inline' : 'none');
        lCol.setAttribute('display', Lf ? 'inline' : 'none');
        if (Lf) {
          lCol.setAttribute('opacity', (0.35 + 0.65 * K.seg(t, 6.6, 7.2)).toFixed(2));
          breath.setAttribute('opacity', (0.4 + 0.6 * Math.abs(Math.sin(t * 3))).toFixed(2));
        } else {
          var jv = K.seg(t, 4.4, 5.6);
          jvd.setAttribute('stroke-width', (2 + 3.5 * jv).toFixed(2));
          neckT2.textContent = jv > 0 ? '경정맥 팽대' : '경정맥';
          neckT2.setAttribute('fill', jv > 0 ? C.clay : C.muted);
          neckT.textContent = '';
          var lv = K.seg(t, 6.4, 7.4), sc = 1 + 0.16 * lv, lc = slot(1) + 24;
          liver.setAttribute('transform', 'translate(49,' + lc + ') scale(' + sc.toFixed(3) + ') translate(-49,' + (-lc) + ')');
          liverT.textContent = lv > 0 ? '간비대' : '간'; liverT.setAttribute('fill', lv > 0 ? C.clay : C.muted);
          var as = K.seg(t, 7.0, 8.2), rx = 26 + 6 * as, ry2 = 14 + 4 * as;
          belly.setAttribute('rx', rx); belly.setAttribute('ry', ry2); bellyClip.setAttribute('rx', rx); bellyClip.setAttribute('ry', ry2);
          ascites.setAttribute('height', (13 * as).toFixed(1)); ascites.setAttribute('y', (bellyCy + ry2 - 13 * as).toFixed(1));
          bellyT.textContent = as > 0 ? '복수' : '복부'; bellyT.setAttribute('fill', as > 0 ? C.clay : C.muted);
          var ed = K.seg(t, 8.4, 9.2), lw = 12 + 6 * ed;
          legA.setAttribute('x', 49 - 2 - lw); legA.setAttribute('width', lw);
          legB.setAttribute('x', 49 + 2); legB.setAttribute('width', lw);
          var press = K.pulse(t, 9.2, 10.2), edge = 49 + 2 + lw;
          finger.setAttribute('x', (edge - 3 + 12 * (1 - press)).toFixed(1)); finger.setAttribute('opacity', press > 0.02 ? 1 : 0);
          var dn = t >= 9.7 ? 1 - 0.5 * K.seg(t, 10.2, 12.5) : 0;
          dent.setAttribute('cx', edge - 4); dent.setAttribute('rx', 3 * dn); dent.setAttribute('ry', 4 * dn);
          legT.textContent = t >= 9.7 ? '함요부종(자국)' : ed > 0 ? '함요부종' : '다리'; legT.setAttribute('fill', ed > 0 ? C.clay : C.muted);
          var wg = K.easeInOut(K.seg(t, 10.4, 11.8)), ang = (-50 + 80 * wg) * Math.PI / 180, ny = slot(4) + 27;
          needle.setAttribute('x2', (49 + 12 * Math.sin(ang)).toFixed(1)); needle.setAttribute('y2', (ny - 12 * Math.cos(ang)).toFixed(1));
          scaleT.textContent = wg > 0 ? '체중 ↑' : '체중'; scaleT.setAttribute('fill', wg > 0 ? C.clay : C.muted);
        }

        // 증상 카드
        var lst = LIST[Lf ? 'left' : 'right'];
        symTitle.textContent = lst.title;
        symRows.forEach(function (r, i) {
          var row = lst.rows[i], on = row[0] && t >= row[1];
          r.t.textContent = row[0] || '';
          r.t.setAttribute('opacity', on ? 1 : 0); r.dot.setAttribute('opacity', on ? 1 : 0);
          r.t.setAttribute('fill', Lf ? '#8a3a26' : C.ink);
        });

        // RAAS 고리
        var c0 = Lf ? 11.0 : 12.0, onC = t >= c0;
        var cur = onC ? Math.floor((t - c0) / 0.45) : -1;
        boxes.forEach(function (bx, i) {
          var hot = onC && (i <= cur || t - c0 > 2.7);
          var now = onC && i === cur;
          bx.r.setAttribute('fill', hot ? '#fbe3da' : '#f3f6f7');
          bx.r.setAttribute('stroke', hot ? C.clay : '#dfe6e9');
          bx.r.setAttribute('stroke-width', now ? 2.2 : 1);
          if (now) bx.r.setAttribute('filter', glowS); else bx.r.removeAttribute('filter');
          bx.t.setAttribute('fill', hot ? '#8a3a26' : C.muted);
        });
        var bh = onC && t - c0 > 2.25;
        back.setAttribute('stroke', bh ? C.clay : '#9aa6b4');
        back.setAttribute('marker-end', 'url(#' + (bh ? arrHot : arrId) + ')');
        cyc.setAttribute('opacity', onC ? 1 : 0.7);
      };
    }
  });
})();
