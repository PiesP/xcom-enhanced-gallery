<!-- markdownlint-disable MD041 -->

# 테스트 아카이브 (test/archive)

> 완료된 리팩토링 Phase와 폐기된 테스트의 참고용 보관소

## 📂 폴더 구조

```
test/archive/
  ├── cleanup-phases/                 # Phase 1~7 정리 테스트 (완료됨)
  │   ├── cleanup-verification.test.ts
  │   ├── naming-cleanup.test.ts
  │   ├── naming-standardization.test.ts
  │   ├── naming-structure-improvement.test.ts
  │   ├── test-consolidation.test.ts
  │   ├── unused-code-removal.test.ts
  │   └── README.md
  │
  ├── integration-behavioral/         # 과거 행위 검증 테스트 (Phase 170B 이전)
  │   ├── user-interactions-fixed.test.ts
  │   ├── toolbar-visibility-fix.test.ts
  │   └── README.md
  │
  ├── integration/                    # test/integration 아카이브 (Phase 171B)
  │   ├── bundle-vendor-tdz.test.ts (TDD RED 단계)
  │   ├── extension.integration.test.ts (Placeholder)
  │   ├── master-test-suite.test.ts (Phase 4 마커)
  │   ├── vendor-tdz-resolution.test.ts (TDD GREEN 단계)
  │   └── README.md
  │
  └── performance/                    # test/performance 아카이브 (Phase 172)
      ├── performance.consolidated.test.ts (Placeholder)
      ├── optimization/
      │   ├── memo-optimization.test.ts (구식)
      │   └── optimization.consolidated.test.ts (Placeholder)
      └── README.md
```

## 📝 내용 설명

### cleanup-phases/

과거 리팩토링 Phase (1~7)의 검증 테스트 모음입니다. 각 파일은 당시 작업 단계의
목표와 검증 내용을 기록하고 있습니다.

**포함된 Phase**:

- **Phase 1**: 사용하지 않는 코드 제거 (utils-backup.ts 제거)
- **Phase 2**: 네이밍 정리 및 파일 구조 개선
- **Phase 3**: 테스트 코드 정리 및 표준화 (Mock 최적화)
- **Phase 4**: 네이밍 표준화 및 최종 정리
- **Phase 6-7**: 의존성 격리 및 레거시 정리

### integration-behavioral/

과거 개발 단계의 행위 검증 테스트 모음입니다. 기능 구현 당시의 검증 방식을
기록하고 있으나, 현재 Phase 170B+ 상태에 비해 비효율적입니다.

**포함된 테스트**:

- **user-interactions-fixed.test.ts**: Mock 기반 사용자 상호작용 검증
  - 갤러리 열기, 키보드 단축키, 자동 다운로드, 오류 처리 등
  - 문제: 실제 DOM 동작 검증 불가, Mock 의존 높음
- **toolbar-visibility-fix.test.ts**: 문자열 기반 CSS 검증
  - CSS `!important` 규칙, JavaScript 강제 적용 패턴 등
  - 문제: 실제 CSS 적용 미검증, JSDOM CSS 계산 미지원

**개선 권장사항**:

- Browser 테스트(Vitest + Chromium)로 전환: 실제 Solid.js 반응성 검증
- E2E 테스트(Playwright)로 승격: 실제 사용자 시나리오 검증
- 가드 테스트 활용: 현재 상태(Phase 170B+) 검증으로 전환

### integration/

test/integration의 구식 또는 불필요한 테스트 모음입니다. Phase 171B 현대화
과정에서 아카이브된 파일들입니다.

**포함된 테스트**:

- **bundle-vendor-tdz.test.ts** (152줄): TDD RED 단계 문제 재현
  - 목적: Vendor TDZ (Temporal Dead Zone) 문제 검증
  - 상태: Phase 170B+에서 정적 import 기반으로 해결됨
  - 이유: 현재는 더 이상 재현이 필요 없음 (문제 완전 해결)

- **extension.integration.test.ts** (129줄): 확장 프로그램 초기화
  - 목적: 원래는 Userscript 초기화 테스트
  - 상태: 모든 테스트가 placeholder (expect(true).toBe(true))
  - 이유: 실제 구현이 없음, E2E 테스트로 충분히 커버됨

- **master-test-suite.test.ts** (72줄): Phase 4 완료 마커
  - 목적: Phase 4 Final Cleanup 완료 표시
  - 상태: 완료된 Phase 기록용
  - 이유: 역사적 기록이며 실제 작업은 이미 구현됨

