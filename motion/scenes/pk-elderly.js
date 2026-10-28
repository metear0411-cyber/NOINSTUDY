// 노인 약동학 — 같은 용량을 매일 먹어도 노인 몸에서는 왜 더 높이 쌓이나
// 1구획 경구 모형(1차 흡수·1차 소실)을 투여마다 겹쳐 더한 값. 반감기만 바꿔 성인/노인을 비교한다.
(function () {
  if (!window.NoriMotion) return;
  var M = window.NoriMotion;

  var KA = 8;                 // 흡수 속도상수(/일)
  var DAYS = 12;              // 그래프 길이(일)
  var T0 = 0.5, T1 = 12.5;    // 곡선이 그려지는 애니메이션 구간(초) — 1초 = 1일
  var LOW = 0.9, HIGH = 2.2, YMAX = 4.0;  // 치료 범위·그래프 높이(임의 단위)
  var PROFILE = {
    adult: { th: 1, f: 1, name: '성인' },
    elder: { th: 2, f: 1.1, name: '노인' },
    half: { th: 2, f: 0.55, name: '노인 ½ 용량' }
  };

  function conc(day, pr) {
    var k = Math.LN2 / pr.th, s = 0;
    for (var d = 0; d <= day + 1e-9; d += 1) {
      var u = day - d;
      s += pr.f * KA / (KA - k) * (Math.exp(-k * u) - Math.exp(-KA * u));
    }
    return s;
  }

  var COMMON0 = { at: 0.0, label: '치료 범위', text: '초록 띠가 **치료 범위**, 그 위 붉은 칸이 **독성 영역**이다. **디곡신·리튬·와파린·테오필린**처럼 치료 범위가 좁은 약은 조금만 더 쌓여도 독성으로 넘어간다.' };

  var STEPS = {
    adult: [
      COMMON0,
      { at: 0.5, label: '첫 투여', text: '먹은 약이 흡수되어 **최고 농도**에 이른 뒤 **반감기**마다 절반씩 줄어든다. 첫날은 아직 치료 범위에 못 미친다.' },
      { at: 2.5, label: '축적', text: '다음 약을 먹을 때 앞의 약이 **다 빠지지 않아** 그 위에 쌓인다. 매일 같은 용량인데도 최고·최저 농도가 날마다 조금씩 올라간다.' },
      { at: 5.0, label: '항정상태', text: '**반감기의 4~5배**가 지나면 들어오는 양과 나가는 양이 같아져 **항정상태**가 된다. 여기서는 반감기 1일이라 약 4~5일째부터 치료 범위 안에서 오르내린다.' },
      { at: 8.0, label: '유지', text: '항정상태의 높이는 **용량과 반감기**가 정한다. 용량을 바꿔도 새 항정상태까지는 다시 반감기 4~5배가 걸린다. 그래서 증량 효과는 며칠 뒤에 판단한다.' },
      { at: 12.5, label: '노인과 비교', text: '점선은 같은 용량을 **노인**이 먹었을 때다. 반감기가 2배로 늘면 축적이 커져 **독성 영역**까지 올라간다. 아래 선택에서 **노인**을 눌러 이유를 보자.' }
    ],
    elder: [
      COMMON0,
      { at: 0.5, label: '첫 투여', text: '**흡수**는 노화로 크게 달라지지 않는다(위산↓·위장 운동↓가 있어도 흡수량은 비슷). 차이는 그 뒤, 몸 안에 머무는 시간에서 생긴다. 회색 점선이 같은 용량의 성인이다.' },
      { at: 2.5, label: '축적', text: '노인은 **반감기가 길어** 다음 약을 먹을 때 남아 있는 양이 더 많다. 매일 같은 용량인데 성인보다 훨씬 가파르게 쌓인다.' },
      { at: 5.0, label: '항정상태', text: '항정상태 도달도 **반감기 4~5배**라 늦어진다(반감기 2일이면 **8~10일**). 그 높이도 높아 **독성 영역**에서 머문다. 처음 며칠 괜찮다가 1~2주 뒤 독성이 나타나는 이유다.' },
      { at: 8.0, label: '노화 변화', text: '**분포**: 체지방↑로 지용성 약(디아제팜)은 분포용적↑·반감기↑, 체수분↓로 수용성 약(디곡신)은 농도↑, **알부민↓**로 결합 안 한 **유리형 약↑**. **대사**: 간 혈류·크기↓. **배설**: **사구체여과율↓**로 신장 배설 약물이 쌓인다.' },
      { at: 10.5, label: '독성 신호', text: '**디곡신** 독성: 식욕부진·오심·구토, **시야 흐림·황록색 시야**, **서맥**. 투약 전 1분간 심첨맥박을 재고 60회 미만이면 보류 후 보고, **저칼륨혈증**이면 독성 위험↑. **디아제팜** 같은 장기작용 벤조디아제핀은 다음 날까지 남아 혼돈·**낙상**을 부른다.' },
      { at: 12.5, label: '낮게 시작', text: '**Start low, go slow**: 성인 용량보다 낮게(흔히 1/3~1/2) 시작해 천천히 올린다. 초록 점선이 ½ 용량으로, 같은 노인 몸에서도 치료 범위 안에 머문다. 신기능(크레아티닌 청소율)과 혈중농도를 함께 본다.' }
    ]
  };

  M.register({
    id: 'pk-elderly',
    title: '반복 투여와 혈중 농도 — 노인은 왜 더 높이 쌓이나',
    system: '약리',
    topics: ['pharmacokinetics-elderly', 'polypharmacy-drug', 'ltc-medication', 'analgesics-elderly'],
    duration: 15,
    options: [{
      key: 'age', label: '복용하는 사람',
      choices: [{ value: 'elder', label: '노인' }, { value: 'adult', label: '성인' }],
      value: 'elder'
    }],
    steps: STEPS.elder,
    stepsFor: function (o) { return STEPS[o.age] || STEPS.elder; },
    source: '1구획 경구 모형, 매일 1회 같은 용량. 반감기 성인 1일·노인 2일, 치료 범위·농도는 임의 단위 — 설명용으로 단순화. 항정상태 도달 = 반감기 4~5배.',

    setup: function (svg, K) {
      var el = K.el, C = K.C;
      var X0 = 62, X1 = 392, Y0 = 300, Y1 = 40;
      function px(day) { return X0 + (X1 - X0) * day / DAYS; }
      function py(c) { return Y0 - (Y0 - Y1) * Math.min(c, YMAX) / YMAX; }

      el('rect', { x: 0, y: 0, width: 600, height: 340, fill: '#eff3f4' }, svg);
      var softSh = K.shadow(svg, 4, 6, 0.18), glowF = K.glow(svg, 3), pillSh = K.shadow(svg, 1.5, 2, 0.25);
      el('rect', { x: 8, y: 8, width: 394, height: 326, rx: 16, fill: '#fff', filter: softSh }, svg);
      var dz = el('linearGradient', { id: 'nmPkTox', x1: 0, x2: 0, y1: 0, y2: 1 }, svg.querySelector('defs') || el('defs', null, svg));
      el('stop', { offset: '0', 'stop-color': '#f2c2b4' }, dz); el('stop', { offset: '1', 'stop-color': '#fbe9e3' }, dz);
      var tz = el('linearGradient', { id: 'nmPkTher', x1: 0, x2: 0, y1: 0, y2: 1 }, dz.parentNode);
      el('stop', { offset: '0', 'stop-color': '#d6ecd0' }, tz); el('stop', { offset: '0.5', 'stop-color': '#e8f4e3' }, tz); el('stop', { offset: '1', 'stop-color': '#d6ecd0' }, tz);
      var ag = el('linearGradient', { id: 'nmPkArea', x1: 0, x2: 0, y1: 0, y2: 1 }, dz.parentNode);
      el('stop', { offset: '0', 'stop-color': '#3a5ea8', 'stop-opacity': '0.32' }, ag); el('stop', { offset: '1', 'stop-color': '#3a5ea8', 'stop-opacity': '0.02' }, ag);

      // ── 그래프 바탕 ──
      var g = el('g', null, svg);
      el('rect', { x: X0, y: Y1, width: X1 - X0, height: py(HIGH) - Y1, fill: 'url(#nmPkTox)' }, g);
      el('rect', { x: X0, y: py(HIGH), width: X1 - X0, height: py(LOW) - py(HIGH), fill: 'url(#nmPkTher)' }, g);
      el('line', { x1: X0, y1: py(HIGH), x2: X1, y2: py(HIGH), stroke: C.clay, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, g);
      el('line', { x1: X0, y1: py(LOW), x2: X1, y2: py(LOW), stroke: C.green, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, g);
      K.label(g, X0 + 8, Y1 + 15, '독성 영역', { size: 13, anchor: 'start', fill: C.clay, weight: 700 });
      K.label(g, X1 - 6, py(HIGH) + 14, '치료 범위', { size: 13, anchor: 'end', fill: C.green, weight: 700 });
      for (var d = 0; d <= DAYS; d += 2) {
        el('line', { x1: px(d), y1: Y0, x2: px(d), y2: Y0 + 4, stroke: C.muted, 'stroke-width': 1 }, g);
        K.label(g, px(d), Y0 + 14, String(d), { size: 12, fill: C.muted, weight: 500 });
      }
      el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.ink, 'stroke-width': 1.5 }, g);
      el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: C.ink, 'stroke-width': 1.5 }, g);
      K.label(g, (X0 + X1) / 2, Y0 + 28, '시간(일) · 알약 = 하루 한 번 투여', { size: 12, fill: C.muted, weight: 600 });
      K.label(g, X0 - 4, Y1 - 14, '혈중 농도', { size: 12, anchor: 'start', fill: C.muted, weight: 600 });

      // 투여 표시
      var doses = [];
      for (var i = 0; i < DAYS; i++) {
        var cg = el('g', { transform: 'translate(' + px(i).toFixed(1) + ',' + (Y0 - 7) + ') rotate(-35)', filter: pillSh }, g);
        el('rect', { x: -8, y: -4, width: 8, height: 8, rx: 4, fill: K.sphere(svg, '#e8eef6') }, cg);
        var half = el('rect', { x: 0, y: -4, width: 8, height: 8, rx: 4, fill: K.sphere(svg, C.navy) }, cg);
        cg.__half = half;
        doses.push(cg);
      }

      // ── 곡선 ──
      var defs = el('defs', null, svg);
      var clip = el('clipPath', { id: 'nmPkClip' }, defs);
      var reveal = el('rect', { x: X0 - 2, y: 0, width: 0, height: 340 }, clip);

      function pathOf(pr) {
        var pts = [];
        for (var x = 0; x <= DAYS + 1e-9; x += 0.02) pts.push(px(x).toFixed(1) + ',' + py(conc(x, pr)).toFixed(1));
        return 'M' + pts.join(' L');
      }
      var ghost = el('path', { fill: 'none', stroke: '#9aa6ae', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
      var ghostL = K.label(svg, 0, 0, '', { size: 12, anchor: 'start', fill: C.muted, weight: 700 });
      var halfP = el('path', { d: pathOf(PROFILE.half), fill: 'none', stroke: C.teal, 'stroke-width': 2.4, 'stroke-dasharray': '7 4' }, svg);
      var halfL = K.label(svg, X1 - 4, py(LOW) + 14, '노인 ½ 용량', { size: 12, anchor: 'end', fill: C.teal, weight: 800 });
      var track = el('path', { fill: 'none', stroke: '#cfd8dc', 'stroke-width': 1.4 }, svg);
      var area = el('path', { fill: 'url(#nmPkArea)', 'clip-path': 'url(#nmPkClip)' }, svg);
      var curve = el('path', { fill: 'none', stroke: C.navy, 'stroke-width': 2.8, 'stroke-linejoin': 'round', 'clip-path': 'url(#nmPkClip)' }, svg);
      var headGlow = el('circle', { r: 11, fill: '#6f95ff', opacity: 0.55, filter: glowF }, svg);
      var head = el('circle', { r: 6, fill: K.sphere(svg, '#3a5ea8'), stroke: '#fff', 'stroke-width': 1.5 }, svg);

      // 항정상태 괄호
      var ss = el('g', null, svg);
      var ssLine = el('path', { fill: 'none', stroke: C.blue, 'stroke-width': 1.8 }, ss);
      var ssTxt = K.label(ss, 0, 0, '', { size: 12, fill: C.blue, weight: 700 });
      // 독성 진입 표시
      var tox = el('g', null, svg);
      var toxDot = el('circle', { r: 7, fill: 'none', stroke: C.clay, 'stroke-width': 2.4 }, tox);
      var toxTxt = K.label(tox, 0, 0, '독성 영역 진입', { size: 12, anchor: 'end', fill: C.clay, weight: 800 });

      // ── 오른쪽 판: 노화 변화 ──
      var P = el('g', null, svg);
      el('rect', { x: 412, y: 8, width: 180, height: 324, rx: 16, fill: '#fff', filter: softSh }, P);
      var who = K.label(P, 422, 46, '', { size: 15, anchor: 'start', weight: 800 });
      var rows = [
        { k: '흡수', a: '변화 적음', e: '큰 변화 적음' },
        { k: '분포', a: '기준', e: '지방↑ 수분↓ 알부민↓' },
        { k: '대사', a: '기준', e: '간 혈류·효소↓' },
        { k: '배설', a: '기준', e: '사구체여과율↓' }
      ];
      var rowEls = rows.map(function (r, i) {
        var y = 76 + i * 42;
        var bg = el('rect', { x: 420, y: y - 13, width: 164, height: 36, rx: 10, fill: C.surface }, P);
        var orb = el('circle', { cx: 434, cy: y + 5, r: 8, fill: K.sphere(svg, ['#9aa6ae', '#e0a630', '#b8664c', '#4a7ad8'][i]) }, P);
        var kk = K.label(P, 448, y - 1, r.k, { size: 13, anchor: 'start', weight: 800, fill: C.navy });
        var vv = K.label(P, 448, y + 15, '', { size: 12.5, anchor: 'start', weight: 600, fill: C.muted });
        return { bg: bg, k: kk, v: vv, r: r, orb: orb };
      });
      el('line', { x1: 420, y1: 238, x2: 578, y2: 238, stroke: C.line }, P);
      K.label(P, 422, 256, '반감기', { size: 13, anchor: 'start', fill: C.muted, weight: 700 });
      var thTxt = K.label(P, 578, 256, '', { size: 16, anchor: 'end', weight: 800 });
      K.label(P, 422, 286, '항정상태까지', { size: 13, anchor: 'start', fill: C.muted, weight: 700 });
      var ssDays = K.label(P, 578, 286, '', { size: 15, anchor: 'end', weight: 800 });
      K.label(P, 499, 306, '(반감기 × 4~5)', { size: 12, fill: C.muted, weight: 500 });

      var cur = null, mainPr, otherPr, cross = null;
      function build(age) {
        cur = age;
        mainPr = PROFILE[age === 'adult' ? 'adult' : 'elder'];
        otherPr = PROFILE[age === 'adult' ? 'elder' : 'adult'];
        var d = pathOf(mainPr);
        curve.setAttribute('d', d); track.setAttribute('d', d);
        area.setAttribute('d', d + ' L' + px(DAYS) + ',' + Y0 + ' L' + X0 + ',' + Y0 + ' Z');
        ghost.setAttribute('d', pathOf(otherPr));
        ghost.setAttribute('stroke', age === 'adult' ? C.clay : '#9aa6ae');
        ghostL.textContent = otherPr.name + '(같은 용량)';
        ghostL.setAttribute('fill', age === 'adult' ? C.clay : C.muted);
        var gy = py(conc(DAYS - 0.02, otherPr));
        if (age === 'adult') { ghostL.setAttribute('x', X0 + 8); ghostL.setAttribute('y', Y1 + 40); }
        else { ghostL.setAttribute('x', px(4.6)); ghostL.setAttribute('y', py(LOW) + 30); }
        // 독성 진입 시점
        cross = null;
        for (var x = 0; x <= DAYS; x += 0.01) { var c = conc(x, mainPr); if (c > HIGH) { cross = { x: x, c: c }; break; } }
        if (cross) {
          toxDot.setAttribute('cx', px(cross.x)); toxDot.setAttribute('cy', py(HIGH));
          toxTxt.setAttribute('x', px(cross.x) - 12); toxTxt.setAttribute('y', py(HIGH) - 13);
        }
        var ad = age === 'adult';
        who.textContent = ad ? '성인 몸' : '노인 몸';
        who.setAttribute('fill', ad ? C.navy : C.clay);
        thTxt.textContent = ad ? '1일' : '2일 ↑';
        thTxt.setAttribute('fill', ad ? C.navy : C.clay);
        ssDays.textContent = ad ? '약 4~5일' : '약 8~10일';
        ssDays.setAttribute('fill', ad ? C.navy : C.clay);
        rowEls.forEach(function (r) { r.v.textContent = ad ? r.r.a : r.r.e; });
        var ssStart = ad ? 4.5 : 9;
        var yb = Y1 + 16;
        ssLine.setAttribute('d', 'M' + px(ssStart) + ',' + (yb + 6) + ' L' + px(ssStart) + ',' + yb + ' L' + px(DAYS) + ',' + yb + ' L' + px(DAYS) + ',' + (yb + 6));
        ssTxt.setAttribute('x', (px(ssStart) + px(DAYS)) / 2); ssTxt.setAttribute('y', yb - 9);
        ssTxt.textContent = '항정상태';
      }

      return function render(t, o) {
        if (o.age !== cur) build(o.age);
        var ad = o.age === 'adult';
        var day = K.clamp(t - T0, 0, DAYS);
        var x = px(day);
        reveal.setAttribute('width', Math.max(0, x - X0 + 4));
        head.setAttribute('cx', x); head.setAttribute('cy', py(conc(day, mainPr)));
        headGlow.setAttribute('cx', x); headGlow.setAttribute('cy', py(conc(day, mainPr)));
        headGlow.setAttribute('opacity', t >= T0 && t < T1 ? 0.5 + 0.2 * Math.sin(t * 6) : 0);
        head.setAttribute('opacity', t >= T0 && t < T1 ? 1 : 0);
        doses.forEach(function (n, i) {
          var hit = t >= T0 + i;
          var flash = hit ? 1 - K.seg(t, T0 + i, T0 + i + 0.5) : 0;
          n.setAttribute('opacity', hit ? 1 : 0.3);
          n.__half.setAttribute('fill', K.sphere(svg, flash > 0.05 ? C.gold : C.navy));
        });

        // 비교 곡선: 노인 화면은 처음부터 성인 회색 점선, 성인 화면은 마지막 단계에서 노인 점선
        var gOn = ad ? K.seg(t, 12.5, 13.1) : K.seg(t, 0.5, 1.2);
        ghost.setAttribute('opacity', gOn * (ad ? 0.95 : 0.8));
        ghostL.setAttribute('opacity', ad ? gOn : K.seg(t, 2.5, 3.0));
        var hOn = ad ? 0 : K.seg(t, 12.5, 13.1);
        halfP.setAttribute('opacity', hOn); halfL.setAttribute('opacity', hOn);

        ss.setAttribute('opacity', K.seg(t, 5.0, 5.5) * (t < 12.5 ? 1 : 0.4));
        var showTox = cross && t >= T0 + cross.x;
        tox.setAttribute('opacity', showTox ? (t < 12.5 ? 1 : 0.35) : 0);
        toxDot.setAttribute('r', showTox ? 7 + 4 * K.pulse(t, T0 + cross.x, T0 + cross.x + 0.8) : 7);

        // 노화 변화 줄: 해당 단계에서 강조
        var hi = !ad && t >= 8 && t < 10.5;
        rowEls.forEach(function (r, i) {
          var on = hi && i > 0;
          r.bg.setAttribute('fill', on ? C.claySoft : C.surface);
          r.v.setAttribute('fill', ad ? C.muted : (i === 0 ? C.muted : on ? C.clay : C.ink));
        });
      };
    }
  });
})();
