# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-01-27
>
> **브랜치**: master
>
> **상태**: Phase 33 Step 2 준비 중 ⏸️

## 프로젝트 상태

- **빌드**: dev 831.69 KB / prod 320.73 KB (gzip 87.40 KB) ✅
- **테스트**: 634/659 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (266 modules, 732 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-33 (Step 1) 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙
- `docs/bundle-analysis.html`: JavaScript 번들 분석 리포트 (Phase 33 Step 1)

---

## 활성 작업

### Phase 33 Step 2: JavaScript Bundle Optimization (준비 중)

**현재 상태**: Step 1 (분석 완료) ✅ → Step 2 (구현 대기) ⏸️

**목표**: 320.73 KB → 301 KB 이하 (19.5 KB 절감)

**구현 계획**:

**A. 이벤트 핸들링 최적화** (19.28 KB → 15 KB, **4 KB 절감**)

- RED: `events.ts` 크기 가드 테스트 작성
- GREEN: 과도한 추상화 제거, 미사용 유틸리티 정리
- REFACTOR: 인라인 가능한 단순 함수 인라인화

**B. 컴포넌트 최적화** (41.52 KB → 35 KB, **6.5 KB 절감**)

- 대상: `Toolbar.tsx` (14.99 KB), `VerticalImageItem.tsx` (13.80 KB),
  `SettingsModal.tsx` (12.73 KB)
- RED: 컴포넌트별 크기 가드 테스트
- GREEN: 중복 로직 통합, Props 패턴 단순화
- REFACTOR: 불필요한 memo/effect 제거

**C. 서비스 레이어 최적화** (59.11 KB → 50 KB, **9 KB 절감**)

- 대상: `media-service.ts` (21.58 KB), `twitter-video-extractor.ts` (13.87 KB),
  `bulk-download-service.ts` (11.87 KB)
- RED: 서비스별 크기 가드 테스트
- GREEN: 전략 패턴 재검토, 팩토리 인라인화
- REFACTOR: 미사용 추출 전략 제거

**검증 체크리스트**:

- [ ] 각 최적화 후 빌드 크기 측정 (`python scripts/analyze-bundle.py`)
- [ ] 전체 테스트 스위트 통과 (634/659)
- [ ] E2E 스모크 테스트 통과 (8/8)
- [ ] 타입 오류 없음 (`npm run typecheck`)
- [ ] 기능 회귀 없음 (수동 확인)

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

**현재 프로젝트는 안정 상태입니다. Phase 33 Step 2가 다음 작업입니다.**
