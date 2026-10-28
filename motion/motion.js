// motion/motion.js
// 움직이는 그림(모션그래픽) 재생기 — 이론 설명용 SVG 애니메이션의 공통 틀.
//
// 장면(scene)은 motion/scenes/*.js 에서 NoriMotion.register({...})로 등록한다.
// 장면은 "시각 t(초) → 그림" 순수 함수(render)로 그린다. 그래서 단계 버튼으로
// 아무 시점이나 바로 건너뛸 수 있고, 헤드리스 캡처도 같은 그림이 나온다.
//
// 사용
//   앱:      NoriMotion.forTopic('acs')  → 그 토픽에 붙은 장면 목록
//            NoriMotion.mountAll(root)    → root 안의 [data-motion] 자리에 재생기 생성
//   그림노트: <div data-motion="ecg-pqrst"></div> + 이 파일·장면 파일 <script>
//
// 장면 정의
//   { id, title, system, topics:[토픽 id], viewBox:'0 0 600 340', duration:초,
//     steps:[{ at:초, label:'P파', text:'설명' }],
//     options:[{ key, label, choices:[{ value, label }], value }]   // 선택(유도 바꾸기 등)
//     source:'근거 한 줄',
//     setup(svg, kit) → render(t, opt) }

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var scenes = [];
  var byId = {};

  // 앱 색 토큰과 같은 값(그림노트에서도 같은 색이 나오도록 상수로 둔다)
  var C = {
    ink: '#18252c', muted: '#63717a', line: '#d8e0e4', paper: '#f7f9f8', surface: '#f0f4f2',
    teal: '#1f7a74', tealSoft: '#dcefeb', tealDark: '#155f5a',
    clay: '#b75d45', claySoft: '#f7e3dc', gold: '#b8872f', goldSoft: '#f5ebd5',
    green: '#3d7a40', greenSoft: '#e3efdf', blue: '#385f8a', blueSoft: '#e1eaf3',
    navy: '#1a2b4a', purple: '#6b3fa0', purpleSoft: '#ede9fe',
    // 혈액: 산소 많은 피 / 산소 적은 피
    oxy: '#c8423b', deoxy: '#4a5fa8'
  };

  // ── 장면 제작 도구 ────────────────────────────────
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  // t가 a~b 구간에서 0→1로 가는 진행률
  function seg(t, a, b) { return b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  // a~b 구간에서 0→1→0 으로 부풀었다 꺼지는 값
  function pulse(t, a, b) { var p = seg(t, a, b); return Math.sin(p * Math.PI); }
  // 색 섞기 '#rrggbb'
  function mix(c1, c2, p) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(lerp(a >> 16, b >> 16, p));
    var g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, p));
    var bl = Math.round(lerp(a & 255, b & 255, p));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  // path 위 비율 위치 {x,y}
  function along(pathEl, frac) {
    var L = pathEl.__len || (pathEl.__len = pathEl.getTotalLength());
    var p = pathEl.getPointAtLength(clamp(frac, 0, 1) * L);
    return { x: p.x, y: p.y };
  }
  // 화살촉 marker 하나 만들어 id 반환
  function arrowHead(svg, color, id) {
    var defs = svg.querySelector('defs') || el('defs', null, svg);
    var mid = id || ('nmA' + Math.random().toString(36).slice(2, 8));
    var m = el('marker', { id: mid, viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
    return mid;
  }
  function label(parent, x, y, s, o) {
    o = o || {};
    return el('text', {
      x: x, y: y, 'font-size': o.size || 16, 'font-weight': o.weight || 600,
      fill: o.fill || C.ink, 'text-anchor': o.anchor || 'middle',
      'dominant-baseline': o.baseline || 'middle', 'class': 'nm-svgtext', text: s
    }, parent);
  }

  // ── 그림(입체감) 도구 ──────────────────────────────
  // motion/art/ 의 바탕 그림 주소 — motion.js 위치 기준이라 앱·그림노트·미리보기 어디서나 맞는다
  var BASE = (function () {
    var cs = document.currentScript && document.currentScript.src;
    return cs ? cs.replace(/motion\.js(\?.*)?$/, '') : 'motion/';
  })();
  var ART_VER = '20261028a';
  function defsOf(svg) {
    var root = svg.ownerSVGElement || svg;
    return root.querySelector('defs') || el('defs', null, root);
  }
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
  // 바탕 그림. o.fade=true면 가장자리를 배경색으로 부드럽게 녹인다(그림 테두리가 안 보이게)
  function image(parent, name, x, y, w, h, o) {
    o = o || {};
    var attrs = { href: BASE + 'art/' + name + '.webp?v=' + ART_VER, x: x, y: y, width: w, height: h,
      preserveAspectRatio: o.slice ? 'xMidYMid slice' : 'xMidYMid meet' };
    if (o.fade !== false) {
      var d = defsOf(parent), gid = uid('nmF'), mid = uid('nmM');
      var g = el('radialGradient', { id: gid, cx: '50%', cy: '50%', r: o.fadeR || '58%' }, d);
      el('stop', { offset: '70%', 'stop-color': '#fff' }, g);
      el('stop', { offset: '100%', 'stop-color': '#000' }, g);
      var m = el('mask', { id: mid, maskContentUnits: 'objectBoundingBox' }, d);
      el('rect', { x: 0, y: 0, width: 1, height: 1, fill: 'url(#' + gid + ')' }, m);
      attrs.mask = 'url(#' + mid + ')';
    }
    return el('image', attrs, parent);
  }
  // 빛 번짐(전기·발광 입자)
  function glow(svg, std) {
    var d = defsOf(svg), id = uid('nmG');
    var f = el('filter', { id: id, x: '-80%', y: '-80%', width: '260%', height: '260%' }, d);
    el('feGaussianBlur', { stdDeviation: std || 3, result: 'b' }, f);
    var mg = el('feMerge', null, f);
    el('feMergeNode', { 'in': 'b' }, mg); el('feMergeNode', { 'in': 'b' }, mg); el('feMergeNode', { 'in': 'SourceGraphic' }, mg);
    return 'url(#' + id + ')';
  }
  // 그림자(떠 있는 카드·입자)
  function shadow(svg, dy, std, op) {
    var d = defsOf(svg), id = uid('nmS');
    var f = el('filter', { id: id, x: '-30%', y: '-30%', width: '160%', height: '180%' }, d);
    el('feDropShadow', { dx: 0, dy: dy == null ? 3 : dy, stdDeviation: std || 3, 'flood-color': '#1a2b4a', 'flood-opacity': op || 0.22 }, f);
    return 'url(#' + id + ')';
  }
  // 입체 구슬 채우기(분자·적혈구·소포): 왼쪽 위 하이라이트 → 가장자리 어둡게
  function sphere(svg, color) {
      var root = svg.ownerSVGElement || svg, key = color;
    root.__nmSph = root.__nmSph || {};
    if (root.__nmSph[key]) return root.__nmSph[key];
    var d = defsOf(svg), id = uid('nmB');
    var g = el('radialGradient', { id: id, cx: '35%', cy: '30%', r: '75%', fx: '30%', fy: '25%' }, d);
    el('stop', { offset: '0%', 'stop-color': mix(color, '#ffffff', 0.75) }, g);
    el('stop', { offset: '45%', 'stop-color': color }, g);
    el('stop', { offset: '100%', 'stop-color': mix(color, '#000000', 0.45) }, g);
    return (root.__nmSph[key] = 'url(#' + id + ')');
  }
  // 카메라: g를 (x,y)가 (cx,cy)에 오도록 z배 확대
  function camera(g, x, y, z, cx, cy) {
    g.setAttribute('transform', 'translate(' + (cx - x * z).toFixed(2) + ',' + (cy - y * z).toFixed(2) + ') scale(' + z.toFixed(4) + ')');
  }

  var kit = { el: el, clamp: clamp, lerp: lerp, seg: seg, easeInOut: easeInOut, easeOut: easeOut,
    pulse: pulse, mix: mix, along: along, arrowHead: arrowHead, label: label, C: C,
    image: image, glow: glow, shadow: shadow, sphere: sphere, camera: camera };

  // ── 등록·조회 ────────────────────────────────────
  function register(def) {
    if (!def || !def.id || byId[def.id]) return;
    def.viewBox = def.viewBox || '0 0 600 340';
    def.steps = (def.steps || []).slice().sort(function (a, b) { return a.at - b.at; });
    scenes.push(def);
    byId[def.id] = def;
  }
  function forTopic(topicId) {
    return scenes.filter(function (s) { return (s.topics || []).indexOf(topicId) !== -1; });
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 재생기 ───────────────────────────────────────
  var players = [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 설명문 안의 **굵게**만 허용
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }

  function mount(host, id) {
    var def = byId[id];
    if (!host || !def || host.__nm) return null;

    host.classList.add('nm');
    host.innerHTML =
      '<div class="nm-head"><span class="nm-tag">🎬 ' + esc(def.system || '움직이는 그림') + '</span>' +
      '<h5 class="nm-title">' + esc(def.title) + '</h5></div>' +
      '<div class="nm-stage" role="img" aria-label="' + esc(def.title) + '"></div>' +
      '<div class="nm-caption" aria-live="polite"><strong class="nm-cap-label"></strong><p class="nm-cap-text"></p></div>' +
      '<div class="nm-bar">' +
        '<button type="button" class="nm-btn nm-play" aria-label="재생"></button>' +
        '<button type="button" class="nm-btn nm-prev" aria-label="이전 단계">‹</button>' +
        '<div class="nm-steps"></div>' +
        '<button type="button" class="nm-btn nm-next" aria-label="다음 단계">›</button>' +
        '<button type="button" class="nm-btn nm-speed" aria-label="속도">1×</button>' +
        ((window.NM_VIDEOS || []).indexOf(def.id) !== -1
          ? '<a class="nm-btn nm-film" href="' + BASE + 'video/' + esc(def.id) + '.mp4?v=' + ART_VER + '" target="_blank" rel="noopener" title="해설 영상(MP4)으로 보기" aria-label="해설 영상">🎞</a>' : '') +
      '</div>' +
      '<div class="nm-opts"></div>' +
      '<div class="nm-progress"><span></span></div>' +
      (def.source ? '<p class="nm-src">' + rich(def.source) + '</p>' : '');

    var stage = host.querySelector('.nm-stage');
    var svg = el('svg', { viewBox: def.viewBox, 'class': 'nm-svg', preserveAspectRatio: 'xMidYMid meet' }, stage);
    var opt = {};
    (def.options || []).forEach(function (o) { opt[o.key] = o.value != null ? o.value : o.choices[0].value; });

    var render = def.setup(svg, kit, opt) || function () {};

    var stepsBox = host.querySelector('.nm-steps');

    var optsBox = host.querySelector('.nm-opts');
    optsBox.innerHTML = (def.options || []).map(function (o) {
      return '<div class="nm-opt" data-key="' + esc(o.key) + '"><span class="nm-opt-l">' + esc(o.label) + '</span>' +
        o.choices.map(function (c) {
          return '<button type="button" class="nm-chip" data-v="' + esc(c.value) + '">' + esc(c.label) + '</button>';
        }).join('') + '</div>';
    }).join('');
    if (!(def.options || []).length) optsBox.remove();

    var p = {
      def: def, host: host, svg: svg, render: render, opt: opt,
      t: 0, playing: false, visible: false, wanted: !reduced, speed: 1, last: 0, step: -1
    };

    var btnPlay = host.querySelector('.nm-play');
    var btnSpeed = host.querySelector('.nm-speed');
    var bar = host.querySelector('.nm-progress span');
    var capL = host.querySelector('.nm-cap-label');
    var capT = host.querySelector('.nm-cap-text');
    var stepBtns = [];
    var steps = def.steps;
    var dur = def.duration;

    // 선택지(유도·리듬 등)에 따라 단계·길이가 바뀌는 장면: stepsFor(opt)·durationFor(opt)
    function buildSteps() {
      steps = (def.stepsFor ? def.stepsFor(p.opt) : def.steps).slice().sort(function (a, b) { return a.at - b.at; });
      dur = def.durationFor ? def.durationFor(p.opt) : def.duration;
      if (p.t >= dur) p.t = 0;
      stepsBox.innerHTML = steps.map(function (s, i) {
        return '<button type="button" class="nm-step" data-i="' + i + '" title="' + esc(s.label) + '">' +
          '<span class="nm-step-n">' + (i + 1) + '</span><span class="nm-step-l">' + esc(s.label) + '</span></button>';
      }).join('');
      stepBtns = [].slice.call(stepsBox.children);
      stepBtns.forEach(function (b) {
        b.addEventListener('click', function () { p.wanted = false; syncPlay(); seekStep(+b.dataset.i); });
      });
      p.step = -1;
    }

    function stepAt(t) {
      var i = 0;
      for (var k = 0; k < steps.length; k++) if (steps[k].at <= t + 1e-6) i = k;
      return i;
    }
    function draw() {
      render(p.t, p.opt);
      bar.style.width = (100 * p.t / dur).toFixed(2) + '%';
      var i = stepAt(p.t);
      if (i !== p.step) {
        p.step = i;
        var s = steps[i] || {};
        capL.textContent = s.label || '';
        capT.innerHTML = rich(s.text || '');
        stepBtns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i); });
      }
    }
    function syncPlay() {
      var run = p.wanted && p.visible && !document.hidden;
      if (run && !p.playing) { p.playing = true; p.last = performance.now(); requestAnimationFrame(tick); }
      if (!run) p.playing = false;
      btnPlay.textContent = p.wanted ? '❚❚' : '▶';
      btnPlay.setAttribute('aria-label', p.wanted ? '일시정지' : '재생');
      host.classList.toggle('is-paused', !p.wanted);
    }
    function tick(now) {
      if (!p.playing) return;
      var dt = Math.max(0, Math.min(0.1, (now - p.last) / 1000));
      p.last = now;
      p.t = (p.t + dt * p.speed) % dur;
      draw();
      requestAnimationFrame(tick);
    }
    function seekStep(i) {
      i = (i + steps.length) % steps.length;
      p.t = steps[i].at;
      p.step = -1;
      draw();
    }

    btnPlay.addEventListener('click', function () { p.wanted = !p.wanted; syncPlay(); });
    host.querySelector('.nm-prev').addEventListener('click', function () {
      // 단계를 손으로 넘기면 멈춰서 읽게 한다
      p.wanted = false; syncPlay();
      var i = stepAt(p.t);
      seekStep(p.t - steps[i].at > 0.4 ? i : i - 1);
    });
    host.querySelector('.nm-next').addEventListener('click', function () {
      p.wanted = false; syncPlay(); seekStep(stepAt(p.t) + 1);
    });
    btnSpeed.addEventListener('click', function () {
      p.speed = p.speed === 1 ? 0.5 : p.speed === 0.5 ? 1.5 : 1;
      btnSpeed.textContent = (p.speed === 0.5 ? '0.5' : p.speed === 1.5 ? '1.5' : '1') + '×';
    });
    [].slice.call(host.querySelectorAll('.nm-opt')).forEach(function (row) {
      var key = row.dataset.key;
      var chips = [].slice.call(row.querySelectorAll('.nm-chip'));
      function mark() { chips.forEach(function (c) { c.classList.toggle('is-on', String(p.opt[key]) === c.dataset.v); }); }
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          var src = (def.options.filter(function (o) { return o.key === key; })[0] || {}).choices || [];
          var hit = src.filter(function (x) { return String(x.value) === c.dataset.v; })[0];
          p.opt[key] = hit ? hit.value : c.dataset.v;
          mark(); if (def.stepsFor || def.durationFor) buildSteps(); p.step = -1; draw();
        });
      });
      mark();
    });

    host.__nm = p;
    players.push(p);
    buildSteps();
    draw();
    syncPlay();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { p.visible = e.isIntersecting; syncPlay(); });
      }, { threshold: 0.35 });
      io.observe(host);
      p.io = io;
    } else { p.visible = true; syncPlay(); }
    p.sync = syncPlay;
    p.draw = draw;
    return p;
  }

  function mountAll(root) {
    var list = (root || document).querySelectorAll('[data-motion]');
    [].forEach.call(list, function (n) { mount(n, n.getAttribute('data-motion')); });
    // 화면에서 빠진(다시 그려진) 재생기는 정리
    players = players.filter(function (p) {
      if (document.body.contains(p.host)) return true;
      p.playing = false; if (p.io) p.io.disconnect(); return false;
    });
  }

  document.addEventListener('visibilitychange', function () {
    players.forEach(function (p) { p.sync(); });
  });

  // 시각 t로 바로 그리기(검증·캡처용)
  function seek(host, t) { var p = host && host.__nm; if (!p) return; p.wanted = false; p.sync(); p.t = t; p.step = -1; p.draw(); }

  window.NoriMotion = {
    register: register, mount: mount, mountAll: mountAll, forTopic: forTopic, seek: seek,
    get: function (id) { return byId[id]; },
    list: function () { return scenes.slice(); },
    kit: kit
  };

  // 그림노트처럼 정적 페이지면 로드 끝나고 자동 장착
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('[data-motion]')) mountAll(document);
  });
})();
