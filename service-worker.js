// 노인전문간호사 2026 — Service Worker
// 버전을 올리면 캐시 갱신됨
const CACHE_NAME = 'nori-study-v22';

// 설치 시 미리 캐시할 핵심 파일
// app.js·styles.css는 index.html과 동일한 ?v= 버전으로 받아 브라우저 HTTP 캐시를 우회한다
// (배포 시 CACHE_NAME 숫자와 아래 ?v= 날짜를 함께 올릴 것)
const ASSET_VER = '20260614j';
const PRECACHE_URLS = [
  './index.html',
  './app.js?v=' + ASSET_VER,
  './styles.css?v=' + ASSET_VER,
  './data/gichul.js?v=' + ASSET_VER,
  './data/variation.js?v=' + ASSET_VER,
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './notes-bridge.js?v=20260531',
];

// 데이터 파일 — fetch 시 자동 캐시됨
const DATA_PATTERNS = [
  /\/data\//,
];

// ── 설치 ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── 활성화 (구버전 캐시 삭제) ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── 요청 가로채기 ────────────────────────────────────
self.addEventListener('fetch', event => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') return;

  // 쿼리스트링 제거한 URL로 캐시 조회 (data 파일의 ?v=날짜 처리)
  const url = new URL(event.request.url);
  const bareUrl = url.origin + url.pathname;

  // 데이터 파일은 network-first — 온라인이면 항상 최신, 오프라인이면 캐시 fallback
  // (?v= 버전을 깜빡 올리지 않아도 콘텐츠 갱신이 즉시 반영되도록)
  const isData = DATA_PATTERNS.some(re => re.test(url.pathname));
  if (isData) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(hit => hit || caches.match(bareUrl)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // 쿼리스트링 없는 버전도 조회
        const cacheHit = cached || (url.search ? caches.match(bareUrl) : Promise.resolve(null));
        return Promise.resolve(cacheHit).then(hit => {
          if (hit) return hit;

          // 캐시 미스 → 네트워크 요청 후 캐시 저장
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'opaque') {
                return response;
              }
              const toCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, toCache);
              });
              return response;
            })
            .catch(() => {
              // 오프라인이고 캐시도 없으면 index.html 반환
              return caches.match('./index.html');
            });
        });
      })
  );
});
