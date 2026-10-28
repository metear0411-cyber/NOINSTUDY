// 뼈 재형성 — 파골세포가 헐고 조골세포가 다시 짓는다. 둘의 균형이 깨지면 골다공증
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var S = 168;            // 뼈 표면 높이
  var PX = 205, PW = 100; // 구멍 중심·반폭
  var PARAM = {
    normal: { D: 42, F: 42, clast: 1.0, digEnd: 6.0 },
    osteo: { D: 60, F: 34, clast: 1.22, digEnd: 6.0 },
    bp: { D: 20, F: 20, clast: 0.85, digEnd: 4.4 }
  };

  var INTRO = '뼈는 평생 **파골세포가 헐고 조골세포가 다시 짓는** 재형성을 되풀이한다. 성인 골격은 해마다 약 10%가 이렇게 바뀐다.';
  var STEPS = {
    normal: [
      { at: 0.0, label: '휴지기', text: INTRO + ' 평소 뼈 표면은 납작한 피복세포가 덮고 있다.' },
      { at: 1.5, label: '흡수', text: '**파골세포**(핵이 여럿인 거대세포)가 붙어 산과 효소로 뼈를 녹여 구멍을 판다. 녹아 나온 **칼슘은 혈액으로** 가 혈중 칼슘을 유지한다(부갑상선호르몬이 이 과정을 자극).' },
      { at: 6.0, label: '역전', text: '흡수를 마친 파골세포는 **세포자멸**로 사라지고, 같은 자리에 조골세포가 모여든다.' },
      { at: 7.4, label: '형성', text: '**조골세포**가 콜라겐 기질(**유골**)을 채운 뒤 칼슘·인이 붙어 **석회화**된다. 장에서 칼슘을 흡수하려면 **비타민 D**가 필요하다.' },
      { at: 11.5, label: '균형', text: '**흡수량 = 형성량**이면 골량이 유지된다. 골밀도(DXA)는 젊은 성인 평균과 비교한 **T-점수**로 본다: **−1 이상 정상**, **−1~−2.5 골감소증**, **−2.5 이하 골다공증**.' }
    ],
    osteo: [
      { at: 0.0, label: '폐경 후', text: INTRO + ' **에스트로겐**은 파골세포를 누르는데, 폐경으로 에스트로겐이 줄면 **파골세포의 수와 활성이 늘어난다**(폐경 후 5~10년간 빠른 골소실).' },
      { at: 1.5, label: '과잉 흡수', text: '파골세포가 **더 깊고 넓게** 판다. 녹아 나온 칼슘이 혈액으로 빠져나간다.' },
      { at: 6.0, label: '역전', text: '파골세포가 물러나고 조골세포가 모인다. 노인은 **조골세포 기능도 떨어져** 있다(노인성 골다공증: 비타민 D 합성↓·장 칼슘 흡수↓).' },
      { at: 7.4, label: '모자란 형성', text: '조골세포가 메우지만 판 만큼 채우지 못한다. **흡수 > 형성**이다.' },
      { at: 11.0, label: '골소실 누적', text: '남은 구멍만큼 매 주기 뼈가 줄어든다. 해면골 기둥이 **얇아지고 끊어져** 척추 **압박골절**(키 감소·등 굽음), **고관절**·손목(콜레스) 골절로 이어진다. **T-점수 −2.5 이하**가 골다공증이다.' },
      { at: 12.8, label: '예방', text: '**칼슘·비타민 D** 섭취와 햇볕, **체중부하 운동**(걷기)·근력 운동, 금연·절주, 그리고 **낙상 예방**. 골절은 뼈의 약함과 넘어짐이 만나야 생긴다.' }
    ],
    bp: [
      { at: 0.0, label: '약이 붙는다', text: '**비스포스포네이트**(알렌드로네이트 등)는 뼈 표면 무기질에 달라붙는다(금색 점). ' + '파골세포가 뼈를 녹일 때 이 약을 함께 삼키게 된다.' },
      { at: 1.5, label: '흡수 억제', text: '약을 삼킨 **파골세포는 기능이 멈추고 세포자멸**로 일찍 사라진다. 그래서 구멍이 **얕게** 끝난다.' },
      { at: 7.4, label: '균형 회복', text: '조골세포가 얕은 구멍을 다 메운다. 흡수와 형성의 균형이 돌아와 골소실이 멈추고 골밀도가 조금 오르며 **골절 위험이 줄어든다**.' },
      { at: 11.0, label: '복용법', text: '**아침 공복**에 일어나자마자 **물 한 컵(200mL 이상)**과 함께 먹고, **30분간 눕지 말고** 음식·다른 약·커피도 미룬다. 흡수율이 매우 낮고 **식도염**을 일으키기 때문이다.' },
      { at: 12.8, label: '주의', text: '속쓰림·삼킴곤란은 식도 손상 신호다. 드물게 **턱뼈 괴사**가 있어 발치 등 치과 시술 전 복용 사실을 알린다. 저칼슘혈증은 먼저 교정하고, 칼슘제는 시간을 띄워 먹는다.' }
    ]
  };

  // 0~1 구멍 모양
  function bump(x) { var u = (x - PX) / PW; return Math.abs(u) >= 1 ? 0 : Math.pow(Math.cos(u * Math.PI / 2), 2); }

  M.register({
    id: 'bone-remodeling',
    title: '뼈 재형성 — 헐기와 짓기의 균형, 골다공증',
    system: '근골격',
    topics: ['osteoporosis', 'prevention-falls-nutrition', 'aging-changes'],
    duration: 14,
    options: [{
      key: 'mode', label: '상태',
      choices: [{ value: 'normal', label: '정상' }, { value: 'osteo', label: '폐경 후·노인 골다공증' }, { value: 'bp', label: '비스포스포네이트' }],
      value: 'normal'
    }],
    steps: STEPS.normal,
    stepsFor: function (o) { return STEPS[o.mode] || STEPS.normal; },
    source: 'T-점수 기준(WHO): −1 이상 정상 · −1~−2.5 골감소증 · −2.5 이하 골다공증. 재형성 주기·구멍 깊이는 설명용으로 단순화.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var defs = el('defs', null, svg);
      var BONE = '#eadcbc', BONE_D = '#cdb98c', OSTEOID = '#9fdccf';
      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var glowF = K.glow(svg, 2.2), softSh = K.shadow(svg, 3, 4, 0.22), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      function pill(parent, txt, color, size) {
        var g = el('g', null, parent);
        var w = txt.length * (size || 12) * 0.95 + 14;
        var r = el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11, fill: 'rgba(255,255,255,.93)', filter: pillSh }, g);
        var tx = K.label(g, 0, 0.5, txt, { size: size || 12, fill: color || C.ink, weight: 700 });
        return { g: g, t: tx, at: function (x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); return this; },
          text: function (s2) { tx.textContent = s2; var w2 = s2.length * (size || 12) * 0.95 + 14; r.setAttribute('x', -w2 / 2); r.setAttribute('width', w2); } };
      }

      // ── 왼쪽: 대퇴골두 절단면(해면골) ──
      var clipL = el('clipPath', { id: 'nmBnClipL' }, defs);
      el('rect', { x: 0, y: 0, width: 340, height: 340 }, clipL);
      var left = el('g', { 'clip-path': 'url(#nmBnClipL)' }, svg);
      var camL = el('g', null, left);
      var IX = -96, IY = 0, IW = 510, IH = 340;
      function P(nx, ny) { return [IX + IW * nx, IY + IH * ny]; }
      var imgG = el('g', null, camL);
      K.image(imgG, 'bone-trabecular', IX, IY, IW, IH, { fadeR: '70%' });
      // 골소실: 같은 그림을 중간 밝기만 어둡게(감마↑) 한 사본을 해면골 자리에 겹친다 → 기둥 가장자리가 빈 공간으로 바뀌어 얇아 보인다
      var thin = el('filter', { id: 'nmBnThin', x: '0', y: '0', width: '1', height: '1', 'color-interpolation-filters': 'sRGB' }, defs);
      var ct = el('feComponentTransfer', null, thin);
      el('feFuncR', { type: 'gamma', amplitude: 1, exponent: 2.1, offset: 0 }, ct);
      el('feFuncG', { type: 'gamma', amplitude: 1, exponent: 2.6, offset: 0 }, ct);
      el('feFuncB', { type: 'gamma', amplitude: 1, exponent: 2.8, offset: 0 }, ct);
      var blurM = el('filter', { id: 'nmBnMB', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      el('feGaussianBlur', { stdDeviation: 9 }, blurM);
      var cTh = el('mask', { id: 'nmBnThinMask', maskUnits: 'userSpaceOnUse', x: -200, y: -100, width: 900, height: 600 }, defs);
      var cThG = el('g', { fill: '#fff', filter: 'url(#nmBnMB)' }, cTh);
      var hc = P(0.655, 0.26);
      el('ellipse', { cx: hc[0], cy: hc[1], rx: 0.13 * IW, ry: 0.19 * IH }, cThG);
      var shaft = [[0.31, 0.22], [0.50, 0.30], [0.53, 0.42], [0.48, 0.62], [0.47, 0.92], [0.33, 0.92], [0.30, 0.5]].map(function (q) { return P(q[0], q[1]).map(function (v) { return v.toFixed(1); }).join(','); });
      el('path', { d: 'M' + shaft.join(' L') + ' Z' }, cThG);
      var thinG = el('g', { mask: 'url(#nmBnThinMask)', opacity: 0 }, camL);
      K.image(thinG, 'bone-trabecular', IX, IY, IW, IH, { fade: false }).setAttribute('filter', 'url(#nmBnThin)');
      var ANCH = P(0.60, 0.33);
      var aGlow = el('circle', { cx: ANCH[0], cy: ANCH[1], r: 11, fill: 'none', stroke: '#ffd25a', 'stroke-width': 3, filter: glowF }, camL);
      var lbHead = pill(svg, '대퇴골두', '#7a6a45'), lbTrab = pill(svg, '해면골(그물 기둥)', '#7a6a45'), lbCort = pill(svg, '피질골', '#7a6a45');
      var netP = pill(svg, '', C.green, 12.5);

      // ── 오른쪽 위: 확대 렌즈(재형성 단위) ──
      var LX = 466, LY = 132, LR = 104, LS = 0.86;
      function T(x, y) { return [LX + (x - PX) * LS, LY + (y - 196) * LS]; }
      var callout = el('path', { fill: 'rgba(255,210,90,.16)', stroke: 'rgba(214,160,40,.55)', 'stroke-width': 1.2 }, svg);
      el('circle', { cx: LX, cy: LY, r: LR + 6, fill: '#fff', filter: softSh }, svg);
      var clipLens = el('clipPath', { id: 'nmBnLens' }, defs);
      el('circle', { cx: LX, cy: LY, r: LR }, clipLens);
      var lens = el('g', { 'clip-path': 'url(#nmBnLens)' }, svg);
      var U = el('g', { transform: 'translate(' + (LX - PX * LS) + ',' + (LY - 196 * LS) + ') scale(' + LS + ')' }, lens);
      // 골수(위)
      var mg = el('radialGradient', { id: 'nmBnMarrow', cx: '50%', cy: '30%', r: '80%' }, defs);
      el('stop', { offset: '0', 'stop-color': '#f6d9cf' }, mg); el('stop', { offset: '1', 'stop-color': '#dfa595' }, mg);
      el('rect', { x: -60, y: -60, width: 540, height: S + 60, fill: 'url(#nmBnMarrow)' }, U);
      var seed = 3;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < 16; i++) el('circle', { cx: 20 + rnd() * 380, cy: 20 + rnd() * 110, r: 7 + rnd() * 9, fill: K.sphere(svg, '#f3c4b4'), opacity: 0.55 }, U);
      // 뼈
      var bg = el('linearGradient', { id: 'nmBnBone', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#f7efdb' }, bg); el('stop', { offset: '0.35', 'stop-color': BONE }, bg); el('stop', { offset: '1', 'stop-color': '#c8b182' }, bg);
      var bonePath = el('path', { fill: 'url(#nmBnBone)', stroke: '#bba274', 'stroke-width': 1.5 }, U);
      var lam = el('g', { stroke: '#cdb98c', 'stroke-width': 1.4, fill: 'none', opacity: 0.7 }, U);
      for (var ly = S + 70; ly < 380; ly += 16) el('path', { d: 'M-40,' + ly + ' C120,' + (ly - 5) + ' 280,' + (ly + 5) + ' 440,' + ly }, lam);
      var og = el('linearGradient', { id: 'nmBnOst', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: '0', 'stop-color': '#d9f5ee' }, og); el('stop', { offset: '1', 'stop-color': OSTEOID }, og);
      var newBone = el('path', { fill: 'url(#nmBnOst)', stroke: C.teal, 'stroke-width': 1.4 }, U);
      var newBoneMin = el('path', { fill: 'url(#nmBnBone)', stroke: '#bba274', 'stroke-width': 1.2, opacity: 0 }, U);
      var resLine = el('path', { fill: 'none', stroke: '#ff6a4a', 'stroke-width': 3, 'stroke-dasharray': '6 4', filter: glowF }, U);
      // 피복세포
      var liningF = K.sphere(svg, '#d9c08e');
      [-30, 10, 50, 360, 400, 440].forEach(function (x) { el('ellipse', { cx: x, cy: S - 3, rx: 15, ry: 4.5, fill: liningF }, U); });
      var liningPit = [118, 150, 182, 214, 246, 278, 300].map(function (x) { return el('ellipse', { cx: x, cy: S - 3, rx: 14, ry: 4.5, fill: liningF }, U); });
      // 약 점
      var drug = [];
      for (i = 0; i < 20; i++) { var dx = -40 + i * 25; drug.push({ x: dx, n: el('circle', { cx: dx, cy: S + 3, r: 4.4, fill: K.sphere(svg, '#e8b030'), filter: glowF }, U) }); }
      // 칼슘
      var ca = [];
      for (i = 0; i < 9; i++) ca.push(el('circle', { r: 4.6, fill: K.sphere(svg, '#f2c040'), filter: glowF, opacity: 0 }, U));
      // 파골세포(입체)
      var clast = el('g', { filter: softSh }, U);
      el('path', { d: 'M-46,4 C-48,-26 -16,-34 0,-32 C24,-34 48,-22 46,4 L38,10 L30,4 L22,10 L14,4 L6,10 L-2,4 L-10,10 L-18,4 L-26,10 L-34,4 L-40,10 Z',
        fill: K.sphere(svg, '#b48ad8'), stroke: '#6b3fa0', 'stroke-width': 1.5 }, clast);
      [[-24, -13], [-9, -18], [8, -13], [24, -16], [0, -4]].forEach(function (p) { el('ellipse', { cx: p[0], cy: p[1], rx: 6, ry: 5, fill: K.sphere(svg, '#5a2a8a') }, clast); });
      // 조골세포
      var blasts = [];
      for (i = 0; i < 6; i++) {
        var gB = el('g', { filter: softSh }, U);
        el('rect', { x: -12, y: -24, width: 24, height: 24, rx: 7, fill: K.sphere(svg, '#7fd0c2'), stroke: '#1f7a74', 'stroke-width': 1.2 }, gB);
        el('circle', { cx: 0, cy: -14, r: 5, fill: K.sphere(svg, '#1f6a64') }, gB);
        blasts.push(gB);
      }
      el('circle', { cx: LX, cy: LY, r: LR, fill: 'none', stroke: '#d6dde1', 'stroke-width': 2 }, svg);
      // 렌즈 이름표
      var clastP = pill(svg, '파골세포', '#6b3fa0', 13), clastSub = pill(svg, '', '#6b3fa0');
      var blastP = pill(svg, '조골세포', '#1f7a74', 13);
      var caP = pill(svg, 'Ca²⁺ → 혈액', '#9a6a10');
      var resP = pill(svg, '못 메운 만큼 = 골소실', C.clay, 12.5);
      var marP = pill(svg, '골수', '#9a4a3a'), boneP = pill(svg, '뼈 기질', '#7a6a45');
      marP.at(LX + 62, LY - 66); boneP.at(LX - 58, LY + 70);
      var phase = pill(svg, '', C.ink, 13.5); phase.at(LX, LY - LR - 4);
      var tag = pill(svg, '', C.teal, 12.5); tag.at(LX, LY + LR + 4);

      // ── 오른쪽 아래: T-점수 막대 ──
      var Tc = el('g', null, svg);
      el('rect', { x: 352, y: 258, width: 240, height: 74, rx: 14, fill: '#fff', filter: softSh }, Tc);
      K.label(Tc, 364, 274, 'T-점수(골밀도)', { size: 12.5, anchor: 'start', fill: C.ink, weight: 800 });
      var TX0 = 366, TX1 = 578; // +1 → −4
      function tx(v) { return TX0 + (1 - v) / 5 * (TX1 - TX0); }
      var tg = el('linearGradient', { id: 'nmBnT', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      el('stop', { offset: '0', 'stop-color': '#7fbf73' }, tg); el('stop', { offset: '0.40', 'stop-color': '#7fbf73' }, tg);
      el('stop', { offset: '0.40', 'stop-color': '#e4bf5a' }, tg); el('stop', { offset: '0.70', 'stop-color': '#e4bf5a' }, tg);
      el('stop', { offset: '0.70', 'stop-color': '#d9765f' }, tg); el('stop', { offset: '1', 'stop-color': '#d9765f' }, tg);
      el('rect', { x: TX0, y: 288, width: TX1 - TX0, height: 10, rx: 5, fill: 'url(#nmBnT)' }, Tc);
      [[-1, '−1'], [-2.5, '−2.5']].forEach(function (a) {
        el('line', { x1: tx(a[0]), y1: 285, x2: tx(a[0]), y2: 301, stroke: '#fff', 'stroke-width': 2 }, Tc);
        K.label(Tc, tx(a[0]), 312, a[1], { size: 12, fill: C.muted, weight: 700 });
      });
      K.label(Tc, (tx(1) + tx(-1)) / 2, 324, '정상', { size: 12, fill: C.green, weight: 700 });
      K.label(Tc, (tx(-1) + tx(-2.5)) / 2, 324, '골감소증', { size: 12, fill: '#9a6a10', weight: 700 });
      K.label(Tc, (tx(-2.5) + tx(-4)) / 2, 324, '골다공증', { size: 12, fill: C.clay, weight: 700 });
      var mark = el('circle', { cy: 293, r: 8, fill: K.sphere(svg, '#3a4a5a'), stroke: '#fff', 'stroke-width': 2, filter: softSh }, Tc);
      var markTxt = K.label(Tc, 0, 274, '', { size: 13, anchor: 'end', weight: 800 });

      // 복용법 카드(비스포스포네이트, 마지막 단계)
      var card = el('g', null, svg);
      el('rect', { x: 10, y: 10, width: 214, height: 106, rx: 14, fill: '#fff', filter: softSh }, card);
      el('circle', { cx: 30, cy: 32, r: 9, fill: K.sphere(svg, '#e8b030') }, card);
      K.label(card, 46, 32, '복용법', { size: 13.5, anchor: 'start', fill: '#8a6420', weight: 800 });
      K.label(card, 24, 56, '아침 공복, 물 200mL 이상', { size: 13, anchor: 'start', weight: 700 });
      K.label(card, 24, 78, '30분 눕지 않기', { size: 13, anchor: 'start', weight: 700 });
      K.label(card, 24, 100, '그동안 음식·약·커피 금지', { size: 13, anchor: 'start', weight: 700 });

      function bonePathD(depth) {
        var d = 'M-60,' + S;
        for (var x = -60; x <= 470; x += 5) d += ' L' + x + ',' + (S + depth * bump(x)).toFixed(1);
        return d + ' L470,420 L-60,420 Z';
      }
      function lens2(top, bot) {
        var a = [], b = [];
        for (var x = PX - PW; x <= PX + PW; x += 4) { a.push(x + ',' + (S + top * bump(x)).toFixed(1)); b.unshift(x + ',' + (S + bot * bump(x)).toFixed(1)); }
        return 'M' + a.join(' L') + ' L' + b.join(' L') + ' Z';
      }
      var CAM = [[0, 0.5, 0.5, 1], [1.2, 0.5, 0.5, 1], [2.2, 0.60, 0.38, 1.35], [14, 0.60, 0.38, 1.35]];

      return function render(t, o) {
        var mode = o.mode, Pm = PARAM[mode] || PARAM.normal;
        // 왼쪽 카메라
        var cz = CAM[0];
        for (var k = 1; k < CAM.length; k++) if (t <= CAM[k][0]) {
          var a0 = CAM[k - 1], b0 = CAM[k], e0 = K.easeInOut(K.seg(t, a0[0], b0[0]));
          cz = [0, K.lerp(a0[1], b0[1], e0), K.lerp(a0[2], b0[2], e0), K.lerp(a0[3], b0[3], e0)]; break;
        }
        var cc = P(cz[1], cz[2]), z = cz[3];
        K.camera(camL, cc[0], cc[1], z, 170, 170);
        function scr(p) { return [(p[0] - cc[0]) * z + 170, (p[1] - cc[1]) * z + 170]; }
        var an = scr(ANCH);
        // 렌즈로 이어지는 빛 원뿔
        var dxl = LX - an[0], dyl = LY - an[1], dl = Math.hypot(dxl, dyl), ux = dxl / dl, uy = dyl / dl;
        var t1 = [LX - uy * LR, LY + ux * LR], t2 = [LX + uy * LR, LY - ux * LR];
        callout.setAttribute('d', 'M' + an[0].toFixed(1) + ',' + an[1].toFixed(1) + ' L' + t1[0].toFixed(1) + ',' + t1[1].toFixed(1) + ' L' + t2[0].toFixed(1) + ',' + t2[1].toFixed(1) + ' Z');
        aGlow.setAttribute('r', (9 + 2 * Math.sin(t * 4)).toFixed(1));
        // 그림 이름표
        var h = scr(P(0.66, 0.12)), tr = scr(P(0.42, 0.52)), co = scr(P(0.27, 0.75));
        lbHead.at(h[0], h[1]); lbTrab.at(tr[0], tr[1]); lbCort.at(Math.max(co[0], 40), co[1]);
        var early = 1 - K.seg(t, 1.2, 1.8);
        lbHead.g.setAttribute('opacity', early); lbCort.g.setAttribute('opacity', early);
        // 해면골이 가늘어짐(에로전 필터)
        var er = mode === 'osteo' ? K.seg(t, 6.0, 13.0) : mode === 'bp' ? 0.45 : 0;
        thinG.setAttribute('opacity', (0.85 * er).toFixed(2));
        netP.text(mode === 'normal' ? '기둥이 굵고 촘촘하다' : mode === 'osteo' ? (t >= 6 ? '기둥이 얇아지고 끊어진다' : '해면골 기둥') : '더 얇아지지 않는다');
        netP.t.setAttribute('fill', mode === 'normal' ? C.green : mode === 'osteo' ? C.clay : '#8a6420');
        netP.at(170, 322);
        lbTrab.g.setAttribute('opacity', 1 - K.seg(t, 1.2, 1.8) * 0);

        // 재형성 단위
        var dig = Pm.D * K.easeInOut(K.seg(t, 2.6, Pm.digEnd));
        var fill = Pm.F * K.easeInOut(K.seg(t, 7.4, 11.2));
        bonePath.setAttribute('d', bonePathD(dig));
        var nb = lens2(Math.max(0, dig - fill), dig);
        newBone.setAttribute('d', nb); newBoneMin.setAttribute('d', nb);
        newBone.setAttribute('opacity', fill > 0.5 ? 1 : 0);
        newBoneMin.setAttribute('opacity', fill > 0.5 ? K.seg(t, 9.5, 12).toFixed(2) : 0);
        var showRes = mode === 'osteo' && t >= 11.0;
        resLine.setAttribute('d', 'M' + (PX - PW) + ',' + S + ' L' + (PX + PW) + ',' + S);
        resLine.setAttribute('opacity', showRes ? K.seg(t, 11.0, 11.6) : 0);
        var rp = T(PX, S + (dig - fill) + 26); resP.at(rp[0], rp[1]); resP.g.setAttribute('opacity', showRes ? K.seg(t, 11.0, 11.6) : 0);
        liningPit.forEach(function (n) { n.setAttribute('opacity', 1 - K.seg(t, 1.6, 2.4)); });
        drug.forEach(function (d) {
          var inPit = bump(d.x) > 0.05;
          d.n.setAttribute('opacity', mode === 'bp' ? (inPit ? 1 - K.seg(t, 2.6, 3.6) : 1) : 0);
        });

        var enter = K.easeOut(K.seg(t, 1.5, 2.6));
        var leaveA = mode === 'bp' ? 4.4 : 6.0, leaveB = mode === 'bp' ? 5.4 : 7.0;
        var leave = K.seg(t, leaveA, leaveB);
        var cx = K.lerp(-40, PX, enter), cy = S + dig - 10;
        var sc = Pm.clast * (1 - 0.45 * leave) * (mode === 'bp' ? 1 - 0.18 * K.seg(t, 2.8, leaveA) : 1);
        var wob = t > 2.6 && t < leaveA ? Math.sin(t * 7) * 1.5 : 0;
        clast.setAttribute('transform', 'translate(' + (cx + wob).toFixed(1) + ',' + cy.toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        var cOp = t < 1.5 ? 0 : 1 - leave;
        clast.setAttribute('opacity', cOp);
        var cp = T(cx, cy - 50 * Pm.clast); clastP.at(cp[0], cp[1]); clastP.g.setAttribute('opacity', cOp);
        var subTxt = mode === 'osteo' ? '수·활성↑' : mode === 'bp' && t >= 2.8 ? '약을 삼킴 → 멈춤' : '';
        clastSub.text(subTxt); clastSub.at(cp[0] + (mode === 'bp' ? -10 : 0), cp[1] - 24); clastSub.g.setAttribute('opacity', subTxt ? cOp : 0);

        var caOn = t > 2.8 && t < Pm.digEnd + 0.4;
        ca.forEach(function (n, i2) {
          var ph = ((t * 0.55 + i2 / ca.length) % 1);
          n.setAttribute('cx', PX - 50 + (i2 * 13) % 100 + Math.sin(ph * 6 + i2) * 4);
          n.setAttribute('cy', S - 30 - ph * 56);
          n.setAttribute('opacity', caOn ? (1 - ph) * (mode === 'bp' ? 0.5 : 1) : 0);
        });
        caP.at(438, 46); caP.g.setAttribute('opacity', caOn && mode !== 'bp' ? 1 : 0);

        var bIn = K.easeOut(K.seg(t, 6.8, 7.6)), bOut = K.seg(t, 11.6, 12.6);
        blasts.forEach(function (b, i3) {
          var x = PX - 70 + i3 * 28, y = S + (dig - fill) * bump(x) - 1, y0 = y - 60 * (1 - bIn);
          b.setAttribute('transform', 'translate(' + x + ',' + y0.toFixed(1) + ') scale(1,' + (1 - 0.7 * bOut).toFixed(2) + ')');
          b.setAttribute('opacity', t < 6.8 ? 0 : 1 - 0.6 * bOut);
        });
        var bp = T(PX, S + (dig - fill) * 0.95 - 58 - 30 * (1 - bIn)); blastP.at(bp[0], bp[1]); blastP.g.setAttribute('opacity', t < 6.8 ? 0 : 1 - bOut);
        marP.g.setAttribute('opacity', t < 1.5 ? 1 : 0); boneP.g.setAttribute('opacity', t < 1.5 || t >= 12.6 ? 1 : 0);

        phase.text(t < 1.5 ? '① 휴지기' : t < 6.0 ? '② 흡수' : t < 7.4 ? '③ 역전' : t < 9.5 ? '④ 형성(유골)' : t < 11.5 ? '⑤ 석회화' : '한 주기 끝');
        tag.text(mode === 'osteo' ? '에스트로겐↓ → 파골세포↑' : mode === 'bp' ? '비스포스포네이트 → 파골세포 억제' : '흡수 = 형성');
        tag.t.setAttribute('fill', mode === 'osteo' ? C.clay : mode === 'bp' ? '#8a6420' : C.teal);
        card.setAttribute('opacity', mode === 'bp' ? K.seg(t, 11.0, 11.5) : 0);

        var tv = mode === 'normal' ? -0.3 : mode === 'osteo' ? K.lerp(-1.7, -3.1, K.seg(t, 6.0, 13.0)) : K.lerp(-3.0, -2.75, K.seg(t, 7.4, 13.0));
        mark.setAttribute('cx', tx(tv).toFixed(1));
        markTxt.setAttribute('x', 580);
        markTxt.textContent = tv.toFixed(1).replace('-', '−');
        markTxt.setAttribute('fill', tv >= -1 ? C.green : tv > -2.5 ? '#8a6420' : C.clay);
      };
    }
  });
})();
