# TDD 리팩토링 완료 기록

> **최종 업데이트**: 2025-10-12
>
> **상태**: Phase 1-30 완료 ✅

## 프로젝트 상태 스냅샷 (2025-10-12)

- **빌드**: dev 741.61 KB / prod 320.73 KB (gzip 87.39 KB) ✅
- **테스트**: Vitest 634/659 (24 skipped, 1 todo), Playwright 8/8 ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings / 0 errors ✅
- **의존성**: dependency-cruiser violations 0 ✅

## 최근 완료 Phase

### Phase 31: Prod Bundle Budget Recovery (2025-10-12)

**배경**: `npm run maintenance:check` 결과 prod 번들 원본 크기 334.68 KB로 팀
예산(325 KB)을 초과. 향후 기능 추가 전 안전 여유 확보 필요.

**목표**: prod userscript 원본 ≤ 325 KB, gzip ≤ 95 KB 유지, 기능/테스트 회귀
없음.

**구현 내역**:

1. **Logger dev/prod 분기 강화**: `src/shared/logging/logger.ts`가
   `import.meta.env.DEV` 신호로 프로덕션에서 `debug/time/timeEnd`를 완전 NOOP
   처리하도록 재구성.
2. **Babel transform 추가**: `vite.config.ts`에 `stripLoggerDebugPlugin` 도입,
   프로덕션 빌드 전 Babel AST 방문으로 `.debug(...)` 호출을 제거해 문자열/브랜치
   제거.
3. **빌드 검증**: `scripts/validate-build.js`의 raw size guard(325 KB hard
   limit, 320 KB soft warning) 통과 확인, prod 320.73 KB (gzip 87.39 KB) 달성.
4. **테스트 회귀 확인**: `test/unit/shared/logging/logger.test.ts`로 dev 풍부한
   로깅 / prod squelch 동작 검증, Vitest 2/2 ✅.
5. **유지보수 점검**: `npm run maintenance:check` 모든 항목 정상, 프로덕션 빌드
   예산 준수.

**결과**: prod raw 크기 334.68 KB → 320.73 KB (~13.95 KB 절감, 4.2% 감소), gzip
91 KB → 87.39 KB. 325 KB 예산 대비 4.27 KB 여유 확보, 향후 기능 추가 공간 확보.

### Phase 30: Toolbar Focus Preview Rollback (2025-10-12)

- `Toolbar`·`ToolbarWithSettings`에서 프리뷰 props와 memoized 상태를 제거하고,
  CSS 모듈의 프리뷰 클래스와 타입 정의를 정리하여 UI를 Phase 28 이전 구성으로
  복원.
- `VerticalGalleryView`에서 프리뷰 메모 및 설정 구독 로직을 삭제하고 언어 서비스
  번역 항목을 정리하여 포커스 카운터만 남도록 단순화.
- `test/features/gallery/toolbar-focus-indicator.test.tsx`를 RED→GREEN 흐름으로
  갱신해 프리뷰 DOM 미노출과 카운터 aria-live 유지, 포커스 인덱스 동기화를 단언.
- `npx vitest run test/features/gallery/toolbar-focus-indicator.test.tsx`와
  `Clear-Host && npm run build`로 변경 사항을 검증.

### Phase 29: Toolbar Focus Indicator Preview (2025-10-12)

- 갤러리에서 포커스된 미디어 썸네일/설명을 메모이제이션하고 설정 구독으로
  `focusIndicatorsEnabled` 상태를 동기화.
- `Toolbar`에 프리뷰 `<figure>`를 추가해 이미지, 캡션, `aria-live="polite"`
  안내를 제공하고 skeleton 스타일을 적용.
- 언어 서비스 및 CSS 모듈을 확장하고, feature/fast 테스트 프로젝트에 프리뷰 검증
  스위트를 추가.

### Phase 28: 자동/수동 스크롤 충돌 방지 (2025-01-15)

- 사용자 스크롤 감지 후 자동 스크롤을 일시 차단하고, 500ms idle 이후 복구.
- `VerticalGalleryView` 스크롤 effect를 정리하고 회귀 테스트를 확장.

### Phase 27: Storage Adapter 패턴 (2025-01-15)

- Userscript/브라우저 겸용 StorageAdapter를 도입하고 서비스 계층을 주입 가능
  구조로 리팩토링.
- Vitest 20건 추가로 저장소 경계 테스트를 보강.

## Phase 하이라이트

- **Phase 1-6**: Solid.js 전환, 테스트 인프라(Vitest/Playwright) 구축, ARIA
  접근성 기본 가드 확립.
- **Phase 7-12**: 갤러리 UX 개선, 키보드 내비게이션 강화, E2E 회귀 커버리지
  추가.
- **Phase 13-20**: 정책/최적화(아이콘 규칙, 애니메이션/휠 이벤트 정비, 콘솔
  가드), 성능 튜닝.
- **Phase 21**: IntersectionObserver 무한 루프 제거, fine-grained signals로
  갤러리 상태 재구성, 부수 효과 최적화.
- **Phase 22**: `constants.ts` 리팩토링으로 상수/타입 일원화 및 코드 37% 감소.
- **Phase 23**: DOMCache 아키텍처 재설계, selector registry 중앙화.
- **Phase 24**: 파일명 kebab-case 일괄 전환 및 lint/test 가드 신설.
- **Phase 25**: 휠 스크롤 배율 제거로 브라우저 기본 동작 위임, 번들 -3 KB.
- **Phase 26**: 파일명 정책을 문서+테스트로 강제, phase별 naming guard 확장.
- **Phase 27**: StorageAdapter 패턴 도입, 서비스/테스트 격리 완성.
- **Phase 28**: 사용자 스크롤과 자동 스크롤 충돌 방지 로직 도입.
- **Phase 29**: Toolbar 포커스 프리뷰와 접근성 안내 추가, 설정/테스트 연동.
- **Phase 30**: Toolbar 포커스 프리뷰 롤백, Phase 28 이전 심플 디자인 복원.
- **Phase 31**: Logger dev/prod 분기 + Babel transform으로 prod 번들 13.95 KB
  절감 (334.68 → 320.73 KB).

## 참고 문서

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CODING_GUIDELINES.md`
- `docs/EVALUATION_TOOLBAR_INDICATOR.md`
- Git 기록 및 Vitest/Playwright 보고서
