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

1. B/C/F — TEST-ONLY/LEGACY 표면 유지: prod 경로에서의 참조 0 유지(스캔/번들
   문자열 가드 지속) — 필요 시 주석/문서 보강만.

롤백 전략: 각 단계는 독립 PR로 최소 diff 수행. 스캔/가드 테스트 GREEN 전제에서
진행하며, 실패 시 해당 커밋만 리버트 가능.

## 품질 게이트 (작업 중 반복 확인)

## 참고/정책 고지

---

## 부록 — SOURCE PATH RENAME / CLEANUP PLAN

> 목적: 레거시/혼동 가능 경로를 식별하고, 안전한 단계별 리네임/정리를 통해

- 근거/제약: 3계층 단방향(Features → Shared → External), vendors/userscript
  getter 규칙, PC-only, CSS Tokens, 테스트 우선(TDD)

### 스코프(1차)

- B. Vendor Legacy Manager(TEST-ONLY):
  `src/shared/external/vendors/vendor-manager.ts` (@deprecated, 테스트 전용)
- C. Deprecated Config: `src/shared/components/ui/Toolbar/toolbarConfig.ts`
- F. Zip Legacy Helper: `src/shared/external/zip/zip-creator.ts`의 @deprecated
  API

### 후보와 제안

2. B(legacy vendor-manager.ts)

- 현상: 테스트 전용. 일부 테스트가 정확한 경로 문자열을 참조.
- 제안: 파일명 변경 금지(테스트 의존). 유지하되 주석/README로 TEST-ONLY 강조.
- 가드/수용 기준: prod 번들에 "VendorManager" 문자열 0, src/\*\*에서 import
  0(기존 테스트/validator PASS)

3. C(toolbarConfig.ts @deprecated)

- 현상: 테스트 호환 전용 구성. 런타임 사용 금지 주석 존재.
- 제안: 유지. 후속: tests 전용 경로로 이관 시, 배럴 재노출로 단계적 전환.
- 가드/수용 기준: src/\*\* 런타임 사용 0, 제거 시 관련 테스트를 tests util로
  치환

6. F(zip-creator @deprecated high-level helper)

- 현상: prod 소스에서 사용 금지 가드 존재. 유지
- 제안: 향후 완전 제거 전, tests 전용 파일로 분리하거나 이름에 `.legacy` 접미사
- 가드/수용 기준: src/\*\* 사용 0 유지, 제거 시 테스트 리팩토링 동반

### 단계별 실행 순서(요약 현행화)

- 관찰 지속 — B/C/F TEST-ONLY/LEGACY 표면 유지(런타임 참조 0, 번들/스캔 가드
  PASS)

### 리스크/롤백

- 리스크: 테스트 경로 의존(특히 vendor-manager.ts) 및 스캔 규칙 민감도
- 롤백: re-export 유지, 배럴 되돌림, 문서/테스트만 수정으로 복구 가능

### 수용 기준(전역)

- deps-cruiser 순환/금지 위반 0
- src/\*\*에서 TEST-ONLY/LEGACY 대상의 런타임 import 0
- 번들 문자열 가드 PASS(VendorManager 등 금지 키워드 0)
- 전체 테스트/빌드/포스트빌드 GREEN
