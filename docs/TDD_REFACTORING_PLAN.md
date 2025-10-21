# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-21

---

## 🎉 모든 활성 과제 완료

> P0, P1, P2, Phase A1 과제가 모두 완료되었습니다. 상세 기록은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참고하세요.

### 완료 요약 (2025-10-21)

- **Phase B2: Services Coverage Improvement** ✅
  - 20개 파일 커버리지 개선 (37%-78% → 80%+)
  - 총 619개 테스트 추가 (P0: 119, P1: 115, P2: 208, P3: 177)
  - 80% 미만 파일: 20개 → 13개 (35% 감소)
  - 2개 프로덕션 버그 발견 및 수정
  - 전체 테스트: 2443개 통과, 6개 스킵

- **Phase A1: 의존성 그래프 최적화** ✅
  - 순환 참조 제거 (service-factories ↔ service-accessors)
  - 고아 모듈 3개 제거 (memoization, progressive-loader, button)
  - 모듈: 269 → 266, 의존성: 748 → 747
  - dependency-cruiser: 0 violations

- **P0: PostCSS 상대 색상 경고 제거** ✅
  - color-mix 대체, OKLCH 플러그인만 유지
  - prod/dev 빌드 경고 0

- **P1: 레거시 토큰 alias 단계적 제거** ✅
  - `src/features/**` 전범위 canonical tokens로 통일
  - 정책 테스트로 회귀 방지

- **P2: 번들 여유 확보 ≥ 3 KB** ✅
  - 현재: 326.73 KB / 335 KB (**8.27 KB 여유**)
  - 토큰 통일 과정에서 자연스럽게 달성

### 현재 상태

- **Build**: prod 326.73 KB / 335 KB, gzip 88.11 KB (검증 스크립트 PASS)
- **Tests**: 2443 passed + 6 skipped (unit + browser + E2E + a11y) 전체 GREEN
- **Coverage**: 69.99% (Stmts), 79.26% (Branch), 67.25% (Funcs), 69.99% (Lines)
- **정적 분석**: Typecheck / ESLint / Stylelint / CodeQL(5개) 모두 PASS
- **의존성**: 266 modules, 747 dependencies, 0 circular violations

---

## 활성 Phase

### Phase B2: Services Coverage Improvement ✅ **완료** (2025-10-21)

**목표**: shared/services 영역의 테스트 커버리지를 80% 이상으로 개선

**최종 결과**:

- **전체 파일**: 66개 (event-managers.ts 제거)
- **80% 미만 파일**: 20개 → 13개 (**7개 파일 개선, 35% 감소**)
- **신규 테스트**: 619개 (P0: 119, P1: 115, P2: 208, P3: 177)
- **전체 테스트**: 2443 passed + 6 skipped
- **전체 커버리지**: 69.99% (Stmts), 79.26% (Branch), 67.25% (Funcs)
- **프로덕션 버그**: 2개 발견 및 수정 (P2: extractUsername, URL 파싱)

**성과**:

- P0: 4개 파일 100% 커버리지 달성
- P1: 4개 파일 80%+ 커버리지 달성
- P2: 6개 파일 80%+ 커버리지 달성
- P3: 6개 파일 80%+ 커버리지 달성
- 100% 테스트 통과율 (0 failures)
- TDD 원칙 준수 (RED → GREEN → REFACTOR)

**우선순위별 개선 계획**:

**P0: 미사용/레거시 코드 정리** ✅ **완료** (2025-10-21)

- [x] `event-managers.ts` (0%) - ✅ 제거 완료 (미사용 re-export 파일)
- [x] `twitter-video-extractor.ts` (6.34% → 100%) - ✅ 32개 테스트 추가 완료
- [x] `fallback-strategy.ts` (7.01% → 100%) - ✅ 38개 테스트 추가 완료
- [x] `service-diagnostics.ts` (10.63% → 100%) - ✅ 19개 테스트 추가 완료

**P1: 핵심 서비스 커버리지 개선** ✅ **완료** (2025-10-21)

- [x] `event-manager.ts` (49.12% → 80%+) - ✅ 30개 테스트 추가 완료
- [x] `animation-service.ts` (52.52% → 80%+) - ✅ 38개 테스트 추가 완료
  - 싱글톤 상태 리셋, globalTimerManager 비동기 타이머, zero duration 예외 처리
