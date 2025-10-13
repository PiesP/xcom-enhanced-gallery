# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: master
>
> **상태**: 활성 작업 없음 ✅

## 프로젝트 상태

- **빌드**: dev 732.38 KB / prod 319.92 KB ✅
- **테스트**: 663+ passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (271 modules, 741 dependencies) ✅
- **번들 예산**: 319.92 KB / 325 KB (5.08 KB 여유) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-36 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료 작업

### Phase 36: 설정 모달 중앙 고정 위치 개선 (2025-10-13) ✅

Modal 모드에서 CSS 모듈 위치 클래스 정상 적용, 모든 위치 옵션 작동 확인.

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

### Phase 35: 툴바 초기 투명도 및 모달 위치 개선 (2025-10-13) ✅

사용자 보고 이슈 2건 해결:

1. 툴바 초기 투명도 문제 → 동기적 테마 초기화로 해결
2. 설정 모달 위치 문제 → 동적 위치 계산 훅으로 해결

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

---

## Phase 34 완료 평가

### ✅ 완료된 작업

**Phase 34 Step 1: 미사용 Export 제거**

- `getCSSVariable`, `applyTheme` 함수 제거
- 소스 코드 22줄 감소
- API 명확성 향상

### 🔍 Step 2 재평가: 대형 파일 리팩토링

#### 현재 상황 분석

**대형 파일 현황**:

1. `events.ts` (805줄, 23.73 KB) - 10개 export
2. `accessibility-utils.ts` (789줄, 23.25 KB) - 20개+ export
3. `url-patterns.ts` (846줄, 23.19 KB)
4. `media-service.ts` (719줄, 21.35 KB) - Phase 33에서 최적화 완료

#### 재평가 결과

**분리를 보류하는 이유**:

1. **번들 크기 목표 달성** ✅
   - 현재: 318.04 KB (목표 325 KB 미만)
   - 여유: 6.96 KB
   - 추가 최적화 불필요

2. **코드 품질 지표 양호** ✅
   - 타입 오류: 0
   - 린트 경고: 0
   - 테스트 통과율: 96.4% (661/686)
   - 의존성 위반: 0

3. **유지보수성 평가**
   - 각 파일이 명확한 단일 책임 수행
   - `events.ts`: 이벤트 관리 시스템
   - `accessibility-utils.ts`: 접근성 유틸리티
   - `url-patterns.ts`: URL 패턴 매칭
   - 기존 구조가 논리적이고 일관성 있음

4. **리팩토링 비용 > 이득**
   - 분리 시 import 복잡도 증가
   - 광범위한 코드 변경으로 회귀 위험
   - 실제 유지보수 문제 미발생
   - 새 기능 추가 시 자연스럽게 분리 가능

#### 결론

**Phase 34 Step 2 작업 보류**

대형 파일 리팩토링은 현재 단계에서 필요하지 않습니다:

- 코드 품질이 양호함
- 번들 크기 목표 달성
- 실제 유지보수 문제 없음
- 복잡도 증가 대비 이득 낮음

대신 **"필요 시점 리팩토링"** 전략 채택:

- 새 기능 추가 시 자연스럽게 모듈 분리
- 실제 유지보수 문제 발생 시 대응
- 코드 품질 모니터링 지속

---

## 다음 단계: 프로젝트 안정화 및 모니터링

### 단기 작업 (즉시)

1. **문서 정리**
   - `TDD_REFACTORING_PLAN_COMPLETED.md` 간소화 (582줄 → 300줄 목표)
   - 불필요한 상세 내용 제거
   - 핵심 성과만 유지

2. **테스트 커버리지 개선**
   - 24개 skipped 테스트 검토
   - 1개 todo 테스트 완료
   - 목표: 670+/686 passing

3. **의존성 정리**
   - 미사용 devDependencies 검토
   - `depcheck` 실행 후 정리

### 중기 작업 (향후 1-2주)

1. **성능 모니터링**
   - 번들 크기 추이 관찰
   - 빌드 시간 최적화 검토

2. **E2E 테스트 강화**
   - Playwright 스모크 테스트 확장
   - 주요 사용자 시나리오 커버리지

3. **문서화 개선**
   - API 문서 자동화 검토
   - 예제 코드 추가

### 장기 작업 (향후 1-3개월)

1. **기능 확장 준비**
   - 사용자 피드백 수집
   - 우선순위 기능 계획

2. **기술 부채 관리**
   - 코드 메트릭 정기 모니터링
   - 리팩토링 백로그 관리

---

## 작업 이력

### Phase 34 (2025-10-13) ✅

- **Step 1**: 미사용 Export 제거 완료
- **Step 2**: 대형 파일 리팩토링 재평가 → 보류 결정

### 이전 Phase

Phase 1-33 완료 기록은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 현재 우선순위

1. ✅ 프로젝트 안정화 (달성)
2. 🎯 문서 간소화 (진행 예정)
3. 🎯 테스트 커버리지 향상 (진행 예정)
4. 📊 성능 모니터링 체계 구축

**다음 작업**: 문서 간소화 및 테스트 개선

**브랜치**: `feature/phase-34-step-2-large-files`

### 배경

4개 파일이 20KB 이상으로 단일 책임 원칙 검토 필요:

