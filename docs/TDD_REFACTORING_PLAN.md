# TDD 리팩토링 활성 계획 (2025-10-07 갱신)

> **현재 상태**: 모든 계획된 리팩토링 작업이 완료되었습니다. 새로운 리팩토링
> 요구 사항이 발견될 때까지 이 문서는 최신 상태를 유지합니다.

---

## 프로젝트 현황 (2025-10-07 기준)

### 코드 품질 현황

- ✅ **빌드**: dev/prod 빌드 정상 동작, postbuild validator 통과
- ✅ **테스트**: 전체 테스트 스위트 GREEN (124 파일 / 584 테스트)
- ✅ **타입**: TypeScript strict 모드 100% 적용
- ✅ **린트**: ESLint 규칙 위반 0건
- ✅ **의존성**: dependency-cruiser 순환 의존성 위반 0건

### 아키텍처 정책 준수 현황

- ✅ **3계층 구조**: Features → Shared → External 단방향 의존성 유지
- ✅ **Vendors 접근**: `StaticVendorManager` 경유 getter 패턴 100% 적용
- ✅ **Userscript API**: `getUserscript()` adapter를 통한 안전한 GM\_\* 접근
- ✅ **입력 정책**: PC 전용 이벤트만 사용 (터치/포인터 이벤트 금지)
- ✅ **스타일 정책**: CSS Modules + 디자인 토큰만 사용 (하드코딩 금지)

### 최근 완료된 주요 작업

1. **Shadow DOM → Light DOM 전환** (2025-10-07 완료)
   - CSS Cascade Layers로 스타일 격리 달성
   - GalleryContainer 코드 33% 축소
   - 테스트: `test/refactoring/light-dom-transition.test.ts`
2. **fflate 의존성 제거** (2025-10-07 완료)
   - StoreZipWriter 구현으로 대체
   - 번들 크기 최적화

_완료된 모든 작업의 상세 내역은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를
참조하세요._

---

## 활성 작업 (현재 없음)

현재 진행 중인 리팩토링 작업이 없습니다. 새로운 요구 사항이나 개선 기회가
발견되면 이 섹션에 추가됩니다.

---

## 품질 게이트 (모든 작업 시 필수)

변경 전:

- [ ] `npm run typecheck` — 타입 오류 0건
- [ ] `npm run lint` — 린트 오류 0건
- [ ] `npm test` — 모든 테스트 통과

변경 후:

- [ ] `npm run build` — dev/prod 빌드 성공
- [ ] `node scripts/validate-build.js` — 번들 검증 통과
- [ ] `npm run deps:check` — 의존성 규칙 위반 0건

---

## 리팩토링 원칙 (참고)

1. **TDD 우선**: 실패 테스트 → 최소 구현 → 리팩토링
2. **최소 diff**: 변경 범위를 최소화하여 리뷰 가능하게 유지
3. **단계별 진행**: 큰 작업은 여러 단계로 분할하여 검증
4. **문서화**: 완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`에 이관

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` — 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` — 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` — 의존성 규칙, CI 강제
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` — 완료된 작업 이력
- **실행 가이드**: `AGENTS.md` — 개발 환경, 스크립트, 워크플로
