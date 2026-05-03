// app.js — 노인전문간호사 v2
// 라우팅 · 렌더링 · 퀴즈(임상추론형) · 플래시카드 · 진행도 저장

(function () {
  'use strict';

  const EXAM_DATE = new Date('2026-07-25');
  const LS_KEY     = 'nori_marks_v2';
  const LS_CAT_KEY = 'nori_cat_v2';

  const MODES = { STUDY: 'study', QUIZ: 'quiz', FLASH: 'flash' };
  const PRIORITIES = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
  const PRIORITY_LABELS = {
    high:   '★ 핵심 주제',
    medium: '▷ 중요 주제',
    low:    ''
  };
  const PRIORITY_ICONS = {
    high:   '★ 핵심',
    medium: '▷ 중요',
    low:    ''
  };
  const FLOW_LABELS = {
    clinical:  ['병태생리', '노인 특이성', '사정', '중재', '평가'],
    policy:    ['제도 배경', '대상·기준', '급여 유형', '운영 원칙', '평가·관리'],
    nursing:   ['역할 배경', '노인 특수성', '사정·도구', '간호중재', '평가기준'],
    promotion: ['개요·근거', '노인 특이성', '사정·스크리닝', '중재·프로그램', '효과 평가']
  };
  const SEARCH_DEBOUNCE_MS = 300;
  const FLOW_STEP_REGEX = /\.\s+(?=[가-힣A-Z【①②③④⑤⑥⑦⑧⑨⑩\d])/;

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
    flash: { cards: [], current: 0, flipped: false }
  };

  // ─── 초기화 ───────────────────────────────────────
  function init() {
    state.subjects    = window.NORI_SUBJECTS || [];
    state.data        = window.NORI_DATA     || {};
    state.marks       = JSON.parse(localStorage.getItem(LS_KEY)     || '{}');
    state.catCollapsed = JSON.parse(localStorage.getItem(LS_CAT_KEY) || '{}');

    updateDDay();
    buildSubjectList();
    bindEvents();

    if (state.subjects.length) selectSubject(state.subjects[0].id);
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
    const done = d.topics.filter(t => state.marks[getTopicMarkKey(subjectId, t.id)]?.done).length;
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
        const mark   = state.marks[getTopicMarkKey(subjectId, t.id)] || {};
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

      const badges = { done: false, weak: false, bookmark: false };
      for (const t of catTopics) {
        const mark = state.marks[getTopicMarkKey(state.currentSubjectId, t.id)] || {};
        if (mark.done) badges.done = true;
        if (mark.weak) badges.weak = true;
        if (mark.bookmark) badges.bookmark = true;
        if (badges.done && badges.weak && badges.bookmark) break;
      }

      const badgeHtml = [
        badges.bookmark ? '<span class="cat-badge cat-badge--bm">★</span>' : '',
        badges.done     ? '<span class="cat-badge cat-badge--done">✓</span>' : '',
        badges.weak     ? '<span class="cat-badge cat-badge--weak">!</span>'  : ''
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
    const mark   = state.marks[getTopicMarkKey(state.currentSubjectId, t.id)] || {};
    const states = [
      mark.bookmark ? 'bookmark' : '',
      mark.done     ? 'done'     : '',
      mark.weak     ? 'weak'     : ''
    ].filter(Boolean).join(' ');
    const active = t.id === state.currentTopicId;
    const sub    = PRIORITY_ICONS[t.priority] || '';
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

    document.getElementById('topicPriority').textContent = PRIORITY_LABELS[topic.priority] || '';
    document.getElementById('topicTitle').textContent = topic.title;

    Object.values(MODES).forEach(m => {
      const el = document.getElementById(`mode${cap(m)}`);
      if (el) el.style.display = state.currentMode === m ? '' : 'none';
    });

    if      (state.currentMode === MODES.STUDY) renderStudy(topic);
    else if (state.currentMode === MODES.QUIZ)  renderQuiz(topic);
    else                                         renderFlash(topic);
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


  // ─── 학습 모드 ────────────────────────────────────
  function renderStudy(topic) {
    const el = document.getElementById('modeStudy');
    if (!el) return;

    let html = '';

    if (topic.beginner)    html += `<div class="beginner-banner"><strong>초보자 포인트&nbsp;</strong>${esc(topic.beginner)}</div>`;
    if (topic.whyImportant) html += `<div class="why-banner"><strong>왜 시험에 나오는가?&nbsp;</strong>${esc(topic.whyImportant)}</div>`;

    if (topic.redFlags?.length) {
      html += section('🚨 즉시 대응 신호 (Red Flags)',
        `<ul class="trap-list">${topic.redFlags.map(f => `<li>🚨 ${esc(f)}</li>`).join('')}</ul>`);
    }

    if (state.memoryMode) {
      if (topic.memory?.length) {
        html += section('핵심 암기 포인트',
          `<ul class="memory-list">${topic.memory.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`);
      }
      if (topic.traps?.length) {
        html += section('함정 &amp; 주의사항',
          `<ul class="trap-list">${topic.traps.map(t => `<li>⚠ ${esc(t)}</li>`).join('')}</ul>`);
      }
    } else {
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

      if (topic.medications?.length) {
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
        html += section('💊 약물치료', `<div class="med-grid">${medsHtml}</div>`);
      }

      if (topic.memory?.length) {
        html += section('핵심 암기 포인트',
          `<ul class="memory-list">${topic.memory.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`);
      }
      if (topic.traps?.length) {
        html += section('함정 &amp; 주의사항',
          `<ul class="trap-list">${topic.traps.map(t => `<li>⚠ ${esc(t)}</li>`).join('')}</ul>`);
      }
    }

    if (topic.caseFrame) {
      html += section('2차 사례형 답안 틀 (SOAP)',
        `<div class="why-banner" style="white-space:pre-line;">${esc(topic.caseFrame)}</div>`);
    }

    el.innerHTML = html || '<div class="empty-state">학습 내용을 준비 중입니다</div>';
  }

  function section(title, bodyHtml) {
    return `<div class="study-section"><h4>${title}</h4>${bodyHtml}</div>`;
  }

  function formatFlowText(text) {
    if (!text) return '';
    const parts = text
      .split(FLOW_STEP_REGEX)
      .map(p => p
        .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
        .replace(/\.\s*$/, '')
        .trim()
      )
      .filter(Boolean);
    if (parts.length <= 1) return `<span>${esc(text)}</span>`;
    return `<ol class="flow-text-list">${parts.map(p => `<li>${esc(p)}</li>`).join('')}</ol>`;
  }

  function isCriticalNurse(text) {
    return /금기|금지|절대\s|주의|위험|즉시|응급|반드시|중단\s|독성|사망/.test(text);
  }

  function flowStep(label, text) {
    return `<div class="flow-step">
      <strong>${label}</strong>
      ${text ? formatFlowText(text) : '<span style="color:#bbb">준비중</span>'}
    </div>`;
  }

  function renderQuiz(topic) {
    const el = document.getElementById('modeQuiz');
    if (!el) return;

    const questions = topic.questions || [];
    if (!questions.length) {
      el.innerHTML = '<div class="quiz-empty">퀴즈 문제를 준비 중입니다.<br>학습 모드에서 내용을 먼저 학습해 보세요.</div>';
      return;
    }

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

    if (q.caseStory) {
      html += `<div class="beginner-banner">
        <strong>📋 임상 사례</strong><br>
        ${esc(q.caseStory).replace(/\n/g, '<br>')}
      </div>`;
    }

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

    html += `<p class="quiz-question">${esc(q.stem)}</p>`;

    html += `<div class="quiz-options">`;
    (q.choices || []).forEach((c, i) => {
      const text = typeof c === 'string' ? c : c.text;
      html += `<button class="quiz-option" data-opt="${i + 1}" type="button">
        <span class="opt-num">${nums[i] || (i + 1) + '.'}</span>
        <span>${esc(text)}</span>
      </button>`;
    });
    html += `</div>`;

    html += `<div class="quiz-explanation" id="quizExplanation">
      <strong>해설</strong><br>${esc(q.explanation || '해설을 준비 중입니다.')}
    </div>`;

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

    // 핵심단서 토글
    el.addEventListener('click', e => {
      const hintBtn = e.target.closest('#quizHintToggle');
      if (hintBtn) {
        const isOpen = hintBtn.classList.toggle('is-open');
        const content = el.querySelector('#quizLearnerSupport');
        if (content) content.style.display = isOpen ? '' : 'none';
        hintBtn.textContent = isOpen ? '📖 핵심단서 접기 ▼' : '📖 핵심단서 보기 ▶';
        return;
      }
    });

    // 건너뛰기
    el.querySelector('#quizSkipBtn')?.addEventListener('click', () => {
      state.quiz.scores.push(null);
      state.quiz.answered = false;
      state.quiz.current++;
      renderQuiz({ questions: state.quiz.questions });
    });
  }

  function handleQuizAnswer(btn, q, el) {
    state.quiz.answered = true;
    const chosen  = parseInt(btn.dataset.opt, 10);
    const correct = q.answerKey;
    const isOk    = chosen === correct;

    state.quiz.scores.push(isOk);

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

  function getTopicMarkKey(subjectId, topicId) { return `${subjectId}:${topicId}`; }

  function getMarkKey() { return getTopicMarkKey(state.currentSubjectId, state.currentTopicId); }

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

  function setMode(mode) {
    state.currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.classList.toggle('is-active', btn.dataset.mode === mode)
    );
    renderCurrentMode();
  }

  let searchTimeout;
  function bindEvents() {
    document.getElementById('subjectList')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-subject]');
      if (btn) selectSubject(btn.dataset.subject);
    });

    document.getElementById('partList')?.addEventListener('click', e => {
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
      const btn = e.target.closest('[data-topic]');
      if (btn) selectTopic(btn.dataset.topic);
    });

    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.addEventListener('click', () => setMode(btn.dataset.mode))
    );

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b =>
          b.classList.toggle('is-active', b.dataset.filter === state.filter)
        );
        buildSubjectList();
      });
    });

    document.getElementById('searchInput')?.addEventListener('input', e => {
      clearTimeout(searchTimeout);
      state.search = e.target.value.trim();
      searchTimeout = setTimeout(() => {
        buildSubjectList();
        if (state.currentSubjectId) buildTopicList();
      }, SEARCH_DEBOUNCE_MS);
    });

    document.getElementById('exportMarksBtn')?.addEventListener('click', exportMarks);
    const importInput = document.getElementById('importMarksInput');
    document.getElementById('importMarksBtn')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', e => {
      importMarks(e.target.files[0]);
      e.target.value = '';
    });

    document.getElementById('bookmarkButton')?.addEventListener('click', () => toggleMark('bookmark'));
    document.getElementById('doneButton')    ?.addEventListener('click', () => toggleMark('done'));
    document.getElementById('weakButton')    ?.addEventListener('click', () => toggleMark('weak'));
    document.getElementById('printButton')   ?.addEventListener('click', printTopic);

    document.getElementById('memoryToggle')?.addEventListener('click', function () {
      state.memoryMode = !state.memoryMode;
      this.classList.toggle('is-active', state.memoryMode);
      this.textContent = state.memoryMode ? '이해 모드' : '암기 집중';
      if (state.currentMode === MODES.STUDY) renderCurrentMode();
    });

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
  }

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

  function printTopic() {
    const topic = getCurrentTopic();
    if (!topic?.id) { alert('인쇄할 토픽을 먼저 선택하세요'); return; }
    const prevMode = state.currentMode;
    if (prevMode !== MODES.STUDY) setMode(MODES.STUDY);
    setTimeout(() => {
      window.print();
      if (prevMode !== MODES.STUDY) setTimeout(() => setMode(prevMode), 500);
    }, 150);
  }

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

  document.addEventListener('DOMContentLoaded', init);
})();
