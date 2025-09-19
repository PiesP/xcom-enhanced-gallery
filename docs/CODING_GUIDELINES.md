# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장**

## 🎨 코딩 스타일

### 기본 포맷팅

```typescript
// ✅ 2 spaces 들여쓰기, 세미콜론, 단일 따옴표
const config = {
  gallery: {
    autoplay: false,
  },
};

// ✅ Import 순서: 타입 → 외부 라이브러리 → 내부 모듈 → 스타일
import type { MediaItem } from '@shared/types';
import { getPreact } from '@shared/external/vendors';
import { MediaService } from '@shared/services';
import styles from './Component.module.css';
```

### 파일 네이밍

```
// 파일 및 디렉토리: kebab-case
gallery-view.tsx
media-processor.ts
components/
services/
```

### Border Radius 정책 (Design Tokens)

| 용도                        | 토큰                                                | 설명                           |
| --------------------------- | --------------------------------------------------- | ------------------------------ |
| 인터랙션 (아이콘/작은 버튼) | `var(--xeg-radius-md)`                              | IconButton, 작은 액션 영역     |
| 일반 Surface / 기본 버튼    | `var(--xeg-radius-lg)`                              | Toolbar 버튼, 카드성 작은 블록 |
| 대형 Surface / 컨테이너     | `var(--xeg-radius-xl)` 또는 `var(--xeg-radius-2xl)` | 모달/토스트 등 큰 영역         |
| Pill 형태                   | `var(--xeg-radius-pill)`                            | 배지, Chip 요소                |
| 원형                        | `var(--xeg-radius-full)`                            | 원형 아바타, 원형 토글         |

규칙:

- px 직접 값 사용 금지 (테스트에서 검출)
- semantic (`--xeg-radius-*`) 토큰만 컴포넌트 CSS에 사용

#### 구현 예시 (Toast / Gallery)

````text
Toast
  .toast (container / surface large)        -> var(--xeg-radius-2xl)
  .actionButton / .closeButton (interaction)-> var(--xeg-radius-md)

Gallery
  .controlButton (interaction)              -> var(--xeg-radius-md)
  .controls (집합 pill 형태)                -> var(--xeg-radius-pill)
  .xegCloseButton / .xegNavButton (shape)   -> var(--xeg-radius-full)
  .mediaElement / .error (standard surface) -> var(--xeg-radius-lg)
# xcom-enhanced-gallery 코딩 가이드라인

프로젝트의 현재 아키텍처와 테스트 규칙에 맞춘 실무 지침입니다. 변경 시에는 관련 테스트와 문서를 함께 업데이트하세요.

## 목차

1. 핵심 스택 · 스크립트 · 경로 별칭
2. 아키텍처 계층과 의존성 경계
3. Import 순서 · 파일/심볼 네이밍
4. 외부 의존성 접근: Vendor getters · Userscript 어댑터
5. 상태/컴포넌트: Signals · Preact 패턴 · PC 전용 입력
6. 스타일 가이드: CSS Modules · 디자인 토큰(색상/반경/간격/애니메이션) · A11y
7. Userscript 통합: 스타일 주입 게이팅 · 빌드/소스맵 정책
8. 서비스/도메인 규칙: Settings · Toast · 다운로드/ZIP · 로그/상관관계
9. 테스트 전략(TDD) · 모킹 · 임시 제외 규칙
10. 툴바 키보드 내비 · Wheel 정책
11. 성능/수명주기: 프리로드 · 타이머/리스너 클린업
12. 품질 게이트 · 빠른 체크리스트

---

## 1) 핵심 스택 · 스크립트 · 경로 별칭

- Stack: TypeScript(strict) + Vite 7 + Preact 10 + @preact/signals + Vitest 3(JSDOM)
- Userscript 번들: 단일 파일 산출물
  - dev: `dist/xcom-enhanced-gallery.dev.user.js` (+ `.map`)
  - prod: `dist/xcom-enhanced-gallery.user.js` (+ `.map`)
