# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 **상태**: Phase 69 완료, 다음 Phase 대기 ✅

## 프로젝트 스냅샷

- **빌드**: dev 733.96 KB / prod **317.30 KB** ✅ (번들 예산 7.70 KB 여유)
- **테스트**: **775 passing**, 9 skipped (Phase 69 debounce 타이밍 조정 필요) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **712 dependencies**) ✅
- **번들 예산**: **317.30 KB / 325 KB** (2.4% 여유) ✅

## 디자인 토큰 현황 (2025-10-15)

- **총 토큰**: 89개 (Phase 67 완료, 27.6% 감소)
- **중복 정의**: 20개 (cross-scope override, 정책 준수)
- **미사용 토큰**: 0개 ✅
- **저사용 토큰**: 53개 (컴포넌트 응집·접근성 사유 유지)

---

## 활성 계획

_Phase 69 완료됨. 다음 Phase는 백로그 또는 별도 기획 필요._

---

## 백로그 (모니터링)

1. **번들 크기 경계**: prod 번들이 322 KB(예산 99%) 접근 시 Phase 67 Step 4-5
   재개
2. **StaticVendorManager 자동 초기화 경고**: Phase 70에서 bootstrap 순서 개선
   예정
3. **순환 네비 UX 개선**: 경계 경고 로그 재분석 필요 시 Phase 71 후보
4. **Phase 69 skipped tests 리팩토링**: 8개 테스트의 debounce 타이밍 조정 필요
   (별도 PR 예정)
   - `use-gallery-focus-tracker-events.test.ts` (3 tests)
   - `use-gallery-focus-tracker-global-sync.test.ts` (4 tests)
   - `use-gallery-focus-tracker-deduplication.test.ts` (1 test)

---

## 설계 원칙 (요약)

1. 유지보수성 우선 — 번들 크기보다 디자인 일관성
2. 컴포넌트 응집도 — 1회 사용 토큰도 컴포넌트 책임이면 유지
3. 과도 추상화 지양 — 재사용 없는 추상화 제거
4. 접근성 우선 — WCAG 기준 준수 토큰/행동 유지
5. TDD 기본 — RED → GREEN → REFACTOR 순서 준수
6. ROI 검토 — 시간 대비 가치 평가 후 진행

---

## 참고 문서

- `AGENTS.md`: 개발 워크플로, 스크립트 규칙
- `docs/ARCHITECTURE.md`: 3계층 구조와 의존성 경계
- `docs/CODING_GUIDELINES.md`: 디자인 토큰·PC 이벤트·Vendor getter 규칙
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료 Phase 상세 기록
- `docs/MAINTENANCE.md`: 유지보수 점검 절차
- `docs/TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 아카이브
