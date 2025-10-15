"""
TDD_REFACTORING_PLAN_COMPLETED.md 간소화 스크립트
- 1072줄 → 약 250줄 목표
- Phase 77, 78만 상세 유지, 나머지는 요약
"""

output = """# TDD 리팩토링 완료 기록

> **목적**: 완료된 Phase들의 핵심 메트릭과 교훈 보관  
> **최종 업데이트**: 2025-10-15

---

## 최신 완료 Phase

### Phase 77: 네비게이션 상태 머신 명시화 ✅

**완료일**: 2025-10-15  
**목표**: focusedIndex/currentIndex 동기화 명확화 + 상태 전환 중앙화

#### 달성 메트릭

| 항목 | 시작 | 최종 | 개선 |
|------|------|------|------|
| 테스트 통과 | 965/978 | 977/990 | +12개 |
| 테스트 통과율 | 97.5% | 99.6% | +2.1%p |
| 프로덕션 빌드 | 320.09 KB | 321.40 KB | +1.3KB |

#### 핵심 변경

1. **NavigationStateMachine 클래스** (218줄)
   - 순수 함수 기반 상태 전환 (immutable)
   - 중복 네비게이션 감지 로직 내장
   - 타임스탬프 자동 추적

2. **순환 의존성 해결**
   - NavigationSource 타입 분리 → `navigation-types.ts`
   - `lastNavigationSource` 파일 스코프 변수 제거

3. **TDD 접근** (12개 테스트, 100% 통과)
   - NAVIGATE 액션 (4개): 동기화, 중복 감지, source 추적
   - SET_FOCUS 액션 (3개): 설정, 해제, 중복
   - 복잡한 시나리오 (2개): 버튼→스크롤→버튼, 키보드 연속

#### 배운 점

- **순환 의존성 예방**: 공통 타입은 별도 파일 (`types/` 디렉터리)
- **순수 함수의 힘**: 상태 전환을 순수 함수로 구현하면 테스트가 쉬움
- **TDD 워크플로**: 테스트 먼저 작성 → 11/12 통과 → 1개 수정 → 전체 GREEN

---

### Phase 78: 테스트 구조 최적화 ✅

**완료일**: 2025-10-15  
**목표**: 23개 디렉터리 → 10개 이하, 373개 파일 → 300개 이하

#### 전체 달성 메트릭

| 항목 | 목표 | 최종 | 달성률 |
|------|------|------|--------|
| 테스트 디렉터리 | 10개 이하 | 8개 | ✅ 120% |
| 테스트 파일 | 300개 이하 | 295개 | ✅ 101.7% |
| 테스트 통과율 | 유지 | 99.6% | ✅ |
| 빌드 크기 | 유지 | 321.40 KB | ✅ |

#### 핵심 개선사항

**1. 디렉터리 구조 단순화 (23개 → 8개, 65.2% 감소)**

```text
test/
├── __mocks__/          # 모킹 파일
├── unit/               # 단위 테스트 (240 files)
├── integration/        # 통합 테스트 (13 files)
├── refactoring/        # 리팩토링 가드 (48 files)
├── styles/             # 스타일/토큰 정책 (13 files)
├── performance/        # 성능/벤치마크 (3 files)
├── cleanup/            # 정리 검증 (6 files)
└── build/              # 빌드 검증 (2 files)
```

**2. 테스트 파일 정리 (373개 → 295개, 78개 제거)**

- Bundle Size 테스트 통합 (4개 → 1개)
- Token 테스트 통합 (41개 → 5개)
- Event 테스트 통합 (3개 → 1개)
- RED 테스트 재평가 및 제거 (5개)
- 중복/오타 테스트 제거 (48개)
- Phase별 임시 테스트 아카이빙 (20개)

#### 배운 점

- **디렉터리 구조**: 너무 세분화하면 탐색이 어려움, 8-10개 카테고리가 적정
- **테스트 통합**: 관련 정책은 단일 파일로 통합
- **RED 테스트**: 아키텍처 가드는 유지, 중복 검증은 제거
- **진행 추적**: 목표 수치 명확히 → 단계별 달성률 측정

---

## 이전 완료 Phase (요약)

### Phase 75: Toolbar 설정 로직 모듈화 ✅

**완료일**: 2025-10-16

- `use-toolbar-settings-controller.ts` 추출 (81줄)
- Toolbar 컴포넌트 로직 92줄 → 42줄 (54% 감소)
- Playwright 하네스 `focusSettingsModal()` 추가

---

### Phase 72: 코드 품질 개선 - 하드코딩 제거 ✅

**완료일**: 2025-10-15

- 디자인 토큰으로 전환 (18개 수정)
- 정책 테스트 통과: `hardcoded-color-detection.test.ts`
- CSS 변수 도입: `--xeg-*` 네임스페이스

---

### Phase 71: 문서 최적화 및 간소화 ✅

**완료일**: 2025-10-15

- ARCHITECTURE.md: 1100줄 → 600줄 (45% 감소)
- CODING_GUIDELINES.md: 900줄 → 550줄 (39% 감소)
- 중복 내용 제거, 경로 통일, 예시 간소화

---

### Phase 69: 성능 개선 ✅

**완료일**: 2025-10-12

- Idle Scheduler 구현: `requestIdleCallback` 폴백
- Signal 최적화: 불필요한 재계산 방지
- 컴포넌트 memo: `Toolbar`, `VerticalGalleryView`

---

### Phase 67: 번들 최적화 1차 ✅

**완료일**: 2025-10-13

- 325 KB → 319 KB (1.8% 감소)
- 트리 셰이킹 강화: `sideEffects: false`
- Lazy Icon 최적화: 동적 import

---

### Phase 33: events.ts 최적화 ✅

**완료일**: 2025-10-14

- 이벤트 관리자 재구성
- Abort signal 지원
- 중복 리스너 감지

---

## 메트릭 히스토리

### 빌드 크기 추이

| Phase | 빌드 크기 | Gzipped | 변화 |
|-------|----------|---------|------|
| 시작 | 330.00 KB | 92.00 KB | - |
| Phase 67 | 319.00 KB | 87.50 KB | -11 KB |
| Phase 78 | 320.09 KB | 88.00 KB | +1 KB |
| Phase 77 | 321.40 KB | 88.06 KB | +1.3 KB |

### 테스트 통과율 추이

| Phase | 통과율 | 실패 | Skip |
|-------|--------|------|------|
| Phase 69 | 95.0% | 25 | 12 |
| Phase 75 | 96.5% | 18 | 10 |
| Phase 78 | 97.5% | 12 | 9 |
| Phase 77 | 99.6% | 4 | 9 |

### 테스트 파일 추이

| Phase | 파일 수 | 디렉터리 | 변화 |
|-------|---------|----------|------|
| 시작 | 373 | 23 | - |
| Phase 78 Part 1 | 318 | 23 | -55 |
| Phase 78 Part 3 | 316 | 8 | -2, -15 dirs |
| Phase 78 최종 | 295 | 8 | -21 |

---

## 참고

이전 Phase 상세 기록은 Git history 참조:

- Phase 67-78 상세: `git show <commit-hash>:docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 문서 간소화 전 버전 (1072줄): `docs/TDD_REFACTORING_PLAN_COMPLETED.md.backup`

현재 활성 계획: [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)
"""

# 파일 쓰기
with open("docs/TDD_REFACTORING_PLAN_COMPLETED.md", "w", encoding="utf-8") as f:
    f.write(output)

print("✅ 문서 간소화 완료: 1072줄 → 약 250줄")
print("📊 감소율: 76.7%")
