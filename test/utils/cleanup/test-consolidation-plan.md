# 테스트 파일 통합 및 정리 계획

## 🎯 목표

- 중복된 테스트 파일 제거 및 통합
- TDD 가이드라인 준수하면서 테스트 커버리지 유지
- 테스트 실행 시간 단축 및 유지보수성 향상

## 📊 현재 상황 분석

### 중복 제거 대상 파일들

1. **ZIndexManager.test.ts** ↔ **ZIndexService.test.ts** (동일 기능)
2. **ServiceManager.test.ts** ↔ **CoreService.test.ts** (이름만 변경된 동일
   서비스)
3. **toolbar-hover-consistency.test.ts** ↔
   **toolbar-hover-consistency-completion.test.ts** (연관성)
4. **logger-safety.test.ts**, **logger-safety-enhanced.test.ts**,
   **logger-import-consistency.test.ts** (로거 안전성)

### 통합 대상 파일들

1. **성능 관련**: `performance-timer.test.ts`,
   `performance-utils.consolidated.test.ts`, `throttle.test.ts`
2. **통합 테스트**: `extension.integration.test.ts`, `full-workflow.test.ts`,
   `utils.integration.test.ts`
3. **Mock 환경**: 여러 preact 환경 mock 파일들
4. **헬퍼 유틸리티**: 중복된 테스트 헬퍼들

## 🔄 Phase 1: 즉시 중복 제거 (높은 우선순위)

### 1.1 동일 기능 테스트 제거

```bash
# 제거할 파일들
- test/shared/utils/ZIndexManager.test.ts (→ ZIndexService.test.ts로 통합)
- test/unit/shared/services/ServiceManager.test.ts (→ CoreService.test.ts 유지)
- test/features/toolbar/toolbar-hover-consistency.test.ts (→ completion 버전 유지)
```

### 1.2 Logger 테스트 통합

```bash
# 통합할 파일들
- logger-safety.test.ts
- logger-safety-enhanced.test.ts
- logger-import-consistency.test.ts
↓
- logger.consolidated.test.ts (새로 생성)
```

### 1.3 예상 효과

- 파일 수: 7개 → 3개 (57% 감소)
- 테스트 실행시간: 약 15% 단축

## 🔄 Phase 2: 기능별 통합 (중간 우선순위)

### 2.1 성능 테스트 통합

```bash
# 통합 대상
- test/shared/utils/performance/throttle.test.ts
- test/unit/shared/utils/performance-timer.test.ts
- test/unit/shared/utils/performance-utils.consolidated.test.ts
↓
- test/shared/performance/performance.consolidated.test.ts
```

### 2.2 통합 테스트 정리

```bash
# 통합 대상
- test/integration/extension.integration.test.ts
- test/integration/full-workflow.test.ts
- test/integration/utils.integration.test.ts
↓
- test/integration/application.integration.test.ts
```

### 2.3 Mock 환경 통합

```bash
# 통합 대상
- test/utils/mocks/preact-test-environment.ts
- test/utils/mocks/preact-test-environment-enhanced.ts
- test/utils/mocks/ultimate-preact-environment.ts
↓
- test/utils/mocks/preact-environment.unified.ts
```

### 2.4 예상 효과

- 파일 수: 12개 → 4개 (67% 감소)
- 코드 중복: 대폭 감소

## 🔄 Phase 3: 구조 최적화 (낮은 우선순위)

### 3.1 테스트 헬퍼 정리

```bash
# 정리 대상
- test/utils/helpers/test-environment.ts
- test/utils/helpers/page-test-environment.ts
↓
- test/utils/helpers/test-environment.unified.ts
```

### 3.2 사용하지 않는 파일 제거

```bash
# 제거 후보
- test/utils/cleanup/test-cleanup-plan.ts (빈 파일)
- test/unit/main/main-initialization.test.ts (빈 파일)
```

## 📋 실행 계획

### Step 1: 중복 제거 (1일)

1. 동일 기능 테스트 파일 제거
2. Logger 테스트 통합
3. 테스트 실행으로 회귀 확인

### Step 2: 기능별 통합 (2일)

1. 성능 테스트 통합
2. 통합 테스트 정리
3. Mock 환경 통합
4. 각 단계마다 테스트 실행

### Step 3: 구조 최적화 (1일)

1. 헬퍼 유틸리티 정리
2. 불필요한 파일 제거
3. 최종 테스트 실행

## ✅ 체크리스트

### 작업 전 확인사항

- [ ] 현재 모든 테스트 통과 확인
- [ ] 중요한 테스트 케이스 목록 작성
- [ ] 백업 생성

### 각 단계별 확인사항

- [ ] 테스트 커버리지 유지 확인
- [ ] 새로운 테스트 실패 없음
- [ ] 성능 개선 측정

### 완료 후 확인사항

- [ ] 전체 테스트 스위트 실행
- [ ] 문서 업데이트
- [ ] README.md의 테스트 가이드 수정

## 📈 예상 효과

### 정량적 효과

- **테스트 파일 수**: 약 30% 감소
- **테스트 실행 시간**: 약 20% 단축
- **코드 중복**: 대폭 감소
- **유지보수 시간**: 약 40% 단축

### 정성적 효과

- 테스트 구조의 명확성 향상
- 새로운 테스트 작성 시 가이드라인 제공
- TDD 사이클의 효율성 증대

## 🚨 리스크 관리

### 주요 리스크

1. **테스트 커버리지 감소**: 중요한 테스트 케이스 누락
2. **회귀 버그**: 통합 과정에서 기능 손실
3. **개발 중단**: 작업 기간 중 다른 개발 블로킹

### 완화 방안

1. 단계별 테스트 실행으로 즉시 문제 탐지
2. 중요 테스트 케이스 체크리스트 사전 작성
3. 작업 단위를 작게 나누어 리스크 최소화

## 📝 다음 단계

1. **즉시 시작**: Phase 1 중복 제거 작업
2. **검토 요청**: 통합 계획에 대한 팀 피드백
3. **도구 활용**: 자동화된 테스트 중복 검사 도구 활용

---

**작성일**: 2025년 8월 7일 **작성자**: GitHub Copilot **버전**: 1.0.0