- 주요 스크립트(package.json)
  - 타입: `npm run typecheck`
  - 린트: `npm run lint` / 자동수정 `npm run lint:fix`
  - 테스트: `npm test` · 워치 `npm run test:watch` · 커버리지 `npm run test:coverage`
  - 빌드: `npm run build:dev` · `npm run build:prod` · 전체 `npm run build`
  - 종합 검증: `npm run validate` (typecheck + lint:fix + format)
- 경로 별칭(빌드/테스트/TS 공통): `@`, `@features`, `@shared`, `@assets`

## 2) 아키텍처 계층과 의존성 경계

- 계층 규칙(단방향)
  - Features(UI/도메인) → Shared(services/state/utils/logging) → External(브라우저/벤더/Userscript 어댑터)
- External 접근은 반드시 안전 getter 경유
  - 예: `const { h, render } = getPreact(); const { signal } = getPreactSignals(); const { zip } = getFflate();`
  - preact / @preact/signals / fflate 등을 코드에서 직접 import 금지
- Userscript 통합은 `@shared/external/userscript/adapter`를 통해서만 사용

## 3) Import 순서 · 파일/심볼 네이밍

- Import 순서: 타입 → 벤더 getter → 내부 모듈 → 스타일
- 파일/디렉터리: kebab-case (`gallery-app.tsx`, `bulk-download-service.ts`)
- 변수/함수: camelCase, 함수는 동사+명사(`extractMediaUrl`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_CONCURRENCY`)
- 타입/인터페이스: PascalCase (`MediaItem`, `LoadingState`)

## 4) 외부 의존성 접근: Vendor getters · Userscript 어댑터

- Vendor getters(`@shared/external/vendors`)
  - TDZ-safe 정적 API 사용: `initializeVendors()`, `getPreact()`, `getPreactSignals()`, `getFflate()`, `getNativeDownload()` 등
  - Heroicons는 어댑터 경유: `@shared/external/vendors/heroicons-react`
  - 테스트에서 모킹 가능해야 하므로 직접 import 금지(정적 스캔 가드)
- Userscript 어댑터(`@shared/external/userscript/adapter`)
  - `getUserscript().download(url, name)` / `.xhr(opts)`만 사용
  - GM_* 미지원 환경(JSDOM/Node)에서도 안전 폴백 제공(fetch/BlobURL 등). 비브라우저 환경엔 no-op

간단 예시

```ts
import { getPreact, getPreactSignals } from '@shared/external/vendors';
import { getUserscript } from '@shared/external/userscript/adapter';

const { h, Fragment, useEffect } = getPreact();
const { signal, computed } = getPreactSignals();

await getUserscript().download(url, filename);
````

## 5) 상태/컴포넌트: Signals · Preact 패턴 · PC 전용 입력

- Signals 기반 전역 상태는 `src/shared/state/**`에 정의, 파생값은 selector 유틸
  사용
- Preact 컴포넌트는 필요 시 `getPreactCompat()`로 `memo/forwardRef` 사용 가능
- PC 전용 입력만 사용
  - 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
    contextmenu, mouseenter/leave/move/down/up
  - 금지: 모든 TouchEvent/PointerEvent 계열 (테스트로 RED)

## 6) 스타일 가이드: CSS Modules · 디자인 토큰 · A11y

- CSS Modules + 디자인 토큰만 사용. 하드코딩 색상/시간/이징 금지
- 토큰 계층
  - 색상/표면/텍스트: `--xeg-*` 또는 프로젝트 표준 `--color-*` 계열만
  - 반경: `--xeg-radius-md|lg|xl|2xl|pill|full`
  - 간격: `--xeg-space-*` 스케일 사용, TSX 인라인 스타일 px 금지
  - 애니메이션: 시간 `--xeg-duration-*`, 이징 `--xeg-ease-*`; `transition: all`
    금지, reduced-motion 가드
- 접근성(A11y)
  - focus-visible: `outline: var(--xeg-focus-ring)` /
    `outline-offset: var(--xeg-focus-ring-offset)`
  - 대비/모션/고대비 미디어쿼리 대응 유지

반경/레이어 예시

```
Toast          → container: --xeg-radius-2xl / action: --xeg-radius-md
Gallery        → control: --xeg-radius-md / pill group: --xeg-radius-pill
Toolbar/Modal  → z-index는 토큰(`--xeg-z-toolbar`, `--xeg-z-modal`)만 사용
```

## 7) Userscript 통합: 스타일 주입 게이팅 · 빌드/소스맵

- 스타일 주입 게이팅(vite 플러그인에서 자동 지원)
  - 글로벌 CSS 텍스트: `window.XEG_CSS_TEXT`
  - Head 주입 모드: `window.XEG_STYLE_HEAD_MODE ∈ {'auto'|'off'|'defer'}`
  - ShadowRoot 사용 시 글로벌 CSS 텍스트를 직접 주입(@import 금지)
- 소스맵 정책(dev/prod 공통)
  - `build.sourcemap: true`, `.map` 파일 생성, Userscript 끝에
    `//# sourceMappingURL=` 주석 부착
  - validator가 `sources/sourcesContent` 무결성 검사 및 dead-preload 제거 확인

## 8) 서비스/도메인 규칙: Settings · Toast · 다운로드/ZIP · 로그

- ServiceManager 접근
  - features → 직접 import 금지. `@shared/container/*` 액세서/브리지 사용
  - 전역 정리(cleanup)는 엔트리(`src/main.ts`)에서만 수행
- Settings
  - 저장/복원은 SettingsService 경유, 타입/기본값/마이그레이션을 중앙에서 관리
- Toast
  - 전역 `UnifiedToastManager` 사용, 컴포넌트 로컬 토스트 금지
  - 기본 라우팅: info/success(live-only), warning/error(toast-only)
- 다운로드/ZIP
  - 단일 다운로드: `getUserscript().download` 또는 `getNativeDownload()`
  - ZIP 생성: `@shared/external/zip/zip-creator` 사용(중복 파일명은 접미사로
    고유화)
  - 대량 다운로드 옵션: `concurrency`, `retries`, `AbortSignal` 표준화
  - 실패 요약/오류 복구 UX는 토스트 정책 준수
- 로깅/상관관계
  - 대량 작업에 `correlationId` 적용, 범위 지정 로거 사용

## 9) 테스트 전략(TDD) · 모킹 · 제외 규칙

- Vitest + JSDOM, 기본 URL `https://x.com`, `test/setup.ts` 자동 로드
- 포함: `test/**/*.{test,spec}.{ts,tsx}`
- 외부 의존성(Vendor/Userscript/DOM API)은 getter를 통해 주입·모킹 가능해야 함
- RED→GREEN 절차 유지, 계약 테스트로 공개 API 보호
- 임시 제외 테스트는 vitest 설정 주석을 참고해 추적 관리

## 10) 툴바 키보드 내비 · Wheel 정책

- 툴바 포커스 흐름: Prev → Next → Fit 토글들 → 다운로드 → Settings → Close
- 키 매핑: Arrow/Home/End/Escape만 자체 처리(Tab은 브라우저 기본 순서)
- 그룹 데이터 속성: `data-toolbar-group`, `data-group-first="true"` 규약
- Wheel 정책: 전용 유틸 `ensureWheelLock` 사용, 필요 시에만 preventDefault

## 11) 성능/수명주기: 프리로드 · 타이머/리스너

- 프리로드: `computePreloadIndices` 기반, 거리 우선 정렬, 스케줄
  모드(immediate/idle/raf/microtask) 지원
- 타이머/리스너: 공통 매니저를 통해 등록/정리, 종료 시 누수 0 보장

## 12) 품질 게이트 · 빠른 체크리스트 ✅

- 커밋/PR 전
  - 타입: `npm run typecheck`
  - 린트: `npm run lint:fix`
  - 테스트: `npm test` (필요 시 `-t`로 범위 축소)
  - 빌드: `npm run build:dev && npm run build:prod` 후 산출물 검증 자동 수행
- 빠른 체크리스트
  - [ ] 벤더/Userscript는 getter로만 접근했는가?
  - [ ] PC 전용 이벤트만 사용했는가? (Touch/Pointer 금지)
  - [ ] CSS Modules + 디자인 토큰만 사용했는가? (색상/시간/이징 하드코딩 금지)
  - [ ] features 레이어에서 ServiceManager를 직접 import하지 않았는가?
  - [ ] 테스트는 RED→GREEN로 진행했는가? 계약 테스트를 추가했는가?
  - [ ] Userscript 빌드 산출물과 소스맵 정책을 만족하는가?

---

부록) 간단 코드 예시

