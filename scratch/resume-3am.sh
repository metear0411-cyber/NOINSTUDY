#!/usr/bin/env bash
# NOINSTUDY 블록연습 사례 작업 재개 — 한국시간 새벽 3시 1회 실행 (crontab: 0 18 25 7 * = 18:00 UTC)
# 실행 후 스스로 crontab 항목을 제거한다.
set -uo pipefail

WT=/home/lsa9005/NOINSTUDY/.claude/worktrees/blk-remaining
LOG=/home/lsa9005/NOINSTUDY-resume-3am.log

exec >>"$LOG" 2>&1
echo "===== 시작: $(date '+%F %T %Z') (KST $(TZ=Asia/Seoul date '+%F %T')) ====="

cd "$WT" || { echo "워크트리 없음: $WT"; exit 1; }

PROMPT='NOINSTUDY 2차시험 [블록연습] 사례 작업을 이어서 끝내라. 모든 산출물과 커밋 메시지는 한국어로 작성한다.

먼저 현재 디렉터리의 `scratch/HANDOFF.md` 를 정독하라. 현재 상태, 남은 할 일, 검증 명령, 커밋 규칙이 모두 그 문서에 있다. 그 문서를 단일 지침으로 삼아 다음을 수행하라.

1. `scratch/gen-urin.json` 작성 (요실금 사례 blk-urin-1, 5문항). HANDOFF.md 의 사양과 임상 정확성 요건을 그대로 따를 것.
2. `scratch/gen-resp.json`, `scratch/gen-eol.json`, `scratch/gen-urin.json` 3건을 `data/case-scenarios.js` 의 `window.NORI_CASE2.cases` 배열 끝에 기존 포맷에 맞춰 병합.
3. HANDOFF.md 의 검증 명령을 모두 실행해 (a) `node --check` 통과 (b) 미연결 블록 0개 (c) 중복 id 0개 를 확인. 실패하면 고칠 것. 파일 상단 주석의 사례 개수 설명도 실제 개수로 갱신.
4. 여기까지 되면 커밋하고 `exam2-boost-blocks` 에 푸시.

그 다음 검증·개선 루프를 수행하라. HANDOFF.md 마지막 절의 점검 항목(답안의 임상적 정확성과 약물 용량·금기·기준 수치, 블록과 사례 답안의 내용 불일치, "~N가지" 개수 지정과 points 개수의 정합, 약어 첫 등장 한글 병기 누락, 기출 모범답안 항목 누락)을 기준으로 `blk-` 로 시작하는 사례 전체를 점검하고, 명백한 오류는 수정한 뒤 별도 커밋으로 남겨라. 판단이 갈리는 사항은 고치지 말고 목록으로만 정리하라.

마지막에 `gh pr create --draft --base exam2-boost` 로 draft PR 을 생성하라. PR 본문에 추가한 사례, 블록 커버리지 결과, 검증 루프에서 고친 것과 판단 보류한 것을 한국어로 정리하라. 이미 PR 이 있으면 본문만 갱신하라.

제약: main/master 푸시 금지, 강제푸시 금지, 머지 금지. 커밋 메시지는 한국어로 쓰고 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 로 끝낼 것.'

/home/lsa9005/.local/bin/claude -p "$PROMPT" \
  --model claude-opus-5 \
  --permission-mode bypassPermissions \
  --add-dir "$WT"

echo "===== 종료(exit=$?): $(date '+%F %T %Z') ====="

# 1회성이므로 자기 자신을 crontab에서 제거
crontab -l 2>/dev/null | grep -v 'resume-3am.sh' | crontab - || true
echo "crontab 항목 제거 완료"
