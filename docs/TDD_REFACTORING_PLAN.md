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

메모(준비):

- 초기 후보(Non-Critical): ThemeService 초기화 지연, BulkDownloadService
  컨테이너 등록 시점 지연(기능 트리거 시), FilenameService 지연
- main.ts 경계: initializeNonCriticalSystems 안에서의 warmupNonCriticalServices
  호출 제거/조정 검토(테스트 방해 없는 범위에서)
- 테스트(RED): startup 시 import/eval 스캔으로
  BulkDownload/ZIP/Settings/Diagnostics 모듈의 즉시 평가 방지 확인

> 참고: 현재 활성 과제는 Phase 3만 남아 있습니다. Phase 4–6은 완료
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