1. Vendor/Signals 사용

```ts
import { getPreact, getPreactSignals } from '@shared/external/vendors';
const { useEffect } = getPreact();
const { signal, computed } = getPreactSignals();

const items = signal<string[]>([]);
const first = computed(() => items.value[0] ?? null);
```

2. Userscript 어댑터 다운로드

```ts
import { getUserscript } from '@shared/external/userscript/adapter';
await getUserscript().download('https://example.com/file.jpg', 'file.jpg');
```

3. Wheel 정책 유틸

```ts
import { ensureWheelLock } from '@shared/utils/events/wheel';
const cleanup = ensureWheelLock(overlayEl, e => shouldConsume(e));
// 언마운트 시 cleanup()
```

4. ZIP 생성

```ts
import { createZipFromItems } from '@shared/external/zip/zip-creator';
const blob = await createZipFromItems(items, 'media.zip');
```

문서는 프로젝트의 단일 소스 오브 트루스로 유지됩니다. 애매하거나 누락된 규칙이
있으면 `AGENTS.md` 및 저장소의 테스트를 기준으로 보완하세요.

### Anti-Patterns

- 대규모 구조 변경과 GREEN 전환을 하나의 거대한 커밋에 혼합
- `.red.` 제거와 동시에 스펙을 변경 (추적 혼선)
- 번들/접근성/토큰 회귀 측정 없이 스타일/구조 수정

