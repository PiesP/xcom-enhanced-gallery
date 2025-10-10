# 🏗️ 아키텍처 개요 (xcom-enhanced-gallery)

> Solid.js 기반 Userscript의 3계층 구조와 의존성 경계 코딩
> 규칙/스타일/토큰/테스트 정책은 중복 없이 `docs/CODING_GUIDELINES.md`를 단일
> 기준으로 참조하세요.

이 문서는 코드 작성 가이드(CODING_GUIDELINES)와 별개로, 상위 수준의 시스템
구조와 계층 간 경계를 설명합니다. 구현 규칙/토큰/스타일은
`docs/CODING_GUIDELINES.md`를 참고하세요.

## 계층 구조와 단방향 의존

- Features → Shared(services/state/utils/logging) → External(adapter/vendors)
- 단방향 의존만 허용: Features는 Shared까지만, Shared는 External까지만
  접근합니다.
- Vendors/Userscript는 반드시 안전 getter 경유:
  - Vendors: `@shared/external/vendors`의 `getSolid()`/`getSolidStore()`
  - Userscript: `@shared/external/userscript/adapter`의 `getUserscript()`

## 디렉터리 지도(요약)

- `src/features/*`: UI/도메인 기능, 신호 구독과 사용자 인터랙션 처리
- `src/shared/services/*`: 순수 로직 API, 파일명/미디어/ZIP/토스트/테마 등
- `src/shared/state/*`: Signals 상태 및 파생값(`useSignalSelector`)
- `src/shared/utils/*`: 순수 유틸리티, DOM 헬퍼(서비스 직접 참조 금지)
- `src/shared/external/*`: 벤더/Userscript 어댑터, ZIP 생성기 등 외부 연동
- `src/assets/*`: 정적 자원, CSS Modules

## 컴포넌트/서비스 경계 원칙

- UI는 가능한 얇게: wiring+presentational 분리, 상태는 shared/state 신호로 이동
- 서비스는 테스트 친화: 외부 의존은 adapter getter로 주입 가능해야 함
- 이벤트는 PC 전용: click, keydown/up(Arrow, Home/End, Escape, Space), wheel,
  contextmenu, mouse\*

## 테스트 전략 개요

- Vitest + JSDOM, 기본 URL https://x.com
- 외부 의존은 getter를 통해 모킹 가능해야 함
- 새 기능: 실패 테스트 → 최소 구현 → 리팩토링(RED→GREEN)

## 의존성 정책과 가드(개요)

- direct vendor import 금지, 순환 의존 금지, 내부 배럴 역참조 금지
- 모든 정책은 dependency-cruiser와 정적 테스트로 강제됩니다. 상세 정책은
  `docs/DEPENDENCY-GOVERNANCE.md`를 참고하세요.

---

문서 역할 분리: 이 파일은 구조/경계/지도에 집중합니다. 세부 코딩 규칙, 디자인
토큰, 테스트 정책은 `CODING_GUIDELINES.md`로 분리되어 있습니다.