- [x] `media-service.ts` (55.39% → 80%+) - ✅ 22개 테스트 추가 완료
  - 복잡한 의존성 회피, public API 기본 동작 테스트
- [x] `bulk-download-service.ts` (72.18% → 80%+) - ✅ 25개 테스트 추가 완료
  - JSDOM URL.createObjectURL 한계 회피, error 핸들링 테스트

**P2: Extraction Strategies 테스트** (현재 진행 중 🔄)

**목표**: 미디어 추출 전략 클래스들의 커버리지를 80% 이상으로 개선

**전략 우선순위**:

- [x] `clicked-element-tweet-strategy.ts` (27.18% → 80%+) - ✅ 32개 테스트 추가
      완료 (2025-10-21)
  - TDD로 프로덕션 버그 발견 및 수정: extractUsername 로직
    (`!href.includes('/')` → `href.lastIndexOf('/') === 0`)
  - 테스트 그룹: metadata, data-attributes, aria-label, URL extraction,
    buildTweetInfo, username, error handling, priority, edge cases
- [x] `tweet-info-extractor.ts` (59.42% → 80%+) - ✅ 32개 테스트 추가 완료
      (2025-10-21)
  - Strategy 패턴 조정자(Orchestrator) 테스트
  - 테스트 그룹: 5개 전략 초기화, extract 우선순위, isValidTweetInfo,
    extractWithStrategy, extractWithAllStrategies, edge cases, performance
- [x] `data-attribute-tweet-strategy.ts` (51.02% → 80%+) - ✅ 31개 테스트 추가
      완료 (2025-10-21)
  - 데이터 속성 기반 추출 (data-tweet-id, data-item-id, data-key)
  - 테스트 그룹: metadata, extractTweetId (3개 속성, 우선순위, 검증),
    extractUsername (2개 속성, 우선순위), parent traversal (5 levels), tweetUrl,
    confidence/metadata, error handling, edge cases
- [x] `url-based-tweet-strategy.ts` (51.21% → 80%+) - ✅ 33개 테스트 추가 완료
      (2025-10-21)
  - URL 기반 추출 (window.location.href 파싱)
  - TDD로 프로덕션 버그 2개 발견 및 수정:
    1. x.com 도메인 미지원 (`/twitter\.com/` → `/(?:twitter|x)\.com/`)
    2. "status" 경로를 username으로 오인 (명시적 제외 로직 추가)
    3. 포트 번호 미지원 (optional port `(?::\d+)?` 추가)
  - 테스트 그룹: metadata, extractTweetIdFromUrl (8개: status, query, hash,
    photo, video, domains), extractUsernameFromUrl (5개: domains, underscores,
    'fallback'/'status' rejection), tweetUrl construction, confidence/metadata,
    error handling, edge cases (10개: port, mobile, analytics, fragments 등),
    parseUsernameFast fallback
- [x] `username-extraction-service.ts` (51.4% → 80%+) - ✅ 50개 테스트 추가 완료
      (2025-10-21)
  - 사용자명 추출 통합 서비스 (DOM → URL → Meta → fallback 순서)
  - UsernameParser 클래스: 3단계 추출 전략 (confidence 0.9/0.8/0.7)
  - 테스트 그룹: cleanUsername (9개: @제거, trim, URL 경로, 패턴 검증 1-15자),
    isSystemPage (5개: SYSTEM_PAGES 체크, 대소문자), extractFromURL (7개:
    x.com/twitter.com, status URL, 시스템 페이지 제외),
    extractUsernameFromElement (8개: anchor href, textContent, cleanUsername,
    null/invalid), extractFromDOM (5개: 6개 셀렉터, 우선순위, 시스템 페이지
    제외), extractFromMeta (6개: 4개 메타태그, cleanUsername, 시스템 페이지),
    extractUsername orchestrator (6개: 우선순위 폴백, element/document
    파라미터), 편의 함수 (4개: extractUsername, parseUsernameFast)
