# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 **상태**: Phase 67 Step 3-6 대기 중 🚧

## 프로젝트 상태

- **빌드**: dev 839 KB / prod **317.63 KB** ✅
- **테스트**: 794 passing (763 base + 31 Phase 67), 1 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (**257 modules**, **712 dependencies**) ✅
- **번들 예산**: **317.63 KB / 325 KB** (7.37 KB 여유) ✅

## 디자인 토큰 현황 (2025-10-15)

- **총 토큰**: 107개 (Phase 67 Step 1-2 완료 후, 이전 123개에서 -16개)
- **중복 정의**: 22개 (테마 오버라이드로 정상, Step 2에서 스코프별 검증 완료)
- **미사용**: 0개 ✅ (Phase 67 Step 1 완료)
- **적게 사용됨** (≤2회): 63개 (Toast 15개, Settings 9개 포함)
- **정상 사용**: 44개

## 진행 중 작업

### Phase 67: 디자인 토큰 및 CSS 최적화 (2025-10-15) 🚧

**목표**: 토큰 축소 및 번들 크기 절감 (목표: ~316 KB, 현재 317.63 KB)

**Step 1-2 완료 결과**:

- 토큰 수: 123개 → 107개 (-16개, 13% 감소)
- 번들 크기: 319.25 KB → 317.63 KB (-1.62 KB, 0.5% 감소)
- 미사용 토큰: 16개 → 0개 (100% 제거)
- 중복 정의: 24개 → 22개 (테마 오버라이드로 정상, 스코프별 검증 통과)
- 테스트: 31개 TDD 테스트 추가 (GREEN)

**다음 작업 단계**:

#### Step 3: 적게 사용되는 토큰 검토 및 정책 수립 (진행 중)

**현황 분석** (`node scripts/analyze-alias-tokens.mjs`):

- 1회 사용 토큰: 49개
- 2회 사용 토큰: 14개
- 총 검토 대상: 63개

**설계 원칙 재확인**:

1. **유지보수성 우선**: 번들 크기보다 디자인 시스템 일관성 우선
2. **컴포넌트 응집도**: 1회 사용이라도 컴포넌트 토큰은 유지 검토
3. **현재 번들 상태**: 317.63 KB / 325 KB (2.3% 여유) - 긴급성 낮음
4. **미래 확장성**: Toast/Settings 등 컴포넌트 이식 가능성 고려

**카테고리별 결정**:

**A. 유지 (컴포넌트 토큰, 33개)**:

- Toast 토큰 (15개): 컴포넌트 응집도 유지, 미래 변형 대비
- Settings 토큰 (9개): 독립 컴포넌트, 일관성 유지
- Z-index 토큰 (3개): 전역 스택 컨텍스트 필수
- Layer 토큰 (3개): CSS Cascade Layer 구조
- Focus 토큰 (2개): 접근성 일관성
- High-contrast 토큰 (4개): 접근성 오버라이드

**B. 인라인 검토 (명백한 과도 추상화, 10개)**:

- Counter 토큰 (3개): `bg-counter`, `border-counter`, `text-counter`
  - 사유: gallery-global.css 전용, 재사용 없음
  - 조치: 직접 값으로 인라인
- Radius 토큰 (2개): `radius-xs`, `radius-pill`
  - 사유: 각 1회만 사용, 다른 radius 토큰과 불일치
  - 조치: 사용처에 직접 값 적용
- Glass 효과 (2개): `surface-glass-bg-hover`, `surface-glass-shadow-hover`
  - 사유: isolated-gallery.css에만 사용
  - 조치: 인라인 후 제거
- Error 토큰 (2개): `color-bg-error`, `color-text-error`
  - 사유: VerticalImageItem.module.css에만 사용
  - 조치: 의미론적 토큰으로 대체 검토
- Shadow 토큰 (1개): `shadow-xs`
  - 사유: Button.module.css에만 사용, 다른 shadow 토큰과 불일치
  - 조치: 통합 또는 인라인

**C. 추가 검토 필요 (Button 토큰, 6개)**:

- `button-bg`, `button-border`, `button-bg-hover`, `button-border-hover`
- `button-lift-hover`
- 현황: Gallery.module.css에서만 사용
- 고려사항: 미래에 다른 버튼 스타일 추가 가능성
- 결정 보류: Step 3 분석 후 판단

**예상 결과**:

- 인라인 대상: ~10개 토큰
- 남은 토큰: ~97개 (107 - 10)
- 번들 절감: 약 0.3-0.5 KB (보수적 추정)
- 유지보수성: 컴포넌트 토큰 체계 보존

**TDD 접근**:

1. RED: 인라인 대상 10개 토큰 사용처 검증 테스트
2. GREEN: 토큰을 실제 값으로 인라인 (카테고리별 단계 진행)
3. REFACTOR: design-tokens.semantic.css에서 제거
4. 정책 문서화: CODING_GUIDELINES.md에 토큰 유지 기준 명시

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

**예상 최종 결과**:

- 토큰 수: 123개 → ~95개 (-28개, 약 23% 축소)
- 번들 크기: 319.25 KB → ~316 KB (-3-4 KB)
- 유지보수성: 토큰 중복 제거로 일관성 향상

---

## 최근 완료 작업 (Phase 60-67)

- Phase 67 Step 1-2: 디자인 토큰 최적화 (미사용/중복 토큰 제거) (2025-10-15) ✅
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
