# test/unit/accessibility — 접근성 유틸리티 테스트

접근성(Accessibility, a11y) 관련 유틸리티 함수 및 모듈의 단위 테스트입니다.

## 📋 테스트 파일

### 1. index.import.test.ts (Sanity Check)

**목적**: 접근성 모듈의 index 재exports 검증

- 모듈: `@/shared/utils/accessibility`
- 검증 대상: `ensurePoliteLiveRegion()`, `ensureAssertiveLiveRegion()` **유형**:
  Sanity check (import 검증)
- 라인 수: ~10줄

**테스트**:

- ✅ 메인 유틸리티 함수가 함수 타입인지 확인
- ✅ 모듈이 정상적으로 재exports되는지 검증

### 2. live-region-manager.test.ts

**목적**: Live Region 단일 인스턴스 및 속성 검증

- 모듈: `@/shared/utils/accessibility/live-region-manager`
- 함수: `ensurePoliteLiveRegion()`, `ensureAssertiveLiveRegion()`
- 라인 수: ~40줄

**테스트**:

- ✅ Polite live region은 한 번만 생성되고 재사용된다
- ✅ Assertive live region은 한 번만 생성되고 재사용된다
- ✅ 두 리전이 동시에 생성될 수 있다
- ✅ 속성 검증 (aria-live, role, data-xe-live-region)

## 📚 관련 모듈 구조

```
src/shared/utils/accessibility/
├── index.ts                     # 메인 재exports
└── live-region-manager.ts       # Live region 관리
```

## 🔄 통합 테스트

라이브 리전 관련 통합 동작 검증:

- **playwright/accessibility/\*-a11y.spec.ts**: E2E 기반 접근성 테스트
- **test/integration/\***: 서비스 통합 테스트 (필요시)

## 📊 현황

- ✅ 총 2개 테스트 파일
- ✅ 약 45줄 테스트 코드
- ✅ 모던 Vitest 패턴 사용
- ✅ 간결하고 유지보수 가능한 구조

## 💡 개발 가이드

### 새로운 접근성 유틸리티 추가 시

1. **src/shared/utils/accessibility/\{module\}.ts**에 구현
2. **test/unit/accessibility/{module}.test.ts** 추가
3. **src/shared/utils/accessibility/index.ts**에 재export
4. **test/unit/accessibility/index.import.test.ts** 업데이트 (필요시)

### 테스트 작성 원칙

- JSDOM 기반 단위 테스트 (순수 로직)
- 실제 DOM 동작 필요시 Playwright E2E로 검증
- 모든 공개 함수에 대한 테스트 필수

## 🔗 참고 문서

- **WCAG 준수**: docs/ACCESSIBILITY_CHECKLIST.md
- **E2E 테스트**: playwright/accessibility/README.md
- **코딩 규칙**: docs/CODING_GUIDELINES.md
- **테스트 전략**: docs/TESTING_STRATEGY.md
