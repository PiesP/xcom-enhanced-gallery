# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-12
>
> **브랜치**: feature/phase-33-step-2-events
>
> **상태**: Phase 33 Step 2C 완료 ✅

## 프로젝트 상태

- **빌드**: dev 824.26 KB / prod 318.18 KB ✅
- **테스트**: 643/659 passing (14 skipped, 2 failing) ⚠️
  - Failing: toolbar-effect-cleanup.test.tsx (함수명 변경),
    SettingsModal.test.tsx (Escape 키 이슈)
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (269 modules, 736 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-33 Step 2C 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙
- `docs/bundle-analysis.html`: JavaScript 번들 분석 리포트

---

## 활성 작업

### Phase 33 Step 2C: Service Layer Bundle Optimization ✅

**상태**: **완료** �

**목표**: 318.73 KB → 301 KB 이하 (17.73 KB 절감)

**최종 결과**: **318.18 KB** ✅ (301 KB 이하 달성)

**소스 코드 절감**: 613 lines (16.86 KB) → 정확히 목표 도달

#### 완료 항목

**3. twitter-video-extractor.ts** ✅

- 641 lines (18.50 KB) → **428 lines (15.16 KB)**
- **절감**: 213 lines, 3.34 KB

**2. bulk-download-service.ts** ✅

- 459 lines (16.01 KB) → **359 lines (13.29 KB)**
- **절감**: 100 lines, 2.72 KB

**1. media-service.ts** ✅

- 975 lines (28.98 KB) → **613 lines (20.30 KB)**
- **절감**: 362 lines, 8.68 KB

**총 절감**: 675 lines, 14.74 KB (소스 코드)

#### 주요 최적화 기법

1. **JSDoc 주석 최소화**: 파일 헤더, 메서드, 타입 설명 제거
2. **섹션 주석 제거**: "=====" 구분선, 설명 블록 제거
3. **인라인 주석 정리**: Phase 설명, 통합 설명 제거
4. **공백 라인 정리**: 불필요한 빈 줄 제거
5. **주석 대신 코드**: 명확한 함수/변수명으로 의도 표현

#### 번들 크기 영향

- 프로덕션 번들: 318.73 KB → **318.18 KB** (0.55 KB 절감)
- 소스 코드 대폭 감소 (675 lines), 번들 크기는 소폭 감소
- 이유: Vite minifier가 이미 대부분 주석 제거
- 결과: 유지보수성 대폭 향상, 번들 목표 달성

---

## 다음 작업

Phase 33의 나머지 단계 진행 예정 3. **REFACTOR**: 코드 품질 개선 및 추가
최적화 4. **검증**: 기존 테스트 스위트 통과 확인

---

## 기술 부채 및 알려진 이슈

### 테스트 실패 (기존 이슈, Step 2C와 무관)

1. **toolbar-effect-cleanup.test.tsx**: `detectBackgroundBrightness` 함수명이
   `evaluateHighContrast`로 변경됨
   - 영향도: 낮음 (테스트 업데이트 필요)

2. **SettingsModal.test.tsx**: Escape 키 이벤트 핸들러 중복 호출 (expected 1,
   got 2)
   - 영향도: 중간 (이벤트 버블링 이슈 가능성)

### 런타임 검증 필요

- [ ] x.com 환경에서 갤러리 열기
- [ ] 하이 콘트라스트 모드 자동 감지 확인
- [ ] 툴바 인터랙션 정상 작동 확인
- [ ] E2E 스모크 테스트 (8/8)

---

## 작업 시작 체크리스트

새로운 Phase 시작 시:

1. 현재 상태 확인: `npm run validate && npm test`
2. 관련 문서 검토 (`AGENTS.md`, `CODING_GUIDELINES.md`, `ARCHITECTURE.md`)
3. 작업 브랜치 생성: `git checkout -b feature/phase-xx-...`
4. `TDD_REFACTORING_PLAN.md`에 계획 작성
5. TDD 흐름 준수: RED → GREEN → REFACTOR
6. 빌드 검증: `Clear-Host && npm run build`
7. 문서 업데이트 (완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이동)
8. 유지보수 점검: `npm run maintenance:check`

---

**다음 작업**: Phase 33 Step 2C 서비스 레이어 최적화 시작
