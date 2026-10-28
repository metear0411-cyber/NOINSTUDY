#!/usr/bin/env python3
"""움직이는 그림 → HyperFrames 해설 영상 프로젝트 만들기.

    python3 motion/film/build.py <장면id> [옵션키=값] [출력폴더]
    cd <출력폴더> && PATH=~/nori-cctv/bin:$PATH npx hyperframes@latest render -o <id>.mp4

장면의 단계마다: 천천히 재생(0.55배) → 설명을 다 읽을 만큼 멈춤. 오른쪽에 단계 설명을 크게.
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS = os.path.expanduser('~/nori-design/assets/fonts')

def main():
    sid = sys.argv[1]
    opt = dict(a.split('=', 1) for a in sys.argv[2:] if '=' in a)
    rest = [a for a in sys.argv[2:] if '=' not in a]
    out = rest[0] if rest else os.path.join(ROOT, 'scratch', 'film', sid + ('-' + '-'.join(opt.values()) if opt else ''))
    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(os.path.join(out, 'motion', 'scenes'))
    shutil.copy(os.path.join(ROOT, 'motion', 'motion.js'), os.path.join(out, 'motion'))
    shutil.copy(os.path.join(ROOT, 'motion', 'scenes', sid + '.js'), os.path.join(out, 'motion', 'scenes'))
    shutil.copytree(os.path.join(ROOT, 'motion', 'art'), os.path.join(out, 'motion', 'art'))
    os.makedirs(os.path.join(out, 'fonts'))
    for w in ('Medium', 'Bold', 'ExtraBold'):
        p = os.path.join(FONTS, 'Pretendard-%s.woff2' % w)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(out, 'fonts'))
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'film.html'), encoding='utf-8') as f:
        html = f.read()
    import subprocess
    node = os.path.expanduser('~/.local/opt/node/bin/node')
    total = subprocess.check_output([node, os.path.join(ROOT, 'motion', 'film', 'schedule.js'), sid,
                                     json.dumps(opt, ensure_ascii=False)], text=True).strip()
    html = html.replace('__SCENE__', sid).replace('__OPT__', json.dumps(opt, ensure_ascii=False))
    html = html.replace('data-duration="60"', 'data-duration="%s"' % total)
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    for name, body in (('meta.json', {'id': 'nm-' + sid, 'name': sid}),
                       ('hyperframes.json', {'paths': {'assets': 'motion/art'}})):
        with open(os.path.join(out, name), 'w') as f:
            json.dump(body, f)
    print(out)

if __name__ == '__main__':
    main()
