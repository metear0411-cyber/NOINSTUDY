# 인수인계 — 2차 [블록연습] 사례 남은 작업

작성: 2026-07-25 (KST 07-26 00:15) / 브랜치 `exam2-boost-blocks` (베이스 `exam2-boost`)

## 목표
`data/answer-blocks.js`(window.NORI_BLOCKS)의 답안 블록 48개를 모두 "[블록연습]" 사례 문항으로
인출 연습할 수 있게 `data/case-scenarios.js`(window.NORI_CASE2.cases)에 사례를 추가하는 작업.
사례의 각 subquestion에 `blockRef: "<topic>.<type>"`를 달아 블록과 1:1 연결한다.

## 현재 상태
- 커밋 완료(`exam2-boost`, origin에 푸시됨): 블록연습 사례 9건
  `blk-fall-1, blk-ulcer-1, blk-delirium-1, blk-dementia-1, blk-stroke-1, blk-parkinson-1,
   blk-heart-1, blk-heart-2, blk-dm-1` → 34개 블록 연결 완료
- 미연결 블록 14개: `resp.*`(5), `urin.*`(5), `eol.assess/dx/drug/edu`(4)
- 이 브랜치의 `scratch/`에 생성 완료된 사례 초안 2건 (아직 case-scenarios.js에 **미병합**):
  - `scratch/gen-resp.json` — `blk-resp-1` 「요양시설 노인의 COPD 급성악화와 흡인성 폐렴」, 5문항, resp.risk/assess/dx/drug/edu
  - `scratch/gen-eol.json` — `blk-eol-1` 「폐암 말기 노인의 임종기 돌봄」, 4문항, eol.assess/dx/drug/edu
- **미작성**: `urin` 주제 사례 (`blk-urin-1`, urin.risk/assess/dx/drug/edu 5문항) — 작성 중 중단됨

## 남은 할 일 (순서대로)

### 1. urin 사례 작성 → `scratch/gen-urin.json`
`blk-urin-1`, system `비뇨생식`, subquestion 5개(urin.risk/assess/dx/drug/edu 각 1개).
- 먼저 블록 전문 정독:
  `node -e 'global.window={};require("./data/answer-blocks.js");const t=window.NORI_BLOCKS.topics.find(t=>t.key==="urin");console.log(JSON.stringify(t,null,1))'`
  → 답안은 이 블록 항목을 빠짐없이 반영할 것(블록이 곧 모범답안).
- 문체·구조·분량은 `data/case-scenarios.js`의 `blk-parkinson-1`, `blk-fall-1`을 그대로 모방.
  answer는 ①②③ 번호 서술, 문항당 최소 600자, dx는 진단 2개 × 중재 4개 이상.
  points는 짧은 요약 불릿 배열.
- frameHint 매핑: risk→`risk`, assess→`test`(사정도구 중심이면 `assess`), dx→`diagnosis`, drug→`drug`, edu→`edu`.
- scenario: 노인 1명에 만성질환 4~8개 복합, 과거력 (1)(2)... 나열,
  활력징후·소변검사·잔뇨량(PVR)·혈액검사 수치와 복용 약물 목록을 숫자로 제시,
  배뇨일지(주간·야간 배뇨 횟수, 실금 횟수와 상황) 포함. 뒤 문항이 이 수치를 인용하도록.
- 임상 정확성 필수 포인트: 요실금 유형 감별(복압성·절박성·범람성·기능성·혼합성)과 유형별 중재 차이,
  노인 무증상 세균뇨는 항생제 대상 아님, 항콜린제(oxybutynin)의 노인 부작용과 Beers Criteria,
  Kegel 운동 구체적 방법과 방광훈련 간격 조정법, 유치도뇨관은 최후 수단.
- 약어 첫 등장 시 한글 병기.

### 2. 3개 JSON을 `data/case-scenarios.js`에 병합
`window.NORI_CASE2.cases` 배열 끝(마지막 `blk-` 사례 뒤)에 삽입.
파일은 순수 JS 리터럴이므로 들여쓰기 6칸 기준으로 기존 항목과 동일하게 포맷을 맞출 것.
스크립트로 삽입하지 말고 기존 스타일(2칸 들여쓰기 중첩, 큰따옴표)에 맞춰 넣는다.

### 3. 검증
```
node --check data/case-scenarios.js
node scratch/validate-blocks.js   # answer-blocks 스키마 검증 (exam2-boost 브랜치에 있음)
# 전 블록 커버리지 0 확인:
node -e 'global.window={};require("./data/answer-blocks.js");const d=global.window.NORI_BLOCKS;
const src=require("fs").readFileSync("./data/case-scenarios.js","utf8");
const used=new Set([...src.matchAll(/"blockRef": "([^"]+)"/g)].map(m=>m[1]));
let n=0;for(const t of d.topics){const un=Object.keys(t.blocks).map(k=>t.key+"."+k).filter(k=>!used.has(k));if(un.length){n+=un.length;console.log(t.key,un.join(","))}}
console.log("미연결:",n)'
# 중복 id 없는지:
node -e 'global.window={};require("./data/case-scenarios.js");const ids=window.NORI_CASE2.cases.map(c=>c.id).filter(Boolean);
console.log("cases",ids.length,"중복",ids.length-new Set(ids).size)'
```
파일 상단 주석의 사례 개수 설명("계통별 연습 17" 등)도 실제 개수에 맞게 갱신할 것.

### 4. 커밋·푸시
한국어 커밋 메시지. `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 로 끝낼 것.
`exam2-boost-blocks` 브랜치에 푸시하고 `exam2-boost` 대상 draft PR 생성.
main/master 푸시·강제푸시·머지 금지.

## 그 다음: 야간 검증·개선 루프
사용자 지시 — 위 작업 완료 후 야간에 검증·개선 루프를 돌릴 것.
점검 항목:
- 답안의 임상적 정확성(약물 용량·금기·기준 수치), 블록과 사례 답안의 내용 불일치
- 문항 개수 지정("~5가지")과 실제 points 개수의 정합
- 약어 첫 등장 한글 병기 누락
- 기출 모범답안 항목이 블록에서 누락되지 않았는지
- `index.html`에서 데이터 파일 로드 후 콘솔 에러 없는지

## 주의
- `data/00-data.js` 류의 생성 파일 규칙은 이 프로젝트엔 없음. `data/*.js`는 직접 편집 대상.
- 다른 세션이 같은 파일을 동시에 편집한 이력이 있음(2026-07-25 15:05 UTC). 작업 전 `git status`와
  `git log --oneline -3` 으로 최신 상태를 먼저 확인할 것.