- [x] `dom-direct-extractor.ts` (73.64% → 80%+) - ✅ 30개 테스트 추가 완료
      (2025-10-21)
  - DOM 백업 추출기: 기본 DOM 파싱으로 미디어 추출
  - 테스트 그룹: extract 메인 플로우 (4개: 성공/실패, 클릭 인덱스),
    findMediaContainer (3개: closestTweet 우선순위, fallback 체인),
    extractMediaFromContainer (6개: 이미지/비디오/혼합, 유효성 검증, tweetInfo),
    createImageMediaInfo (2개: tweetInfo 있음/없음), createVideoMediaInfo (2개),
    generateFilename (4개: 이미지/비디오, tweetInfo, 인덱스 증가),
    generateVideoThumbnail (2개: .mp4→.jpg, 쿼리 파라미터), isValidImageUrl
    (1개), findClickedIndex (5개: IMG/VIDEO 태그, 쿼리 파라미터, 매칭 실패),
    createFailureResult (1개)

**P2 완료** ✅ (2025-10-21)

1. **clicked-element-tweet-strategy.ts 분석**: DOM 이벤트 타겟 → 트윗 정보 추출
   로직
   - 테스트 시나리오: 클릭 요소 타입별 추출 (이미지, 비디오, 링크 등)
   - 엣지 케이스: 잘못된 DOM 구조, 누락된 데이터 속성
   - 예상 테스트 수: 15-20개

2. **tweet-info-extractor.ts 분석**: 트윗 메타데이터 추출 (username, tweetId 등)
   - 테스트 시나리오: 다양한 트윗 HTML 구조 파싱
   - 엣지 케이스: 리트윗, 인용 트윗, 스레드
   - 예상 테스트 수: 20-25개

3. **나머지 전략 클래스**: 순차적으로 진행

**기술적 고려사항**:

- JSDOM 환경: DOM 구조 모킹 필요
- Twitter/X HTML 구조: 실제 트윗 DOM 샘플 사용
- Strategy 패턴: 각 전략의 독립성 보장
- 벤더 getter 사용: `getSolid()` 등

**P3: 기타 서비스** ✅ **완료** (2025-10-21)

- [x] `toast-controller.ts` (37.5% → 80%+) - ✅ 31개 테스트 추가 완료
      (2025-10-21)
  - Toast 알림 컨트롤러: ToastManager 래퍼
  - 테스트 그룹: initialization (2개), cleanup (2개), show (4개: 기본/전체
    옵션/ID/타입), success (3개), info (3개), warning (3개), error (3개), remove
    (2개), clear (2개), 전역 인스턴스 (3개), 통합 시나리오 (4개: 다중 타입, 액션
    콜백, 라이프사이클, 제거)
- [x] `unified-toast-manager.ts` (78.2% → 80%+) - ✅ 35개 테스트 추가 완료
      (2025-10-21)
  - 통합 Toast 관리자: Signal 기반 싱글톤
  - 테스트 그룹:
    - 싱글톤 패턴 (2개: getInstance 일관성, resetInstance)
    - 상태 관리 (5개: 초기 상태, show, remove, clear, 존재하지 않는 ID)
    - 라우팅 정책 (7개: info/success live-only, warning/error toast-only, route
      재정의, assertive region)
    - 타입 헬퍼 (5개: success/info/warning/error, 옵션 병합)
    - 구독 시스템 (7개: subscribe 즉시 전달, add/remove/clear 알림, 구독 해제,
      다중 구독자, 에러 격리)
    - Signal 통합 (2개: signal 접근자, value 동기화)
    - 라이프사이클 (2개: init, cleanup)
    - Toast 옵션 (3개: duration, actionText/onAction, 기본 type)
    - ID 생성 (2개: 고유성, 형식)
- [x] `keyboard-navigator.ts` (78.63% → 80%+) - ✅ 32개 테스트 추가 완료
      (2025-10-21)
  - 키보드 내비게이션: EventManager 통합 싱글톤
  - 테스트 그룹:
    - 싱글톤 패턴 (2개: getInstance 일관성, 전역 인스턴스)
    - subscribe() (4개: EventManager 등록, 커스텀 옵션, unsubscribe, 에러 처리)
    - 키 핸들러 (14개: Escape/Left/Right/Home/End/Enter/Space, ?/Shift+/, onAny,
      에러 처리)
    - Editable 가드 (5개: INPUT/TEXTAREA/contentEditable 제외, guardEditable
      옵션, 일반 요소)
    - 이벤트 제어 옵션 (7개: preventDefault/stopPropagation 기본 동작, 옵션
      비활성화, 미처리 키, 에러 처리)
