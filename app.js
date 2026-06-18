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

  const MOCK_SIZE = 100;  // 모의고사 회당 문항 수

  // 공식 출제비중(subjects.js weight 매핑, 합 100) — 회차 챕터 분포 기준
  const EXAM_WEIGHTS = {
    '노인질환관리': 55, '노인복지·시설': 6, '건강증진·예방': 5, '생애말기간호': 3,
    '공통:신체검진': 7, '공통:약리': 5, '공통:병태생리': 4, '공통:이론·연구': 6,
    '공통:교육상담': 4, '공통:윤리': 2, '전문간호 총론': 3
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
    state.marks       = JSON.parse(localStorage.getItem(LS_KEY)     || '{}');
    state.catCollapsed = JSON.parse(localStorage.getItem(LS_CAT_KEY) || '{}');

    updateDDay();
    buildSubjectList();
    bindEvents();

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
        ${med.examples?.length ? `<div class="med-examples">${med.examples.map(e => `<span class="med-pill">${esc(e)}</span>`).join('')}</div>` : ''}
        ${med.mechanism ? `<div class="med-detail"><strong>기전</strong><p>${esc(med.mechanism)}</p></div>` : ''}
        ${sideArr.length ? `<div class="med-detail"><strong>⚠️ 부작용</strong><ul>${sideArr.map(s => `<li class="med-side-effect">${esc(s)}</li>`).join('')}</ul></div>` : ''}
        ${nurseArr.length ? `<div class="med-detail"><strong>💉 간호 포인트</strong><ul>${nurseArr.map(n => `<li${isCriticalNurse(n) ? ' class="med-critical"' : ''}>${esc(n)}</li>`).join('')}</ul></div>` : ''}
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

    // 기출문제 버튼
    document.getElementById('gichulEntryBtn')?.addEventListener('click', enterGichulMode);
    document.getElementById('gichulExitBtn')?.addEventListener('click', exitGichulMode);

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
  function startGichulSession(questions, info) {
    const qs = questions ? [...questions] : shuffle([...gichulPool()]);
    state.gichul = {
      questions: qs, current: 0, answered: false, scores: [],
      mock: !!(info && info.mock), batchId: info?.batchId || null, batchLabel: info?.batchLabel || ''
    };
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
  function bumpQStat(id, wrong) { const s = lsGet(LS_QSTAT); const e = s[id] || { seen: 0, wrong: 0 }; e.seen++; if (wrong) e.wrong++; s[id] = e; lsSet(LS_QSTAT, s); }
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
    let html = `<div class="mock-intro"><p>📋 <b>${esc(state.gichulSource)} 모의고사</b> — 한 회 <b>${MOCK_SIZE}문항</b>, 실제 출제비중에 맞춰 구성됩니다. 빈출 영역(순환·신경·호흡 등)은 더 자주 출제돼요.</p></div>`;
    html += `<div class="mock-grid">`;
    exams.forEach((ex, i) => {
      const r = results[ex.id];
      const badge = r ? `<span class="mock-badge ${r.pct >= 60 ? 'pass' : 'fail'}">${r.pct}%</span>` : `<span class="mock-badge new">미응시</span>`;
      html += `<button class="mock-card" type="button" data-batch="${i}"><strong>${i + 1}회</strong><span>${ex.questions.length}문항</span>${badge}</button>`;
    });
    html += `</div>`;
    el.innerHTML = html;
    el.querySelectorAll('[data-batch]').forEach(b => b.addEventListener('click', () => {
      const ex = exams[+b.dataset.batch];
      startGichulSession(ex.questions, { mock: true, batchId: ex.id, batchLabel: ex.label });
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
  function showGichulView() {
    const typeBar = document.getElementById('gichulTypeBar');
    const chapBar = document.getElementById('gichulChapterBar');
    document.getElementById('gichulProgress').textContent = '';
    if (state.gichulView === 'normal') {
      typeBar.style.display = ''; chapBar.style.display = '';
      buildGichulTypeBar(); buildGichulChapterBar(); startGichulSession();
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
    document.getElementById('gichulPanel').style.display  = '';
    document.getElementById('subjectRail')?.classList.remove('is-open');
    document.getElementById('sidebarOverlay')?.classList.remove('is-open');

    buildGichulModeBar();
    showGichulView();
  }

  function exitGichulMode() {
    state.gichulMode = false;
    document.getElementById('overviewBand').style.display = '';
    document.getElementById('contentGrid').style.display  = '';
    document.getElementById('gichulPanel').style.display  = 'none';
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

    document.getElementById('gichulProgress').textContent =
      (state.gichul.batchLabel ? state.gichul.batchLabel + ' · ' : '') + `${current + 1} / ${total}`;

    let html = `<div class="quiz-wrapper">
      <div>
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <p class="quiz-counter">${current + 1} / ${total}</p>
      </div>`;

    if (q.tag) html += `<span class="gichul-tag">${esc(q.tag)}</span>`;
    if (q.type === 'variation') html += `<span class="variation-badge">변형문제(AI생성)</span>`;

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
      renderGichulQuestion();
    });
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
      nav.innerHTML = `<button class="quiz-btn quiz-btn-primary" id="gichulNextBtn" type="button">
        ${more ? '다음 문제 →' : '결과 확인 →'}
      </button>`;
      nav.querySelector('#gichulNextBtn').addEventListener('click', () => {
        state.gichul.answered = false;
        state.gichul.current++;
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

    // 모의고사 결과 저장
    if (sess.mock && sess.batchId) {
      const res = lsGet(LS_MOCK); res[sess.batchId] = { pct, correct, total, doneAt: Date.now() }; lsSet(LS_MOCK, res);
    }

    document.getElementById('gichulProgress').textContent = '완료!';
    const backToList = sess.mock || sess.batchId === 'review';

    el.innerHTML = `<div class="quiz-result">
      <p class="quiz-score" style="color:${pass ? 'var(--green)' : 'var(--clay)'}">${pct}%</p>
      <p class="quiz-score-label">${correct} / ${total} 정답</p>
      <p class="quiz-result-msg">${pass ? '합격권 🎉 잘 하셨어요!' : '조금 더 연습해봐요'}</p>
      <p class="quiz-result-sub">60% 이상이 합격 기준입니다</p>
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