1. **events.ts** (717줄, 23.73 KB): 통합 이벤트 관리
2. **accessibility-utils.ts** (790줄, 23.25 KB): 접근성 유틸리티
3. **url-patterns.ts** (847줄, 23.19 KB): URL 패턴 매칭
4. **media-service.ts** (720줄, 21.35 KB): 미디어 서비스

### 리팩토링 전략

각 파일의 책임을 분석하고 필요 시 분할합니다.

#### Step 2-A: events.ts 분석 및 분할

**현재 구조** (추정):

- 이벤트 리스너 관리
- 갤러리 이벤트 핸들링
- 키보드 네비게이션
- 비디오 재생 제어
- 트위터 네이티브 갤러리 감지

**분할 후보**:

```
shared/utils/events/
  ├── event-manager.ts          // 리스너 등록/해제 (core)
  ├── gallery-event-handlers.ts // 갤러리 전용 핸들러
  ├── keyboard-handlers.ts      // 키보드 네비게이션
  ├── video-handlers.ts         // 비디오 제어
  └── twitter-detection.ts      // 트위터 네이티브 감지
```

**TDD 접근**:

1. RED: 파일 크기 가드 테스트 (500줄 제한)
2. GREEN: 책임별로 모듈 분리
3. REFACTOR: import 경로 정리, 테스트 보강

**예상 효과**:

- 각 모듈: ~150-200줄
- 책임 분리로 테스트 용이성 향상
- 변경 영향 범위 감소

#### Step 2-B: accessibility-utils.ts 분석 및 분할

**현재 구조** (추정):

- 색상 대비 계산 (WCAG)
- 상대 휘도 계산
- 색상 파싱 (RGB, HEX)
- 포커스 관리
- 스크린 리더 지원

**분할 후보**:

```
shared/utils/accessibility/
  ├── contrast-calculator.ts    // 대비 비율 계산
  ├── color-parser.ts           // 색상 파싱 유틸
  ├── focus-management.ts       // 포커스 관리 (이미 분리?)
  └── aria-helpers.ts           // ARIA 속성 헬퍼
```

**TDD 접근**:

1. RED: 색상 관련/포커스 관련 책임 분리 테스트
2. GREEN: 기능별 모듈 분리
3. REFACTOR: 각 모듈의 테스트 커버리지 확인

#### Step 2-C: url-patterns.ts 분석 및 분할

**현재 구조** (추정):

- 트윗 URL 패턴
- 미디어 URL 패턴
- 이미지/비디오 URL 감지
- URL 파싱 유틸리티

**분할 후보**:

```
shared/utils/patterns/
  ├── tweet-patterns.ts         // 트윗 URL 패턴
  ├── media-patterns.ts         // 미디어 URL 패턴
  ├── url-matchers.ts           // URL 매칭 로직
  └── url-extractors.ts         // URL 정보 추출
```

**판단 기준**:

- 현재 구조가 "URLPatterns 객체 하나에 모든 패턴" 형태라면 유지
- 복잡한 파싱 로직이 포함되어 있다면 분리 검토

#### Step 2-D: media-service.ts 검토

**상태**: Phase 33 Step 2C에서 이미 최적화됨 (975줄 → 613줄 → 720줄)

**현재 크기**: 21.35 KB (720줄)

**판단**:

- 이미 주석 제거 및 최적화 완료
- 720줄은 서비스 레이어로 수용 가능한 크기
- 추가 분할 필요성 낮음

**Action**: Step 2-D는 생략 또는 검토만 수행

### Phase 34 Step 2 우선순위

1. **events.ts** (최우선): 가장 크고 책임이 많음
2. **accessibility-utils.ts** (중요): WCAG 계산 로직 분리 가치 있음
3. **url-patterns.ts** (검토): 현재 구조 확인 후 결정
4. **media-service.ts** (생략): 이미 최적화됨

### TDD 진행 순서

**Phase 34 Step 2-1: events.ts 리팩토링**

1. RED: 파일 크기/책임 분리 테스트
2. GREEN: 5개 모듈로 분할
3. REFACTOR: 테스트 보강 및 문서화

**Phase 34 Step 2-2: accessibility-utils.ts 리팩토링**

1. RED: 색상/포커스 책임 분리 테스트
2. GREEN: 4개 모듈로 분할
3. REFACTOR: WCAG 계산 로직 검증 강화

**Phase 34 Step 2-3: url-patterns.ts 검토**

1. 현재 구조 분석
2. 분할 필요성 판단
3. 필요 시 리팩토링, 아니면 현재 구조 유지

---

## 작업 순서 요약

```
1. Phase 34 Step 1: 미사용 Export 제거
   ├─ Step 1-A: RED (unused-exports-removal.test.ts)
   ├─ Step 1-B: GREEN (함수 2개 제거)
   └─ Step 1-C: REFACTOR (문서 정리)

2. Phase 34 Step 2: 대형 파일 리팩토링
   ├─ Step 2-1: events.ts → 5개 모듈
   ├─ Step 2-2: accessibility-utils.ts → 4개 모듈
   └─ Step 2-3: url-patterns.ts 검토 및 필요 시 분할
```

---

## 다음 작업

**즉시 시작 가능**: Phase 34 Step 1 (미사용 Export 제거)

- 브랜치 생성: `git checkout -b feature/phase-34-step-1-unused-exports`
- 테스트 작성: `test/unit/refactoring/unused-exports-removal.test.ts`
- TDD 사이클 진행: RED → GREEN → REFACTOR

---

**이전 완료 Phase**: Phase 1-33 → `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