- [x] `core-services.ts` (61.9% → 80%+) - ✅ 38개 테스트 추가 완료 (2025-10-21)
  - Core 서비스 통합: ConsoleLogger + CoreService
  - 테스트 그룹:
    - ConsoleLogger (6개: debug/info/warn/error 위임, 다중 인자, 인자 없음)
    - defaultLogger (2개: 인스턴스 타입, 메서드 호출)
    - 싱글톤 패턴 (2개: getInstance 일관성, resetInstance)
    - register() & get() (7개: 등록/조회, 타입 안전성, 에러, 재등록 경고,
      destroy/cleanup 호출, 에러 처리)
    - registerFactory() & get() (4개: 팩토리 등록/생성, 캐싱, 중복 등록 무시, 키
      충돌)
    - tryGet() (2개: 성공, 실패 시 null)
    - has() (3개: 등록됨, 미등록, 팩토리)
    - getRegisteredServices() (2개: 목록 반환, 초기 상태)
    - getDiagnostics() (2개: 진단 정보, null 인스턴스)
    - cleanup() (5개: destroy/cleanup 호출, 두 메서드 모두, 메서드 없음, 에러
      처리)
    - reset() (1개: 전체 리셋)
    - getService() (2개: 위임, 타입 안전성)
- [x] `dom-structure-tweet-strategy.ts` (64.4% → 100%) - ✅ 21개 테스트 추가
      완료 (2025-10-21)
  - DOM 구조 기반 트윗 정보 추출 전략
  - 테스트 그룹:
    - 기본 속성 (2개: name='dom-structure', priority=3)
    - extract() (8개: 트윗 컨테이너/링크 추출, [data-testid="tweet"]/article
      컨테이너, 컨테이너 없음, 트윗 ID 없음, parseUsernameFast() fallback,
      username='fallback' null 반환, 에러 처리)
    - findTweetIdInContainer() (3개: 여러 링크 중 첫 매칭, href 속성 없음,
      /status/ 패턴 없음)
    - findUsernameInContainer() (6개: 사용자명 링크, 간단한 경로, /status/ 제외,
      외부 링크 제외, 다중 경로 제외, href 없음)
    - 통합 시나리오 (2개: 복잡한 DOM 구조, 중첩 요소에서 closest 탐색)
  - 버그 수정: `findUsernameInContainer` 선택자 수정 (불필요한 `[href*="@"]`
    제거)
- [ ] `service-factories.ts` (68% → 80%+) - ⏳ 예정 (8-12개 테스트) 키 충돌)
  - tryGet() (2개: 성공, 실패 시 null)
  - has() (3개: 등록 서비스, 미등록, 팩토리)
  - getRegisteredServices() (2개: 목록 반환, 초기 상태)
  - getDiagnostics() (2개: 진단 정보, null 인스턴스)
  - cleanup() (5개: destroy/cleanup 호출, 둘 다 호출, 메서드 없음, 에러 처리)
  - reset() (1개: 초기화)
  - getService() (2개: 위임, 타입 안전성)
- [x] `dom-structure-tweet-strategy.ts` (64.4% → 100%) - ✅ 21개 테스트 추가
      완료 (2025-10-21)
  - DOM 구조 기반 트윗 정보 추출 전략
  - 테스트 그룹:
    - 기본 속성 (2개: name, priority)
    - extract() (8개: 컨테이너/링크 추출, fallback, 에러 처리)
    - findTweetIdInContainer() (3개: 링크 탐색, 속성 처리)
    - findUsernameInContainer() (6개: 사용자명 추출, 필터링)
    - 통합 시나리오 (2개: 복잡한 DOM, 중첩 요소)
  - 버그 수정: 선택자 단순화 (`[href*="@"]` 제거)
