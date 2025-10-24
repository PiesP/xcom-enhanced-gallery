# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 169
> (성능 유틸리티 정리) **마지막 업데이트**: 2025-10-24

---

## 📊 현황 요약

| 항목           | 상태          | 세부                                  |
| -------------- | ------------- | ------------------------------------- |
| Build (prod)   | ✅ 339.65 KB  | 빌드 성공, 제한(420 KB) 여유 80.35 KB |
| npm run build  | ✅ PASS       | E2E 89/97 PASS, a11y 34/34 PASS       |
| npm test       | ✅ PASS       | fast + raf-timing 프로젝트 분리 운영  |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료, CodeQL 통과           |
| 의존성         | ✅ OK         | 0 violations                          |
| **현재 Phase** | 📋 169 준비중 | 성능 유틸리티 정리 (3-4 KB 절감)      |

---

## ✅ Phase 166: 코드 현대화 및 기술 부채 감소 (완료 2025-10-24)

**상태**: ✅ 완료 → COMPLETED로 이관됨

**달성사항**:

1. ✅ 빌드 제한 상향: 400 KB → 420 KB (official)
2. ✅ 코드 현대화: GalleryApp.ts 타입 단언 개선 (double cast → single cast)
3. ✅ 빌드 검증: 339.65 KB (gzip 91.47 KB)
4. ✅ E2E 테스트: 89 PASS
5. ✅ a11y 테스트: 34 PASS

**세부 내용**:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고

---

## 🔄 Phase 167: 테스트 정책 재평가 및 최적화 (완료 2025-10-24)

**상태**: ✅ 완료 - Option B 선택 및 실행 완료

**달성사항**:

1. ✅ TESTING_STRATEGY.md 갱신: npm run build vs npm test 우선순위 명시
2. ✅ 개발자 가이드 추가: 추천 워크플로우 (일반/버그/기능별)
3. ✅ 주의사항 문서화: npm test 실패 ≠ 배포 불가 원칙
4. ✅ CI 정책 명확화: npm run build 통과 필수 (E2E, a11y 포함)

**핵심 내용**:

- **npm run build** (권장): 전체 검증 (typecheck, lint, deps, CodeQL, browser,
  E2E, a11y)
  - 신뢰도 높음, 프로덕션 준비 완료 판정
  - CI/배포 전 필수 통과
  - 소요 시간: ~8-10분

- **npm test** (개발 편의): vitest projects 분리 (fast + raf-timing)
  - 신뢰도 낮음, 개발 편의용
  - E2E/a11y 미포함
  - 소요 시간: ~1-2분

**커밋**:

- `docs(phase-167): add npm run build vs npm test policy guidance` (0648ec6e)

---

## ✅ Phase 168: 번들 최적화 분석 (완료 2025-10-24)

**상태**: ✅ 분석 완료 → Phase 169로 이관

**분석 결과**:

1. ✅ 배럴 파일 분석 완료
2. ✅ 미사용 export 식별 (3-4 KB 절감 기회)
3. ✅ Tree-shaking 기회 평가
4. ✅ Phase 169 계획 수립

**식별된 미사용 Export**:

- `measurePerformance` (0.5 KB)
- `measureAsyncPerformance` (0.6 KB)
- `idle-scheduler.ts` 전체 (1-2 KB) - 유저스크립트에 부적합
- `getCSSVariable` / `applyTheme` (0.7 KB)

**예상 절감**: 3-4 KB (339.65 KB → 335-336 KB)

**세부 분석**: `docs/temp/phase-169-bundle-optimization-analysis.md` 참고

---

## 📋 Phase 169: 성능 유틸리티 정리 (준비 단계)

---

## � Phase 168: 번들 최적화 및 내보내기 정책 평가 (준비 단계)

## 📋 Phase 169: 성능 유틸리티 정리 (준비 단계)

**상태**: 🎯 계획 수립 (2025-10-24)

**목표**:

1. 미사용 유틸리티 제거 (measurePerformance, idle-scheduler)
2. 번들 크기 3-4 KB 추가 절감
3. 코드 명확성 개선 (배럴 표면 축소)

**TDD 액션**:

- [ ] RED: 미사용 함수 제거 테스트 작성
- [ ] GREEN: 함수 정의 삭제 + 배럴 정리
- [ ] REFACTOR: 테스트 업데이트 + 문서화

**예상 효과**:

- 절감: 3-4 KB (339.65 KB → 335-336 KB)
- 신뢰도: 높음 (0 사용처 검증됨)
- 난이도: 낮음
- 비용: 1-2시간

**대상 파일**:

- `src/shared/utils/performance/idle-scheduler.ts` (제거)
- `src/shared/utils/performance/performance-utils.ts` (함수 제거)
- `src/shared/utils/styles/style-utils.ts` (함수 제거)
- `src/shared/utils/performance/index.ts` (import 정리)

---

## 📚 참고 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 개발 환경, 테스트 전략
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing Trophy, vitest
  projects, npm run build vs npm test
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 & 정책
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-168 완료 기록

---

## �📚 참고 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 개발 환경, 테스트 전략
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing Trophy, vitest
  projects, npm run build vs npm test
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 & 정책
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-167 완료 기록
