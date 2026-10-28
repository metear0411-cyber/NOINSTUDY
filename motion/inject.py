#!/usr/bin/env python3
"""움직이는 그림 연결기 — 장면을 추가·이름 변경한 뒤 한 번 돌린다.

    python3 motion/inject.py

하는 일
  1. index.html 의 <!-- motion:start --> ~ <!-- motion:end --> 사이에 motion.js·장면 <script>를 다시 쓴다.
  2. 그림노트(0N_*.html)에 motion.css·스크립트를 넣고, NOTE_MAP 의 앵커 제목 바로 아래에
     <div class="nm-slot" data-motion="..."></div> 자리를 만든다(다시 돌려도 중복되지 않음).
  3. 00_움직이는그림_모음.html(전체 모음)을 새로 만든다.
캐시 버전은 VER 하나로 맞춘다(장면을 고치면 숫자를 올릴 것).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = '20261028a'

# 모음 화면 순서 = 계통별 묶음
GROUPS = [
    ('순환기', ['circulation', 'ecg-pqrst', 'arrhythmia-strips', 'stiff-artery', 'hf-congestion']),
    ('호흡기', ['gas-exchange', 'airway-obstruction']),
    ('신경계', ['ach-synapse', 'dopamine-balance', 'stroke-penumbra']),
    ('내분비', ['insulin-glucose', 'thyroid-feedback']),
    ('병태생리·소화기', ['starling-edema', 'portal-htn']),
    ('근골격·피부', ['bone-remodeling', 'pressure-shear']),
    ('약리·통증', ['pk-elderly', 'gate-control']),
]

# 그림노트 안 자리: 장면 id → (파일, 앵커 id)
NOTE_MAP = {
    'circulation': ('02_심혈관계_학습노트.html', 'aging'),
    'ecg-pqrst': ('02_심혈관계_학습노트.html', 'ihd-ecg'),
    'hf-congestion': ('02_심혈관계_학습노트.html', 'hf'),
    'starling-edema': ('02_심혈관계_학습노트.html', 'hf'),
    'arrhythmia-strips': ('02_심혈관계_학습노트.html', 'arrhythmia'),
    'stiff-artery': ('02_심혈관계_학습노트.html', 'htn'),
    'airway-obstruction': ('03_호흡기계_학습노트.html', 'asthma-copd'),
    'gas-exchange': ('03_호흡기계_학습노트.html', 'pneumonia'),
    'ach-synapse': ('05_신경계_학습노트.html', 'dementia'),
    'dopamine-balance': ('05_신경계_학습노트.html', 'parkinson'),
    'stroke-penumbra': ('05_신경계_학습노트.html', 'stroke-tx'),
    'portal-htn': ('06_소화기계_학습노트.html', 'liver'),
    'bone-remodeling': ('07_근골격계_학습노트.html', 'osteoporosis'),
    'insulin-glucose': ('08_내분비계_학습노트.html', 'dm-base'),
    'thyroid-feedback': ('08_내분비계_학습노트.html', 'thyroid'),
    'pressure-shear': ('01_피부감각계_학습노트.html', 'pressure'),
}

GALLERY = '00_움직이는그림_모음.html'


def scene_ids():
    have = {f[:-3] for f in os.listdir(os.path.join(ROOT, 'motion', 'scenes')) if f.endswith('.js')}
    ordered = [i for _, ids in GROUPS for i in ids if i in have]
    missing = sorted(have - set(ordered))
    if missing:
        print('GROUPS에 없는 장면(모음 맨 끝에 붙임):', ', '.join(missing))
    return ordered + missing, have


def videos():
    d = os.path.join(ROOT, 'motion', 'video')
    return sorted(f[:-4] for f in os.listdir(d) if f.endswith('.mp4')) if os.path.isdir(d) else []


def tags(ids, prefix=''):
    out = ['<script>window.NM_VIDEOS = %s;</script>' % json.dumps(videos())]
    out += ['<script src="%smotion/motion.js?v=%s"></script>' % (prefix, VER)]
    out += ['<script src="%smotion/scenes/%s.js?v=%s"></script>' % (prefix, i, VER) for i in ids]
    return '\n  '.join(out)


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


def block(s, body, where_re, name='motion'):
    """<!-- name:start -->…<!-- name:end --> 블록을 갈아 끼우거나, 없으면 where_re 앞에 넣는다."""
    start, end = '<!-- %s:start -->' % name, '<!-- %s:end -->' % name
    new = '%s\n  %s\n  %s' % (start, body, end)
    if start in s:
        return re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: new, s, flags=re.S)
    m = re.search(where_re, s)
    if not m:
        sys.exit('자리를 못 찾음: ' + where_re)
    return s[:m.start()] + new + '\n  ' + s[m.start():]


def do_index(ids):
    p = os.path.join(ROOT, 'index.html')
    s = read(p)
    s = block(s, '<link rel="stylesheet" href="motion/motion.css?v=%s">' % VER, r'</head>', 'motion-css')
    s = block(s, tags(ids), r'<script src="app\.js')
    write(p, s)


def do_notes(have):
    by_file = {}
    for sid, (fn, anchor) in NOTE_MAP.items():
        if sid in have:
            by_file.setdefault(fn, []).append((sid, anchor))
    for fn in sorted(by_file):
        p = os.path.join(ROOT, fn)
        s = read(p)
        s = re.sub(r'<div class="nm-slot"[^>]*></div>\n?', '', s)
        for sid, anchor in by_file[fn]:
            m = re.search(r'id="%s"[^>]*>' % re.escape(anchor), s)
            if not m:
                sys.exit('%s 에 앵커 #%s 없음' % (fn, anchor))
            # 그 구역의 첫 제목(h2/h3) 바로 뒤, 같은 앵커에 여러 장면이면 차례대로
            h = re.search(r'</h[23]>', s[m.end():])
            pos = m.end() + h.end()
            while s.startswith('\n<div class="nm-slot"', pos):
                pos = s.index('</div>', pos) + len('</div>')
            s = s[:pos] + '\n<div class="nm-slot" data-motion="%s"></div>' % sid + s[pos:]
        ids = [sid for sid, _ in by_file[fn]]
        s = block(s, '<link rel="stylesheet" href="motion/motion.css?v=%s">' % VER, r'</head>', 'motion-css')
        s = block(s, tags(ids), r'</body>')
        write(p, s)
        print('그림노트', fn, '←', ', '.join(ids))


def do_gallery(ids):
    nav = []
    body = []
    for name, group in GROUPS + [('기타', [i for i in ids if not any(i in g for _, g in GROUPS)])]:
        g = [i for i in group if i in ids]
        if not g:
            continue
        gid = 'g%d' % len(nav)
        nav.append('<a href="#%s">%s</a>' % (gid, name))
        body.append('<h2 id="%s">%s</h2>' % (gid, name))
        body += ['<div data-motion="%s"></div>' % i for i in g]
    html = '''<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>움직이는 그림 모음 — 노인전문간호사</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.min.css">
<link rel="icon" href="icon-192.svg" type="image/svg+xml">
<style>
body{margin:0;background:#f7f9f8;color:#18252c;font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
  line-height:1.65;word-break:keep-all;overflow-wrap:break-word}
header{background:linear-gradient(135deg,#1f7a74,#155f5a);color:#fff;padding:28px 0 22px}
.wrap{max-width:920px;margin:0 auto;padding:0 16px}
header h1{margin:4px 0 6px;font-size:26px;text-wrap:balance}
header p{margin:0;opacity:.92;font-size:15px;text-wrap:pretty}
header .kicker{font-size:13px;font-weight:700;opacity:.85}
nav{position:sticky;top:0;z-index:5;background:rgba(247,249,248,.94);backdrop-filter:blur(8px);border-bottom:1px solid #d8e0e4}
nav .wrap{display:flex;gap:6px;overflow-x:auto;padding-top:8px;padding-bottom:8px;scrollbar-width:none}
nav a{flex:0 0 auto;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid #d8e0e4;color:#155f5a;
  font-weight:700;font-size:14px;text-decoration:none}
nav a.home{background:#1f7a74;color:#fff;border-color:#1f7a74}
h2{font-size:20px;color:#155f5a;margin:30px 0 4px;border-left:5px solid #1f7a74;padding-left:10px;scroll-margin-top:64px}
main{padding-bottom:80px}
</style>
<!-- motion-css:start -->
  <link rel="stylesheet" href="motion/motion.css?v=%(ver)s">
  <!-- motion-css:end -->
</head>
<body>
<header><div class="wrap">
  <div class="kicker">노인전문간호사 · 그림으로 이해</div>
  <h1>움직이는 그림 모음</h1>
  <p>교과서 그림으로는 잘 안 잡히는 흐름(전기·혈류·호르몬·약물 농도)을 움직여 보는 곳. ▶로 재생하고, 번호 단추로 단계마다 멈춰 읽는다. 단추로 상황(유도·리듬·질환)을 바꿔 비교할 수 있다.</p>
</div></header>
<nav><div class="wrap"><a class="home" href="index.html">← 앱으로</a>%(nav)s</div></nav>
<main class="wrap">
%(body)s
</main>
<!-- motion:start -->
  %(tags)s
  <!-- motion:end -->
</body></html>
''' % {'ver': VER, 'nav': ''.join(nav), 'body': '\n'.join(body), 'tags': tags(ids)}
    write(os.path.join(ROOT, GALLERY), html)
    print('모음', GALLERY, len(ids), '장면')


if __name__ == '__main__':
    ids, have = scene_ids()
    do_index(ids)
    do_notes(have)
    do_gallery(ids)