- **vendor-tdz-resolution.test.ts** (282줄): TDD GREEN 단계 검증
  - 목적: TDZ 문제 해결 검증
  - 상태: Phase 170B에서 완료됨
  - 이유: 해결된 문제에 대한 검증이므로 필요 없음

**의료 권장사항**:

현재 프로젝트 상태는 더 이상 이들 테스트를 필요로 하지 않습니다:

- `test/guards/project-health.test.ts`에서 현재 상태 검증
- `test/styles/color-token-consistency.test.ts`에서 색상 토큰 검증
- E2E 테스트에서 통합 시나리오 검증

### performance/

test/performance의 통합 성능 테스트 모음입니다. 모든 파일은 placeholder 패턴
(`expect(true).toBe(true)`)으로, 실제 검증 로직이 없습니다.

**포함된 테스트**:

- **performance.consolidated.test.ts** (80줄): 종합 성능 테스트
  - Virtual Gallery, Code Splitting, Runtime Monitoring, Animation, Network 성능
    검증
  - 문제: 모두 placeholder, 실제 구현 없음

- **optimization/memo-optimization.test.ts** (45줄): Preact.memo 최적화
  - 목적: Button, Toast 등 컴포넌트의 메모이제이션 검증
  - 문제: Preact 기반이나 현재는 Solid.js 사용 → 파일 자체 구식

- **optimization/optimization.consolidated.test.ts** (76줄): 최적화 통합 테스트
  - Code Splitting, Component Memoization, Runtime Performance 등
  - 문제: 모두 placeholder, 실제 구현 없음

**대체 구현**:

실제 성능 테스트는 `test/unit/performance/`에서 관리됩니다:

- `gallery-preload.util.test.ts`: 갤러리 프리로드 로직
- `gallery-prefetch.viewport-weight.red.test.ts`: 뷰포트 가중치 프리페치
- `media-prefetch.*.test.ts`: 다양한 스케줄 기반 프리페치
- `signal-optimization.test.tsx`: Signal 메모이제이션
- `media-prefetch.bench.test.ts`: 성능 벤치마킹

**아카이브 이유**:

- 실제 성능 테스트는 `test/unit/performance/`에서 이미 명확하고 구체적으로
  관리됨
- 이중화 제거 및 유지보수 단순화
- CI 성능 최적화 (불필요한 placeholder 테스트 제외)

## ✅ 아카이브 정책

### 언제 아카이브되는가?

1. Phase 완료 후 검증이 끝난 테스트
2. 리팩토링 완료 후 더 이상 실행하지 않는 테스트
3. 대체 또는 통합된 테스트

### 왜 아카이브하는가?

- **유지보수 부담 감소**: 더 이상 필요 없는 테스트의 로직 유지 비용 제거
- **프로젝트 구조 간결화**: 현재 상태와 맞지 않는 테스트로 인한 혼동 방지
- **참고용 보관**: Phase 진행 과정과 의사 결정 기록 보존

### 현재 상태 검증

현재 프로젝트 상태(Phase 170B+)는 `test/guards/project-health.test.ts`에서
검증합니다:

- 번들 크기: 339.55 KB (제한 420 KB)
- 의존성: 0 violations
- 코딩 규칙: 3대 핵심 원칙 준수 (Vendor getter, PC 이벤트, 디자인 토큰)

## 📚 관련 문서

- `docs/TDD_REFACTORING_PLAN.md`: 완료된 Phase별 상세 기록
- `docs/TESTING_STRATEGY.md`: 현재 테스트 전략 및 실행 가이드
- `.github/copilot-instructions.md`: 협업 가이드 및 Phase 기록 규칙

## 🔄 아카이브에서 복원하기

필요시 과거 Phase의 테스트 로직을 참고하여 새로운 검증을 작성할 수 있습니다:

```bash
# 아카이브 폴더 내용 확인
ls test/archive/cleanup-phases/

# 특정 Phase 테스트 내용 확인
cat test/archive/cleanup-phases/naming-standardization.test.ts
```

## 💡 개발자 노트

아카이브된 테스트는 CI/로컬 테스트 실행에 포함되지 않습니다. 이는 의도적
설계입니다:

- **현재 상태 검증**: `test/guards/` 의 최소 가드 테스트만 실행
- **참고용 보관**: 역사적 기록으로 문서와 함께 보관
- **빠른 피드백**: 불필요한 테스트 제거로 로컬 개발 속도 향상

---

**마지막 업데이트**: 2025-10-25 (Phase 171B - integration 아카이브 통합)
