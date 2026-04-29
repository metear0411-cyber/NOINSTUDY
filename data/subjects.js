// data/subjects.js
// 전체 과목 메타 배열 — window.NORI_SUBJECTS 에 할당
// (file:// CORS 우회용 전역 변수 방식)

window.NORI_SUBJECTS = [
  // ── 전공과목 (major) ──────────────────────────
  {
    id: "gero-disease",
    title: "노인질환관리",
    category: "major",
    icon: "🏥",
    totalQuestions: 97,
    priority: "1순위",
    weight: 88,
    meta: "전공 핵심 · 97문항",
    summary: "전공 110문항 중 97문항을 차지하는 최우선 영역. 질환별 병리·증상·검사·건강사정·진단·치료·간호중재·재활을 한 흐름으로 연결해야 한다.",
    chips: ["병리", "증상", "건강사정", "중재", "치료", "재활"],
    dataKey: "gero-disease"
  },
  {
    id: "gero-ltc",
    title: "노인장기요양관리",
    category: "major",
    icon: "🏡",
    totalQuestions: 5,
    priority: "2순위",
    weight: 5,
    meta: "전공 · 5문항",
    summary: "문항수는 적지만 현장 경험을 점수화하기 좋은 영역. 제도·서비스·시설운영·안전관리로 압축한다.",
    chips: ["노인복지서비스", "시설운영", "안전", "기록", "연계"],
    dataKey: "gero-ltc"
  },
  {
    id: "gero-promotion",
    title: "노인건강증진",
    category: "major",
    icon: "💪",
    totalQuestions: 7,
    priority: "2순위",
    weight: 6,
    meta: "전공 · 7문항",
    summary: "노화이론·노화 변화·위험요인·의사소통·예방중재를 짧게 정리. 센터 프로그램 경험과 연결하면 효율적이다.",
    chips: ["노화이론", "노화변화", "위험요인", "의사소통", "예방"],
    dataKey: "gero-promotion"
  },
  {
    id: "gero-eol",
    title: "생애말기간호",
    category: "major",
    icon: "🕊️",
    totalQuestions: 1,
    priority: "압축",
    weight: 1,
    meta: "전공 · 1문항",
    summary: "문항은 적지만 사례형 답안에서 윤리·가족간호·증상완화로 활용될 수 있다.",
    chips: ["완화간호", "사별가족", "의사결정", "통증", "윤리"],
    dataKey: "gero-eol"
  },
  {
    id: "gero-nursing",
    title: "상급노인간호",
    category: "major",
    icon: "👵",
    totalQuestions: 0,
    priority: "참고",
    weight: 0,
    meta: "전공 · 참고",
    summary: "노인증후군 통합(낙상·섬망·영양·수면·통증)을 다학제 관점에서 정리하는 영역.",
    chips: ["낙상", "섬망", "영양", "수면", "통증", "다학제"],
    dataKey: "gero-nursing"
  },

  // ── 공통과목 (common) ─────────────────────────
  {
    id: "assessment",
    title: "상급건강사정",
    category: "common",
    icon: "🩺",
    totalQuestions: 10,
    priority: "1순위",
    weight: 9,
    meta: "공통 핵심 · 10문항",
    summary: "계통별 신체검진은 공통 10문항이지만 전공의 건강사정 15문항과 직결된다.",
    chips: ["전반적사정", "심폐", "복부/비뇨", "신경계", "근골격"],
    dataKey: "assessment"
  },
  {
    id: "pharmacology",
    title: "약리",
    category: "common",
    icon: "💊",
    totalQuestions: 6,
    priority: "2순위",
    weight: 5,
    meta: "공통 · 6문항",
    summary: "약물명 암기보다 노인에서 왜 위험한지, 어떤 질환에서 왜 쓰는지 연결해야 한다.",
    chips: ["약동학", "심혈관약", "호흡기약", "당뇨약", "항생제", "진통제"],
    dataKey: "pharmacology"
  },
  {
    id: "pathophysiology",
    title: "병태생리",
    category: "common",
    icon: "🧬",
    totalQuestions: 6,
    priority: "2순위",
    weight: 5,
    meta: "공통 · 6문항",
    summary: "질환관리의 뼈대. 세포손상·염증·면역·수분전해질·계통별 병태를 질환과 붙여 학습한다.",
    chips: ["세포손상", "염증", "면역", "수분전해질", "산염기"],
    dataKey: "pathophysiology"
  },
  {
    id: "nursing-theory",
    title: "간호이론",
    category: "common",
    icon: "📚",
    totalQuestions: 2,
    priority: "3순위",
    weight: 2,
    meta: "공통 · 압축",
    summary: "분량 대비 문항수가 적다. 주요 이론가와 핵심 키워드를 비교표로 압축한다.",
    chips: ["Orem", "Roy", "Neuman", "Watson", "Leininger"],
    dataKey: "nursing-theory"
  },
  {
    id: "nursing-research",
    title: "간호연구",
    category: "common",
    icon: "🔬",
    totalQuestions: 3,
    priority: "3순위",
    weight: 3,
    meta: "공통 · 압축",
    summary: "연구설계·자료해석·연구윤리를 문제풀이용으로 정리한다.",
    chips: ["연구설계", "표집", "자료수집", "통계", "윤리"],
    dataKey: "nursing-research"
  },
  {
    id: "advanced-practice",
    title: "전문간호사 역할·정책",
    category: "common",
    icon: "⚖️",
    totalQuestions: 9,
    priority: "2순위",
    weight: 8,
    meta: "공통 · 9문항",
    summary: "범위가 비교적 명확하다. 법·윤리·질관리·보건의료체계를 숫자와 역할 중심으로 압축한다.",
    chips: ["제도", "법윤리", "정책", "질관리", "교육상담"],
    dataKey: "advanced-practice"
  }
];
