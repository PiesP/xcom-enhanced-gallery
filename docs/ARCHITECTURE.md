# 🏗️ 아키텍처 개요 (xcom-enhanced-gallery)

> Solid.js 기반 Userscript의 3계층 구조와 의존성 경계 최종 업데이트: 2025-10-25
> 코딩 규칙/스타일/토큰/테스트 정책은 `docs/CODING_GUIDELINES.md`를 단일
> 기준으로 참조하세요.

이 문서는 코드 작성 가이드(CODING_GUIDELINES)와 별개로, 상위 수준의 시스템
구조와 계층 간 경계를 설명합니다. 구현 규칙/토큰/스타일은
`docs/CODING_GUIDELINES.md`를 참고하세요.

## 프로젝트 현황 (2025-10-25)

- **빌드**: prod 339.55 KB / 420 KB (80.45 KB 여유) ✅
- **테스트**: Browser 111, E2E 60/61(1 skipped), a11y 34, 단위 전체 GREEN ✅
- **아키텍처**: 3계층 구조, 0 dependency violations ✅
- **번들러**: Vite 7 + Solid.js 1.9.9 + TypeScript strict

## 계층 구조와 단방향 의존

- **Features** → **Shared**(services/state/utils/logging) →
  **External**(adapter/vendors)
- 단방향 의존만 허용: Features는 Shared까지만, Shared는 External까지만
  접근합니다.
- Vendors/Userscript는 반드시 안전 getter 경유:
  - Vendors: `@shared/external/vendors`의 `getSolid()`/`getSolidStore()`
  - Userscript: `@shared/external/userscript/adapter`의 `getUserscript()`

## 디렉터리 지도(요약)

- `src/features/*`: UI/도메인 기능, 신호 구독과 사용자 인터랙션 처리
  - `gallery/`: 메인 갤러리 UI, 키보드 네비게이션, 수직 스크롤
  - `settings/`: 설정 UI, 스토리지 어댑터, 마이그레이션
- `src/shared/services/*`: 순수 로직 API
  - 미디어: `MediaService`, `BulkDownloadService`, `media-extraction/`,
    `media-mapping/`
  - UX: `UnifiedToastManager`, `ThemeService`, `AnimationService`
- `src/shared/state/*`: Signals 상태 및 파생값(`signalSelector`)
- `src/shared/utils/*`: 순수 유틸리티, DOM 헬퍼(서비스 직접 참조 금지)
- `src/shared/external/*`: 벤더/Userscript 어댑터, ZIP 생성기 등 외부 연동
- `src/assets/*`: 정적 자원, CSS Modules, 디자인 토큰(3계층)

## 컴포넌트/서비스 경계 원칙

- **UI는 가능한 얇게**: wiring+presentational 분리, 상태는 shared/state 신호로
  이동
- **서비스는 테스트 친화**: 외부 의존은 adapter getter로 주입 가능해야 함
- **이벤트는 PC 전용**: 세부 사항은 `docs/CODING_GUIDELINES.md` 참조

## 디자인 토큰

프로젝트는 3계층 디자인 토큰 시스템을 사용합니다 (Primitive → Semantic →
Component). **상세 규칙**: `docs/CODING_GUIDELINES.md`의 "디자인 토큰 체계" 섹션
참조

## 테스트 전략 개요

**레이어**:

- **Static Analysis**: TypeScript, ESLint, stylelint, CodeQL
- **Unit Tests**: Vitest + JSDOM (순수 함수, 서비스 로직)
- **Browser Tests**: Vitest + Chromium (Solid.js 반응성, 실제 DOM)
- **E2E Tests**: Playwright (사용자 시나리오, 하네스 패턴)
- **Guards**: test/guards/project-health.test.ts (현재 상태 검증)

**원칙**:

- **Vitest + JSDOM**, 기본 URL <https://x.com>
- **외부 의존은 getter를 통해 모킹** 가능해야 함
- **TDD 원칙**: 실패 테스트 → 최소 구현 → 리팩토링(RED→GREEN→REFACTOR)
- **커버리지**: 단위/통합/E2E(Playwright)/접근성(axe-core) 포함

**아카이브 정책**:

- 완료된 Phase 및 비효율적 패턴의 테스트는 `test/archive/`로 이동
- CI/로컬 테스트에서 제외, 참고용 보관
- 상세: `test/archive/README.md` / `docs/TESTING_STRATEGY.md`

## 의존성 정책과 가드(개요)

- direct vendor import 금지, 순환 의존 금지, 내부 배럴 역참조 금지
- 모든 정책은 **dependency-cruiser**와 정적 테스트로 강제됩니다.
- 상세 정책은 `docs/DEPENDENCY-GOVERNANCE.md`를 참고하세요.

---

**문서 역할 분리**: 이 파일은 구조/경계/지도에 집중합니다. 세부 코딩 규칙,
디자인 토큰, 테스트 정책은 `CODING_GUIDELINES.md`와 `TESTING_STRATEGY.md`로
분리되어 있습니다.
