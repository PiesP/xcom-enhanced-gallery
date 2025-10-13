# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: feature/phase-33-step-2-events
>
> **상태**: 테스트 수정 완료, Phase 33 Step 3 준비 ✅

## 프로젝트 상태

- **빌드**: dev 726.60 KB / prod 318.04 KB ✅
- **테스트**: 652/677 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (269 modules, 736 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-33 Step 2C 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙
- `docs/bundle-analysis.html`: JavaScript 번들 분석 리포트

---

## 활성 작업

### Phase 33 Step 3: 코드 리팩토링 - 중복 로직 제거

**상태**: **진행 중** �

**목표**:

1. 중복된 유틸리티 함수 통합 (번들 크기 절감: 예상 5-10 KB)
2. 사용하지 않는 export 제거
3. 코드 구조 개선 및 가독성 향상

#### 발견된 중복 코드

**1. Style Utilities 중복** ⚠️

다음 함수들이 3개 파일에 중복 정의됨:

- `combineClasses`: `style-utils.ts`, `css-utilities.ts`, `core-utils.ts`
- `toggleClass`: `style-utils.ts`, `css-utilities.ts`
- `updateComponentState`: `style-utils.ts`, `css-utilities.ts` (시그니처 다름)

**영향 분석**:

- `style-utils.ts` (46줄) - 이미 css-utilities를 re-export
- `css-utilities.ts` (65줄) - 독립적인 구현
- `core-utils.ts` (343줄) - combineClasses만 포함

**최적화 전략**:

1. **단일 소스 원칙** - `css-utilities.ts`를 정규 구현으로 선택
2. **점진적 마이그레이션** - 모든 import를 css-utilities로 변경
3. **레거시 제거** - style-utils.ts와 core-utils.ts에서 중복 제거

#### 리팩토링 계획 (TDD)

##### Step 1: RED - 중복 감지 테스트 작성 ✅

```typescript
// test/unit/refactoring/duplicate-utilities.test.ts
describe('Duplicate Utilities Detection', () => {
  it('should have only one combineClasses implementation', () => {
    // 파일 검색으로 중복 확인
  });
});
```

##### Step 2: GREEN - 통합 및 마이그레이션

1. `css-utilities.ts`를 canonical source로 지정
2. 모든 import 경로를 `css-utilities`로 변경
3. `style-utils.ts`에서 중복 함수 제거 (re-export만 유지)
4. `core-utils.ts`에서 `combineClasses` 제거

##### Step 3: REFACTOR - 정리 및 검증

1. 사용하지 않는 import 제거
2. 타입 체크 및 테스트 통과 확인
3. 번들 크기 측정 및 비교

#### 예상 효과

- **소스 코드 절감**: ~50-100 lines
- **번들 크기 절감**: ~2-5 KB (중복 제거 + tree-shaking)

---

## 런타임 검증 필요

- [ ] x.com 환경에서 갤러리 열기
- [ ] 하이 콘트라스트 모드 자동 감지 확인
- [ ] 툴바 인터랙션 정상 작동 확인
- [ ] E2E 스모크 테스트 (8/8)

---

## 작업 시작 체크리스트

새로운 Phase 시작 시:

1. 현재 상태 확인: `npm run validate && npm test`
2. 관련 문서 검토 (`AGENTS.md`, `CODING_GUIDELINES.md`, `ARCHITECTURE.md`)
3. 작업 브랜치 생성: `git checkout -b feature/phase-xx-...`
4. `TDD_REFACTORING_PLAN.md`에 계획 작성
5. TDD 흐름 준수: RED → GREEN → REFACTOR
6. 빌드 검증: `Clear-Host && npm run build`
7. 문서 업데이트 (완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이동)
8. 유지보수 점검: `npm run maintenance:check`

---

**다음 작업**: Phase 33 Step 3 - 번들 분석 및 최적화 전략 수립
