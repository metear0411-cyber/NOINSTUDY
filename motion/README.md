# 움직이는 그림 (motion/)

이론 설명용 3D 모션그래픽. 앱 토픽 화면(「🎬 움직이는 그림으로 이해」), 그림노트, 모음 페이지(`00_움직이는그림_모음.html`)에 같은 장면이 뜬다.

## 구조
```
motion.js        재생기 + 장면 제작 도구(kit). 장면은 "시각 t → 그림" 순수 함수라 단계 버튼으로 바로 건너뛴다
motion.css       재생기 모양
scenes/<id>.js   장면 하나 = 파일 하나. NoriMotion.register({...})
art/<이름>.webp   3D 의학 일러스트 바탕 그림(GPT 생성, 글자 없음, 1200px)
video/<id>.mp4   HyperFrames로 뽑은 해설 영상(재생기의 🎞 단추)
film/            영상 만들기: build.py(프로젝트 생성) · film.html(영상 틀) · schedule.js(길이 계산)
inject.py        연결기: index.html·그림노트·모음 페이지에 장면을 다시 꽂는다
```

## 장면 정의
`{ id, title, system, topics:[앱 토픽 id], duration, steps:[{at, label, text}], options?, stepsFor?(opt), durationFor?(opt), source, setup(svg, K, opt) → render(t, opt) }`
- `text`의 `**굵게**`만 허용. 단계 설명이 본문이다.
- render 안에서 난수·DOM 생성 금지(setup에서 만들고 render는 속성만 바꾼다).
- 도구: `K.image(부모, '그림이름', x, y, w, h)`(가장자리 녹임) · `K.glow` · `K.shadow` · `K.sphere(색)`(입체 구슬) · `K.camera(g, x, y, 배율, cx, cy)`(단계별 확대).
- 그림 속 해부 위치는 정규화 좌표 `P(nx, ny)`로 잡는다(견본: `scenes/ecg-pqrst.js`). 좌표는 webp 기준으로 잰다.

## 새 장면을 더할 때
1. `scenes/<id>.js` 작성(필요하면 바탕 그림을 `art/`에 webp로).
2. `inject.py`의 `GROUPS`(모음 순서)·`NOTE_MAP`(그림노트 자리)에 등록 → `python3 motion/inject.py`.
3. 해설 영상: `python3 motion/film/build.py <id>` → 그 폴더에서 `npx hyperframes render -o <id>.mp4`(FFmpeg 필요) → `video/`에 복사 → `inject.py` 다시.
4. 장면·그림을 고치면 `inject.py`의 `VER`, `motion.js`의 `ART_VER`, `service-worker.js`의 캐시 이름을 올린다.

## 내용 원칙
수치는 표준 교재 값만. 교재마다 다르면 `source` 줄에 밝히고, 설명용으로 단순화한 곳도 거기에 적는다.
