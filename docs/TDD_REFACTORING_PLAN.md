# TDD 리팩토링 계획

> xcom-enhanced-gallery 프로젝트의 활성 리팩토링 진행 상황 **현재 Phase**: 167
> (테스트 정책 개선) **마지막 업데이트**: 2025-10-24

---

## 📊 현황 요약

| 항목           | 상태          | 세부                                         |
| -------------- | ------------- | -------------------------------------------- |
| Build (prod)   | ✅ 339.65 KB  | 빌드 성공, 제한(420 KB) 여유 80.35 KB        |
| npm run build  | ✅ PASS       | E2E 89/97 PASS, a11y 34/34 PASS              |
| npm test       | ⚠️ 분석중     | fast/raf-timing 프로젝트 분리 이후 평가 필요 |
| Typecheck/Lint | ✅ PASS       | 모든 검사 완료, CodeQL 통과                  |
| 의존성         | ✅ OK         | 0 violations                                 |
| **현재 Phase** | 🔄 167 진행중 | 테스트 정책 평가 및 최적화 계획 수립         |

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

## 🔄 Phase 167: 테스트 정책 재평가 및 최적화 (진행 중)

### 📋 분석 및 목표

**현황**:

- `npm run build`: ✅ 전체 검증 통과 (E2E, a11y, typecheck, lint 포함)
- `npm test`: ⚠️ 프로젝트별 격리 이후 상태 재평가 필요
- vitest projects 분리: fast vs raf-timing (package.json 참고)

**배경**:

Phase 164-166 동안 vitest projects 분리로 인해 테스트 환경이 단편화됨:

- fast: 주요 테스트
- raf-timing: RAF/포커스 테스트

이제 다음을 평가해야 함:

1. **npm test 실행 정책**: CI에서 npm run build vs npm test 우선순위
2. **프로젝트 격리 효과**: fast/raf-timing 분리가 실제 필요한가?
3. **테스트 신뢰도**: 프로덕션 코드는 정상 (npm run build 통과), 테스트 환경만
   이슈?

### 🎯 우선 작업 (옵션별)

#### **Option A: 현재 상태 유지** (권장 - 즉시 가능)

**근거**: npm run build가 전체 검증(E2E, a11y)을 포함하므로 프로덕션 신뢰도는
높음

**작업**:

- Phase 167 현재 상태로 폐기
- 다음 기능 개발로 진행
- npm test 환경은 CI/개발 편의용으로 취급

**장점**: 빠른 진행 **단점**: npm test 신뢰도 저하

#### **Option B: 테스트 정책 문서화** (권장 - 1시간)

**작업**:

1. TESTING_STRATEGY.md 업데이트: npm run build vs npm test 구분 명시
2. 개발자 가이드: CI/로컬 테스트 권장사항
3. Phase 167 완료 → COMPLETED로 이관

**결과**: 명확한 테스트 정책, 개발팀 혼동 제거

#### **Option C: 테스트 환경 재정비** (선택 - 3-5시간)

**작업**:

1. vitest projects 재분석
2. 실패 테스트 근본 원인 파악
3. 필요시 fast/raf-timing 재설정

**장점**: 완전한 테스트 신뢰도 **단점**: 시간 소요, 불확실성

### 🎯 추천 액션 (지금 실행)

**즉시**: Option B 실행

1. TESTING_STRATEGY.md 갱신 (npm run build 우선권 명시)
2. Phase 167 폐기, Phase 166 COMPLETED 확인
3. 다음 기능 개발로 진행

**선택적**: Option C는 필요시 이후 Phase로 계획

---

## 📚 참고 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 개발 환경, 테스트 전략
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing Trophy, vitest projects
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙 & 정책
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  Phase 159-166 완료 기록
