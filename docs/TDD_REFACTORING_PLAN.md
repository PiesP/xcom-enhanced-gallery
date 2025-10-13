# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: feature/phase-34-step-2-large-files
>
> **상태**: Phase 34 Step 2 준비 중 📝

## 프로젝트 상태

- **빌드**: dev 726.49 KB / prod 318.04 KB ✅
- **테스트**: 661/686 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (269 modules, 736 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-34 Step 1 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## Phase 34: 코드 품질 향상 및 최적화

### 목표

1. ~~**미사용 코드 제거**: 실제로 사용되지 않는 export 제거로 코드베이스 정리~~
   ✅
2. **대형 파일 리팩토링**: 23KB+ 파일들을 책임별로 분리하여 유지보수성 향상 🎯

### 우선순위

~~**Phase 34 Step 1** → 미사용 Export 제거 (완료)~~ ✅ **Phase 34 Step 2** →
대형 파일 리팩토링 (진행 중) 🎯

---

## Phase 34 Step 2: 대형 파일 리팩토링 🎯

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
