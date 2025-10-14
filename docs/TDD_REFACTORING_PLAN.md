# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 **상태**: Phase 67 Step 4-6 대기 중 🚧

## 프로젝트 상태

- **빌드**: dev 839 KB / prod **317.00 KB** ✅
- **테스트**: 794 passing (763 base + 42 Phase 67), 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **712 dependencies**) ✅
- **번들 예산**: **317.00 KB / 325 KB** (8.00 KB 여유) ✅

## 디자인 토큰 현황 (2025-10-15)

- **총 토큰**: 89개 (Phase 67 Step 1-3 완료 후, 이전 123개에서 -34개)
- **중복 정의**: 20개 (테마 오버라이드로 정상, Step 2에서 스코프별 검증 완료)
- **미사용**: 0개 ✅ (Phase 67 Step 1 완료)
- **적게 사용됨** (≤2회): 53개 (Toast 15개, Settings 9개 포함, Step 3 유지 결정)
- **정상 사용**: 36개

## 진행 중 작업

### Phase 67: 디자인 토큰 및 CSS 최적화 (2025-10-15) 🚧

**목표**: 토큰 축소 및 번들 크기 절감 (목표: ~316 KB, 현재 317.63 KB)

**Step 1-3 완료 결과**:

- 토큰 수: 123개 → 89개 (-34개, 27.6% 감소)
- 번들 크기: 319.25 KB → 317.00 KB (-2.25 KB, 0.7% 감소)
- 미사용 토큰: 16개 → 0개 (100% 제거)
- 저사용 토큰: 63개 → 53개 (10개 인라인, 53개 유지 결정)
- 중복 정의: 24개 → 20개 (테마 오버라이드로 정상, 스코프별 검증 통과)
- 테스트: 42개 TDD 테스트 추가 (30 Step 1 + 1 Step 2 + 11 Step 3, 전체 GREEN)

**Step 3 세부 내역** (2025-10-15 완료):

**인라인 완료 (10개)**:

- Counter 토큰 (3개): `bg-counter`, `border-counter`, `text-counter`
  - 조치: gallery-global.css에서 semantic 토큰으로 대체
- Radius 토큰 (2개): `radius-xs` (2px), `radius-pill` (28px)
  - 조치: 사용처에 직접 값 적용 (gallery-global.css, Gallery.module.css)
- Glass 효과 (2개): `surface-glass-bg-hover`, `surface-glass-shadow-hover`
  - 조치: isolated-gallery.css에 literal 값 인라인
- Error 토큰 (2개): `color-bg-error`, `color-text-error`
  - 조치: VerticalImageItem.module.css에서 semantic `--color-error-bg`,
    `--color-error`로 대체
- Shadow 토큰 (1개): `shadow-xs`
  - 조치: Button.module.css에 literal rgba 값 인라인

**유지 결정 (53개)**:

- Toast 토큰 (15개): 컴포넌트 응집도 유지, 미래 변형 대비
- Settings 토큰 (9개): 독립 컴포넌트, 일관성 유지
- Button 토큰 (6개): 미래 버튼 스타일 확장 가능성
- Z-index 토큰 (3개): 전역 스택 컨텍스트 필수
- Layer 토큰 (3개): CSS Cascade Layer 구조
- Focus 토큰 (2개): 접근성 일관성
- High-contrast 토큰 (4개): 접근성 오버라이드
- 기타 semantic/component 토큰 (11개)

**설계 원칙 적용**:

1. **유지보수성 우선**: 번들 크기보다 디자인 시스템 일관성 우선
2. **컴포넌트 응집도**: 1회 사용이라도 컴포넌트 토큰은 유지
3. **명백한 과도 추상화만 제거**: 재사용 없는 gallery 전용 토큰만 인라인
4. **미래 확장성**: Toast/Settings 등 컴포넌트 이식 가능성 고려

**TDD 검증**:

- 11개 신규 테스트 (총 42개)
- Counter/Radius/Glass/Error/Shadow 인라인 검증
- Toast/Settings/Button/Architecture 토큰 유지 검증
- 토큰 수 목표 달성 확인 (107 → 89, 목표 ≤97)
- 전체 테스트 GREEN ✅

**다음 작업 단계**:

#### Step 4: CSS 중복 규칙 분석 (대기 중)

**대상 파일**:

- `src/**/*.module.css` (CSS Modules)
- `src/shared/styles/*.css` (전역 스타일)

**분석 도구**:

- 수동 검토 + grep 패턴 검색
- 중복 선택자, 중복 속성 값 탐색

**목표**: 1-2 KB 절감

#### Step 5: SVG/아이콘 최적화 검토 (대기 중)

**분석**:

- `src/assets/**/*.svg` 파일 목록 및 크기
- 스프라이트화 가능성
- SVGO 압축 적용 검토

**목표**: 0.5-1 KB 절감

#### Step 6: 빌드 검증 및 문서 갱신 (대기 중)

**검증 항목**:

- `npm run validate` (typecheck + lint + format)
- `npm test` (전체 테스트 스위트)
- `npm run build` (dev + prod 빌드)
- 번들 크기 측정 및 비교

**문서 갱신**:

- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 67 완료 이력
- `TDD_REFACTORING_PLAN.md`: 백로그 업데이트
- `CODING_GUIDELINES.md`: 토큰 정책 갱신 (필요시)

**예상 최종 결과** (Step 4-6 완료 시):

- 토큰 수: 123개 → 89개 (-34개, 약 27.6% 축소) ✅ 달성
- 번들 크기: 319.25 KB → ~315-316 KB (Step 4-5로 추가 -2-3 KB 목표)
- 유지보수성: 컴포넌트 토큰 응집도 보존, 과도 추상화만 제거

---

## 최근 완료 작업 (Phase 60-67)

- Phase 67 Step 1-3: 디자인 토큰 최적화 (34개 토큰 제거) (2025-10-15) ✅
- Phase 66 Part 2: Focus Tracker Container Accessor Null 처리 (2025-10-14) ✅
- Phase 66 Part 1: Toolbar 순환 네비게이션 수정 (2025-10-14) ✅
- Phase 65: Orphan 파일 정리 (2025-01-27) ✅
- Phase 64: 포커스 트래킹 및 네비게이션 동기화 (2025-10-14) ✅
- Phase 62-63: 툴바 네비게이션 및 인덱스 관리 (2025-01-27) ✅
- Phase 61: 갤러리 스크롤 동작 정리 (2025-10-14) ✅

상세 이력은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참고

---

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙
- `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 기록 (Phase 67 Step 1-2
  포함)
- `TDD_REFACTORING_PLAN_Phase63.md`: Phase 63 상세 계획 (아카이브)
