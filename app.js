// app.js — 노인전문간호사 v2
// 라우팅 · 렌더링 · 퀴즈(임상추론형) · 플래시카드 · 진행도 저장

(function () {
  'use strict';

  const EXAM_DATE = new Date(2026, 6, 5);  // 2026-07-05 로컬 자정 (월은 0-indexed) — UTC 파싱 시 타임존 오차로 D-Day 하루 밀림 방지
  const LS_KEY     = 'nori_marks_v2';
  const LS_CAT_KEY = 'nori_cat_v2';   // 카테고리 접힘 상태
  const LS_MOCK    = 'nori_mock_v1';  // 모의고사 회차별 결과 { batchId: {pct,correct,total,doneAt} }
  const LS_QMARK   = 'nori_qmark_v1'; // 문항별 마킹 { qid: 'known' | 'review' }
  const LS_QSTAT   = 'nori_qstat_v1'; // 문항별 통계 { qid: {seen,wrong} }
  const LS_MOCKPROG = 'nori_mockprog_v1'; // 모의고사 진행 임시저장 { batchId: {ids,current,scores,label} }
  const LS_FOCUS   = 'nori_focus_v1'; // 집중(넓게보기) 모드 on/off
  const LS_STREAK  = 'nori_streak_v1'; // 연속 학습일 { last:'YYYY-MM-DD', count:N }
  const LS_FREEPOS = 'nori_freepos_v1'; // 자유 풀기 필터별 마지막 위치 { 'type|chapter': index }

  // ── 간격 반복(Leitner) ──
  // 박스 단계(1~5)별 다음 복습까지 간격(시간). 시험이 가까우므로 짧게 순환.
  // 틀리면 box=1로 리셋 → 8시간 뒤(=대개 다음 세션) 다시 등장.
  const SRS_HOURS = [null, 8, 24, 3 * 24, 6 * 24, 11 * 24]; // index = box (1..5)
  const DAILY_DEFAULT = 25; // '오늘의 한 판' 기본 문항 수

  const MOCK_SIZE = 150;  // 모의고사 회당 문항 수 (공식 1차 = 공통40 + 노인전공110)

  // 공식 출제기준(2026 개정, 1차 필기) 영역별 문항수 — 합 150
  //  전공 110: 노인질환관리 97 / 장기요양 5 / 건강증진 7 / 생애말기 1
  //  공통  40: 신체검진 10·약리 6·병태생리 6·이론연구 5·전문직발전 7·윤리 2·교육상담 4
  const EXAM_WEIGHTS = {
    '노인질환관리': 97, '노인복지·시설': 5, '건강증진·예방': 7, '생애말기간호': 1,
    '공통:신체검진': 10, '공통:약리': 6, '공통:병태생리': 6, '공통:이론·연구': 5,
    '공통:교육상담': 4, '공통:윤리': 2, '전문간호 총론': 7
  };
  // 빈출 가중(그림노트 ⭐⭐/⭐ 빈출 계통) — 회차 내 선택 확률↑·회차 간 반복 ↑
  const FREQ_BOOST = {
    '순환기계': 1.7, '신경계': 1.7, '호흡기계': 1.5, '내분비계': 1.5,
    '근골격계': 1.4, '소화기계': 1.3, '피부감각계': 1.2
  };

  // ── localStorage 헬퍼 ──
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // 결정론적 RNG (mulberry32) — 같은 회차는 항상 동일 구성
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ─── 앱 상태 ──────────────────────────────────────
  const state = {
    subjects: [],
    data: {},
    currentSubjectId: null,
    currentTopicId: null,
    currentMode: 'study',   // study | quiz | flash
    memoryMode: false,
    filter: 'all',
    search: '',
    marks: {},
    catCollapsed: {},        // { 'subjectId:카테고리명': true } → 접힘
    quiz: { questions: [], current: 0, answered: false, scores: [] },
    flash: { cards: [], current: 0, flipped: false },
    gichulMode: false,
    gichulView: 'mock',      // 'mock' | 'normal' | 'review'
    gichulChapter: '전체',   // 기출 탭 챕터 필터
    gichulType: '기출',      // '기출' | '변형' | '전체'
    gichulSource: '기출',    // 모의고사 출처: '기출' | '변형'
    gichul: { questions: [], current: 0, answered: false, scores: [], mock: false, batchId: null, batchLabel: '' }
  };

  // ─── 초기화 ───────────────────────────────────────
  function init() {
    state.subjects    = window.NORI_SUBJECTS || [];
    state.data        = window.NORI_DATA     || {};
    ensureQuestionIds();   // id 없는 챕터 문항에 안정적 id 부여 → 오답노트 누적 가능
    // 결함으로 숨김 처리된 문항은 출제 풀에서 제외
    if (window.NORI_GICHUL?.questions)   window.NORI_GICHUL.questions   = window.NORI_GICHUL.questions.filter(q => !q.disabled);
    if (window.NORI_VARIATION?.questions) window.NORI_VARIATION.questions = window.NORI_VARIATION.questions.filter(q => !q.disabled);
    state.marks       = JSON.parse(localStorage.getItem(LS_KEY)     || '{}');
    state.catCollapsed = JSON.parse(localStorage.getItem(LS_CAT_KEY) || '{}');

    updateDDay();
    buildSubjectList();
    bindEvents();
    applyFocusMode(localStorage.getItem(LS_FOCUS) === '1');

    if (state.subjects.length) selectSubject(state.subjects[0].id);

    // 그림노트 → 앱 딥링크 (#open=과목id:토픽id) 처리
    window.addEventListener('hashchange', openDeepLink);
    openDeepLink();
  }

  // 해시 딥링크로 특정 토픽 열기 (예: index.html#open=gero-disease:htn)
  function openDeepLink() {
    const m = (location.hash || '').match(/open=([^:&#]+):([^:&#]+)/);
    if (!m) return;
    const sid = decodeURIComponent(m[1]);
    const tid = decodeURIComponent(m[2]);
    if (!state.subjects.some(s => s.id === sid)) return;
    if (sid !== state.currentSubjectId) {
      selectSubject(sid);
      setTimeout(() => selectTopic(tid), 50);
    } else {
      selectTopic(tid);
    }
  }

  // ─── 집중(넓게보기) 모드 ──────────────────────────
  function applyFocusMode(on) {
    document.body.classList.toggle('focus-mode', on);
    const btn = document.getElementById('focusToggle');
    if (btn) {
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? '기본 보기 (사이드바·토픽목록 펼치기)' : '넓게 보기 (사이드바·토픽목록 접기)';
      btn.textContent = on ? '⤡' : '⤢';
    }
    const fab = document.getElementById('focusToggleFloat');
    if (fab) {
      fab.classList.toggle('is-active', on);
      fab.setAttribute('aria-pressed', on ? 'true' : 'false');
      fab.textContent = on ? '⤡ 펼치기' : '⤢ 넓게';
    }
    localStorage.setItem(LS_FOCUS, on ? '1' : '0');
  }

  // ─── D-Day ────────────────────────────────────────
  function updateDDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((EXAM_DATE - today) / 86400000);
    const el = document.getElementById('daysLeft');
    if (!el) return;
    el.textContent = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-Day!' : `D+${Math.abs(diff)}`;
    el.style.color = diff <= 14 ? 'var(--clay)' : diff <= 30 ? 'var(--gold)' : 'var(--teal)';
  }

  // ─── 과목 목록 ────────────────────────────────────
  function buildSubjectList() {
    const list = document.getElementById('subjectList');
    if (!list) return;

    const filtered = getFilteredSubjects();
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">검색 결과 없음</div>';
      return;
    }

    list.innerHTML = filtered.map(s => {
      const prog  = getSubjectProgress(s.id);
      const active = s.id === state.currentSubjectId;
      return `<button class="subject-button${active ? ' is-active' : ''}"
                       data-subject="${s.id}" type="button">
        <span>
          <strong>${s.icon || ''} ${esc(s.title)}</strong>
          <span class="sub-meta">${esc(s.meta)}</span>
        </span>
        <span class="sub-right">
          <span class="priority-badge">${esc(s.priority)}</span>
          <span class="progress-mini">
            <span class="progress-mini-fill" style="width:${prog}%"></span>
          </span>
        </span>
      </button>`;
    }).join('');
  }

  function getFilteredSubjects() {
    let list = state.subjects;
    if (state.filter !== 'all') list = list.filter(s => s.category === state.filter);
    if (!state.search) return list;

    const q = state.search.toLowerCase();
    return list.filter(s => {
      if (s.title.toLowerCase().includes(q)) return true;
      const d = state.data[s.dataKey];
      if (!d) return false;
      return d.topics.some(t =>
        t.title.toLowerCase().includes(q) ||
        (t.memory || []).some(m => m.toLowerCase().includes(q)) ||
        (t.understand?.pathology || '').toLowerCase().includes(q)
      );
    });
  }

  function getSubjectProgress(subjectId) {
    const s = state.subjects.find(x => x.id === subjectId);
    if (!s) return 0;
    const d = state.data[s.dataKey];
    if (!d?.topics.length) return 0;
    const done = d.topics.filter(t => state.marks[`${subjectId}:${t.id}`]?.done).length;
    return Math.round((done / d.topics.length) * 100);
  }

  // ─── 과목 선택 ────────────────────────────────────
  function selectSubject(subjectId) {
    if (state.gichulMode) exitGichulMode();
    if (document.getElementById('medPanel')?.style.display !== 'none') exitMedMode();
    if (document.getElementById('cramPanel')?.style.display === '') exitCramMode();
    state.currentSubjectId = subjectId;
    state.currentTopicId   = null;

    const s = state.subjects.find(x => x.id === subjectId);
    if (!s) return;

    // 헤더 배너 업데이트
    document.getElementById('subjectMeta').textContent    = s.meta;
    document.getElementById('subjectTitle').textContent   = s.title;
    document.getElementById('subjectSummary').textContent = s.summary || '';

    const ring = document.getElementById('weightRing');
    if (ring) {
      ring.style.setProperty('--value', s.weight || 0);
      ring.querySelector('strong').textContent = `${s.weight || 0}%`;
    }
    document.getElementById('focusChips').innerHTML =
      (s.chips || []).map(c => `<span class="chip">${esc(c)}</span>`).join('');

    buildSubjectList();
    buildTopicList();
    clearLesson();

    // 모바일에서 과목 선택 시 사이드바 자동 닫기 (선택 후 바로 내용이 보이도록)
    document.getElementById('subjectRail')?.classList.remove('is-open');
    document.getElementById('sidebarOverlay')?.classList.remove('is-open');
  }

  // ─── 토픽 목록 ────────────────────────────────────
  function buildTopicList() {
    const list = document.getElementById('partList');
    if (!list) return;

    const s = state.subjects.find(x => x.id === state.currentSubjectId);
    if (!s) return;

    const d = state.data[s.dataKey];
    if (!d?.topics.length) {
      list.innerHTML = '<div class="empty-state">콘텐츠 준비 중입니다</div>';
      return;
    }

    let topics = d.topics;

    // 검색어 있으면 전 과목 토픽 대상으로 크로스 검색
    if (state.search) {
      const q = state.search.toLowerCase();
      const allMatches = [];
      state.subjects.forEach(subj => {
        const sd = state.data[subj.dataKey];
        if (!sd?.topics) return;
        sd.topics.forEach(t => {
          const hit = t.title.toLowerCase().includes(q) ||
            (t.memory || []).some(m => m.toLowerCase().includes(q)) ||
            (t.understand?.pathology || '').toLowerCase().includes(q) ||
            (t.understand?.intervention || '').toLowerCase().includes(q) ||
            (t.traps || []).some(tr => tr.toLowerCase().includes(q));
          if (hit) allMatches.push({ topic: t, subjectId: subj.id, subjectTitle: subj.title });
        });
      });

      if (allMatches.length === 0) {
        list.innerHTML = `<div class="search-empty">검색 결과 없음<br><small>'${esc(state.search)}'과 일치하는 토픽이 없습니다</small></div>`;
        return;
      }

      list.innerHTML = allMatches.map(({ topic: t, subjectId, subjectTitle }) => {
        const mark   = state.marks[`${subjectId}:${t.id}`] || {};
        const active = t.id === state.currentTopicId && subjectId === state.currentSubjectId;
        return `<button class="part-button${active ? ' is-active' : ''} search-result-btn"
          data-topic="${esc(t.id)}" data-subject="${esc(subjectId)}" type="button">
          <span class="search-result-subject">${esc(subjectTitle)}</span>
          <span class="part-title">${esc(t.title)}</span>
          ${mark.done ? '<span class="mark done">✓</span>' : ''}
          ${mark.bookmark ? '<span class="mark bk">★</span>' : ''}
          ${mark.weak ? '<span class="mark wk">!</span>' : ''}
        </button>`;
      }).join('');

      // 크로스 검색 결과 클릭 — 과목 전환 후 토픽 선택
      list.querySelectorAll('.search-result-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.dataset.subject;
          const tid = btn.dataset.topic;
          if (sid !== state.currentSubjectId) {
            selectSubject(sid);
            // 과목 전환 후 토픽 선택 (buildTopicList 완료 후 짧은 딜레이)
            setTimeout(() => selectTopic(tid), 50);
          } else {
            selectTopic(tid);
          }
        });
      });
      return;
    }

    // 카테고리 필드가 있으면 계통별 그룹화, 없으면 기존 평면 렌더링
    const hasCategories = topics.some(t => t.category);
    if (!hasCategories) {
      list.innerHTML = topics.map(t => renderTopicBtn(t)).join('');
      return;
    }

    // 카테고리별 그룹화 (categoryOrder → 삽입 순서 유지)
    const catMap = new Map();
    topics.forEach(t => {
      const cat = t.category || '기타';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(t);
    });

    list.innerHTML = Array.from(catMap.entries()).map(([cat, catTopics]) => {
      const catKey   = `${state.currentSubjectId}:${cat}`;
      const collapsed = state.catCollapsed[catKey] || false;
      const hasDone  = catTopics.some(t => state.marks[`${state.currentSubjectId}:${t.id}`]?.done);
      const hasWeak  = catTopics.some(t => state.marks[`${state.currentSubjectId}:${t.id}`]?.weak);
      const hasBookmark = catTopics.some(t => state.marks[`${state.currentSubjectId}:${t.id}`]?.bookmark);

      const badgeHtml = [
        hasBookmark ? '<span class="cat-badge cat-badge--bm">★</span>' : '',
        hasDone     ? '<span class="cat-badge cat-badge--done">✓</span>' : '',
        hasWeak     ? '<span class="cat-badge cat-badge--weak">!</span>'  : ''
      ].filter(Boolean).join('');

      return `
        <div class="category-group${collapsed ? ' is-collapsed' : ''}" data-cat="${esc(catKey)}">
          <button class="category-header" type="button" data-cat-toggle="${esc(catKey)}">
            <span class="cat-arrow">${collapsed ? '▶' : '▼'}</span>
            <span class="cat-name">${esc(cat)}</span>
            <span class="cat-count">${catTopics.length}</span>
            ${badgeHtml}
          </button>
          <div class="cat-topic-list">
            ${catTopics.map(t => renderTopicBtn(t)).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function renderTopicBtn(t) {
    const mark   = state.marks[`${state.currentSubjectId}:${t.id}`] || {};
    const states = [
      mark.bookmark ? 'bookmark' : '',
      mark.done     ? 'done'     : '',
      mark.weak     ? 'weak'     : ''
    ].filter(Boolean).join(' ');
    const active = t.id === state.currentTopicId;
    const sub    = t.priority === 'high' ? '★ 핵심' : t.priority === 'medium' ? '▷ 중요' : '';
    return `<button class="part-button${active ? ' is-active' : ''}"
                     data-topic="${esc(t.id)}"
                     ${states ? `data-state="${states}"` : ''}
                     type="button">
      <strong>${esc(t.title)}</strong>
      ${sub ? `<span>${sub}</span>` : ''}
    </button>`;
  }

  // ─── 토픽 선택 ────────────────────────────────────
  function selectTopic(topicId) {
    // 약물·기출·암기노트 패널이 열려 있으면 닫고 학습 화면으로 복귀 (사이드바에서 바로 토픽 이동 가능)
    if (state.gichulMode) exitGichulMode();
    if (document.getElementById('medPanel')?.style.display !== 'none') exitMedMode();
    if (document.getElementById('cramPanel')?.style.display === '') exitCramMode();

    state.currentTopicId = topicId;
    state.quiz  = { questions: [], current: 0, answered: false, scores: [] };
    state.flash = { cards: [], current: 0, flipped: false };

    buildTopicList();
    updateMarkButtons();
    renderCurrentMode();
  }

  // ─── 렌더링 디스패치 ──────────────────────────────
  function renderCurrentMode() {
    const topic = getCurrentTopic();
    if (!topic?.id) return;

    document.getElementById('topicPriority').textContent =
      topic.priority === 'high' ? '★ 핵심 주제' :
      topic.priority === 'medium' ? '▷ 중요 주제' : '';
    document.getElementById('topicTitle').textContent = topic.title;

    ['study', 'quiz', 'flash'].forEach(m => {
      const el = document.getElementById(`mode${cap(m)}`);
      if (el) el.style.display = state.currentMode === m ? '' : 'none';
    });

    if      (state.currentMode === 'study') renderStudy(topic);
    else if (state.currentMode === 'quiz')  renderQuiz(topic);
    else                                     renderFlash(topic);
  }

  function clearLesson() {
    document.getElementById('topicPriority').textContent = '';
    document.getElementById('topicTitle').textContent    = '← 왼쪽에서 토픽을 선택하세요';
    ['modeStudy', 'modeQuiz', 'modeFlash'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.innerHTML = ''; el.style.display = ''; }
    });
    document.getElementById('modeQuiz').style.display  = 'none';
    document.getElementById('modeFlash').style.display = 'none';
  }

  function getCurrentTopic() {
    const s = state.subjects.find(x => x.id === state.currentSubjectId);
    const d = state.data[s?.dataKey];
    return d?.topics.find(t => t.id === state.currentTopicId) || null;
  }

  // ─── 토픽 유형별 플로우 레이블 ──────────────────────
  const FLOW_LABELS = {
    clinical:  ['병태생리', '노인 특이성', '사정', '중재', '평가'],
    policy:    ['제도 배경', '대상·기준', '급여 유형', '운영 원칙', '평가·관리'],
    nursing:   ['역할 배경', '노인 특수성', '사정·도구', '간호중재', '평가기준'],
    promotion: ['개요·근거', '노인 특이성', '사정·스크리닝', '중재·프로그램', '효과 평가']
  };

  // ─── 학습 모드 ────────────────────────────────────
  function renderStudy(topic) {
    const el = document.getElementById('modeStudy');
    if (!el) return;

    // coreSummary 를 갖춘 토픽은 레이어드 UI 렌더러 사용 (그 외 토픽은 기존 렌더 유지)
    if (topic.coreSummary) { renderStudyLayered(topic, el); return; }

    let html = '';

    // 초보자 배너 + 왜 중요한가
    if (topic.beginner)    html += `<div class="beginner-banner"><strong>초보자 포인트&nbsp;</strong>${esc(topic.beginner)}</div>`;
    if (topic.whyImportant) html += `<div class="why-banner"><strong>왜 시험에 나오는가?&nbsp;</strong>${esc(topic.whyImportant)}</div>`;

    // 비교표(빈출 비교 정리) — 상단 노출
    (topic.compareTables || (topic.compareTable ? [topic.compareTable] : [])).forEach(ct => {
      html += section(ct.title || '한눈 비교 정리', compareTableBlock(ct));
    });

    // Red Flags
    if (topic.redFlags?.length) {
      html += section('🚨 즉시 대응 신호 (Red Flags)',
        `<ul class="trap-list">${topic.redFlags.map(f => `<li>🚨 ${esc(f)}</li>`).join('')}</ul>`);
    }

    if (state.memoryMode) {
      // 암기 집중 모드
      if (topic.memory?.length) {
        html += section('핵심 암기 포인트', memoryList(topic.memory));
      }
      if (topic.traps?.length) {
        html += section('함정 &amp; 주의사항', trapList(topic.traps));
      }
    } else {
      // 이해 모드 — 임상 추론 플로우
      const u = topic.understand || {};
      const lbl = FLOW_LABELS[topic.topicType || 'clinical'];
      const flowTitle = topic.topicType === 'policy'   ? '제도 구조 개요' :
                        topic.topicType === 'nursing'  ? '간호 실무 흐름' :
                        topic.topicType === 'promotion'? '건강증진 흐름' :
                                                         '임상 추론 흐름 (PAPIE)';
      if (u.pathology || u.geriatric_specifics || u.assessment || u.intervention || u.evaluation) {
        html += section(flowTitle,
          `<div class="flow-strip">
            ${flowStep(lbl[0], u.pathology)}
            ${flowStep(lbl[1], u.geriatric_specifics)}
            ${flowStep(lbl[2], u.assessment)}
            ${flowStep(lbl[3], u.intervention)}
            ${flowStep(lbl[4], u.evaluation)}
          </div>`);
      }

      // 약물치료 섹션 (medications 필드가 있는 토픽에서만 표시)
      html += medsSection(topic);

      if (topic.memory?.length) {
        html += section('핵심 암기 포인트', memoryList(topic.memory));
      }
      if (topic.traps?.length) {
        html += section('함정 &amp; 주의사항', trapList(topic.traps));
      }
    }

    // 2차 답안 틀
    if (topic.caseFrame) {
      html += section('2차 사례형 답안 틀 (SOAP)',
        `<div class="why-banner" style="white-space:pre-line;">${esc(topic.caseFrame)}</div>`);
    }

    el.innerHTML = html || '<div class="empty-state">학습 내용을 준비 중입니다</div>';
  }

  // ─── 학습 모드 (레이어드 UI) ──────────────────────
  // ① 한눈에(비유·초보·왜 + 그림노트 딥링크) → ② 핵심 한 장 → ③ 자세히(접기)
  function renderStudyLayered(topic, el) {
    let html = '';

    // ── ① 한눈에 ──
    let glance = '';
    if (topic.analogy)
      glance += `<div class="l-analogy"><span class="l-analogy-tag">💡 쉽게 이해</span><span>${esc(topic.analogy)}</span></div>`;
    if (topic.beginner)
      glance += `<div class="beginner-banner"><strong>초보자 포인트&nbsp;</strong>${esc(topic.beginner)}</div>`;
    if (topic.whyImportant)
      glance += `<div class="why-banner"><strong>왜 시험에 나오는가?&nbsp;</strong>${esc(topic.whyImportant)}</div>`;
    if (topic.noteLink) {
      const nl = topic.noteLink;
      glance += `<a class="note-link-btn" href="${nl.file}#${nl.anchor}" target="_blank" rel="noopener">`
              + `<span class="note-link-ico">📖</span>`
              + `<span class="note-link-txt"><strong>그림으로 보기</strong><span>${esc(nl.label || '그림노트')}</span></span>`
              + `<span class="note-link-arrow">↗</span></a>`;
    }
    if (glance) html += `<div class="l-glance">${glance}</div>`;

    // ── ② 핵심 한 장 정리 ──
    if (topic.coreSummary?.length)
      html += section('⭐ 핵심 한 장 정리', labeledCard(topic.coreSummary));

    // 비교표(빈출 비교 정리) — 표 형태로 한눈에. coreSummary 바로 아래 노출.
    (topic.compareTables || (topic.compareTable ? [topic.compareTable] : [])).forEach(ct => {
      html += section(ct.title || '한눈 비교 정리', compareTableBlock(ct));
    });

    // Red Flags — 안전상 항상 노출
    if (topic.redFlags?.length)
      html += section('🚨 즉시 대응 신호 (Red Flags)', redFlagCards(topic.redFlags));

    // ── ③ 자세히 보기 (접기) ──
    let deep = '';
    const u = topic.understand || {};
    const lbl = FLOW_LABELS[topic.topicType || 'clinical'];
    const flowTitle = topic.topicType === 'policy'    ? '제도 구조 개요' :
                      topic.topicType === 'nursing'   ? '간호 실무 흐름' :
                      topic.topicType === 'promotion' ? '건강증진 흐름' :
                                                        '임상 추론 흐름 (PAPIE)';
    if (u.pathology || u.geriatric_specifics || u.assessment || u.intervention || u.evaluation) {
      deep += section(flowTitle, stepFlow([
        { step: lbl[0], text: u.pathology },
        { step: lbl[1], text: u.geriatric_specifics },
        { step: lbl[2], text: u.assessment },
        { step: lbl[3], text: u.intervention },
        { step: lbl[4], text: u.evaluation }
      ]));
    }
    deep += medsSection(topic);
    if (topic.memory?.length)
      deep += section('핵심 암기 포인트', memoryList(topic.memory));
    if (topic.traps?.length)
      deep += section('함정 &amp; 주의사항', trapList(topic.traps));
    if (topic.caseFrame)
      deep += section('2차 사례형 답안 틀 (SOAP)',
        `<div class="why-banner" style="white-space:pre-line;">${esc(topic.caseFrame)}</div>`);

    if (deep)
      html += `<details class="l-deep"><summary class="l-deep-summary">`
            + `<span>📂 자세히 보기 — 임상추론·약물·암기·함정·SOAP</span>`
            + `<span class="l-deep-chev" aria-hidden="true">▾</span></summary>`
            + `<div class="l-deep-body">${deep}</div></details>`;

    el.innerHTML = html || '<div class="empty-state">학습 내용을 준비 중입니다</div>';
  }

  // 함정 & 주의사항 — 머리말(:/→/—)만 보이는 접이식 줄. 긴 경고 문장 나열 완화.
  function trapList(items) {
    const rows = items.map(t => {
      const s = String(t);
      const m = s.match(/[:：]|→|—/);
      const idx = m ? m.index : -1;
      if (idx > 0 && idx <= 52) {
        const head = s.slice(0, idx).trim();
        const body = s.slice(idx + m[0].length).trim();
        if (body) return `<details class="trap-item"><summary class="trap-key"><span class="key-text">⚠ ${emph(esc(head))}</span><span class="mem-chev" aria-hidden="true">▾</span></summary><div class="trap-detail">${emph(esc(body))}</div></details>`;
      }
      return `<div class="trap-item trap-plain">⚠ ${emph(esc(s))}</div>`;
    }).join('');
    return `<div class="trap-fold">${rows}</div>`;
  }

  // 핵심 암기 포인트 — 키워드(머리말)만 보이는 접이식 줄. 키워드가 없으면 일반 줄.
  // 긴 문장 나열로 인한 가독성 저하 완화: 헤드워드 스캔 → 필요한 것만 펼침.
  function memoryList(items) {
    const rows = items.map(m => {
      const s = String(m);
      const ci = s.search(/[:：]/);
      if (ci > 0 && ci <= 42) {
        const head = s.slice(0, ci).trim();
        const body = s.slice(ci + 1).trim();
        if (body) return `<details class="mem-item"><summary class="mem-key"><span class="key-text">${emph(esc(head))}</span><span class="mem-chev" aria-hidden="true">▾</span></summary><div class="mem-detail">${emph(esc(body))}</div></details>`;
      }
      return `<div class="mem-item mem-plain">${emph(esc(s))}</div>`;
    }).join('');
    return `<div class="mem-list">${rows}</div>`;
  }

  // 핵심 정리 — 색상 라벨 칩 + 설명 카드 (체크리스트: 순서 아님 → 번호 X)
  function labeledCard(items) {
    return `<div class="lc-list">${items.map(it => `
      <div class="lc-row">
        <span class="lc-chip">${esc(it.label)}</span>
        <span class="lc-detail">${esc(it.detail)}</span>
      </div>`).join('')}</div>`;
  }

  // 비교표 — 빈출 항목을 행/열로 한눈에. intro(설명 문단)·notes(표 아래 요점) 선택.
  // 셀 안에서도 **강조**·수치·경고어 하이라이트 적용. 모바일에서 가로 스크롤.
  function compareTableBlock(ct) {
    const head = `<tr>${(ct.headers || []).map(h => `<th>${emph(esc(h))}</th>`).join('')}</tr>`;
    const body = (ct.rows || []).map(r =>
      `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="cmp-key"' : ''}>${emph(esc(String(c)))}</td>`).join('')}</tr>`
    ).join('');
    const intro = ct.intro ? `<p class="cmp-intro">${emph(esc(ct.intro))}</p>` : '';
    const notes = (ct.notes && ct.notes.length)
      ? `<ul class="cmp-notes">${ct.notes.map(n => `<li>${emph(esc(n))}</li>`).join('')}</ul>` : '';
    return `${intro}<div class="cmp-scroll"><table class="cmp-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>${notes}`;
  }

  // 진짜 순서가 있는 흐름(PAPIE 등) → 번호 스텝
  function stepFlow(steps) {
    const rows = steps.filter(s => s.text).map((s, i) => `
      <div class="step-row">
        <span class="step-num">${i + 1}</span>
        <div class="step-body"><strong class="step-label">${esc(s.step)}</strong>${formatFlowText(s.text)}</div>
      </div>`).join('');
    return `<div class="step-flow">${rows}</div>`;
  }

  // Red Flags — 객체 배열이면 색상 띠 카드, 문자열 배열이면 기존 리스트(하위호환)
  function redFlagCards(items) {
    if (typeof items[0] === 'string')
      return `<ul class="trap-list">${items.map(f => `<li>🚨 ${esc(f)}</li>`).join('')}</ul>`;
    return `<div class="rf-list">${items.map(it => {
      const emergency = it.level === 'emergency';
      return `<div class="rf-card ${emergency ? 'rf-emergency' : 'rf-urgency'}">
        <span class="rf-badge">${emergency ? '응급' : '긴박·주의'}</span>
        <div class="rf-body">
          <p class="rf-sign">${esc(it.sign)}</p>
          <p class="rf-action">→ ${esc(it.action)}</p>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  // 약물치료 섹션 (medications 필드가 있는 토픽에서만) — 기존/레이어드 공용
  function medsSection(topic) {
    if (!topic.medications?.length) return '';
    const medsHtml = topic.medications.map(med => {
      const sideArr = Array.isArray(med.sideEffects) ? med.sideEffects : (med.sideEffects ? [med.sideEffects] : []);
      const nurseArr = Array.isArray(med.nursingPoints) ? med.nursingPoints : (med.nursingPoints ? [med.nursingPoints] : []);
      return `<div class="med-card">
        <div class="med-category">${esc(med.category)}</div>
        ${med.indication ? `<div class="med-use"><strong>💡 이럴 때 써요 (적응증·효능)</strong><p>${emph(esc(med.indication))}</p></div>` : ''}
        ${med.examples?.length ? `<div class="med-examples">${med.examples.map(e => `<span class="med-pill">${esc(e)}</span>`).join('')}</div>` : ''}
        ${med.mechanism ? `<div class="med-detail"><strong>기전</strong><p>${esc(med.mechanism)}</p></div>` : ''}
        ${sideArr.length ? `<div class="med-detail"><strong>⚠️ 부작용</strong><ul>${sideArr.map(s => `<li class="med-side-effect">${esc(s)}</li>`).join('')}</ul></div>` : ''}
        ${nurseArr.length ? `<div class="med-detail"><strong>💉 간호 포인트</strong><ul>${nurseArr.map(n => `<li${isCriticalNurse(n) ? ' class="med-critical"' : ''}>${esc(n)}</li>`).join('')}</ul></div>` : ''}
        ${med.examPattern ? `<div class="med-exam"><strong>📝 기출 포인트</strong><p>${emph(esc(med.examPattern))}</p></div>` : ''}
      </div>`;
    }).join('');
    return section('💊 약물치료', `<div class="med-grid">${medsHtml}</div>`);
  }

  function section(title, bodyHtml) {
    return `<div class="study-section"><h4>${title}</h4>${bodyHtml}</div>`;
  }

  // 핵심어 강조 — 이미 esc()된 문자열에만 적용(숫자·단위·별표는 esc 영향 없음, 안전)
  // 색 체계: **외울 핵심**(보라 형광) · 경고어(점토) · 수치+단위(청록)
  function emph(escaped) {
    // 1) 수동 강조 **...**(빈출 핵심)는 먼저 추출해 보호 → 자동 강조 중첩 방지
    const keys = [];
    let s = escaped.replace(/\*\*([^*\n]+?)\*\*/g, (_, g) => `${keys.push(g) - 1}`);
    // 2) 경고어(점토) · 수치+단위(청록) 자동 강조
    s = s
      .replace(/(금기|금지|절대|즉시|응급|반드시|주의|중단|위험|사망|독성)/g, '<b class="kw-warn">$1</b>')
      .replace(/(\d+(?:\.\d+)?\s?(?:mmHg|mg\/dL|mEq\/L|mg|mcg|mL|%|회|시간|분|일|주|kg|g))/g, '<b class="kw-num">$1</b>');
    // 3) 보호한 핵심 복원
    return s.replace(/(\d+)/g, (_, i) => `<b class="kw-key">${keys[+i]}</b>`);
  }

  // flowStep 텍스트를 '. ' '; ' '①②③' 기준으로 잘게 분리 + 핵심어 강조
  function formatFlowText(text) {
    if (!text) return '';
    // 원형숫자 마커 앞에 분리 토큰(\u0001) 삽입 후, 문장부호 기준으로도 분리
    const marked = text.replace(/\s*([①②③④⑤⑥⑦⑧⑨⑩])\s*/g, '\u0001$1');
    const parts = marked
      .split(/\u0001|(?:\.\s+|;\s+)(?=[가-힣A-Z【\d])/)
      .map(p => p
        .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
        .replace(/[.;]\s*$/, '')
        .trim()
      )
      .filter(Boolean);
    if (parts.length <= 1) return `<span>${emph(esc(text))}</span>`;
    return `<ol class="flow-text-list">${parts.map(p => `<li>${emph(esc(p))}</li>`).join('')}</ol>`;
  }

  // 간호포인트 중 금기·주의·위험 키워드 포함 여부 감지
  function isCriticalNurse(text) {
    return /금기|금지|절대\s|주의|위험|즉시|응급|반드시|중단\s|독성|사망/.test(text);
  }

  function flowStep(label, text) {
    return `<div class="flow-step">
      <strong>${label}</strong>
      ${text ? formatFlowText(text) : '<span style="color:#bbb">준비중</span>'}
    </div>`;
  }

  // 문제 전환 시 퀴즈 패널 상단으로 스크롤 (긴 사례형에서 새 문제 시작점이 화면 밖으로 밀리는 문제 방지)
  function scrollQuizTop() {
    const panel = document.querySelector('.lesson-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── 퀴즈 모드 ───────────────────────────────────
  function renderQuiz(topic) {
    const el = document.getElementById('modeQuiz');
    if (!el) return;

    const questions = topic.questions || [];
    if (!questions.length) {
      el.innerHTML = '<div class="quiz-empty">퀴즈 문제를 준비 중입니다.<br>학습 모드에서 내용을 먼저 학습해 보세요.</div>';
      return;
    }

    // 첫 진입 시 초기화
    if (!state.quiz.questions.length) {
      state.quiz.questions = shuffle([...questions]);
      state.quiz.current   = 0;
      state.quiz.answered  = false;
      state.quiz.scores    = [];
    }

    const total = state.quiz.questions.length;
    const idx   = state.quiz.current;

    if (idx >= total) { renderQuizResult(el, total); return; }

    const q   = state.quiz.questions[idx];
    const pct = Math.round((idx / total) * 100);
    const nums = '①②③④⑤';

    let html = `<div class="quiz-wrapper">
      <div>
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width:${pct}%"></div>
        </div>
        <p class="quiz-counter">${idx + 1} / ${total}</p>
      </div>`;

    // 임상 사례 (case 유형)
    if (q.caseStory) {
      html += `<div class="beginner-banner">
        <strong>📋 임상 사례</strong><br>
        ${esc(q.caseStory).replace(/\n/g, '<br>')}
      </div>`;
    }

    // 핵심 단서 읽기 (stemHighlights) — 답 선택 후 자동 공개
    if (q.stemHighlights?.length) {
      html += `<div id="quizStemHighlights" style="display:none;padding:10px 14px;background:var(--gold-soft);border-radius:8px;font-size:13px;">
        <strong style="display:block;margin-bottom:6px;color:var(--gold)">⚡ 핵심 단서 (답 선택 후 공개)</strong>
        ${q.stemHighlights.map(h => {
          const color = h.risk === 'high' ? '#c0392b' : h.risk === 'medium' ? '#d68910' : '#1e8449';
          const icon  = h.risk === 'high' ? '🔴' : h.risk === 'medium' ? '🟡' : '🟢';
          return `<div style="padding:4px 0;border-bottom:1px solid #e8d9b8;">
            <span style="font-weight:700;">"${esc(h.text)}"</span>
            <span style="color:${color};margin-left:6px;font-size:12px;">${icon} ${esc(h.risk === 'high' ? '주의' : h.risk === 'medium' ? '확인' : '참고')}</span>
            ${h.reason ? `<span style="color:var(--muted);font-size:12px;display:block;padding-left:4px;">${esc(h.reason)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>`;
    }

    // 문제 stem
    html += `<p class="quiz-question">${esc(q.stem)}</p>`;

    // 선택지
    html += `<div class="quiz-options">`;
    (q.choices || []).forEach((c, i) => {
      const text = typeof c === 'string' ? c : c.text;
      html += `<button class="quiz-option" data-opt="${i + 1}" type="button">
        <span class="opt-num">${nums[i] || (i + 1) + '.'}</span>
        <span>${esc(text)}</span>
      </button>`;
    });
    html += `</div>`;

    // 해설 (숨김)
    html += `<div class="quiz-explanation" id="quizExplanation">
      <strong>해설</strong><br>${esc(q.explanation || '해설을 준비 중입니다.')}
    </div>`;

    // 무경력자 가이드 (토글 버튼 + 접힌 내용)
    if (q.learnerSupport) {
      const ls = q.learnerSupport;
      html += `<button id="quizHintToggle" class="quiz-hint-toggle" style="display:none;" type="button">📖 핵심단서 보기 ▶</button>`;
      html += `<div id="quizLearnerSupport" class="quiz-learner-support" style="display:none;padding:12px 14px;background:var(--purple-soft);border-left:4px solid var(--purple);border-radius:0 8px 8px 0;font-size:13px;line-height:1.65;">
        <strong style="display:block;margin-bottom:5px;color:var(--purple)">📖 무경력자 가이드</strong>
        ${ls.clinicalContext ? `<p style="margin:0 0 5px;">${esc(ls.clinicalContext)}</p>` : ''}
        ${ls.keyInsight ? `<p style="margin:0 0 5px;font-weight:700;">${esc(ls.keyInsight)}</p>` : ''}
        ${ls.commonMistake?.length ? `
          <div style="margin-top:6px;"><strong style="font-size:12px;color:var(--clay);">흔한 실수:</strong>
          ${Array.isArray(ls.commonMistake)
            ? `<ul style="margin:4px 0 0;padding-left:16px;">
                ${ls.commonMistake.map(m => `<li style="font-size:13px;">${esc(m)}</li>`).join('')}
              </ul>`
            : `<p style="margin:4px 0 0;font-size:13px;">${esc(ls.commonMistake)}</p>`
          }</div>` : ''}
      </div>`;
    }

    // 네비게이션
    html += `<div class="quiz-nav" id="quizNav">
      <button class="quiz-btn quiz-btn-secondary" id="quizSkipBtn" type="button">건너뛰기</button>
    </div></div>`;

    el.innerHTML = html;

    // 선택지 클릭
    el.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.quiz.answered) return;
        handleQuizAnswer(btn, q, el);
      });
    });

    // 핵심단서 토글 — 위임 리스너는 bindEvents에서 1회만 등록 (중복 방지)

    // 건너뛰기
    el.querySelector('#quizSkipBtn')?.addEventListener('click', () => {
      state.quiz.scores.push(null);
      state.quiz.answered = false;
      state.quiz.current++;
      renderQuiz({ questions: state.quiz.questions });
      scrollQuizTop();
    });
  }

  function handleQuizAnswer(btn, q, el) {
    state.quiz.answered = true;
    const chosen  = parseInt(btn.dataset.opt, 10);
    const correct = q.answerKey;
    const isOk    = chosen === correct;

    state.quiz.scores.push(isOk);
    if (q.id) bumpQStat(q.id, !isOk);  // 챕터 퀴즈 오답도 복습 모음(오답노트)에 누적

    el.querySelectorAll('.quiz-option').forEach((b, i) => {
      b.classList.add('disabled');
      if (i + 1 === correct)              b.classList.add('correct');
      else if (i + 1 === chosen && !isOk) b.classList.add('wrong');
    });

    el.querySelector('#quizExplanation')?.classList.add('show');

    // 핵심 단서 자동 공개 (답 선택 후)
    const stemHints = el.querySelector('#quizStemHighlights');
    if (stemHints) stemHints.style.display = '';

    if (q.learnerSupport) {
      const hintBtn = el.querySelector('#quizHintToggle');
      if (hintBtn) hintBtn.style.display = '';
    }

    const nav = el.querySelector('#quizNav');
    if (nav) {
      const more = state.quiz.current + 1 < state.quiz.questions.length;
      nav.innerHTML = `<button class="quiz-btn quiz-btn-primary" id="quizNextBtn" type="button">
        ${more ? '다음 문제 →' : '결과 확인 →'}
      </button>`;
      nav.querySelector('#quizNextBtn').addEventListener('click', () => {
        state.quiz.answered = false;
        state.quiz.current++;
        renderQuiz({ questions: state.quiz.questions });
        scrollQuizTop();
      });
    }
  }

  function renderQuizResult(el, total) {
    const correct   = state.quiz.scores.filter(s => s === true).length;
    const pct       = Math.round((correct / total) * 100);
    const pass      = pct >= 60;

    // 오답/건너뛴 문제 목록 — 나중에 버튼 핸들러에서 쓰기 위해 캡처
    const wrongQs = state.quiz.questions.filter((q, i) => state.quiz.scores[i] !== true);
    const wrongCount = wrongQs.length;

    el.innerHTML = `<div class="quiz-result">
      <p class="quiz-score" style="color:${pass ? 'var(--green)' : 'var(--clay)'}">${pct}%</p>
      <p class="quiz-score-label">${correct} / ${total} 정답</p>
      <p class="quiz-result-msg">${pass ? '합격권 🎉 잘 하셨어요!' : '조금 더 연습해봐요'}</p>
      <p class="quiz-result-sub">60% 이상이 합격 기준입니다</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;">
        <button class="quiz-btn quiz-btn-primary"   id="quizRetryBtn"  type="button">전체 다시 풀기</button>
        ${wrongCount > 0
          ? `<button class="quiz-btn quiz-btn-wrong" id="quizRetryWrongBtn" type="button">❌ 오답만 다시 풀기 (${wrongCount}문제)</button>`
          : `<button class="quiz-btn quiz-btn-wrong" disabled style="opacity:0.4;cursor:not-allowed">❌ 오답 없음 🎉</button>`
        }
        <button class="quiz-btn quiz-btn-secondary" id="quizStudyBtn"  type="button">학습 모드</button>
      </div>
      ${wrongCount > 0 ? `<p class="quiz-result-sub" style="margin-top:12px">❌ 오답 ${wrongCount}개가 <b>오답노트(복습 모음)</b>에 저장됐어요</p>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px;">
        <button class="quiz-btn quiz-btn-secondary" id="quizReviewNoteBtn" type="button">📕 오답노트 보기</button>
        ${!pass ? `<button class="quiz-btn quiz-btn-secondary" id="quizWeakBtn" type="button">! 이 챕터 약점 표시</button>` : ''}
      </div>
    </div>`;

    el.querySelector('#quizRetryBtn').addEventListener('click', () => {
      state.quiz = { questions: [], current: 0, answered: false, scores: [] };
      const topic = getCurrentTopic();
      if (topic) renderQuiz(topic);
    });

    if (wrongCount > 0) {
      el.querySelector('#quizRetryWrongBtn').addEventListener('click', () => {
        state.quiz = { questions: shuffle([...wrongQs]), current: 0, answered: false, scores: [] };
        renderQuiz({ questions: state.quiz.questions });
      });
    }

    el.querySelector('#quizStudyBtn').addEventListener('click', () => setMode('study'));

    // 오답노트(복습 모음)로 바로 이동
    el.querySelector('#quizReviewNoteBtn')?.addEventListener('click', () => {
      state.gichulView = 'review';
      enterGichulMode();
    });

    // 점수 미달 시 이 챕터를 약점(!)으로 표시
    el.querySelector('#quizWeakBtn')?.addEventListener('click', (e) => {
      const key = getMarkKey();
      if (key) {
        state.marks[key] = state.marks[key] || {};
        state.marks[key].weak = true;
        localStorage.setItem(LS_KEY, JSON.stringify(state.marks));
        updateMarkButtons();
        buildTopicList();
      }
      e.target.textContent = '✓ 약점으로 표시됨';
      e.target.disabled = true;
      e.target.style.opacity = '0.6';
    });
  }

  // ─── 플래시카드 모드 ──────────────────────────────
  function renderFlash(topic) {
    const el = document.getElementById('modeFlash');
    if (!el) return;

    const cards = topic.flashcards || [];
    if (!cards.length) {
      el.innerHTML = '<div class="fc-empty">이 토픽의 플래시카드를 준비 중입니다.</div>';
      return;
    }

    if (!state.flash.cards.length) {
      state.flash.cards   = [...cards];
      state.flash.current = 0;
      state.flash.flipped = false;
    }

    const idx  = state.flash.current;
    const card = state.flash.cards[idx];

    el.innerHTML = `<div class="flashcard-wrapper">
      <p class="fc-counter">${idx + 1} / ${state.flash.cards.length}</p>
      <div class="flashcard${state.flash.flipped ? ' flipped' : ''}" id="flashCard">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <p>${esc(card.front)}</p>
            <span class="flashcard-hint">클릭하여 답 확인</span>
          </div>
          <div class="flashcard-face flashcard-back">
            <p>${esc(card.back)}</p>
          </div>
        </div>
      </div>
      <div class="fc-nav">
        <button class="fc-btn" id="fcPrev"    type="button" ${idx === 0 ? 'disabled' : ''}>← 이전</button>
        <button class="fc-btn fc-btn-shuffle" id="fcShuffle" type="button">🔀 섞기</button>
        <button class="fc-btn" id="fcNext"    type="button" ${idx >= state.flash.cards.length - 1 ? 'disabled' : ''}>다음 →</button>
      </div>
    </div>`;

    el.querySelector('#flashCard').addEventListener('click', () => {
      state.flash.flipped = !state.flash.flipped;
      el.querySelector('#flashCard').classList.toggle('flipped', state.flash.flipped);
    });
    el.querySelector('#fcPrev').addEventListener('click', () => {
      state.flash.current--;
      state.flash.flipped = false;
      renderFlash(getCurrentTopic());
    });
    el.querySelector('#fcNext').addEventListener('click', () => {
      state.flash.current++;
      state.flash.flipped = false;
      renderFlash(getCurrentTopic());
    });
    el.querySelector('#fcShuffle').addEventListener('click', () => {
      state.flash.cards   = shuffle([...cards]);
      state.flash.current = 0;
      state.flash.flipped = false;
      renderFlash({ flashcards: state.flash.cards });
    });
  }

  // ─── 마크 (북마크·완료·약점) ──────────────────────
  function getMarkKey() { return `${state.currentSubjectId}:${state.currentTopicId}`; }

  function updateMarkButtons() {
    const mark = state.marks[getMarkKey()] || {};
    document.getElementById('bookmarkButton')?.classList.toggle('is-active', !!mark.bookmark);
    document.getElementById('doneButton')    ?.classList.toggle('is-active', !!mark.done);
    document.getElementById('weakButton')    ?.classList.toggle('is-active', !!mark.weak);
  }

  function toggleMark(type) {
    if (!state.currentTopicId) return;
    const key = getMarkKey();
    state.marks[key] = state.marks[key] || {};
    state.marks[key][type] = !state.marks[key][type];
    localStorage.setItem(LS_KEY, JSON.stringify(state.marks));
    updateMarkButtons();
    buildTopicList();
  }

  // ─── 모드 전환 ────────────────────────────────────
  function setMode(mode) {
    state.currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.classList.toggle('is-active', btn.dataset.mode === mode)
    );
    renderCurrentMode();
  }

  // ─── 이벤트 바인딩 ────────────────────────────────
  function bindEvents() {
    // 과목 클릭
    document.getElementById('subjectList')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-subject]');
      if (btn) selectSubject(btn.dataset.subject);
    });

    // 토픽 클릭 + 카테고리 헤더 토글
    document.getElementById('partList')?.addEventListener('click', e => {
      // 카테고리 헤더 토글
      const catBtn = e.target.closest('[data-cat-toggle]');
      if (catBtn) {
        const catKey   = catBtn.dataset.catToggle;
        const group    = catBtn.closest('.category-group');
        const nowCollapsed = !state.catCollapsed[catKey];
        state.catCollapsed[catKey] = nowCollapsed;
        localStorage.setItem(LS_CAT_KEY, JSON.stringify(state.catCollapsed));
        if (group) {
          group.classList.toggle('is-collapsed', nowCollapsed);
          const arrow = catBtn.querySelector('.cat-arrow');
          if (arrow) arrow.textContent = nowCollapsed ? '▶' : '▼';
        }
        return;
      }
      // 토픽 버튼 선택
      const btn = e.target.closest('[data-topic]');
      if (btn) selectTopic(btn.dataset.topic);
    });

    // 모드 탭
    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.addEventListener('click', () => setMode(btn.dataset.mode))
    );

    // 필터 버튼
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b =>
          b.classList.toggle('is-active', b.dataset.filter === state.filter)
        );
        buildSubjectList();
      });
    });

    // 검색
    document.getElementById('searchInput')?.addEventListener('input', e => {
      state.search = e.target.value.trim();
      buildSubjectList();
      if (state.currentSubjectId) buildTopicList();
    });

    // 집중(넓게보기) 모드 토글 — 과목 레일·토픽 목록 접기 (상단 버튼 + 좌하단 플로팅)
    const toggleFocus = () => applyFocusMode(!document.body.classList.contains('focus-mode'));
    document.getElementById('focusToggle')?.addEventListener('click', toggleFocus);
    document.getElementById('focusToggleFloat')?.addEventListener('click', toggleFocus);

    // 기출문제 버튼
    document.getElementById('gichulEntryBtn')?.addEventListener('click', enterGichulMode);
    document.getElementById('dailyEntryBtn')?.addEventListener('click', enterDailyMode);
    document.getElementById('gichulExitBtn')?.addEventListener('click', exitGichulMode);
    document.getElementById('gichulFilterToggle')?.addEventListener('click', () => {
      _gichulFiltersOpen = !_gichulFiltersOpen; applyNormalFilters();
    });

    // 약물 총정리
    document.getElementById('medEntryBtn')?.addEventListener('click', enterMedMode);
    document.getElementById('medExitBtn')?.addEventListener('click', exitMedMode);
    document.getElementById('medSearch')?.addEventListener('input', e => { _medSearch = e.target.value.trim(); renderMedView(); });
    document.getElementById('medMemToggle')?.addEventListener('click', function () {
      _medMemMode = !_medMemMode;
      this.classList.toggle('is-active', _medMemMode);
      this.textContent = _medMemMode ? '👁 학습 모드' : '🙈 암기 모드';
      renderMedView();
    });
    document.getElementById('medContent')?.addEventListener('click', e => {
      const btn = e.target.closest('.med-reveal-btn');
      if (btn) { btn.closest('.med-card')?.classList.add('revealed'); }
    });

    // 막판 암기노트 허브
    document.getElementById('cramEntryBtn')?.addEventListener('click', enterCramMode);
    document.getElementById('cramExitBtn')?.addEventListener('click', exitCramMode);
    document.getElementById('cramSearch')?.addEventListener('input', e => { _cramSearch = e.target.value.trim(); renderCramHub(); });
    document.getElementById('cramMemToggle')?.addEventListener('click', function () {
      _cramMemMode = !_cramMemMode;
      this.classList.toggle('is-active', _cramMemMode);
      this.textContent = _cramMemMode ? '👁 학습 모드' : '🙈 암기 모드';
      renderCramHub();
    });
    // 암기 모드: 가려진 핵심(캡슐·왜빈출) 탭하면 공개
    document.getElementById('cramContent')?.addEventListener('click', e => {
      if (!_cramMemMode) return;
      const hit = e.target.closest('.cram-capsule li, .cram-mem-cell .cmc-body');
      if (hit) hit.classList.toggle('revealed');
    });

    // 학습 기록 내보내기/불러오기
    document.getElementById('exportMarksBtn')?.addEventListener('click', exportMarks);
    const importInput = document.getElementById('importMarksInput');
    document.getElementById('importMarksBtn')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', e => {
      importMarks(e.target.files[0]);
      e.target.value = '';   // 같은 파일 재선택 허용
    });

    // 마크 버튼
    document.getElementById('bookmarkButton')?.addEventListener('click', () => toggleMark('bookmark'));
    document.getElementById('doneButton')    ?.addEventListener('click', () => toggleMark('done'));
    document.getElementById('weakButton')    ?.addEventListener('click', () => toggleMark('weak'));
    document.getElementById('printButton')   ?.addEventListener('click', printTopic);

    // 암기 집중 토글
    document.getElementById('memoryToggle')?.addEventListener('click', function () {
      state.memoryMode = !state.memoryMode;
      this.classList.toggle('is-active', state.memoryMode);
      this.textContent = state.memoryMode ? '이해 모드' : '암기 집중';
      if (state.currentMode === 'study') renderCurrentMode();
    });

    // 모바일 햄버거
    const rail    = document.getElementById('subjectRail');
    const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
      rail?.classList.toggle('is-open');
      overlay?.classList.toggle('is-open');
    });
    overlay?.addEventListener('click', () => {
      rail?.classList.remove('is-open');
      overlay?.classList.remove('is-open');
    });

    // 퀴즈 핵심단서 토글 — 컨테이너에 위임 리스너 1회만 등록 (문제마다 중복 등록되던 버그 수정)
    document.getElementById('modeQuiz')?.addEventListener('click', e => {
      const hintBtn = e.target.closest('#quizHintToggle');
      if (!hintBtn) return;
      const isOpen  = hintBtn.classList.toggle('is-open');
      const content = document.getElementById('quizLearnerSupport');
      if (content) content.style.display = isOpen ? '' : 'none';
      hintBtn.textContent = isOpen ? '📖 핵심단서 접기 ▼' : '📖 핵심단서 보기 ▶';
    });

    // 키보드 단축키 — 플래시카드(Space 뒤집기, ←/→ 이동), 퀴즈(1~5 선택, Enter 다음)
    document.addEventListener('keydown', handleKeyboard);
  }

  // ─── 기출문제 모드 ──────────────────────────────────

  // 현재 타입·챕터 필터에 해당하는 문항 목록
  function gichulPool() {
    const gqs = window.NORI_GICHUL?.questions || [];
    const vqs = (window.NORI_VARIATION?.questions || []).map(q => ({...q, type: 'variation'}));
    let pool;
    if (state.gichulType === '기출') pool = gqs;
    else if (state.gichulType === '변형') pool = vqs;
    else pool = [...gqs, ...vqs];
    if (state.gichulChapter === '전체') return pool;
    return pool.filter(q => q.chapter === state.gichulChapter);
  }

  // 타입 풀 (챕터 필터 제외) — 챕터 뱃지 계산용
  function gichulTypePool() {
    const gqs = window.NORI_GICHUL?.questions || [];
    const vqs = (window.NORI_VARIATION?.questions || []).map(q => ({...q, type: 'variation'}));
    if (state.gichulType === '기출') return gqs;
    if (state.gichulType === '변형') return vqs;
    return [...gqs, ...vqs];
  }

  // 타입 선택 바 (기출 / 변형 / 전체)
  function buildGichulTypeBar() {
    const bar = document.getElementById('gichulTypeBar');
    if (!bar) return;
    const gCount = (window.NORI_GICHUL?.questions || []).length;
    const vCount = (window.NORI_VARIATION?.questions || []).length;
    const types = [
      { key: '기출', label: '기출문제', count: gCount },
      { key: '변형', label: '변형(AI)', count: vCount },
      { key: '전체', label: '전체',    count: gCount + vCount },
    ];
    bar.innerHTML = types.map(t =>
      `<button class="mode-button gichul-chapter-btn${state.gichulType === t.key ? ' is-active' : ''}" type="button" data-type="${t.key}">${esc(t.label)} <span class="gichul-chapter-count">${t.count}</span></button>`
    ).join('');
    bar.querySelectorAll('[data-type]').forEach(btn => {
      btn.addEventListener('click', () => setGichulType(btn.dataset.type));
    });
  }

  function setGichulType(type) {
    state.gichulType = type;
    state.gichulChapter = '전체';
    buildGichulTypeBar();
    buildGichulChapterBar();
    startGichulSession();
  }

  // 챕터 필터 바 생성 (현재 타입 풀 기준 동적 생성)
  function buildGichulChapterBar() {
    const bar = document.getElementById('gichulChapterBar');
    if (!bar) return;
    const pool = gichulTypePool();
    const order = (window.NORI_GICHUL?.chapters || []).filter(c => pool.some(q => q.chapter === c));
    pool.forEach(q => { if (q.chapter && !order.includes(q.chapter)) order.push(q.chapter); });
    const count = ch => ch === '전체' ? pool.length : pool.filter(q => q.chapter === ch).length;
    const chapters = ['전체', ...order];
    bar.innerHTML = chapters.map(ch =>
      `<button class="mode-button gichul-chapter-btn${ch === state.gichulChapter ? ' is-active' : ''}" type="button" data-chapter="${esc(ch)}">${esc(ch)} <span class="gichul-chapter-count">${count(ch)}</span></button>`
    ).join('');
    bar.querySelectorAll('.gichul-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => setGichulChapter(btn.dataset.chapter));
    });
  }

  // 챕터 선택 → 필터 적용 + 세션 초기화 + 재렌더
  function setGichulChapter(ch) {
    state.gichulChapter = ch;
    document.querySelectorAll('#gichulChapterBar .gichul-chapter-btn')
      .forEach(b => b.classList.toggle('is-active', b.dataset.chapter === ch));
    startGichulSession();
  }

  // 현재 풀(또는 전달된 문항 세트)로 새 세션 시작
  // ── 자유 풀기 위치 기억(필터별) ──
  function freeKey() { return `${state.gichulType}|${state.gichulChapter}`; }
  function getFreePos() { return lsGet(LS_FREEPOS)[freeKey()] || 0; }
  function setFreePos(idx) { const m = lsGet(LS_FREEPOS); m[freeKey()] = idx; lsSet(LS_FREEPOS, m); }

  function startGichulSession(questions, info) {
    // 인자 없이 호출 = 자유 풀기: 고정 순서(번호 일치) + 필터별 마지막 위치 이어풀기
    let qs, start = 0;
    if (questions) {
      qs = [...questions];
    } else {
      qs = [...gichulPool()];
      start = Math.min(getFreePos(), Math.max(0, qs.length - 1));
    }
    state.gichul = {
      questions: qs, current: start, answered: false, scores: [],
      mock: !!(info && info.mock), batchId: info?.batchId || null, batchLabel: info?.batchLabel || ''
    };
    renderGichulQuestion();
  }

  // ── 모의고사 임시저장(이어풀기) ──
  function getMockProg() { return lsGet(LS_MOCKPROG); }
  function saveMockProg() {
    const g = state.gichul;
    if (!g || !g.batchId || !g.mock) return;
    if (g.current >= g.questions.length) return; // 완료분은 저장 안 함
    const p = getMockProg();
    p[g.batchId] = { ids: g.questions.map(q => q.id), current: g.current, scores: g.scores, label: g.batchLabel, at: Date.now() };
    lsSet(LS_MOCKPROG, p);
  }
  function clearMockProg(id) { const p = getMockProg(); if (id && p[id]) { delete p[id]; lsSet(LS_MOCKPROG, p); } }
  function resumeMock(batchId) {
    const p = getMockProg()[batchId];
    if (!p) return false;
    const byId = allQuestionsById();
    const qs = p.ids.map(id => byId[id]).filter(Boolean);
    if (!qs.length) { clearMockProg(batchId); return false; }
    const cur = Math.min(p.current, qs.length);
    state.gichul = { questions: qs, current: cur, answered: false, scores: (p.scores || []).slice(0, cur), mock: true, batchId, batchLabel: p.label || '' };
    renderGichulQuestion();
    return true;
  }
  // 전체 섞기: 해당 소스(기출/변형) 전 문항을 한 세션으로 섞어 풀기(이어풀기 지원)
  function startShuffleAll() {
    const id = 'shuffle-' + state.gichulSource;
    if (getMockProg()[id]) { resumeMock(id); return; }
    const pool = rawSourcePool(state.gichulSource);
    const qs = shuffle([...pool]);
    state.gichul = { questions: qs, current: 0, answered: false, scores: [], mock: true, batchId: id, batchLabel: state.gichulSource + ' 전체 섞기' };
    renderGichulQuestion();
  }

  // ── 모의고사: 결정론적 가중 추출 ──
  function rawSourcePool(sourceKey) {
    if (sourceKey === '변형') return (window.NORI_VARIATION?.questions || []).map(q => ({ ...q, type: 'variation' }));
    return (window.NORI_GICHUL?.questions || []);
  }
  function weightedSample(items, k, wf, rng) {
    const pool = items.slice(), w = pool.map(wf), out = [];
    for (let n = 0; n < k && pool.length; n++) {
      let tot = 0; for (const x of w) tot += x;
      let r = rng() * tot, i = 0;
      while (i < w.length - 1 && r > w[i]) { r -= w[i]; i++; }
      out.push(pool[i]); pool.splice(i, 1); w.splice(i, 1);
    }
    return out;
  }
  function seededShuffleArr(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // 출제비중대로 챕터 stratified + 빈출 가중. 회차마다 결정론적, 빈출은 회차 간 반복 허용.
  function buildMockExams(sourceKey) {
    const pool = rawSourcePool(sourceKey);
    if (!pool.length) return [];
    const N = Math.max(1, Math.round(pool.length / MOCK_SIZE));
    const byChap = {};
    pool.forEach(q => { (byChap[q.chapter] = byChap[q.chapter] || []).push(q); });
    const chapters = Object.keys(EXAM_WEIGHTS).filter(c => byChap[c] && byChap[c].length);
    const totalW = chapters.reduce((a, c) => a + EXAM_WEIGHTS[c], 0) || 1;
    const prefix = sourceKey === '변형' ? 'var-mock' : 'gi-mock';
    const exams = [];
    for (let e = 0; e < N; e++) {
      let qs = [];
      chapters.forEach(ch => {
        const target = Math.round(EXAM_WEIGHTS[ch] / totalW * MOCK_SIZE);
        const rng = makeRng(hashStr(sourceKey + '|' + e + '|' + ch));
        qs = qs.concat(weightedSample(byChap[ch], Math.min(target, byChap[ch].length), q => FREQ_BOOST[q.tag] || 1, rng));
      });
      qs = seededShuffleArr(qs, makeRng(hashStr(sourceKey + '|order|' + e)));
      exams.push({ id: `${prefix}-${e + 1}`, label: `${sourceKey} 모의고사 ${e + 1}회`, questions: qs });
    }
    return exams;
  }

  // ── 문항 마킹 / 통계 ──
  function getQMark(id) { return lsGet(LS_QMARK)[id] || null; }
  function setQMark(id, val) { const m = lsGet(LS_QMARK); if (val) m[id] = val; else delete m[id]; lsSet(LS_QMARK, m); }
  function bumpQStat(id, wrong) {
    const s = lsGet(LS_QSTAT);
    const e = s[id] || { seen: 0, wrong: 0 };
    e.seen++;
    if (wrong) e.wrong++;
    // 간격 반복 스케줄: 맞히면 박스 +1(최대5), 틀리면 1로 리셋
    const box = wrong ? 1 : Math.min((e.box || 1) + 1, 5);
    e.box = box;
    e.last = Date.now();
    e.due  = Date.now() + SRS_HOURS[box] * 3600000;
    s[id] = e;
    lsSet(LS_QSTAT, s);
  }

  // ── 연속 학습일(streak) ──
  function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function getStreak() { const st = lsGet(LS_STREAK); return { last: st.last || null, count: st.count || 0 }; }
  function recordStudyDay() {
    const st = getStreak();
    const today = ymd(new Date());
    if (st.last === today) return st;                 // 오늘 이미 기록됨
    const yest = ymd(new Date(Date.now() - 86400000));
    const next = { last: today, count: st.last === yest ? st.count + 1 : 1 };
    lsSet(LS_STREAK, next);
    return next;
  }

  // ── '오늘의 한 판' — 간격 반복 + 신규(비중 가중) 혼합 세트 ──
  // 1) 복습 만기 문항(due<=now, 약한 박스 우선)  2) 모자라면 미학습 신규를 출제비중·빈출 가중으로 채움
  function dailyDueList() {
    const stat = lsGet(LS_QSTAT), mark = lsGet(LS_QMARK), byId = allQuestionsById();
    const now = Date.now();
    const due = [];
    Object.entries(stat).forEach(([id, s]) => {
      if (!s || mark[id] === 'known' || !byId[id]) return;
      // due가 잡힌 문항은 만기 시, 옛 데이터(due 없이 오답만 있던 문항)는 즉시 만기로 취급
      const isDue = s.due != null ? s.due <= now : s.wrong > 0;
      if (isDue) due.push({ id, box: s.box || 1, due: s.due || 0 });
    });
    // 약한 박스(많이 틀린) 우선, 그 다음 더 오래 밀린 순
    due.sort((a, b) => (a.box - b.box) || (a.due - b.due));
    return due.map(x => byId[x.id]);
  }
  function dailyNewPool() {
    const stat = lsGet(LS_QSTAT), mark = lsGet(LS_QMARK);
    const all = [
      ...(window.NORI_GICHUL?.questions || []),
      ...(window.NORI_VARIATION?.questions || []).map(q => ({ ...q, type: 'variation' }))
    ];
    return all.filter(q => q.id && !stat[q.id] && mark[q.id] !== 'known');
  }
  function buildDailySet(limit, opts) {
    limit = limit || DAILY_DEFAULT;
    const due = dailyDueList();
    // 복습이 세트의 최대 70%를 넘지 않게 해 신규 학습 진도도 함께 나가도록(복습만 있으면 전부 사용)
    const reviewCap = Math.max(Math.ceil(limit * 0.7), limit - dailyNewPool().length);
    const review = due.slice(0, Math.min(due.length, reviewCap));
    let set = review.slice();
    const reviewCount = review.length;
    if (set.length < limit) {
      const need = limit - set.length;
      const newPool = dailyNewPool();
      const picked = weightedSample(newPool, Math.min(need, newPool.length),
        q => (EXAM_WEIGHTS[q.chapter] || 3) * (FREQ_BOOST[q.tag] || 1), Math.random);
      set = set.concat(picked);
    }
    const newCount = set.length - reviewCount;
    let crossCount = 0;
    if (opts && opts.cross) ({ set, crossCount } = applyCrossover(set));
    return { questions: shuffle(set), reviewCount, newCount, crossCount };
  }
  // 교차 모드: 충분히 외운(box≥3) 복습 항목을 같은 개념의 '다른 소스' 문항으로 치환
  // → 답을 외운 게 아니라 개념을 아는지 확인. 파트너가 없으면 원문 유지.
  function applyCrossover(set) {
    const stat = lsGet(LS_QSTAT), mark = lsGet(LS_QMARK);
    const ids = new Set(set.map(q => q.id));
    let crossCount = 0;
    const out = set.map(q => {
      const s = stat[q.id];
      if (!s || (s.box || 1) < 3) return q;     // 외운 복습 항목만 대상(신규·약한 항목은 그대로)
      const partner = crossPartners(q, ids).find(p => mark[p.id] !== 'known' && !ids.has(p.id));
      if (!partner) return q;
      ids.delete(q.id); ids.add(partner.id);
      crossCount++;
      return { ...partner, _cross: true };
    });
    return { set: out, crossCount };
  }
  function dailyStats() {
    return { due: dailyDueList().length, fresh: dailyNewPool().length, streak: getStreak().count };
  }
  // id가 없는 챕터 문항에 결정론적 id 부여(배열 순서 기반 → 새로고침해도 동일)
  // 기존 실제 id(예: htn-q1)는 그대로 두고, 없는 것만 `sid:topicId#idx` 형식으로 채움
  function ensureQuestionIds() {
    Object.entries(state.data || {}).forEach(([sid, subj]) => {
      (subj.topics || []).forEach(t => {
        (t.questions || []).forEach((q, i) => {
          if (q && !q.id) q.id = `${sid}:${t.id}#${i}`;
        });
      });
    });
  }

  // 토픽(챕터) 문제를 기출 렌더러가 이해하는 형태로 정규화
  // (choices: [{text}] → [string], caseStory를 stem 앞에 붙임, 태그=토픽명)
  function normalizeTopicQ(q, topicTitle) {
    const choices = (q.choices || []).map(c => (typeof c === 'string' ? c : (c && c.text) || ''));
    const stem = q.caseStory ? `${q.caseStory}\n\n${q.stem}` : q.stem;
    return { ...q, stem, choices, tag: topicTitle || q.tag, type: 'topic' };
  }
  function allQuestionsById() {
    const m = {};
    // 챕터(토픽) 문제 먼저 — 기출/변형과 id가 겹치면 아래에서 덮어씀
    Object.values(state.data || {}).forEach(subj => {
      (subj.topics || []).forEach(t => (t.questions || []).forEach(q => {
        if (q.id) m[q.id] = normalizeTopicQ(q, t.title);
      }));
    });
    (window.NORI_GICHUL?.questions || []).forEach(q => { m[q.id] = q; });
    (window.NORI_VARIATION?.questions || []).forEach(q => { m[q.id] = { ...q, type: 'variation' }; });
    return m;
  }

  // ── 교차출제(꼬리물기) — 기출 ↔ 변형 같은 개념 연결 ──
  // 하이브리드 링크: ① 변형 source_id가 실제 기출 id면 정밀 1:1 연결,
  //                 ② 아니면 같은 tag(계통), ③ 그래도 없으면 같은 chapter로 근사 매칭.
  // (기출 변형 양쪽이 tag 19종·chapter 11종을 100% 공유 → 사실상 전 문항 커버)
  let _crossIndex = null;
  function buildCrossIndex() {
    if (_crossIndex) return _crossIndex;
    const G = window.NORI_GICHUL?.questions || [];
    const V = window.NORI_VARIATION?.questions || [];
    const gIds = new Set(G.map(q => q.id));
    const byId = {}, g2v = {}, v2g = {}, byTag = {}, byChapter = {};
    const reg = (q, src) => {
      byId[q.id] = src === 'variation' ? { ...q, type: 'variation' } : q;
      (byTag[q.tag] = byTag[q.tag] || { gichul: [], variation: [] })[src].push(q.id);
      (byChapter[q.chapter] = byChapter[q.chapter] || { gichul: [], variation: [] })[src].push(q.id);
    };
    G.forEach(q => reg(q, 'gichul'));
    V.forEach(q => {
      reg(q, 'variation');
      if (gIds.has(q.source_id)) {            // 정밀 링크
        v2g[q.id] = q.source_id;
        (g2v[q.source_id] = g2v[q.source_id] || []).push(q.id);
      }
    });
    _crossIndex = { byId, g2v, v2g, byTag, byChapter };
    return _crossIndex;
  }
  // q와 같은 개념의 '반대 소스' 문항들을 정밀→tag→chapter 순으로 반환(자기 자신·exclude 제외)
  function crossPartners(q, exclude) {
    if (!q || !q.id) return [];
    const idx = buildCrossIndex();
    exclude = exclude || new Set();
    const isVar = q.type === 'variation';
    const otherKey = isVar ? 'gichul' : 'variation';
    const out = [];
    const pushId = id => {
      if (!id || id === q.id || exclude.has(id) || out.some(o => o.id === id)) return;
      if (idx.byId[id]) out.push(idx.byId[id]);
    };
    if (isVar) pushId(idx.v2g[q.id]);                       // ① 정밀
    else (idx.g2v[q.id] || []).forEach(pushId);
    ((idx.byTag[q.tag] || {})[otherKey] || []).forEach(pushId);   // ② 같은 계통
    if (!out.length) ((idx.byChapter[q.chapter] || {})[otherKey] || []).forEach(pushId); // ③ 같은 챕터
    return out;
  }
  // 자주 틀린 문제 + 복습 표시 문제 모음 (안다 표시는 제외, 오답률 높은 순)
  function buildReviewSet() {
    const stat = lsGet(LS_QSTAT), mark = lsGet(LS_QMARK), byId = allQuestionsById();
    const ids = new Set();
    Object.entries(stat).forEach(([id, s]) => { if (s && s.wrong > 0) ids.add(id); });
    Object.entries(mark).forEach(([id, m]) => { if (m === 'review') ids.add(id); });
    const ratio = q => { const s = stat[q.id]; return s ? s.wrong / (s.seen || 1) : 0; };
    return [...ids].filter(id => mark[id] !== 'known').map(id => byId[id]).filter(Boolean).sort((a, b) => ratio(b) - ratio(a));
  }

  // ── 기출 패널 뷰 전환 ──
  function buildGichulModeBar() {
    const bar = document.getElementById('gichulModeBar');
    if (!bar) return;
    const views = [
      { key: 'daily',  label: '🎯 오늘의 한 판' },
      { key: 'mock',   label: '📋 모의고사' },
      { key: 'review', label: '🔁 복습 모음' },
      { key: 'normal', label: '📚 자유 풀기' }
    ];
    bar.innerHTML = views.map(v =>
      `<button class="mode-button gichul-view-btn${state.gichulView === v.key ? ' is-active' : ''}" type="button" data-view="${v.key}">${esc(v.label)}</button>`
    ).join('');
    bar.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      state.gichulView = b.dataset.view; buildGichulModeBar(); showGichulView();
    }));
  }
  function buildGichulSourceBar() {
    const bar = document.getElementById('gichulTypeBar');
    if (!bar) return;
    const g = (window.NORI_GICHUL?.questions || []).length, v = (window.NORI_VARIATION?.questions || []).length;
    const srcs = [{ key: '기출', label: '기출문제', count: g }, { key: '변형', label: '변형(AI)', count: v }];
    bar.innerHTML = srcs.map(s =>
      `<button class="mode-button gichul-chapter-btn${state.gichulSource === s.key ? ' is-active' : ''}" type="button" data-src="${s.key}">${esc(s.label)} <span class="gichul-chapter-count">${s.count}</span></button>`
    ).join('');
    bar.querySelectorAll('[data-src]').forEach(b => b.addEventListener('click', () => {
      state.gichulSource = b.dataset.src; buildGichulSourceBar(); renderMockGrid();
    }));
  }
  function renderMockGrid() {
    const el = document.getElementById('gichulContent');
    if (!el) return;
    document.getElementById('gichulProgress').textContent = '';
    const exams = buildMockExams(state.gichulSource);
    const results = lsGet(LS_MOCK);
    const prog = getMockProg();
    let html = `<div class="mock-intro"><p>📋 <b>${esc(state.gichulSource)} 모의고사</b> — 한 회 <b>${MOCK_SIZE}문항</b>, 실제 출제비중에 맞춰 구성됩니다. 중간에 나가도 <b>이어풀기</b>로 저장돼요.</p></div>`;

    // 전체 섞기 타일 (이어풀기 지원)
    const shId = 'shuffle-' + state.gichulSource;
    const shP = prog[shId];
    const shPool = rawSourcePool(state.gichulSource).length;
    const shLabel = shP ? `이어풀기 ${shP.current}/${shP.ids.length}` : `전 ${shPool}문항 섞기`;
    html += `<button class="mock-shuffle-btn" id="mockShuffleBtn" type="button">🔀 전체 섞어 풀기 <span>${shLabel}</span></button>`;
    if (shP) html += `<button class="mock-restart-link" id="mockShuffleRestart" type="button">↻ 전체 섞기 처음부터</button>`;

    html += `<div class="mock-grid">`;
    exams.forEach((ex, i) => {
      const r = results[ex.id];
      const p = prog[ex.id];
      const badge = p ? `<span class="mock-badge prog">이어풀기 ${p.current}/${p.ids.length}</span>`
        : r ? `<span class="mock-badge ${r.pct >= 60 ? 'pass' : 'fail'}">${r.pct}%</span>`
        : `<span class="mock-badge new">미응시</span>`;
      html += `<button class="mock-card${p ? ' has-prog' : ''}" type="button" data-batch="${i}"><strong>${i + 1}회</strong><span>${ex.questions.length}문항</span>${badge}</button>`;
    });
    html += `</div>`;
    el.innerHTML = html;

    el.querySelector('#mockShuffleBtn')?.addEventListener('click', startShuffleAll);
    el.querySelector('#mockShuffleRestart')?.addEventListener('click', () => {
      if (confirm('전체 섞기 진행을 지우고 처음부터 새로 섞을까요?')) { clearMockProg(shId); startShuffleAll(); }
    });
    el.querySelectorAll('[data-batch]').forEach(b => b.addEventListener('click', () => {
      const ex = exams[+b.dataset.batch];
      if (prog[ex.id]) { resumeMock(ex.id); return; }  // 이어풀기
      startGichulSession(ex.questions, { mock: true, batchId: ex.id, batchLabel: ex.label });
    }));
  }
  function renderDailyIntro() {
    const el = document.getElementById('gichulContent');
    if (!el) return;
    document.getElementById('gichulProgress').textContent = '';
    const d = dailyStats();
    const today = ymd(new Date());
    const doneToday = getStreak().last === today;
    const totalAvail = d.due + d.fresh;
    const sizes = [15, 25, 40].filter(n => n <= Math.max(15, totalAvail) || n === 15);

    let html = `<div class="daily-hero">
      <div class="daily-streak">🔥 연속 <b>${d.streak}</b>일${doneToday ? ' <span class="daily-done-chip">오늘 완료 ✓</span>' : ''}</div>
      <h3 class="daily-title">🎯 오늘의 한 판</h3>
      <p class="daily-lead">고민 없이 버튼만 누르세요. 알고리즘이 <b>잊을 때가 된 복습 문제</b>와 <b>비중 높은 새 문제</b>를 섞어 냅니다.</p>
      <div class="daily-stat-row">
        <div class="daily-stat"><span class="daily-stat-n">${d.due}</span><span class="daily-stat-l">🔁 복습 만기</span></div>
        <div class="daily-stat"><span class="daily-stat-n">${d.fresh}</span><span class="daily-stat-l">✨ 새 문제</span></div>
      </div>`;

    if (totalAvail === 0) {
      html += `<p class="daily-empty">풀 문제가 없어요 🎉 모든 문항을 "안다"로 표시했거나 데이터가 없습니다.</p>`;
    } else {
      html += `<label class="daily-cross-toggle"><input type="checkbox" id="dailyCrossToggle" checked>
        🔀 <b>교차출제</b> — 외운 복습 문제는 <b>같은 개념의 다른 문제</b>(기출↔변형)로 바꿔 출제</label>`;
      html += `<div class="daily-size-row">` +
        sizes.map((n, i) => `<button class="quiz-btn ${i === 1 || sizes.length === 1 ? 'quiz-btn-primary' : 'quiz-btn-secondary'} daily-start" type="button" data-n="${n}">${n}문제 시작</button>`).join('') +
        `</div>
        <p class="daily-tip">💡 맞히면 다음 복습 간격이 늘어나고, 틀리면 곧 다시 나옵니다. 교차출제를 켜면 답을 외운 문제도 표현을 바꿔 출제해 <b>진짜 개념 이해</b>를 점검해요.</p>`;
    }
    html += `</div>`;
    el.innerHTML = html;

    el.querySelectorAll('.daily-start').forEach(b => b.addEventListener('click', () => {
      const cross = el.querySelector('#dailyCrossToggle')?.checked;
      const set = buildDailySet(+b.dataset.n, { cross });
      if (!set.questions.length) { renderDailyIntro(); return; }
      startGichulSession(set.questions, {
        batchId: 'daily',
        batchLabel: `오늘의 한 판 (복습 ${set.reviewCount}·신규 ${set.newCount}${set.crossCount ? '·🔀' + set.crossCount : ''})`
      });
    }));
  }

  function renderReviewIntro() {
    const el = document.getElementById('gichulContent');
    if (!el) return;
    document.getElementById('gichulProgress').textContent = '';
    const set = buildReviewSet();
    const stat = lsGet(LS_QSTAT), mark = lsGet(LS_QMARK);
    const wrongN = Object.values(stat).filter(s => s.wrong > 0).length;
    const reviewN = Object.values(mark).filter(m => m === 'review').length;
    let html = `<div class="mock-intro">
      <p>🔁 <b>복습 모음 (오답노트)</b> — 챕터 퀴즈·모의고사에서 틀린 문제와 "복습 필요"로 표시한 문제를 자동으로 모았습니다.</p>
      <p class="mock-sub">자주 틀린 문제 ${wrongN}개 · 복습 표시 ${reviewN}개 · 합계 <b>${set.length}개</b></p></div>`;
    if (set.length) {
      html += `<div style="text-align:center;margin-top:16px"><button class="quiz-btn quiz-btn-primary" id="reviewStartBtn" type="button">복습 시작 (${set.length}문제)</button></div>`;
    } else {
      html += `<p style="text-align:center;color:var(--muted);margin-top:18px">아직 틀리거나 복습 표시한 문제가 없어요.<br>챕터 퀴즈나 모의고사를 풀면 자동으로 채워집니다.</p>`;
    }
    el.innerHTML = html;
    el.querySelector('#reviewStartBtn')?.addEventListener('click', () => {
      startGichulSession(set, { mock: false, batchId: 'review', batchLabel: '복습 모음' });
    });
  }
  // 자유 풀기 유형·계통 필터 접힘 상태(기본 접힘 — 문제까지 스크롤 줄이기)
  let _gichulFiltersOpen = false;
  function applyNormalFilters() {
    const typeBar = document.getElementById('gichulTypeBar');
    const chapBar = document.getElementById('gichulChapterBar');
    const tog = document.getElementById('gichulFilterToggle');
    const open = _gichulFiltersOpen;
    if (typeBar) typeBar.style.display = open ? '' : 'none';
    if (chapBar) chapBar.style.display = open ? '' : 'none';
    if (tog) {
      tog.style.display = '';
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      tog.classList.toggle('is-open', open);
      tog.textContent = (open ? '🔧 유형·계통 필터 닫기 ▴' : '🔧 유형·계통 필터 ▾');
    }
  }
  function showGichulView() {
    const typeBar = document.getElementById('gichulTypeBar');
    const chapBar = document.getElementById('gichulChapterBar');
    const tog = document.getElementById('gichulFilterToggle');
    document.getElementById('gichulProgress').textContent = '';
    if (tog) tog.style.display = 'none';        // 기본 숨김 — normal에서만 노출
    if (state.gichulView === 'daily') {
      typeBar.style.display = 'none'; chapBar.style.display = 'none';
      renderDailyIntro();
    } else if (state.gichulView === 'normal') {
      buildGichulTypeBar(); buildGichulChapterBar();
      applyNormalFilters();                      // 토글 노출 + 접힘 상태 반영
      startGichulSession();
    } else if (state.gichulView === 'review') {
      typeBar.style.display = 'none'; chapBar.style.display = 'none';
      renderReviewIntro();
    } else { // mock
      typeBar.style.display = ''; chapBar.style.display = 'none';
      buildGichulSourceBar(); renderMockGrid();
    }
  }

  function enterGichulMode() {
    const qs = window.NORI_GICHUL?.questions || [];
    if (!qs.length) { alert('기출문제 데이터를 불러올 수 없습니다.'); return; }

    state.gichulMode = true;
    document.getElementById('overviewBand').style.display = 'none';
    document.getElementById('contentGrid').style.display  = 'none';
    const medP = document.getElementById('medPanel'); if (medP) medP.style.display = 'none';
    const cramP = document.getElementById('cramPanel'); if (cramP) cramP.style.display = 'none';
    document.getElementById('gichulPanel').style.display  = '';
    document.getElementById('subjectRail')?.classList.remove('is-open');
    document.getElementById('sidebarOverlay')?.classList.remove('is-open');

    buildGichulModeBar();
    showGichulView();
  }

  // 사이드바 '🎯 오늘의 한 판' 진입 — 기출 패널을 열고 데일리 뷰로 바로 이동
  function enterDailyMode() {
    state.gichulView = 'daily';
    enterGichulMode();
  }

  function exitGichulMode() {
    state.gichulMode = false;
    document.getElementById('overviewBand').style.display = '';
    document.getElementById('contentGrid').style.display  = '';
    document.getElementById('gichulPanel').style.display  = 'none';
  }

  // ─── 💊 약물 총정리 ────────────────────────────────
  let _medIndex = null, _medCorpus = null, _medMemMode = false, _medFilter = '전체', _medSearch = '';
  function medCorpus() {
    if (_medCorpus != null) return _medCorpus;
    let c = '';
    (window.NORI_GICHUL?.questions || []).forEach(q => {
      if (q.disabled) return;
      c += (q.stem || '') + ' ' + (q.choices || []).map(x => x.text || x).join(' ') + ' ' + (q.explanation || '') + '\n';
    });
    _medCorpus = c.toLowerCase();
    return _medCorpus;
  }
  function medFreqScore(med) {
    const corp = medCorpus();
    let score = 0;
    (med.examples || []).forEach(e => {
      const base = String(e).replace(/\(.*?\)/g, '').split(/[ ,/·]/)[0].trim().toLowerCase();
      if (base.length > 2) score += corp.split(base).length - 1;
    });
    ['이뇨제', '베타차단제', '항응고제', '항생제', '인슐린', '스테로이드', '항콜린', '벤조디아제핀', 'nsaid', 'ace', 'ppi', 'statin', '항히스타민', '항우울제', '항정신병']
      .forEach(k => { if ((med.category || '').toLowerCase().includes(k)) score += corp.split(k).length - 1; });
    return score;
  }
  function medIsGeriatric(med) {
    const cat = (med.category || '');
    if (/항콜린|벤조디아제핀|1세대 항히스타민|삼환계|TCA|근이완|수면제|Beers|비어스/i.test(cat)) return true;
    const txt = cat + ' ' + (med.sideEffects || []).join(' ') + ' ' + (med.nursingPoints || []).join(' ');
    return /노인/.test(txt) && /(금기|주의|피한|피해|위험|Beers|신중)/.test(txt);
  }
  function buildMedIndex() {
    if (_medIndex) return _medIndex;
    let list;
    if (window.NORI_MED_CLASSES && window.NORI_MED_CLASSES.length) {
      // 통합 클래스 기반(중복 제거): 토픽별 medications를 클래스로 합친 데이터 사용
      list = window.NORI_MED_CLASSES.map(c => ({
        category: c.label, examples: c.examples || [], mechanism: '',
        indication: '', sideEffects: c.sideEffects || [], nursingPoints: c.nursingPoints || [],
        examPattern: '', _examPoints: c.examPoints || [], _subgroups: c.subgroups || [],
        _system: c.system || '기타', _topic: (c.sources || []).join(' · '), _key: c.key
      }));
    } else {
      // 폴백: 기존 토픽 평면화
      list = [];
      Object.values(state.data || {}).forEach(subj => {
        (subj.topics || []).forEach(t => {
          (t.medications || []).forEach(m => {
            if (!m || !m.category) return;
            list.push(Object.assign({}, m, { _topic: t.title, _system: t.category || subj.title || '기타' }));
          });
        });
      });
    }
    list.forEach(m => { m._freq = medFreqScore(m); m._geri = medIsGeriatric(m); });
    // 빈출 배지: 상위 약 30% 또는 freq 12+
    const sorted = list.slice().sort((a, b) => b._freq - a._freq);
    const hotCut = Math.max(12, sorted[Math.floor(sorted.length * 0.25)]?._freq || 12);
    list.forEach(m => { m._hot = m._freq >= hotCut; });
    list.sort((a, b) => (b._hot - a._hot) || (b._freq - a._freq));
    _medIndex = list;
    return _medIndex;
  }

  function enterMedMode() {
    document.getElementById('overviewBand').style.display = 'none';
    document.getElementById('contentGrid').style.display  = 'none';
    document.getElementById('gichulPanel').style.display  = 'none';
    const cramP = document.getElementById('cramPanel'); if (cramP) cramP.style.display = 'none';
    document.getElementById('medPanel').style.display     = '';
    document.getElementById('subjectRail')?.classList.remove('is-open');
    document.getElementById('sidebarOverlay')?.classList.remove('is-open');
    buildMedFilterBar();
    renderMedView();
  }
  function exitMedMode() {
    document.getElementById('medPanel').style.display    = 'none';
    document.getElementById('overviewBand').style.display = '';
    document.getElementById('contentGrid').style.display  = '';
  }
  function buildMedFilterBar() {
    const bar = document.getElementById('medFilterBar'); if (!bar) return;
    const idx = buildMedIndex();
    const systems = [...new Set(idx.map(m => m._system))];
    const chips = ['전체', '🔥 빈출', '👴 노인주의', ...systems];
    bar.innerHTML = chips.map(c =>
      `<button class="med-filter-chip${_medFilter === c ? ' is-active' : ''}" type="button" data-medf="${esc(c)}">${esc(c)}</button>`
    ).join('');
    bar.querySelectorAll('[data-medf]').forEach(b => b.addEventListener('click', () => {
      _medFilter = b.dataset.medf; buildMedFilterBar(); renderMedView();
    }));
  }
  function medCard(m) {
    const badges = `${m._hot ? '<span class="med-badge hot">🔥 빈출</span>' : ''}${m._geri ? '<span class="med-badge geri">👴 노인주의</span>' : ''}`;
    const exam = (m._examPoints && m._examPoints.length)
      ? `<div class="med-exam"><strong>📝 기출 포인트 (이렇게 나온다)</strong><ul>${m._examPoints.map(p => `<li>${emph(esc(p))}</li>`).join('')}</ul></div>` : '';
    // 통합 클래스: 서브그룹(약물 → 왜 주의)별로 분절. 서브그룹 많으면 기본 접힘.
    if (m._subgroups && m._subgroups.length) {
      const multi = m._subgroups.length > 2;
      const subs = m._subgroups.map(sg => {
        const open = (!_medMemMode && !multi) ? ' open' : '';
        const drugs = (sg.drugs || []).length ? `<div class="med-examples">${sg.drugs.map(e => `<span class="med-pill">${esc(e)}</span>`).join('')}</div>` : '';
        const mech = sg.mechanism ? `<div class="med-detail"><strong>🔬 기전</strong><p>${emph(esc(sg.mechanism))}</p></div>` : '';
        const side = (sg.side || []).length ? `<div class="med-detail"><strong>⚠️ 부작용·주의</strong><ul>${sg.side.map(s => `<li class="med-side-effect">${esc(s)}</li>`).join('')}</ul></div>` : '';
        const nurse = (sg.nursing || []).length ? `<div class="med-detail"><strong>💉 간호</strong><ul>${sg.nursing.map(n => `<li${isCriticalNurse(n) ? ' class="med-critical"' : ''}>${esc(n)}</li>`).join('')}</ul></div>` : '';
        return `<details class="med-sub"${open}><summary class="med-sub-sum"><span class="med-sub-name">${esc(sg.name)}</span><span class="med-sub-cnt">약 ${(sg.drugs || []).length}</span></summary><div class="med-sub-body">${drugs}${mech}${side}${nurse}</div></details>`;
      }).join('');
      return `<div class="med-card${m._geri ? ' med-geri' : ''}">
        <div class="med-card-head"><span class="med-category">${esc(m.category)}</span><span class="med-badges">${badges}</span></div>
        ${m._topic ? `<div class="med-sys-tag">${esc(m._system)} · 출처: ${esc(m._topic)}</div>` : ''}
        ${exam}
        <div class="med-subs">${subs}</div>
      </div>`;
    }
    // 폴백(토픽 medications 평면): 기존 단순 카드
    const pills = (m.examples || []).length
      ? `<div class="med-examples">${m.examples.map(e => `<span class="med-pill">${esc(e)}</span>`).join('')}</div>` : '';
    const mech = m.mechanism ? `<div class="med-detail"><strong>기전</strong><p>${esc(m.mechanism)}</p></div>` : '';
    const side = (m.sideEffects || []).length
      ? `<div class="med-detail"><strong>⚠️ 부작용</strong><ul>${m.sideEffects.map(s => `<li class="med-side-effect">${esc(s)}</li>`).join('')}</ul></div>` : '';
    const nurse = (m.nursingPoints || []).length
      ? `<div class="med-detail"><strong>💉 간호포인트</strong><ul>${m.nursingPoints.map(n => `<li${isCriticalNurse(n) ? ' class="med-critical"' : ''}>${esc(n)}</li>`).join('')}</ul></div>` : '';
    const use = m.indication ? `<div class="med-use"><strong>💡 이럴 때 써요</strong><p>${emph(esc(m.indication))}</p></div>` : '';
    return `<div class="med-card${m._geri ? ' med-geri' : ''}">
      <div class="med-card-head"><span class="med-category">${esc(m.category)}</span><span class="med-badges">${badges}</span></div>
      <div class="med-sys-tag">${esc(m._system)} · ${esc(m._topic)}</div>
      ${use}${pills}${mech}
      <div class="med-reveal">${side}${nurse}${exam}</div>
      <button class="med-reveal-btn" type="button">👁 부작용·간호·기출 보기</button>
    </div>`;
  }
  function renderMedView() {
    const el = document.getElementById('medContent'); if (!el) return;
    const idx = buildMedIndex();
    const s = _medSearch.toLowerCase();
    const items = idx.filter(m => {
      if (_medFilter === '🔥 빈출' && !m._hot) return false;
      if (_medFilter === '👴 노인주의' && !m._geri) return false;
      if (_medFilter !== '전체' && _medFilter !== '🔥 빈출' && _medFilter !== '👴 노인주의' && m._system !== _medFilter) return false;
      if (s) {
        const blob = (m.category + ' ' + (m.examples || []).join(' ') + ' ' + (m.mechanism || '') + ' ' + (m.sideEffects || []).join(' ') + ' ' + (m.nursingPoints || []).join(' ')).toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
    el.classList.toggle('mem-mode', _medMemMode);
    if (!items.length) { el.innerHTML = '<div class="med-empty">조건에 맞는 약물이 없어요.</div>'; return; }
    // 계통별 그룹 (빈출 필터일 땐 그룹 없이 빈출순)
    let html = `<p class="med-empty" style="padding:6px 0;color:#6b3fa0;font-weight:600">총 ${items.length}개 · ${_medMemMode ? '암기 모드(탭하면 부작용·간호 공개)' : '학습 모드'}</p>`;
    if (_medFilter === '🔥 빈출' || _medFilter === '👴 노인주의' || s) {
      html += `<div class="med-grid">${items.map(medCard).join('')}</div>`;
    } else {
      const groups = {};
      items.forEach(m => { (groups[m._system] = groups[m._system] || []).push(m); });
      html += Object.entries(groups).map(([sys, arr]) =>
        `<div class="med-sys-group"><h4>${esc(sys)} <span style="color:#bbb">(${arr.length})</span></h4><div class="med-grid">${arr.map(medCard).join('')}</div></div>`
      ).join('');
    }
    el.innerHTML = html;
  }

  // ─── 🔥 막판 암기노트 허브 ─────────────────────────────
  // 흩어진 고빈출 암기 내용을 한 화면 스크롤+탭 펼침으로. 기존 필드(memory·whyImportant·
  // compareTable·redFlags·cramCapsule)만 모아 빈출 점수로 랭킹. (새 사실 생성 없음)
  let _cramIndex = null, _cramFilter = '전체', _cramMemMode = false, _cramSearch = '';
  const CRAM_TAG_ALIAS = { '피부계': '피부감각계', '감각계': '피부감각계' };
  function cramTagCounts() {
    const c = {};
    [...(window.NORI_GICHUL?.questions || []), ...(window.NORI_VARIATION?.questions || [])]
      .forEach(q => { if (q && q.tag) c[q.tag] = (c[q.tag] || 0) + 1; });
    return c;
  }
  function cramWrongByTag() {
    const stat = lsGet(LS_QSTAT), wrong = {}, byId = {};
    [...(window.NORI_GICHUL?.questions || []), ...(window.NORI_VARIATION?.questions || [])]
      .forEach(q => { if (q && q.id) byId[q.id] = q.tag; });
    Object.entries(stat).forEach(([id, s]) => {
      if (s && s.wrong > 0 && byId[id]) wrong[byId[id]] = (wrong[byId[id]] || 0) + s.wrong;
    });
    return wrong;
  }
  function buildCramIndex() {
    if (_cramIndex) return _cramIndex;
    const counts = cramTagCounts(), wrongByTag = cramWrongByTag();
    const list = [];
    Object.entries(state.data || {}).forEach(([sid, subj]) => {
      (subj.topics || []).forEach(t => {
        const hasContent = (t.memory && t.memory.length) || t.cramCapsule || t.compareTable || t.whyImportant;
        if (!hasContent) return;
        const cat = t.category || subj.title || '기타';
        const tag = CRAM_TAG_ALIAS[cat] || cat;
        const cnt = counts[tag] || 0;
        const pw = t.priority === 'high' ? 1.6 : t.priority === 'low' ? 0.7 : 1.0;
        const fb = FREQ_BOOST[tag] || (cnt > 0 ? 1.2 : 1.0);
        list.push({
          sid, tid: t.id, title: t.title, category: cat, tag, priority: t.priority || 'medium',
          yieldScore: pw * fb * (1 + cnt / 50), qcount: cnt, weak: wrongByTag[tag] || 0,
          hot: (FREQ_BOOST[tag] >= 1.5) || cnt >= 120, topic: t
        });
      });
    });
    list.sort((a, b) => b.yieldScore - a.yieldScore);
    _cramIndex = list;
    return _cramIndex;
  }
  function cramDaysLeft() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.max(1, Math.ceil((EXAM_DATE - today) / 86400000));
  }
  // 카테고리형 핵심정리 — 진단·감별·약물(이름)·모니터링·금기·간호 등으로 나눠 라벨 + 그리드.
  const CRAM_CATS = [
    ['정의', '📖 정의·원인'], ['진단', '🔍 진단·검사'], ['감별', '🔀 감별진단'],
    ['특징', '⭐ 핵심 특징'], ['약물', '💊 약물 (이름)'], ['모니터링', '📈 부작용·모니터링'],
    ['금기', '⛔ 금기·주의'], ['간호', '💉 간호중재'], ['합병증', '⚠ 합병증'], ['응급', '🚨 응급'],
    ['기출', '📝 기출 포인트 (이렇게 나온다)']
  ];
  function cramSheetBlock(sheet) {
    return CRAM_CATS.filter(([k]) => Array.isArray(sheet[k]) && sheet[k].length)
      .map(([k, label]) => `<div class="cram-cat${k === '기출' ? ' cram-cat-gichul' : ''}"><h5 class="cram-cat-h">${label}</h5>${cramMemoryGrid(sheet[k])}</div>`)
      .join('');
  }
  // 핵심 암기를 '한 장 학습지'처럼 — 접지 않고 항상 펼친 카드 그리드(가로 3열).
  // 머리말(:앞)은 굵게, 설명은 아래로. 암기 모드면 설명만 가리고 머리말로 자가테스트.
  // 가독성: 줄바꿈(\n)·구분자(|)·번호(①②③·1)·▸) 자리에서 줄바꿈 처리.
  function cramBreaks(str) {
    let s = esc(String(str));
    s = s.replace(/\n+/g, '<br>')
         .replace(/\s*\|\s*/g, '<br>')
         .replace(/\s*▸\s*/g, '<br>▸ ')
         .replace(/\s*(?=[①②③④⑤⑥⑦⑧⑨⑩])/g, '<br>')
         .replace(/\s+(?=\d[).]\s)/g, '<br>')
         .replace(/^(?:<br>\s*)+/, '')
         .replace(/(?:<br>\s*){2,}/g, '<br>');
    return emph(s);
  }
  function cramMemoryGrid(items) {
    const cells = items.map(m => {
      const s = String(m);
      const ci = s.search(/[:：]/);
      if (ci > 0 && ci <= 42) {
        const head = s.slice(0, ci).trim();
        const bodyTxt = s.slice(ci + 1).trim();
        if (bodyTxt) return `<div class="cram-mem-cell"><b class="cmc-head">${emph(esc(head))}</b><span class="cmc-body">${cramBreaks(bodyTxt)}</span></div>`;
      }
      return `<div class="cram-mem-cell"><span class="cmc-body">${cramBreaks(s)}</span></div>`;
    }).join('');
    return `<div class="cram-mem-grid">${cells}</div>`;
  }
  function cramCard(it) {
    const t = it.topic;
    const badges = `${it.hot ? '<span class="cram-badge hot">🔥 빈출</span>' : ''}`
      + `${it.priority === 'high' ? '<span class="cram-badge hi">중요</span>' : ''}`
      + `${it.weak ? `<span class="cram-badge weak">⚠ 오답 ${it.weak}</span>` : ''}`;
    const u = t.understand || {};
    const oneRaw = t.analogy || t.beginner || (t.cramCapsule && t.cramCapsule[0]) || (t.memory && t.memory[0]) || '';
    const oneLine = String(oneRaw).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    let body = '';
    // ── 이해 먼저 (주입식 X): 비유 → 원리 → 노인 특이성 ──
    const easy = t.analogy || t.beginner;
    if (easy)
      body += `<div class="cram-analogy"><span class="cram-analogy-tag">💡 쉽게 이해</span><p>${emph(esc(easy))}</p></div>`;
    if (u.pathology)
      body += section('🔬 왜 이렇게 되나 (원리)', `<p class="cram-explain">${cramBreaks(u.pathology)}</p>`);
    if (u.geriatric_specifics)
      body += section('👴 노인은 이렇게 나타나요', `<p class="cram-explain">${cramBreaks(u.geriatric_specifics)}</p>`);
    if (t.cramExplain)
      body += section('💡 한 번 더 쉽게', `<p class="cram-explain">${cramBreaks(t.cramExplain)}</p>`);
    // ── 이해 후 비교·암기 ──
    if (t.compareTable)
      body += section(t.compareTable.title || '한눈 비교', compareTableBlock(t.compareTable));
    if (t.cramCapsule && t.cramCapsule.length)
      body += section('🎯 이해했으면 이건 외우자', `<ul class="cram-capsule">${t.cramCapsule.map(x => `<li>${cramBreaks(x)}</li>`).join('')}</ul>`);
    // 카테고리형 정리(cram-sheets.js)가 있으면 그걸로, 없으면 평면 그리드로 폴백
    const sheet = (window.NORI_CRAMSHEETS && window.NORI_CRAMSHEETS[it.tid]) || t.cramSheet;
    if (sheet)
      body += section('📌 핵심 정리 (카테고리별)', cramSheetBlock(sheet));
    else if (t.memory && t.memory.length)
      body += section('📌 핵심 암기 한눈에', cramMemoryGrid(t.memory));
    const emerg = (t.redFlags || []).filter(f => f && typeof f === 'object' && f.level === 'emergency');
    if (emerg.length) body += section('🚨 응급 신호', redFlagCards(emerg));
    body += `<div class="cram-actions">`
      + `<button class="cram-jump" type="button" data-sid="${esc(it.sid)}" data-tid="${esc(it.tid)}">📘 전체 학습</button>`
      + (t.noteLink ? `<a class="cram-note-link" href="${esc(t.noteLink.file)}#${esc(t.noteLink.anchor)}" target="_blank" rel="noopener">📖 그림으로 보기</a>` : '')
      + `</div>`;
    return `<details class="cram-card"><summary class="cram-sum">
        <span class="cram-sum-top"><span class="cram-title">${esc(it.title)}</span><span class="cram-badges">${badges}</span></span>
        <span class="cram-one">${esc(oneLine)}</span>
        <span class="cram-chev" aria-hidden="true">▾</span>
      </summary><div class="cram-body">${body}</div></details>`;
  }
  function buildCramFilterBar() {
    const bar = document.getElementById('cramFilterBar'); if (!bar) return;
    const idx = buildCramIndex();
    const cats = [...new Set(idx.map(i => i.category))];
    const chips = ['전체', '🔥 최빈출', '⚠ 내 약점', '📅 오늘 분량', ...cats];
    bar.innerHTML = chips.map(c =>
      `<button class="med-filter-chip${_cramFilter === c ? ' is-active' : ''}" type="button" data-cramf="${esc(c)}">${esc(c)}</button>`
    ).join('');
    bar.querySelectorAll('[data-cramf]').forEach(b => b.addEventListener('click', () => {
      _cramFilter = b.dataset.cramf; buildCramFilterBar(); renderCramHub();
    }));
  }
  function renderCramHub() {
    const el = document.getElementById('cramContent'); if (!el) return;
    const idx = buildCramIndex();
    const s = _cramSearch.toLowerCase();
    const dday = cramDaysLeft();
    const perDay = Math.max(1, Math.ceil(idx.length / dday));
    let items = idx.slice();
    if (_cramFilter === '🔥 최빈출') items = items.filter(i => i.hot);
    else if (_cramFilter === '⚠ 내 약점') items = items.filter(i => i.weak > 0).sort((a, b) => b.weak - a.weak);
    else if (_cramFilter === '📅 오늘 분량') items = items.slice(0, perDay);
    else if (_cramFilter !== '전체') items = items.filter(i => i.category === _cramFilter);
    if (s) items = items.filter(i =>
      (i.title + ' ' + i.category + ' ' + (i.topic.memory || []).join(' ') + ' ' + (i.topic.whyImportant || '')).toLowerCase().includes(s));
    el.classList.toggle('mem-mode', _cramMemMode);
    let html = `<div class="cram-plan">📅 시험까지 <b>D-${dday}</b> · 핵심 토픽 <b>${idx.length}</b>개 → 하루 <b>${perDay}개</b> 권장`
      + `${_cramFilter !== '📅 오늘 분량' ? ` <button class="cram-today-btn" type="button">오늘 분량만</button>` : ''}</div>`;
    if (!items.length) { el.innerHTML = html + '<div class="med-empty">조건에 맞는 항목이 없어요.</div>'; bindCramHub(el); return; }
    if (_cramFilter === '전체') {
      const groups = {};
      items.forEach(i => { (groups[i.category] = groups[i.category] || []).push(i); });
      html += Object.entries(groups).sort((a, b) => b[1][0].yieldScore - a[1][0].yieldScore)
        .map(([cat, arr]) => `<div class="cram-group"><h4>${esc(cat)} <span class="cram-gcount">${arr.length}</span></h4>${arr.map(cramCard).join('')}</div>`).join('');
    } else {
      html += `<p class="med-empty" style="padding:4px 0;color:var(--teal-dark);font-weight:700">${items.length}개</p>`;
      html += items.map(cramCard).join('');
    }
    el.innerHTML = html;
    bindCramHub(el);
  }
  function bindCramHub(el) {
    el.querySelector('.cram-today-btn')?.addEventListener('click', () => {
      _cramFilter = '📅 오늘 분량'; buildCramFilterBar(); renderCramHub();
    });
    el.querySelectorAll('.cram-jump').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const sid = b.dataset.sid, tid = b.dataset.tid;
      exitCramMode(); selectSubject(sid); setTimeout(() => selectTopic(tid), 30);
    }));
  }
  function enterCramMode() {
    document.getElementById('overviewBand').style.display = 'none';
    document.getElementById('contentGrid').style.display  = 'none';
    document.getElementById('gichulPanel').style.display  = 'none';
    document.getElementById('medPanel').style.display     = 'none';
    document.getElementById('cramPanel').style.display    = '';
    document.getElementById('subjectRail')?.classList.remove('is-open');
    document.getElementById('sidebarOverlay')?.classList.remove('is-open');
    buildCramFilterBar();
    renderCramHub();
  }
  function exitCramMode() {
    const p = document.getElementById('cramPanel'); if (p) p.style.display = 'none';
    document.getElementById('overviewBand').style.display = '';
    document.getElementById('contentGrid').style.display  = '';
  }

  function renderGichulQuestion() {
    const el = document.getElementById('gichulContent');
    if (!el) return;
    const { questions, current } = state.gichul;
    const total = questions.length;
    if (current >= total) { renderGichulResult(el, total); return; }

    const q    = questions[current];
    const pct  = Math.round((current / total) * 100);
    const nums = '①②③④⑤';
    // 자유 풀기(모의/데일리/복습 아님) — 위치 기억 + 번호 이동 메뉴 노출
    const isFree = !state.gichul.mock && !state.gichul.batchId;
    if (isFree) setFreePos(current);

    document.getElementById('gichulProgress').textContent =
      (state.gichul.batchLabel ? state.gichul.batchLabel + ' · ' : '') + `${current + 1} / ${total}`;

    let html = `<div class="quiz-wrapper">
      <div>
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <p class="quiz-counter">${current + 1} / ${total}</p>
      </div>`;

    if (isFree) html += `<details class="free-jump-wrap"><summary class="free-jump-sum">📍 번호 이동 (${current + 1}/${total})</summary>
      <div class="free-jump">
        <button class="free-jump-btn" data-jump="first" type="button">⏮ 처음</button>
        <button class="free-jump-btn" data-jump="prev" type="button">◀ 이전</button>
        <input class="free-jump-input" id="freeJumpInput" type="number" min="1" max="${total}" placeholder="번호" inputmode="numeric" aria-label="이동할 문제 번호">
        <span class="free-jump-total">/ ${total}</span>
        <button class="free-jump-btn free-jump-go" id="freeJumpGo" type="button">이동</button>
        <button class="free-jump-btn" data-jump="next" type="button">다음 ▶</button>
      </div></details>`;

    if (q.tag) html += `<span class="gichul-tag">${esc(q.tag)}</span>`;
    if (q.type === 'variation') html += `<span class="variation-badge">변형문제(AI생성)</span>`;
    if (q._cross) html += `<span class="cross-badge">🔀 같은 개념 다른 문제</span>`;

    const mk = getQMark(q.id);
    html += `<div class="qmark-bar">
      <button class="qmark-btn${mk === 'known' ? ' on-known' : ''}" data-mark="known" type="button">✓ 안다 (패스)</button>
      <button class="qmark-btn${mk === 'review' ? ' on-review' : ''}" data-mark="review" type="button">! 복습 필요</button>
    </div>`;

    html += `<p class="quiz-question">${esc(q.stem).replace(/\n/g, '<br>')}</p>`;
    html += `<div class="quiz-options">`;
    (q.choices || []).forEach((c, i) => {
      html += `<button class="quiz-option" data-opt="${i + 1}" type="button">
        <span class="opt-num">${nums[i] || (i + 1) + '.'}</span>
        <span>${esc(c)}</span>
      </button>`;
    });
    html += `</div>`;
    html += `<div class="quiz-explanation" id="quizExplanation">
      <strong>해설</strong><br>${esc(q.explanation || '해설을 준비 중입니다.')}
    </div>`;
    html += `<div class="quiz-nav" id="quizNav">
      <button class="quiz-btn quiz-btn-secondary" id="gichulSkipBtn" type="button">건너뛰기</button>
    </div></div>`;

    el.innerHTML = html;
    el.scrollTop = 0;

    el.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.gichul.answered) return;
        handleGichulAnswer(btn, q, el);
      });
    });

    el.querySelectorAll('.qmark-btn').forEach(b => b.addEventListener('click', () => {
      const cur = getQMark(q.id), val = b.dataset.mark;
      setQMark(q.id, cur === val ? null : val);
      const nv = getQMark(q.id);
      el.querySelectorAll('.qmark-btn').forEach(x => x.classList.remove('on-known', 'on-review'));
      if (nv === 'known') el.querySelector('[data-mark="known"]').classList.add('on-known');
      else if (nv === 'review') el.querySelector('[data-mark="review"]').classList.add('on-review');
    }));

    el.querySelector('#gichulSkipBtn')?.addEventListener('click', () => {
      state.gichul.scores.push(null);
      state.gichul.answered = false;
      state.gichul.current++;
      saveMockProg();
      renderGichulQuestion();
    });

    // 자유 풀기 번호 이동
    if (isFree) {
      const jumpTo = n => {
        const idx = Math.max(0, Math.min(total - 1, n));
        state.gichul.current = idx;
        state.gichul.answered = false;
        setFreePos(idx);
        renderGichulQuestion();
      };
      el.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
        const j = b.dataset.jump;
        if (j === 'first') jumpTo(0);
        else if (j === 'prev') jumpTo(current - 1);
        else if (j === 'next') jumpTo(current + 1);
      }));
      const input = el.querySelector('#freeJumpInput');
      const go = () => { const v = parseInt(input.value, 10); if (!isNaN(v)) jumpTo(v - 1); };
      el.querySelector('#freeJumpGo')?.addEventListener('click', go);
      input?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    }
  }

  function handleGichulAnswer(btn, q, el) {
    state.gichul.answered = true;
    const chosen  = parseInt(btn.dataset.opt, 10);
    const correct = q.answerKey;
    const isOk    = chosen === correct;

    state.gichul.scores.push(isOk);
    if (q.id) bumpQStat(q.id, !isOk);  // 문항별 오답 통계 누적(복습 모음용)

    el.querySelectorAll('.quiz-option').forEach((b, i) => {
      b.classList.add('disabled');
      if (i + 1 === correct)              b.classList.add('correct');
      else if (i + 1 === chosen && !isOk) b.classList.add('wrong');
    });
    el.querySelector('#quizExplanation')?.classList.add('show');

    const nav = el.querySelector('#quizNav');
    if (nav) {
      const more = state.gichul.current + 1 < state.gichul.questions.length;
      // 같은 개념의 다른 문제(기출↔변형)를 다음 문항으로 끼워넣어 바로 꼬리물기
      const sessIds = new Set(state.gichul.questions.map(x => x.id));
      const mark = lsGet(LS_QMARK);
      const cands = crossPartners(q, sessIds);
      const partner = cands.find(p => mark[p.id] !== 'known') || cands[0];
      nav.innerHTML =
        (partner ? `<button class="quiz-btn quiz-btn-secondary" id="gichulCrossBtn" type="button">🔀 같은 개념 다른 문제</button>` : '') +
        `<button class="quiz-btn quiz-btn-primary" id="gichulNextBtn" type="button">
        ${more ? '다음 문제 →' : '결과 확인 →'}
      </button>`;
      nav.querySelector('#gichulNextBtn').addEventListener('click', () => {
        state.gichul.answered = false;
        state.gichul.current++;
        saveMockProg();
        renderGichulQuestion();
      });
      nav.querySelector('#gichulCrossBtn')?.addEventListener('click', () => {
        state.gichul.questions.splice(state.gichul.current + 1, 0, { ...partner, _cross: true });
        state.gichul.answered = false;
        state.gichul.current++;
        saveMockProg();
        renderGichulQuestion();
      });
    }
  }

  function renderGichulResult(el, total) {
    const sess      = state.gichul;
    const correct   = sess.scores.filter(s => s === true).length;
    const pct       = total ? Math.round((correct / total) * 100) : 0;
    const pass      = pct >= 60;
    const wrongQs   = sess.questions.filter((q, i) => sess.scores[i] !== true);

    // 계통별(tag) 정답률
    const byTag = {};
    sess.questions.forEach((q, i) => {
      const t = q.tag || '기타'; const b = byTag[t] = byTag[t] || { c: 0, n: 0 };
      b.n++; if (sess.scores[i] === true) b.c++;
    });
    const tagRows = Object.entries(byTag).sort((a, b) => b[1].n - a[1].n).map(([t, b]) => {
      const r = Math.round(b.c / b.n * 100);
      return `<div class="tagrate-row"><span class="tagrate-name">${esc(t)}</span><span class="tagrate-bar"><span style="width:${r}%;background:${r >= 60 ? 'var(--green)' : 'var(--clay)'}"></span></span><span class="tagrate-val">${b.c}/${b.n}</span></div>`;
    }).join('');

    // 모의고사 결과 저장 + 임시저장(이어풀기) 제거
    if (sess.mock && sess.batchId) {
      const res = lsGet(LS_MOCK); res[sess.batchId] = { pct, correct, total, doneAt: Date.now() }; lsSet(LS_MOCK, res);
      clearMockProg(sess.batchId);
    }
    // 한 세션이라도 끝내면 오늘을 학습일로 기록(연속일 streak)
    let streakNote = '';
    if (total > 0) { const st = recordStudyDay(); streakNote = `🔥 연속 학습 ${st.count}일째`; }

    document.getElementById('gichulProgress').textContent = '완료!';
    const backToList = sess.mock || sess.batchId === 'review' || sess.batchId === 'daily';

    el.innerHTML = `<div class="quiz-result">
      <p class="quiz-score" style="color:${pass ? 'var(--green)' : 'var(--clay)'}">${pct}%</p>
      <p class="quiz-score-label">${correct} / ${total} 정답</p>
      <p class="quiz-result-msg">${pass ? '합격권 🎉 잘 하셨어요!' : '조금 더 연습해봐요'}</p>
      <p class="quiz-result-sub">60% 이상이 합격 기준입니다${streakNote ? ` · ${streakNote}` : ''}</p>
      <div class="tagrate"><h4>계통별 정답률</h4>${tagRows}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;">
        <button class="quiz-btn quiz-btn-primary"   id="gichulRetryBtn"      type="button">${sess.mock ? '이 회차 다시' : '다시 풀기'}</button>
        ${wrongQs.length > 0
          ? `<button class="quiz-btn quiz-btn-wrong" id="gichulRetryWrongBtn" type="button">❌ 오답만 다시 (${wrongQs.length}문제)</button>`
          : `<button class="quiz-btn quiz-btn-wrong" disabled style="opacity:0.4;cursor:not-allowed">❌ 오답 없음 🎉</button>`
        }
        <button class="quiz-btn quiz-btn-secondary" id="gichulBackBtn"       type="button">${backToList ? '← 목록으로' : '← 학습으로 돌아가기'}</button>
      </div>
    </div>`;

    el.querySelector('#gichulRetryBtn').addEventListener('click', () => {
      if (sess.mock) startGichulSession(sess.questions, { mock: true, batchId: sess.batchId, batchLabel: sess.batchLabel });
      else if (sess.batchId === 'review') startGichulSession(sess.questions, { batchId: 'review', batchLabel: '복습 모음' });
      else if (sess.batchId === 'daily') {  // 새 '오늘의 한 판' 구성으로 한 판 더
        const set = buildDailySet(total);
        if (set.questions.length) startGichulSession(set.questions, { batchId: 'daily', batchLabel: `오늘의 한 판 (복습 ${set.reviewCount}·신규 ${set.newCount})` });
        else { state.gichulView = 'daily'; buildGichulModeBar(); showGichulView(); }
      }
      else startGichulSession();
    });
    if (wrongQs.length > 0) {
      el.querySelector('#gichulRetryWrongBtn').addEventListener('click', () => {
        startGichulSession(shuffle([...wrongQs]), { batchLabel: '오답 다시' });
      });
    }
    el.querySelector('#gichulBackBtn').addEventListener('click', () => {
      if (backToList) showGichulView(); else exitGichulMode();
    });
  }

  function handleKeyboard(e) {
    // 입력창에 포커스가 있으면 무시
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    // 기출문제 모드 키보드
    if (state.gichulMode) {
      if (/^[1-5]$/.test(e.key) && !state.gichul.answered) {
        const opt = document.querySelector(`#gichulContent .quiz-option[data-opt="${e.key}"]`);
        if (opt) { e.preventDefault(); opt.click(); }
      } else if (e.key === 'Enter') {
        const next = document.getElementById('gichulNextBtn') || document.getElementById('gichulSkipBtn');
        if (next) { e.preventDefault(); next.click(); }
      }
      return;
    }

    if (!state.currentTopicId) return;

    if (state.currentMode === 'flash') {
      const card = document.getElementById('flashCard');
      if (!card) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        card.click();
      } else if (e.key === 'ArrowLeft') {
        document.getElementById('fcPrev')?.click();
      } else if (e.key === 'ArrowRight') {
        document.getElementById('fcNext')?.click();
      }
    } else if (state.currentMode === 'quiz') {
      // 1~5 선택지
      if (/^[1-5]$/.test(e.key) && !state.quiz.answered) {
        const opt = document.querySelector(`.quiz-option[data-opt="${e.key}"]`);
        if (opt) { e.preventDefault(); opt.click(); }
      } else if (e.key === 'Enter') {
        // 답한 뒤 Enter → 다음 문제 / 결과 확인
        const next = document.getElementById('quizNextBtn');
        if (next) { e.preventDefault(); next.click(); }
      }
    }
  }

  // ─── 유틸리티 ─────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── 학습 기록 내보내기/불러오기 ──────────────────
  function exportMarks() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      marks: state.marks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nori-marks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importMarks(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        const marks  = parsed.marks || parsed; // 버전 2 또는 raw 객체 모두 허용
        if (typeof marks !== 'object') throw new Error('형식 오류');
        state.marks = marks;
        localStorage.setItem(LS_KEY, JSON.stringify(marks));
        renderCurrentMode();
        buildTopicList();
        alert(`학습 기록을 불러왔습니다 (${Object.keys(marks).length}개 항목)`);
      } catch {
        alert('파일 형식이 맞지 않습니다. 이전에 내보낸 JSON 파일을 선택해주세요.');
      }
    };
    reader.readAsText(file);
  }

  // ─── 인쇄 ─────────────────────────────────────────
  function printTopic() {
    const topic = getCurrentTopic();
    if (!topic?.id) { alert('인쇄할 토픽을 먼저 선택하세요'); return; }
    // 현재 학습 모드 내용이 보이도록 study 모드로 전환 후 인쇄
    const prevMode = state.currentMode;
    if (prevMode !== 'study') setMode('study');
    setTimeout(() => {
      window.print();
      if (prevMode !== 'study') setTimeout(() => setMode(prevMode), 500);
    }, 150);
  }

  // ─── answerKey 유효성 검증 (콘솔 유틸) ───────────
  // 브라우저 콘솔에서 noriValidate() 실행하면 의심 문항 목록 출력
  window.noriValidate = function () {
    const issues = [];
    Object.entries(state.data).forEach(([dataKey, d]) => {
      (d.topics || []).forEach(topic => {
        (topic.questions || []).forEach((q, qi) => {
          const choiceCount = (q.choices || []).length;
          const key = q.answerKey;
          if (!key || key < 1 || key > choiceCount) {
            issues.push({
              topic: topic.id,
              qIndex: qi + 1,
              stem: (q.stem || '').slice(0, 50),
              answerKey: key,
              choiceCount,
              problem: key === 0 ? 'answerKey:0 (Type A 버그 — 0-indexed)' : `answerKey ${key} > 선택지 수 ${choiceCount}`
            });
          }
        });
      });
    });
    if (issues.length === 0) {
      console.log('%c✅ answerKey 오류 없음 — 모든 MCQ 정상', 'color:green;font-weight:bold');
    } else {
      console.warn(`%c❌ answerKey 의심 항목 ${issues.length}건`, 'color:red;font-weight:bold');
      console.table(issues);
    }
    return issues;
  };

  // ─── 부트 ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
