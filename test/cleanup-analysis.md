# 테스트 파일 정리 분석 보고서

## 현재 상황 분석

### 1. 실패한 테스트 (3개)
- `test/unit/shared/external/libraries-integration.test.ts`: TanStack Query/Virtual 통합 오류
- `test/unit/shared/external/vendors/motion-integration.test.ts`: Motion One inView 함수 테스트 오류

### 2. 중복 파일 그룹 식별

#### A. Browser Utils 관련 (4개 파일)
- `test/unit/shared/browser/browser-utils.test.ts`
- `test/unit/shared/browser/utils/browser-utils.test.ts`
- `test/shared/utils/browser-utils.test.ts`
- `test/infrastructure/browser/browser-manager.test.ts`

#### B. Media URL 관련 (3개 파일)
- `test/unit/shared/utils/media/media-url.test.ts`
- `test/shared/utils/media/media-url.util.test.ts`
- `test/utils/media-url-utils.test.ts`

#### C. Performance 관련 (2개 통합 파일)
- `test/optimization/optimization.consolidated.test.ts`
- `test/performance/performance.consolidated.test.ts`

#### D. 단계별 파일들 (Phase 파일들)
- `phase1/` ~ `phase4/`: 리팩토링 완료된 단계
- `phase-g/`: 주별 최적화 (week1-4)
- `refactoring/`: 6개 단계별 파일

### 3. 네이밍 일관성 문제
- "unified", "simplified", "optimized", "new", "old" 등의 수식어 발견
- 컴포넌트명에 불필요한 접두사 존재
- 테스트 파일명의 일관성 부족

## 정리 우선순위

### 즉시 수정 대상 (Critical)
1. 실패한 테스트 3개 수정
2. Browser Utils 중복 파일 통합
3. Media URL 중복 파일 통합

### Phase별 정리 대상 (High)
1. 완료된 phase1-4 파일들 아카이브
2. phase-g 주별 파일들 통합
3. refactoring 단계별 파일들 정리

### 네이밍 표준화 (Medium)
1. 수식어 제거 및 통합
2. 파일명 일관성 확보
3. 테스트 설명 표준화

## 작업 계획

### Phase 1-A: 즉시 수정
- 실패한 테스트 수정
- 중복 파일 통합 (browser-utils, media-url)

### Phase 1-B: 단계별 정리
- 완료된 phase 파일들 정리
- 불필요한 테스트 제거

### Phase 1-C: 네이밍 표준화
- 수식어 제거
- 일관된 명명 규칙 적용

## 예상 효과
- 테스트 파일 수: 71개 → 약 45-50개
- 중복 제거로 유지보수성 향상
- 일관된 네이밍으로 가독성 개선
