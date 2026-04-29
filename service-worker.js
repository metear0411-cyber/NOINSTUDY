// 노인전문간호사 2026 — Service Worker
// 버전을 올리면 캐시 갱신됨
const CACHE_NAME = 'nori-study-v1';

// 설치 시 미리 캐시할 핵심 파일
const PRECACHE_URLS = [
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
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
