// notes-bridge.js
// 그림 학습노트 브리지 — app.js를 수정하지 않고 시각자료(그림 노트)를 연결한다.
// index.html 의 <script src="app.js"></script> 아래에 한 줄 추가:
//   <script src="notes-bridge.js?v=20260531"></script>
// (학습노트 HTML들은 저장소 루트에 함께 둔다)

(function () {
  'use strict';

  var NOTES = [
    { icon: '🧠', label: '신경계',        desc: '뇌졸중·치매·섬망·파킨슨',         file: '05_신경계_학습노트.html' },
    { icon: '❤️', label: '심혈관계',      desc: 'ECG·죽상경화·심근표지자·심방세동', file: '02_심혈관계_학습노트.html' },
    { icon: '🫁', label: '호흡기계',      desc: '천식·COPD·폐렴·결핵·폐암',       file: '03_호흡기계_학습노트.html' },
    { icon: '🍽️', label: '소화기계',      desc: '소화성궤양·GERD·위/대장암·간담', file: '06_소화기계_학습노트.html' },
    { icon: '🦴', label: '근골격계',      desc: '골관절염·골다공증·골절',         file: '07_근골격계_학습노트.html' },
    { icon: '💉', label: '내분비계',      desc: '당뇨·갑상샘',                     file: '08_내분비계_학습노트.html' },
    { icon: '🩹', label: '피부·감각계',   desc: '욕창단계·대상포진·백내장·난청',   file: '01_피부감각계_학습노트.html' },
    { icon: '📚', label: '간호이론·연구', desc: '노화이론·연구설계·통계',          file: '04_간호이론·간호연구_학습노트.html' },
    { icon: '🕊️', label: '장기요양·생애말기', desc: '장기요양 등급·호스피스·임종',   file: '09_장기요양·생애말기_학습노트.html' },
    { icon: '🗂️', label: '학습 허브',     desc: '전 과목 + 학습플랜 모아보기',      file: '00_학습허브_시작.html' }
  ];

  var PURPLE = '#1f7a74';  // 청록 통일(브랜드 악센트)

  function injectStyles() {
    var css = ''
      + '.nb-fab{position:fixed;right:18px;bottom:18px;z-index:9000;display:flex;align-items:center;gap:8px;'
      + 'padding:12px 18px;border:none;border-radius:999px;background:' + PURPLE + ';color:#fff;font-weight:700;'
      + 'font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(107,63,160,.4);font-family:inherit}'
      + '.nb-fab:hover{filter:brightness(1.08)}'
      + '.nb-panel{position:fixed;right:18px;bottom:74px;z-index:9000;width:300px;max-width:calc(100vw - 36px);'
      + 'background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(20,20,40,.28);overflow:hidden;'
      + 'display:none;font-family:inherit;border:1px solid #eadff5}'
      + '.nb-panel.open{display:block}'
      + '.nb-head{background:' + PURPLE + ';color:#fff;padding:13px 16px}'
      + '.nb-head strong{font-size:15px;display:block}'
      + '.nb-head span{font-size:12px;opacity:.85}'
      + '.nb-item{display:flex;gap:11px;align-items:flex-start;padding:12px 15px;text-decoration:none;color:#222;'
      + 'border-bottom:1px solid #f1ecf7;transition:background .12s}'
      + '.nb-item:hover{background:#f6f1fb}'
      + '.nb-item:last-child{border-bottom:none}'
      + '.nb-ico{font-size:20px;line-height:1.2}'
      + '.nb-txt strong{display:block;font-size:14px;color:' + PURPLE + '}'
      + '.nb-txt span{font-size:12px;color:#667}'
      + '.nb-overlay{position:fixed;inset:0;z-index:8999;display:none}'
      + '.nb-overlay.open{display:block}'
      + '@media print{.nb-fab,.nb-panel,.nb-overlay{display:none!important}}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();

    var overlay = document.createElement('div');
    overlay.className = 'nb-overlay';

    var fab = document.createElement('button');
    fab.className = 'nb-fab';
    fab.type = 'button';
    fab.innerHTML = '📖 그림 노트';

    var panel = document.createElement('div');
    panel.className = 'nb-panel';
    var itemsHtml = NOTES.map(function (n) {
      return '<a class="nb-item" href="' + n.file + '" target="_blank" rel="noopener">'
           + '<span class="nb-ico">' + n.icon + '</span>'
           + '<span class="nb-txt"><strong>' + n.label + '</strong><span>' + n.desc + '</span></span></a>';
    }).join('');
    panel.innerHTML = '<div class="nb-head"><strong>📖 그림 학습노트</strong>'
                    + '<span>강의 슬라이드 그림 + 쉬운 설명 + 암기모드</span></div>' + itemsHtml;

    function toggle(open) {
      var show = (open === undefined) ? !panel.classList.contains('open') : open;
      panel.classList.toggle('open', show);
      overlay.classList.toggle('open', show);
    }
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    overlay.addEventListener('click', function () { toggle(false); });

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(fab);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