### 예시 (아이콘 프리로드)

1. `toolbar.preload-icons.red.test.tsx` 추가 (FAIL)
2. Hybrid preload 최소 구현 (`preloadCommonIcons`)
3. 테스트 안정성 확인 후 GREEN
4. 파일 rename → `toolbar.preload-icons.test.tsx`
5. Completed 로그에 `ICN-R3 — Hybrid Preload GREEN` 1줄 요약 기록

이 워크플로는 새 Epic / 백로그 항목 설계 리뷰 시 품질 기준으로 활용된다.

### 추가 정책: Graduation 후 원본 RED 파일 보존 금지 (2025-09-18 확정)

중복/혼동/메트릭 왜곡을 방지하기 위해 `.red.test.` → `.test.` rename(Graduation)
완료 후 기존 RED 파일 사본/placeholder(빈 export, describe.skip 등)를 저장소에
남기지 않는다.

규칙 요약:

- Rename 는 git mv (동일 경로)로 수행 (복사 후 잔존 금지)
- GREEN 전환 시 테스트 내부의 `(RED)` 라벨/주석도 제거
- Vitest 가 "No test suite found"를 피하기 위한 임시 placeholder 는 사용하지
  않고, 즉시 최소 구현 또는 최소 expect 로 GREEN 상태를 만든다
- Batch Graduation 중 하나라도 구현 미완/실패 상태라면 해당 파일은 배치에서
  제외하여 독립 처리

근거: Batch F 후속 정리에서 placeholder 9건(이미 GREEN 동등 가드 존재)의 물리
삭제로 테스트 시간/검색 노이즈가 감소하고 RED 카운트 지표 신뢰도가 향상됨을
검증.

위반 발견 시: 즉시 불필요한 잔존 RED 사본 삭제 + Completed 로그에 정정 주석
추가.