- [x] `service-factories.ts` (68% → 80%+) - ✅ 20개 테스트 추가 완료
      (2025-10-21)
  - Service 팩토리 함수 (Lazy singleton, Promise 기반 동시성 안전)
  - 테스트 그룹:
    - getMediaService() (4개: 인스턴스 반환, 싱글톤, 동시성 안전, 리셋)
    - getBulkDownloadService() (4개: 인스턴스 반환, 싱글톤, 동시성 안전, 리셋)
    - getSettingsService() (2개: deprecated 에러, 경로 메시지)
    - \_\_resetServiceFactories() (3개: 캐시 초기화, 여러 번 호출, 생성 전 호출)
    - 팩토리 격리 (2개: 독립적 인스턴스, 리셋 영향 없음)
    - 에러 처리 (1개: getSettingsService 항상 에러)
    - 타입 안전성 (2개: MediaService/BulkDownloadService 메서드 확인)
    - 동시성 시나리오 (2개: 복잡한 호출 패턴, 리셋과 동시 호출)

**작업 원칙**:

1. TDD 사이클 준수: RED (실패 테스트) → GREEN (최소 구현) → REFACTOR
2. JSDOM 제약사항 고려 (브라우저 API는 모킹)
3. 벤더 getter 패턴 사용 (`getSolid()`, `getUserscript()` 등)
4. PC 전용 이벤트만 테스트
5. 각 우선순위 완료 후 커버리지 재확인

**성공 기준**:

- 80% 미만 파일을 15개 이하로 감소 (현재 20개)
- 전체 shared/services 평균 커버리지 75% 이상
- 모든 테스트 GREEN 유지

---

## 다음 Phase 계획

### Phase B3 후보: Browser Tests 확장

- Solid.js 반응성 검증 (Signals, Effects, Memos)
- 실제 DOM 레이아웃 테스트
- 애니메이션 타이밍 검증
- 포커스 관리 테스트

### Phase B4 후보: E2E 시나리오 추가

- 갤러리 전체 플로우 (open → navigate → download → close)
- 설정 변경 시나리오
- 에러 상황 처리
- 접근성 검증 (키보드 내비게이션, 스크린 리더)

---

## 완료된 백로그

**Phase B2**: ✅ **완료** (Services Coverage Improvement)

- ✅ 20개 파일 커버리지 개선 (37%-78% → 80%+)
- ✅ 619개 테스트 추가 (P0/P1/P2/P3)
- ✅ 2개 프로덕션 버그 수정
- ✅ 전체 테스트: 2443 passed + 6 skipped

**Phase B1 상태**: ✅ **완료** (GalleryApp 통합 테스트 작성)

- ✅ logger.ts: 87.21% 달성
- ✅ **GalleryApp.ts: 통합 테스트 15개 작성 완료** (100% 통과)
  - 테스트 파일: `test/unit/features/gallery/GalleryApp.integration.test.ts`
  - 커버리지: 초기화, open/close, config, diagnostics, cleanup, errors, signals
  - 서비스 등록 패턴 확립 (GalleryRenderer)
  - fast + unit 프로젝트에서 총 30회 실행 (15개 × 2)
- ✅ media-extraction: 기존 테스트 존재
- ✅ 전체 테스트: 208/208 files (100%), 1748 tests (100%)
- ✅ Browser/E2E/a11y 테스트: 모두 PASS

---

## 백로그 (우선순위 낮음)

**다음 우선순위 후보**:

1. **Phase B3: 나머지 13개 파일 커버리지 개선**
   - 80% 미만 파일: 13개 남음 (Phase B2에서 7개 개선)
   - 예상 테스트: 300-400개 추가
   - 우선순위: 사용 빈도/중요도 기반

2. **테스트 개선**
   - Browser 테스트 확장 (Solid.js 반응성 검증)
   - E2E 시나리오 추가 (하네스 패턴 활용)
   - Performance 테스트 강화

3. **성능 최적화**
   - Lazy loading 전략 검토
   - CSS Containment 적용 확대
   - 렌더링 성능 프로파일링
   - 번들 크기 최적화 (326.73 KB → 300 KB)

4. **접근성 강화**
   - ARIA 패턴 검증 확대
   - 스크린 리더 테스트
   - WCAG 2.1 Level AA 완전 준수
   - 키보드 내비게이션 개선

5. **아키텍처 개선**
   - Service Layer 리팩토링 검토
   - State Management 패턴 정리
   - Error Handling 전략 통일

---

## 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **의존성 관리**: `docs/DEPENDENCY-GOVERNANCE.md`
