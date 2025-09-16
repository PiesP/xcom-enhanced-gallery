# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 0) 현재 상태 점검 요약

- 품질 게이트: typecheck, lint, smoke/fast 테스트 GREEN. dev/prod 빌드 및
  postbuild validator 정상 동작 중.
- Vendors: 정적 매니저(`StaticVendorManager`) 경유 정책 준수. 테스트 모드 자동
  초기화 경고는 다운그레이드되어 소음 없음(완료 항목으로 이관됨).
- 레거시 표면: 동적 VendorManager(`vendor-manager.ts`)는 TEST-ONLY 유지. 갤러리
  런타임 `createAppContainer.ts` 스텁은 삭제 완료(테스트 하네스 전용 경로만
  사용).

---

## 남은 작업(우선순위 및 순서)

> 경량화 목표: UX/기능 동등성 유지. 코드/스타일 중복 제거와 레거시 표면을
> 정리하고, 실행 경로를 단순화한다. Userscript 특성상 단일 번들이지만, “불필요한
> 코드 제거”와 “지연 실행(조건부 로딩)”, “디버그 제거”로 실측 크기·초기화 비용을
> 낮춘다.

### Phase 1 — 갤러리 셀렉터 단일화와 가드 테스트 추가 (TDD)

- 배경: 현재 `.xeg-gallery-container`, `#xeg-gallery-root`,
  `[data-xeg-gallery-container]`, `.gallery-container` 등 다수의 셀렉터 조합이
  공존합니다(`constants.ts`, `shared/utils/(utils|core-utils|scroll-utils).ts`,
  `assets/styles/utilities/accessibility.css`). Shadow DOM 기반
  `GalleryContainer`와 격리 스타일(`shared/styles/isolated-gallery.css`)이
  존재하므로 런타임 판단 분기를 최소화합니다.
- 작업:
  - 테스트 추가: `test/behavioral/gallery-selectors.test.ts`
    - isGalleryInternalElement/isGalleryContainer/canTriggerGallery가 Shadow DOM
      루트와 `.xeg-gallery-container`에서 일관 동작함을 보장
    - `#xeg-gallery-root` 직접 참조가 없어도 동작 유지(호환 레이어는 tests-only)
  - 구현: `shared/utils/utils.ts`와 `shared/utils/core-utils.ts`의 중복
    함수/상수 통합
    - 단일 소스: `constants.SELECTORS.GALLERY_CONTAINER` 및 소수의 호환 키만
      허용
    - 런타임 경로에서 `#xeg-gallery-root` 직참조 제거(필요 시 내부 호환 배열로만
      관리)
  - 스타일: `assets/styles/utilities/accessibility.css`의
    `.xeg-gallery-container` 규칙이 `isolated-gallery.css`와 중복이면
    제거/통합(토큰 유지)
- 수용 기준:
  - src/\*\*에서 `#xeg-gallery-root` 직접 참조 0(테스트/문서 제외)
  - 새 테스트 GREEN, 기존 갤러리 열기/닫기/네비 동작 무변
  - 스타일 회귀 없음(contrast/토큰 테스트 GREEN)
- 이득: 중복 경로 제거로 번들 크기 및 분기 비용 감소, 유지보수성 향상

### Phase 2 — 로깅/디버그 코드의 프로덕션 제거(Tree-shaking 강제)

- 배경: dev 레벨 로그/디버그 util이 프로덕션 번들에 잔존할 수 있음
- 작업:
  - 테스트 추가: `test/smoke/logging-tree-shake.test.ts`
    - prod 빌드 산출물에서 `logger.debug(`, `ServiceDiagnostics` 문자열 0 보장
  - 구현: vite 정의값(define) 또는 환경 플래그로 디버그 분기 제거
    - logger에서 `if (__DEV__)`/레벨 가드로 debug/info 제거 가능하도록 분리
    - dev 전용 글로벌 attach/키리스너는 dev 환경에서만 import/실행
- 수용 기준: prod 번들 문자열 가드 PASS, 기능 회귀 없음
- 이득: 수 kB~ 수십 kB 감축(소스 비중에 따라 다름), 런타임 오버헤드 감소

### Phase 3 — 비핵심 서비스 지연 실행(조건부 import) 및 경량화

- 배경: 단일 번들이지만, 즉시 실행 비용을 낮추면 초기 체감속도가 개선됨
- 작업:
  - 다운로드/ZIP/설정/진단 관련 서비스는 이벤트 시점까지 import/초기화를 지연
    - 예: BulkDownloadService/zip creator/ServiceDiagnostics/Settings 로딩 지연
  - main.ts의 initializeNonCriticalSystems/initializeToastContainer 경계 검토 →
    불필요 선행 초기화 제거
  - 테스트 추가: `test/performance/startup-latency.test.ts`
    - 갤러리 미개시 상태의 초기 작업(타이머/리스너 수) 상한 가드
- 수용 기준: 갤러리 미사용 시 초기 타이머/리스너 수 감소, 기능 회귀 없음
- 이득: 초기화 비용/메모리 풋프린트 감소

> 참고: Phase 1–3만 활성 유지. Phase 4–6은 완료
> 로그(TDD_REFACTORING_PLAN_COMPLETED.md)에 기록됨.

<!-- Phase 4–6은 기존 가드/수정으로 충족되어 완료 로그로 이관되었습니다. 활성 계획에서는 제거합니다. -->

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

## 품질 게이트 (작업 중 반복 확인)

## 참고/정책 고지

---

## 부록 — SOURCE PATH RENAME / CLEANUP PLAN (정리됨)

> 목적: 레거시/혼동 가능 경로를 식별하고, 안전한 단계별 리네임/정리를 통해

- 근거/제약: 3계층 단방향(Features → Shared → External), vendors/userscript
  getter 규칙, PC-only, CSS Tokens, 테스트 우선(TDD)

### 스코프(1차)

- (해결) B/C/F 항목은 TEST-ONLY/LEGACY 표면 유지 정책으로 확정되었습니다. 활성
  계획에서는 제외되었으며, 완료 로그에서 가드/수용 기준과 함께 추적합니다.

### 후보와 제안

- 해당 없음(완료 로그 참조). 필요 시 후속 스캔/가드 강화만 수행.

### 단계별 실행 순서(요약 현행화)

- 현재 없음 — 신규 관찰 대상이 생기면 추가.

### 리스크/롤백

- 리스크: 테스트 경로 의존(특히 vendor-manager.ts) 및 스캔 규칙 민감도
- 롤백: re-export 유지, 배럴 되돌림, 문서/테스트만 수정으로 복구 가능

### 수용 기준(전역)

- deps-cruiser 순환/금지 위반 0
- src/\*\*에서 TEST-ONLY/LEGACY 대상의 런타임 import 0
- 번들 문자열 가드 PASS(VendorManager 등 금지 키워드 0)
- 전체 테스트/빌드/포스트빌드 GREEN
