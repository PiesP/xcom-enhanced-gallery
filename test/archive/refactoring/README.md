# test/archive/refactoring

완료되거나 비활성화된 리팩토링 테스트 모음입니다. 프로젝트는 Phase 174 진행
중입니다.

## 📂 구조

```
test/archive/refactoring/
├── README.md                                       # 이 파일
├── phase2-animation-simplification.test.ts        # Phase 2 (231줄)
├── phase65-orphan-file-cleanup.test.ts            # Phase 65 (126줄)
└── container/                                      # AppContainer 리팩토링 (8개 파일)
    ├── app-container-contract.test.ts             # 루트 계약 테스트 (145줄)
    ├── cleanup/
    │   └── cleanup-hard-removal.test.ts           # Phase 7 정리 테스트 (279줄)
    ├── core/
    │   ├── container-legacy-contract.test.ts      # 레거시 계약 테스트
    │   └── core-migration-contract.test.ts        # 코어 마이그레이션 테스트
    ├── feature/
    │   └── feature-lazy-factory.test.ts           # 기능 레이지 팩토리 테스트
    ├── global/
    │   └── global-singleton-removal.test.ts       # 글로벌 싱글톤 제거 테스트
    ├── legacy/
    │   └── legacy-adapter-contract.test.ts        # 레거시 어댑터 계약 테스트
    └── services/
        └── service-keys-reduction.test.ts         # 서비스 키 감소 테스트
```

## 📋 테스트 상태

### Phase 파일 (2개, ~357줄)

- **phase2-animation-simplification.test.ts** (231줄)
  - 애니메이션 시스템 단순화 및 CSS 트랜지션 교체
  - Motion One 라이브러리 제거 관련
  - 상태: 완료된 Phase 2 리팩토링

- **phase65-orphan-file-cleanup.test.ts** (126줄)
  - Orphan 파일 정리 (src/shared/services/media/normalizers/legacy/twitter.ts)
  - 상태: 완료된 Phase 65 리팩토링

### Container 리팩토링 테스트 (8개, ~800+줄)

**현황**:

- `src/bootstrap/`에 container-factory 실제 구현 없음
- 레거시 리팩토링 관련 계약 테스트 (RED/GREEN/REFACTOR 패턴)
- Phase 7 정리 테스트 포함

**파일 목록:**

| 파일                              | 라인 | 설명                          |
| --------------------------------- | ---- | ----------------------------- |
| app-container-contract.test.ts    | 145  | 루트 AppContainer 계약 테스트 |
| cleanup-hard-removal.test.ts      | 279  | Phase 7 정리 및 하드 제거     |
| container-legacy-contract.test.ts | ?    | 레거시 어댑터 계약            |
| core-migration-contract.test.ts   | ?    | 코어 마이그레이션 계약        |
| feature-lazy-factory.test.ts      | ?    | 기능 레이지 팩토리 패턴       |
| global-singleton-removal.test.ts  | ?    | 글로벌 싱글톤 제거            |
| legacy-adapter-contract.test.ts   | ?    | 레거시 어댑터 계약            |
| service-keys-reduction.test.ts    | ?    | 서비스 키 감소                |

## 🔄 아카이브 정책

### 왜 아카이브 되었는가?

1. **Phase 파일 (2개)**
   - 과거 리팩토링 단계의 TDD 테스트
   - 현재 Phase 174 진행 중이므로 역사적 기록으로 보관
   - 향후 유사 패턴 참고 자료 용도

2. **Container 파일 (8개)**
   - AppContainer 리팩토링은 완료 단계
   - 실제 구현(src/bootstrap/)에서 container 모듈 없음 (정책 변경)
   - 레거시 계약 테스트로서 참고 가치 낮음
   - 현재 bootstrap은 features.ts, events.ts 등 직접 함수 기반

### CI/로컬 테스트에서 제외

`vitest.config.ts`의 refactor 프로젝트에서 exclude 처리:

```typescript
exclude: [
  'test/refactoring/**/*.test.ts',
  'test/refactoring/**/*.test.tsx',
  'test/refactoring/**/*.spec.ts',
  'test/refactoring/**/*.spec.tsx',
];
```

## 🔍 복원 방법

테스트를 다시 활성화하려면:

1. **파일 이동:**

```bash
# Phase 파일만 복원
mv test/archive/refactoring/phase*.test.ts test/refactoring/

# Container 복원
cp -r test/archive/refactoring/container test/refactoring/
```

1. **vitest.config.ts 업데이트:**
   - refactor 프로젝트의 exclude 수정

1. **실행:**

```bash
npm run test:refactor
```

## 📚 참고 문서

- [AGENTS.md](../../AGENTS.md): 테스트 가이드 및 Vitest 프로젝트 설명
- [TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md): 테스트 전략 및 피라미드
- [TDD_REFACTORING_PLAN.md](../../docs/TDD_REFACTORING_PLAN.md): Phase별 진행
  현황
- [test/README.md](../README.md): 전체 테스트 가이드

## 📝 마지막 업데이트

- **날짜**: 2025-10-25
- **Phase**: Phase 174 진행 중
- **상태**: 안정 단계
- **총 아카이브 파일**: 10개 (Phase 2개 + Container 8개)
