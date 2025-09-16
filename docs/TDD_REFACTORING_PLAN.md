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

- 현재 활성 작업 없음 — 모든 계획 항목은 완료 로그로 이관되었습니다. 신규 과제가
  생기면 이 섹션에 활성 항목만 간결히 추가합니다.

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
