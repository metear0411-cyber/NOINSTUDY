// 욕창 — 압력(뼈 쪽이 가장 크다)·전단력(층이 어긋남)·30° 측위
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var STEPS = {
    press: [
      { at: 0.0, label: '구조', text: '천골 위 조직을 잘라 본 그림이다. 위에서부터 **뼈 → 근육 → 피하지방 → 진피 → 표피**, 그 아래가 매트리스다. 천골·대전자·발뒤꿈치처럼 **뼈가 튀어나온 곳**이 욕창 호발 부위다.' },
      { at: 1.5, label: '압력 집중', text: '체중이 뼈 돌출부로 모여 아래를 누른다. 압력은 **원뿔 모양**으로 퍼져 피부 쪽은 넓고 약하게, **뼈에 가까운 깊은 곳은 좁고 세게** 걸린다. 게다가 근육은 피부보다 허혈에 약하다.' },
      { at: 4.0, label: '모세혈관 폐쇄', text: '조직에 걸린 압력이 **모세혈관압(고전적 기준 약 32mmHg)**을 넘으면 모세혈관이 눌려 닫힌다. 산소와 영양이 끊기고 노폐물이 쌓인다.' },
      { at: 6.5, label: '허혈 → 괴사', text: '계속 눌리면 **깊은 근육부터 괴사**한다. 겉은 멀쩡하거나 **보라·적갈색 변색**만 보이는 **심부조직손상**이 이렇게 생긴다. 손상은 **압력의 크기 × 시간**: 낮은 압력도 오래가면 위험하다.' },
      { at: 9.5, label: '압력 해제', text: '체위를 바꿔 압력을 풀면 피가 다시 몰려 붉어지는 **반응성 충혈**이 온다. 손가락으로 눌러 **하얘지면 정상 반응**, **눌러도 하얘지지 않는 발적**이면 **1단계 욕창**이다.' },
      { at: 12.0, label: '예방', text: '**2시간마다 체위변경**, **압력분산 매트리스**, 단백질·수분 섭취, 피부 청결·건조(실금 관리). 위험은 **Braden 척도**로 사정하며 **점수가 낮을수록 위험**하다. 발적 부위 마사지는 하지 않는다.' }
    ],
    shear: [
      { at: 0.0, label: '침대 머리', text: '왼쪽은 누운 사람과 침대, 오른쪽은 천골 부위 조직 단면이다. 지금은 침대가 평평해 조직 층이 곧게 쌓여 있다.' },
      { at: 1.5, label: '미끄러짐', text: '침대 머리를 **30°보다 높이** 올리면 몸이 중력으로 **발치 쪽으로 미끄러진다**.' },
      { at: 4.0, label: '전단력', text: '**피부는 시트에 붙어 있고 뼈대는 아래로 내려가** 깊은 조직 층이 서로 어긋난다(전단력). 층을 가로지르는 **혈관이 늘어나고 꺾여** 피가 끊긴다. 천골·꼬리뼈 욕창이 흔한 이유다.' },
      { at: 8.0, label: '마찰', text: '미끄러진 환자를 시트 위로 **끌어 올리면** 피부와 시트가 비벼져 **표피가 벗겨진다(마찰)**. 땀·실금으로 피부가 젖어 있으면 더 쉽게 다친다.' },
      { at: 11.0, label: '예방', text: '**침상 머리는 30° 이하**(식사·경관영양 뒤 필요한 시간만 올리고 다시 낮춘다), **무릎 쪽을 약간 올려** 미끄러짐을 막고, 옮길 때는 **끌지 않고 들어 올린다**(리프트 시트·2인). 피부는 건조하게.' }
    ],
    lat30: [
      { at: 0.0, label: '앙와위', text: '골반을 발치에서 본 단면이다. 똑바로 누우면 체중이 **천골**에 몰린다. 천골은 노인 욕창이 가장 흔한 자리다.' },
      { at: 3.5, label: '90° 측위', text: '옆으로 완전히 돌리면 이번엔 **대전자**(넙다리뼈 바깥 돌출부)에 압력이 집중된다. 피하조직이 얇아 위험하다.' },
      { at: 7.5, label: '30° 측위', text: '등 뒤에 베개를 받쳐 **30°만 기울이면** 천골과 대전자를 모두 피하고 **근육이 두꺼운 둔부**로 체중이 나뉜다. 욕창 예방 체위의 기본이다.' },
      { at: 11.0, label: '2시간마다', text: '**2시간마다** 좌우 30° 측위와 앙와위를 번갈아 바꾼다. 압력분산 매트리스를 써도 체위변경은 계속한다. **발뒤꿈치는 종아리 밑에 베개를 넣어 띄운다**.' }
    ]
  };

  M.register({
    id: 'pressure-shear',
    title: '욕창 — 압력·전단력과 30° 측위',
    system: '피부',
    topics: ['pressure-injury', 'ltc-wound-care', 'skin-sensory-assessment'],
    duration: 14,
    options: [{
      key: 'mode', label: '보기',
      choices: [{ value: 'press', label: '압력' }, { value: 'shear', label: '전단력' }, { value: 'lat30', label: '30° 측위' }],
      value: 'press'
    }],
    steps: STEPS.press,
    stepsFor: function (o) { return STEPS[o.mode] || STEPS.press; },
    source: '모세혈관압 약 32mmHg는 고전적 기준(Landis)으로, 실제 손상 역치는 사람·부위마다 다르다. 2시간 체위변경은 기본 원칙이며 개인 위험에 따라 조정. 그림은 설명용으로 단순화.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var BONE = '#efe6cf', BONE_S = '#bfae86', STAGE = '#eff3f4';
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: STAGE }, svg);
      var glowF = K.glow(svg, 2.4), softSh = K.shadow(svg, 3, 4, 0.22), pillSh = K.shadow(svg, 1.5, 2, 0.25);

      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.92)', filter: pillSh }, g);
        var tx = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, at: function (x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); return this; } };
      }
      // 뒤집어 놓은 피부 블록 그림: 원본은 피부가 위 → 바로 누운 자세로 보이게 위아래를 뒤집는다
      function flipped(parent, x, y, w, h) {
        var g = el('g', { transform: 'translate(0,' + (2 * y + h) + ') scale(1,-1)' }, parent);
        K.image(g, 'skin-sacrum', x, y, w, h, { fadeR: '64%' });
        return g;
      }
      function cam(keys, t) {
        for (var i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
          var a = keys[i - 1], b = keys[i], e = K.easeInOut(K.seg(t, a[0], b[0]));
          return [K.lerp(a[1], b[1], e), K.lerp(a[2], b[2], e), K.lerp(a[3], b[3], e)];
        }
        var z = keys[keys.length - 1]; return [z[1], z[2], z[3]];
      }
      var downId = K.arrowHead(svg, C.navy, 'nmPsDown');

      // ════════ 1) 압력 ════════
      var gP = el('g', null, svg);
      var clipP = el('clipPath', { id: 'nmPsClipP' }, defs);
      el('rect', { x: 0, y: 0, width: 404, height: 340 }, clipP);
      var viewP = el('g', { 'clip-path': 'url(#nmPsClipP)' }, gP);
      var camP = el('g', null, viewP);
      var IX = -44, IY = 4, IW = 492, IH = 328;
      function Q(nx, ny) { return [IX + IW * nx, IY + IH * (1 - ny)]; } // 원본 그림 좌표 → 뒤집힌 화면 좌표
      // 매트리스(블록이 살짝 눌려 앉는다)
      var mg = el('linearGradient', { id: 'nmPsMat', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#dfe8f1' }, mg); el('stop', { offset: '1', 'stop-color': '#b9c8d8' }, mg);
      flipped(camP, IX, IY, IW, IH);
      var mat = el('path', { d: 'M-20,300 C60,300 90,292 170,292 C250,292 290,300 420,300 L420,360 L-20,360 Z', fill: 'url(#nmPsMat)', filter: softSh }, camP);
      for (var mx = 0; mx < 410; mx += 34) el('path', { d: 'M' + mx + ',312 q17,6 34,0', fill: 'none', stroke: '#a7b8ca', 'stroke-width': 1.2 }, camP);
      var matL = pill(camP, '매트리스', C.blue).at(52, 322);
      // 층 이름표(블록 오른쪽 옆면 앞)
      var CX = Q(0.43, 0)[0];
      var LAY = [['뼈(천골)', 0.80], ['근육', 0.55], ['피하지방', 0.36], ['진피', 0.255], ['표피·피부', 0.17]];
      var layPills = LAY.map(function (a) { var p = Q(0.80, a[1]); return pill(camP, a[0], '#5a3a30').at(p[0], p[1]); });
      // 압력 원뿔: 뼈 쪽은 좁고 진하게, 피부 쪽은 넓고 옅게
      var cg = el('linearGradient', { id: 'nmPsCone', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#6a0a1c', 'stop-opacity': '0.78' }, cg);
      el('stop', { offset: '0.55', 'stop-color': '#b02a3a', 'stop-opacity': '0.42' }, cg);
      el('stop', { offset: '1', 'stop-color': '#e0605a', 'stop-opacity': '0.12' }, cg);
      var yBone = Q(0, 0.64)[1], ySkin = Q(0, 0.2)[1];
      var cone = el('path', { d: 'M' + (CX - 26) + ',' + yBone + ' L' + (CX + 26) + ',' + yBone + ' L' + (CX + 128) + ',' + ySkin + ' L' + (CX - 128) + ',' + ySkin + ' Z',
        fill: 'url(#nmPsCone)', opacity: 0 }, camP);
      var coneEdge = el('path', { d: 'M' + (CX - 26) + ',' + yBone + ' L' + (CX - 128) + ',' + ySkin + ' M' + (CX + 26) + ',' + yBone + ' L' + (CX + 128) + ',' + ySkin,
        fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0, filter: glowF }, camP);
      // 모세혈관(입체 고리)
      var capF = K.sphere(svg, '#d8323a');
      var caps = [];
      [[0.30, 0.56], [0.43, 0.58], [0.56, 0.56], [0.22, 0.47], [0.36, 0.48], [0.50, 0.47], [0.64, 0.48],
        [0.26, 0.36], [0.40, 0.37], [0.55, 0.36], [0.68, 0.38], [0.33, 0.26], [0.47, 0.26], [0.60, 0.27]].forEach(function (n) {
        var p = Q(n[0], n[1]);
        var depth = K.clamp((p[1] - ySkin) / (yBone - ySkin), 0, 1); // 1 = 피부 쪽
        var half = 26 + 102 * depth;
        var dx = Math.abs(p[0] - CX);
        var inten = dx < half ? (1 - 0.45 * depth) * (1 - 0.5 * dx / half) : 0;
        caps.push({ inten: inten, n: el('ellipse', { cx: p[0], cy: p[1], rx: 8, ry: 4.5, fill: capF, stroke: '#7d1018', 'stroke-width': 1, filter: softSh }, camP) });
      });
      var coneL = pill(camP, '압력: 깊은 곳일수록 세다', '#8a1020', 12.5).at(CX, yBone + 26);
      // 괴사(깊은 곳)·피부 변색·반응성 충혈
      var ng = el('radialGradient', { id: 'nmPsNec' }, defs);
      el('stop', { offset: '0', 'stop-color': '#2a0a22', 'stop-opacity': '0.9' }, ng);
      el('stop', { offset: '0.7', 'stop-color': '#4a1d3a', 'stop-opacity': '0.7' }, ng);
      el('stop', { offset: '1', 'stop-color': '#4a1d3a', 'stop-opacity': '0' }, ng);
      var necro = el('ellipse', { cx: CX, cy: yBone + 10, rx: 0, ry: 0, fill: 'url(#nmPsNec)' }, camP);
      var necroL = pill(camP, '깊은 곳부터 괴사', '#4a1d3a', 12.5).at(CX, yBone + 58);
      var skinMark = el('ellipse', { cx: CX, cy: Q(0, 0.12)[1], rx: 40, ry: 9, fill: '#6a2a5a', opacity: 0, style: 'mix-blend-mode:multiply' }, camP);
      var skinL = pill(camP, '겉은 변색 정도뿐', '#5a2a4a').at(CX + 112, Q(0, 0.12)[1] + 4);
      var hg = el('radialGradient', { id: 'nmPsHyp' }, defs);
      el('stop', { offset: '0', 'stop-color': '#ff3b30', 'stop-opacity': '0.55' }, hg);
      el('stop', { offset: '1', 'stop-color': '#ff3b30', 'stop-opacity': '0' }, hg);
      var hyper = el('ellipse', { cx: CX, cy: Q(0, 0.2)[1], rx: 150, ry: 40, fill: 'url(#nmPsHyp)', opacity: 0, style: 'mix-blend-mode:multiply' }, camP);
      var hyperL = pill(camP, '반응성 충혈', '#a3201a', 13).at(CX, Q(0, 0.29)[1]);
      // 체중 화살표
      var wArrow = el('g', null, gP);
      el('line', { x1: CX, y1: 0, x2: CX, y2: 30, stroke: C.navy, 'stroke-width': 4, 'marker-end': 'url(#' + downId + ')' }, wArrow);
      pill(wArrow, '체중', C.navy, 13).at(CX + 40, 14);
      var turn = pill(gP, '체위변경 → 압력 해제', C.teal, 13).at(CX, 18);
      var capP = pill(camP, '모세혈관', '#9a1a22', 12);

      // 오른쪽: 압력 막대 카드
      var R = el('g', null, gP);
      el('rect', { x: 414, y: 14, width: 174, height: 310, rx: 14, fill: '#fff', filter: softSh }, R);
      K.label(R, 428, 38, '깊은 조직의 압력', { size: 13, anchor: 'start', fill: C.ink, weight: 800 });
      var BY0 = 250, BY1 = 60;
      function by(v) { return BY0 - (BY0 - BY1) * v / 80; }
      var tg = el('linearGradient', { id: 'nmPsTube', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      el('stop', { offset: '0', 'stop-color': '#e3e9ec' }, tg); el('stop', { offset: '0.5', 'stop-color': '#fbfcfd' }, tg); el('stop', { offset: '1', 'stop-color': '#d5dde2' }, tg);
      el('rect', { x: 434, y: BY1, width: 24, height: BY0 - BY1, rx: 12, fill: 'url(#nmPsTube)', stroke: '#d3dbe0' }, R);
      var bar = el('rect', { x: 437, y: BY0, width: 18, height: 0, rx: 9, fill: K.sphere(svg, C.clay) }, R);
      el('line', { x1: 428, y1: by(32), x2: 466, y2: by(32), stroke: C.navy, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, R);
      K.label(R, 472, by(32) - 9, '약 32mmHg', { size: 13, anchor: 'start', fill: C.navy, weight: 800 });
      K.label(R, 472, by(32) + 8, '모세혈관압', { size: 12, anchor: 'start', fill: C.navy, weight: 700 });
      K.label(R, 472, by(32) + 24, '(고전적 기준)', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });
      var capState = K.label(R, 472, by(70), '', { size: 12.5, anchor: 'start', weight: 800 });
      K.label(R, 428, 278, '누른 시간', { size: 12.5, anchor: 'start', fill: C.muted, weight: 700 });
      var clock = K.label(R, 428, 302, '', { size: 15, anchor: 'start', weight: 800 });
      var CAMP = [[0, CX, 170, 1], [1.5, CX, 170, 1], [2.4, CX, 165, 1.1], [4.0, CX, 165, 1.1], [4.8, CX, 180, 1.3], [6.5, CX, 180, 1.3],
        [7.3, CX, 150, 1.3], [9.5, CX, 150, 1.3], [10.3, CX, 215, 1.15], [12.0, CX, 215, 1.15], [12.8, CX, 170, 1], [14, CX, 170, 1]];

      // ════════ 2) 전단력 ════════
      var gS = el('g', null, svg);
      var P0 = { x: 140, y: 236 };
      // 침대 틀·매트리스(입체)
      var bg = el('linearGradient', { id: 'nmPsBed', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#d6e1ec' }, bg); el('stop', { offset: '1', 'stop-color': '#93a8bd' }, bg);
      el('rect', { x: 38, y: 258, width: 266, height: 8, rx: 4, fill: '#7d8b99', filter: softSh }, gS);
      [54, 288].forEach(function (x) { el('rect', { x: x - 3, y: 262, width: 6, height: 44, rx: 3, fill: '#7d8b99' }, gS); });
      var bedHead = el('line', { stroke: 'url(#nmPsBed)', 'stroke-width': 16, 'stroke-linecap': 'round', filter: softSh }, gS);
      var bedFoot = el('polyline', { fill: 'none', stroke: '#a9bbcd', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: softSh }, gS);
      var ref30 = el('line', { x1: P0.x, y1: P0.y, x2: P0.x - 124 * Math.cos(Math.PI / 6), y2: P0.y - 124 * Math.sin(Math.PI / 6), stroke: C.teal, 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }, gS);
      var ref30L = pill(gS, '30°', C.teal, 12.5).at(P0.x - 70, P0.y - 14);
      var skG = el('linearGradient', { id: 'nmPsSkin', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#f6dcc6' }, skG); el('stop', { offset: '1', 'stop-color': '#d9a888' }, skG);
      var body = el('polyline', { fill: 'none', stroke: '#e3b898', 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: softSh }, gS);
      var bodyHi = el('polyline', { fill: 'none', stroke: '#f7e1cf', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.7 }, gS);
      var headC = el('circle', { r: 16, fill: K.sphere(svg, '#e8bd9c'), filter: softSh }, gS);
      var sacDot = el('circle', { r: 6.5, fill: K.sphere(svg, '#efe0bd'), stroke: BONE_S, 'stroke-width': 1.2 }, gS);
      var angP = pill(gS, '침대 머리 45°', C.clay, 14);
      var slideA = el('g', null, gS);
      var slideId = K.arrowHead(svg, C.clay, 'nmPsSlide');
      var slideLine = el('line', { stroke: C.clay, 'stroke-width': 3.5, 'marker-end': 'url(#' + slideId + ')' }, slideA);
      var slideP = pill(slideA, '몸이 발치로 미끄러짐', C.clay);
      var dragA = el('g', null, gS);
      var dragId = K.arrowHead(svg, C.purple, 'nmPsDrag');
      var dragLine = el('line', { stroke: C.purple, 'stroke-width': 3.5, 'marker-end': 'url(#' + dragId + ')' }, dragA);
      var dragP = pill(dragA, '시트 위로 끌어 올리기', C.purple);
      var prevP = pill(gS, '30° 이하 · 무릎 약간 올림 · 들어서 옮기기', C.teal, 12.5).at(160, 300);

      // 조직 블록(오른쪽): 뒤집은 그림을 가로 띠로 잘라 깊은 층일수록 발치 쪽으로 민다
      var SX = 292, SY = 34, SW = 306, SH = 204;
      function S(nx, ny) { return [SX + SW * nx, SY + SH * (1 - ny)]; }
      var bands = [], NB = 9, yTop = S(0, 0.97)[1], yBot = S(0, 0.07)[1];
      for (var bi = 0; bi < NB; bi++) {
        var y0 = yTop + (yBot - yTop) * bi / NB, y1 = yTop + (yBot - yTop) * (bi + 1) / NB;
        var cid = 'nmPsBand' + bi;
        var gb = el('g', null, gS);
        var cp = el('clipPath', { id: cid }, defs);
        el('rect', { x: SX - 60, y: y0 - 0.6, width: SW + 120, height: y1 - y0 + 1.2 }, cp);
        var inner = el('g', { 'clip-path': 'url(#' + cid + ')' }, gb);
        flipped(inner, SX, SY, SW, SH);
        bands.push({ g: gb, y: (y0 + y1) / 2 });
      }
      var sheet = el('rect', { x: SX + 30, y: yBot - 6, width: SW - 60, height: 14, rx: 7, fill: 'url(#nmPsMat)', filter: softSh }, gS);
      var sheetP = pill(gS, '시트(피부가 붙어 있음)', C.blue).at(SX + SW / 2, yBot + 26);
      var bonePill = pill(gS, '뼈(천골)', '#5a3a30'), musPill = pill(gS, '근육', '#5a3a30'), fatPill = pill(gS, '피하지방', '#5a3a30');
      var vessels = [];
      for (var vi = 0; vi < 4; vi++) vessels.push(el('polyline', { fill: 'none', stroke: '#e0303a', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', filter: glowF }, gS));
      var kinkP = pill(gS, '층이 어긋나 혈관이 늘어나고 꺾임', C.clay, 12.5).at(SX + SW / 2 - 6, 318);
      var fricP = pill(gS, '마찰: 표피가 벗겨짐', C.purple, 12.5).at(SX + SW / 2 - 6, 318);
      var boneMoveP = pill(gS, '뼈대는 발치 쪽으로 →', C.clay, 12.5).at(SX + SW / 2 + 10, 22);
      var abr = [];
      for (vi = 0; vi < 5; vi++) abr.push(el('ellipse', { cx: SX + 52 + vi * 40, cy: yBot - 8, rx: 13, ry: 4, fill: '#b02a2a', opacity: 0, filter: glowF }, gS));

      // ════════ 3) 30° 측위 ════════
      var gL = el('g', null, svg);
      var lm = el('path', { fill: 'url(#nmPsMat)', filter: softSh }, gL);
      var lmL = pill(gL, '매트리스', C.blue).at(60, 304);
      pill(gL, '골반을 발치에서 본 단면', C.muted).at(98, 22);
      var pillow = el('path', { fill: K.sphere(svg, '#f1e4c6'), stroke: '#d4c193', 'stroke-width': 1, filter: softSh }, gL);
      var pillowL = pill(gL, '베개', '#8a6420');
      var pel = el('g', { filter: softSh }, gL);
      var RX = 110, RY = 66;
      var bodyG = el('radialGradient', { id: 'nmPsBody', cx: '40%', cy: '35%', r: '70%' }, defs);
      el('stop', { offset: '0', 'stop-color': '#fbe5d3' }, bodyG); el('stop', { offset: '0.7', 'stop-color': '#eec2a3' }, bodyG); el('stop', { offset: '1', 'stop-color': '#cf9a7a' }, bodyG);
      el('ellipse', { cx: 0, cy: 0, rx: RX, ry: RY, fill: 'url(#nmPsBody)', stroke: '#c39072', 'stroke-width': 1.5 }, pel);
      el('ellipse', { cx: 0, cy: 20, rx: 84, ry: 38, fill: '#d98a7c', opacity: 0.55 }, pel);
      var boneF = K.sphere(svg, '#efe2c2');
      el('path', { d: 'M-64,-10 C-36,-36 36,-36 64,-10 C46,8 18,20 0,20 C-18,20 -46,8 -64,-10 Z', fill: boneF, stroke: BONE_S, 'stroke-width': 1.2 }, pel);
      el('path', { d: 'M-15,28 L15,28 L0,56 Z', fill: boneF, stroke: BONE_S, 'stroke-width': 1.2 }, pel);
      el('circle', { cx: 94, cy: 0, r: 12, fill: boneF, stroke: BONE_S, 'stroke-width': 1.2 }, pel);
      el('circle', { cx: -94, cy: 0, r: 12, fill: boneF, stroke: BONE_S, 'stroke-width': 1.2 }, pel);
      var hotG = el('radialGradient', { id: 'nmPsHot' }, defs);
      el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.9' }, hotG);
      el('stop', { offset: '0.35', 'stop-color': '#fff', 'stop-opacity': '0.5' }, hotG);
      el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }, hotG);
      var hot = el('circle', { r: 30, opacity: 0 }, pel);
      var hotRing = el('circle', { r: 30, fill: 'none', 'stroke-width': 2.5, opacity: 0, filter: glowF }, pel);
      var lbBelly = pill(gL, '배 쪽', '#8a5a44');
      var lbSac = pill(gL, '천골', '#7a6a45'), lbTro = pill(gL, '대전자', '#7a6a45');
      var lbHot = pill(gL, '', C.clay, 13);
      var LR = el('g', null, gL);
      el('rect', { x: 414, y: 14, width: 174, height: 310, rx: 14, fill: '#fff', filter: softSh }, LR);
      K.label(LR, 428, 38, '어디에 압력이?', { size: 13, anchor: 'start', fill: C.ink, weight: 800 });
      var rows = [['앙와위', '천골', C.clay], ['90° 측위', '대전자', C.clay], ['30° 측위', '둔부 근육', C.green]].map(function (r, i) {
        var y = 66 + i * 54;
        return {
          bg: el('rect', { x: 422, y: y - 16, width: 158, height: 44, rx: 10, fill: C.surface }, LR),
          a: K.label(LR, 434, y - 1, r[0], { size: 13, anchor: 'start', fill: C.ink, weight: 800 }),
          b: K.label(LR, 434, y + 17, '→ ' + r[1], { size: 12.5, anchor: 'start', fill: r[2], weight: 700 })
        };
      });
      K.label(LR, 428, 236, '체위변경', { size: 12.5, anchor: 'start', fill: C.muted, weight: 700 });
      K.label(LR, 428, 260, '2시간마다', { size: 16, anchor: 'start', fill: C.teal, weight: 800 });
      var lrSide = K.label(LR, 428, 286, '', { size: 12.5, anchor: 'start', fill: C.ink, weight: 700 });
      var lrHeel = K.label(LR, 428, 306, '발뒤꿈치는 띄우기', { size: 12.5, anchor: 'start', fill: C.ink, weight: 700 });

      // ── 그리기 ──
      function renderPress(t) {
        var cp = cam(CAMP, t);
        K.camera(camP, cp[0], cp[1], cp[2], CX, 170);
        var on = K.easeInOut(K.seg(t, 1.5, 3.2));
        var off = K.easeInOut(K.seg(t, 9.5, 10.6));
        var pr = on * (1 - off);
        cone.setAttribute('opacity', pr); coneEdge.setAttribute('opacity', 0.8 * pr);
        coneL.g.setAttribute('opacity', pr * (t < 4.0 ? 1 : 0));
        wArrow.setAttribute('opacity', 1 - off);
        turn.g.setAttribute('opacity', off);
        caps.forEach(function (c) {
          var tc = 4.0 + (1 - c.inten) * 1.6;
          var closed = c.inten > 0.3 ? K.seg(t, tc, tc + 0.6) * (1 - off) : 0;
          c.n.setAttribute('ry', (4.5 * (1 - 0.8 * closed)).toFixed(2));
          c.n.setAttribute('rx', (8 + 2.5 * closed).toFixed(2));
          c.n.setAttribute('fill', closed > 0.5 ? K.sphere(svg, '#6b5a66') : capF);
        });
        var nec = K.easeOut(K.seg(t, 6.5, 8.6)) * (1 - off);
        necro.setAttribute('rx', (78 * nec).toFixed(1)); necro.setAttribute('ry', (38 * nec).toFixed(1));
        necroL.g.setAttribute('opacity', nec > 0.6 ? 1 : 0);
        var sk = K.seg(t, 7.6, 8.8) * (1 - off);
        skinMark.setAttribute('opacity', 0.6 * sk);
        skinL.g.setAttribute('opacity', sk);
        var hy = K.seg(t, 10.0, 10.8) * (1 - K.seg(t, 12.6, 13.8));
        hyper.setAttribute('opacity', hy);
        hyperL.g.setAttribute('opacity', hy);
        layPills.forEach(function (p) { p.g.setAttribute('opacity', K.clamp(1 - (cp[2] - 1.1) * 8, 0, 1)); });
        var cc = caps[1].n; capP.at(+cc.getAttribute('cx') + 44, +cc.getAttribute('cy') + 2);
        capP.g.setAttribute('opacity', K.seg(t, 4.0, 4.4) * (1 - K.seg(t, 6.3, 6.6)));
        var v = 70 * pr + 6;
        bar.setAttribute('y', by(v)); bar.setAttribute('height', BY0 - by(v));
        bar.setAttribute('fill', K.sphere(svg, v > 32 ? C.clay : C.teal));
        capState.textContent = v > 32 ? (t >= 4.0 ? '모세혈관 닫힘' : '') : (t >= 9.5 ? '혈류 다시 열림' : '');
        capState.setAttribute('fill', v > 32 ? C.clay : C.teal);
        capState.setAttribute('y', v > 32 ? by(70) : by(14));
        var hrs = t < 1.5 ? 0 : t < 6.5 ? 2 * (t - 1.5) / 5 : t < 9.5 ? 2 + (t - 6.5) / 3 : 0;
        if (t >= 9.5) { clock.textContent = '체위변경!'; clock.setAttribute('fill', C.teal); }
        else {
          var h = Math.floor(hrs), m = Math.floor((hrs - h) * 60 / 10) * 10;
          clock.textContent = (h ? h + '시간 ' : '') + m + '분';
          clock.setAttribute('fill', hrs >= 2 ? C.clay : C.ink);
        }
      }

      function renderShear(t) {
        var up = K.easeInOut(K.seg(t, 1.5, 3.2)), down = K.easeInOut(K.seg(t, 11.0, 12.2));
        var deg = 45 * up - 15 * down;
        var th = deg * Math.PI / 180;
        var knee = down;
        var hx = P0.x - 118 * Math.cos(th), hy = P0.y - 118 * Math.sin(th);
        bedHead.setAttribute('x1', P0.x); bedHead.setAttribute('y1', P0.y); bedHead.setAttribute('x2', hx); bedHead.setAttribute('y2', hy);
        var kx = 222, ky = P0.y - 14 * knee;
        bedFoot.setAttribute('points', P0.x + ',' + P0.y + ' ' + kx + ',' + ky + ' 296,' + P0.y);
        ref30.setAttribute('opacity', t >= 1.5 ? 0.9 : 0); ref30L.g.setAttribute('opacity', t >= 1.5 ? 1 : 0);
        angP.t.textContent = deg < 1 ? '침대 평평(0°)' : '침대 머리 ' + Math.round(deg) + '°';
        angP.t.setAttribute('fill', deg > 31 ? C.clay : C.teal);
        angP.at(96, 28);
        var slide = 18 * K.easeInOut(K.seg(t, 2.6, 4.4)) * (1 - K.easeInOut(K.seg(t, 8.0, 9.6)));
        var off = 15;
        var nx = Math.sin(th), ny = -Math.cos(th);
        var hipX = P0.x + slide, hipY = P0.y - off;
        var tl = 92 - slide;
        var bx = P0.x - tl * Math.cos(th) + off * nx, byy = P0.y - tl * Math.sin(th) + off * ny;
        var cx0 = P0.x + off * nx * 0.6, cy0 = P0.y - off;
        var feetX = Math.min(292, hipX + 150);
        var pts = [bx, byy, cx0, cy0, hipX, hipY, kx, ky - off, feetX, P0.y - off].map(function (v) { return v.toFixed(1); }).join(' ');
        body.setAttribute('points', pts);
        bodyHi.setAttribute('points', [bx, byy - 6, cx0, cy0 - 6, hipX, hipY - 6, kx, ky - off - 6, feetX, P0.y - off - 6].map(function (v) { return v.toFixed(1); }).join(' '));
        var hcx = P0.x - (tl + 18) * Math.cos(th) + (off + 2) * nx, hcy = P0.y - (tl + 18) * Math.sin(th) + (off + 2) * ny;
        headC.setAttribute('cx', hcx.toFixed(1)); headC.setAttribute('cy', hcy.toFixed(1));
        sacDot.setAttribute('cx', hipX.toFixed(1)); sacDot.setAttribute('cy', (hipY + 2).toFixed(1));
        var sl = K.seg(t, 2.6, 3.2) * (1 - K.seg(t, 7.6, 8.0));
        slideA.setAttribute('opacity', sl);
        slideLine.setAttribute('x1', hipX - 14); slideLine.setAttribute('y1', P0.y + 40);
        slideLine.setAttribute('x2', hipX + 34); slideLine.setAttribute('y2', P0.y + 40);
        slideP.at(hipX + 10, P0.y + 62);
        var dr = K.seg(t, 8.0, 8.5) * (1 - K.seg(t, 10.6, 11.0));
        dragA.setAttribute('opacity', dr);
        dragLine.setAttribute('x1', hipX + 30); dragLine.setAttribute('y1', P0.y + 40);
        dragLine.setAttribute('x2', hipX - 18); dragLine.setAttribute('y2', P0.y + 40);
        dragP.at(hipX + 6, P0.y + 62);
        prevP.g.setAttribute('opacity', K.seg(t, 11.0, 11.6));

        var sh = 40 * K.easeInOut(K.seg(t, 2.8, 4.6)) * (1 - K.easeInOut(K.seg(t, 8.0, 9.6)));
        function shearAt(y) { var u = K.clamp((yBot - 8 - y) / (yBot - 8 - S(0, 0.62)[1]), 0, 1); return sh * Math.pow(u, 1.5); }
        bands.forEach(function (b) { b.g.setAttribute('transform', 'translate(' + shearAt(b.y).toFixed(2) + ',0)'); });
        var yb = S(0, 0.82)[1], ym = S(0, 0.52)[1], yf = S(0, 0.33)[1];
        bonePill.at(S(0.5, 0)[0] + shearAt(yb), yb);
        musPill.at(S(0.5, 0)[0] + shearAt(ym), ym);
        fatPill.at(S(0.5, 0)[0] + shearAt(yf), yf);
        var kink = sh / 40;
        [0.27, 0.40, 0.53, 0.66].forEach(function (nxv, i) {
          var x = S(nxv, 0)[0], pts2 = [];
          [0.12, 0.22, 0.30, 0.40, 0.50, 0.62].forEach(function (nyv, j) {
            var y = S(0, nyv)[1], xx = x + shearAt(y);
            if (j === 3) xx += 6 * kink * (i % 2 ? 1 : -1);
            pts2.push(xx.toFixed(1) + ',' + y.toFixed(1));
          });
          vessels[i].setAttribute('points', pts2.join(' '));
          vessels[i].setAttribute('stroke', K.mix('#e0303a', '#6b5a66', kink));
          vessels[i].setAttribute('stroke-width', (3 - 1.4 * kink).toFixed(2));
        });
        kinkP.g.setAttribute('opacity', kink > 0.5 ? 1 : 0);
        fricP.g.setAttribute('opacity', kink <= 0.5 && dr > 0.5 ? 1 : 0);
        boneMoveP.g.setAttribute('opacity', K.clamp(kink * 1.5 - 0.3, 0, 1));
        abr.forEach(function (a, i) { a.setAttribute('opacity', (K.seg(t, 8.4 + i * 0.25, 8.9 + i * 0.25) * (1 - K.seg(t, 12.6, 13.4))).toFixed(2)); });
      }

      function renderLat(t) {
        var a1 = K.easeInOut(K.seg(t, 3.5, 4.6)), a2 = K.easeInOut(K.seg(t, 7.5, 8.6)), a3 = K.easeInOut(K.seg(t, 11.0, 12.4));
        var deg = 90 * a1 - 60 * a2;
        deg = deg * (1 - a3) + (-30) * a3;
        var ph = deg * Math.PI / 180;
        var s = Math.sin(ph), c = Math.cos(ph);
        var low = Math.sqrt(RX * RX * s * s + RY * RY * c * c);
        var SINK = 8;
        var cx = 205, cy = 270 + SINK - low;
        pel.setAttribute('transform', 'translate(' + cx + ',' + cy.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')');
        // 매트리스가 닿는 자리에서 살짝 꺼진다
        var qx = RX * RX * s / low, qy = RY * RY * c / low;
        var wx = cx + qx * c - qy * s;
        var d = 'M10,270';
        for (var x = 10; x <= 404; x += 6) { var u = (x - wx) / 60; d += ' L' + x + ',' + (270 + SINK * Math.exp(-u * u)).toFixed(1); }
        lm.setAttribute('d', d + ' L404,320 L10,320 Z');
        var dSac = Math.hypot(qx, qy - 56), dTro = Math.hypot(qx - Math.sign(s || 1) * 94, qy);
        var bony = dSac < 34 ? 'sac' : dTro < 34 ? 'tro' : 'mus';
        var col = bony === 'mus' ? C.green : C.oxy;
        hot.setAttribute('cx', (qx - 20 * s).toFixed(1)); hot.setAttribute('cy', (qy - 20 * c).toFixed(1));
        hot.setAttribute('fill', col); hot.setAttribute('opacity', 0.35);
        hot.setAttribute('r', bony === 'mus' ? 30 : 20);
        hotRing.setAttribute('cx', (qx - 20 * s).toFixed(1)); hotRing.setAttribute('cy', (qy - 20 * c).toFixed(1));
        hotRing.setAttribute('r', ((bony === 'mus' ? 30 : 20) + 3 * Math.sin(t * 5)).toFixed(1));
        hotRing.setAttribute('stroke', col); hotRing.setAttribute('opacity', 0.9);
        function world(lx, ly) { return { x: cx + lx * c - ly * s, y: cy + lx * s + ly * c }; }
        var ps = world(0, 40), pt = world(Math.sign(s || 1) * 94, 0), pb = world(0, -RY - 16);
        lbBelly.at(pb.x, pb.y);
        lbSac.at(ps.x, ps.y - 30);
        lbTro.at(pt.x - 34 * Math.sign(s || 1) * Math.cos(ph), pt.y - 26);
        lbTro.g.setAttribute('opacity', Math.abs(deg) > 50 ? 1 : 0);
        lbHot.t.textContent = bony === 'sac' ? '천골에 압력 집중' : bony === 'tro' ? '대전자에 압력 집중' : '근육 많은 둔부로 분산';
        lbHot.t.setAttribute('fill', bony === 'mus' ? C.green : C.clay);
        var wtxt = lbHot.t.textContent.length * 13 * 0.95 + 14;
        lbHot.g.firstChild.setAttribute('x', -wtxt / 2); lbHot.g.firstChild.setAttribute('width', wtxt);
        lbHot.at(205, 326);
        var pOn = Math.abs(Math.abs(deg) - 30) < 8 ? 1 : 0;
        if (pOn) {
          var side = deg > 0 ? -1 : 1;
          var b = world(side * 64, 52);
          var xa = side < 0 ? b.x - 46 : b.x - 10, xb = xa + 56, yt = b.y - 6;
          pillow.setAttribute('d', 'M' + xa.toFixed(1) + ',272 L' + xa.toFixed(1) + ',' + (yt + 16).toFixed(1) + ' Q' + xa.toFixed(1) + ',' + yt.toFixed(1) + ' ' + (xa + 16).toFixed(1) + ',' + yt.toFixed(1) +
            ' L' + (xb - 16).toFixed(1) + ',' + yt.toFixed(1) + ' Q' + xb.toFixed(1) + ',' + yt.toFixed(1) + ' ' + xb.toFixed(1) + ',' + (yt + 16).toFixed(1) + ' L' + xb.toFixed(1) + ',272 Z');
          pillow.setAttribute('opacity', 1);
          pillowL.at((xa + xb) / 2, 252); pillowL.g.setAttribute('opacity', 1);
        } else { pillow.setAttribute('opacity', 0); pillowL.g.setAttribute('opacity', 0); }
        var cur = Math.abs(deg) < 8 ? 0 : Math.abs(deg) > 80 ? 1 : pOn ? 2 : -1;
        rows.forEach(function (r, i) { r.bg.setAttribute('fill', i === cur ? (i === 2 ? C.greenSoft : C.claySoft) : C.surface); });
        lrSide.textContent = t >= 11.0 ? '좌우 30° ↔ 앙와위' : '';
        lrHeel.setAttribute('opacity', t >= 11.0 ? 1 : 0);
      }

      return function render(t, o) {
        var m = o.mode;
        gP.setAttribute('display', m === 'press' ? 'inline' : 'none');
        gS.setAttribute('display', m === 'shear' ? 'inline' : 'none');
        gL.setAttribute('display', m === 'lat30' ? 'inline' : 'none');
        if (m === 'press') renderPress(t);
        else if (m === 'shear') renderShear(t);
        else renderLat(t);
      };
    }
  });
})();
