# GitHub Copilot 개발 지침 (xcom-enhanced

---

## 아키텍처 원칙 (불변 규칙)

### 3-Layer 경계

```
Features (UI/도메인 로직)
    ↓ 단방향 의존
Shared (서비스/상태/유틸리티)
    ↓ 단방향 의존
External (벤더/Userscript/ZIP 어댑터)
```

**Features 계층** (`src/features/**`):

- 역할: SolidJS 컴포넌트, 이벤트 핸들링, 상태 구독/표시
- 예: `gallery/`, `settings/`, `notifications/`

**Shared 계층** (`src/shared/**`):

- 역할: 순수 서비스 로직, 상태 관리, 유틸리티
- 예: `services/`, `state/`, `hooks/`, `utils/`, `logging/`

**External 계층** (`src/shared/external/**`):

- 역할: 외부 종속성 캡슐화 (TDZ-safe, 테스트 모킹 용이)
- 예: `vendors/`, `userscript/`, `zip/`

### 벤더 라이브러리 접근 (필수 패턴)

**✅ 올바른 방법 (getter 사용)**:

```typescript
import { getSolidCore, getSolidWeb, getFflate } from '@shared/external/vendors';

const solid = getSolidCore();
const { createSignal, createEffect, onCleanup } = solid;

const { render } = getSolidWeb();

const { zip } = getFflate();
```

**❌ 금지 (직접 import)**:

```typescript
// 절대 하지 마세요!
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { zip } from 'fflate';
```

**이유**:

- TDZ(Temporal Dead Zone) 안전성 보장
- 테스트에서 쉽게 모킹 가능
- Userscript 환경 초기화 타이밍 제어

### Userscript API 접근

**✅ 올바른 방법 (adapter 사용)**:

```typescript
import { getUserscript } from '@shared/external/userscript/adapter';

await getUserscript().download(url, filename);
const response = await getUserscript().xhr({ url, method: 'GET' });
```

**❌ 금지 (직접 GM\_\* 사용)**:

```typescript
// 절대 하지 마세요!
GM_download(url, filename);
GM_xmlhttpRequest({ url });
```

### 상태 관리

**권장 (SolidJS Native)**:

```typescript
import { getSolidCore } from '@shared/external/vendors';

const solid = getSolidCore();
const [count, setCount] = solid.createSignal(0);
const doubled = solid.createMemo(() => count() * 2);
```

**레거시 (신규 코드 금지)**:

- `createGlobalSignal` — 기존 코드 유지만 허용, 신규 사용 금지

---

## 입력 이벤트 제약 (PC 전용 설계)

### ✅ 허용되는 이벤트

- 마우스: `click`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`,
  `mousemove`, `wheel`, `contextmenu`
- 키보드: `keydown`, `keyup` (ArrowLeft/Right, Home/End, Escape, Space 등)

### ❌ 금지되는 이벤트 (테스트에서 RED 처리)

- 터치: `touchstart`, `touchmove`, `touchend`, `touchcancel`
- 포인터: `pointerdown`, `pointerup`, `pointermove`, `pointerenter`,
  `pointerleave`, `pointercancel`
- 제스처 전용 이벤트

**린트 규칙**:

- JSX에서 `onTouch*`, `onPointer*` 사용 시 오류
- `addEventListener`에서 `'touch*'`, `'pointer*'` 사용 시 오류

**키보드 처리 가이드**:

- 네비게이션 키 처리 시 **목적 동작에 한해서만** `preventDefault()` 호출
- 예: 갤러리 화살표 키 네비게이션 시 스크롤 충돌 방지

---

## 스타일 규칙 (디자인 토큰 필수)

### CSS Modules + 디자인 토큰만 사용

**✅ 올바른 방법**:

```css
.container {
  background: var(--xeg-bg-primary);
  color: var(--xeg-text-primary);
  border-radius: var(--xeg-radius-md);
  transition: var(--xeg-transition-fast);
}
```

**❌ 금지 (하드코딩)**:

```css
.container {
  background: #1a1a1a; /* 절대 하지 마세요! */
  color: rgb(255, 255, 255); /* 절대 하지 마세요! */
  border-radius: 8px; /* 절대 하지 마세요! */
  transition: all 0.2s ease; /* 절대 하지 마세요! */
}
```

**사용 가능한 토큰 프리픽스**:

- 색상: `--xeg-*`, `--color-*`
- 레이아웃: `--xeg-spacing-*`, `--xeg-radius-*`
- 애니메이션: `--xeg-transition-*`, `--xeg-duration-*`

**참조**: `docs/CODING_GUIDELINES.md` 디자인 토큰 섹션

---

## TDD 워크플로 (필수)

### RED → GREEN → REFACTOR

**1. RED (실패하는 테스트 작성)**:

```typescript
import { describe, it, expect } from 'vitest';

describe('MediaService', () => {
  it('should extract media URLs from tweet data', () => {
    const result = extractMediaUrls(mockTweetData);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('https://pbs.twimg.com');
  });
});
```

**2. GREEN (최소 구현)**:

```typescript
export function extractMediaUrls(data: TweetData): string[] {
  return data.media?.map(m => m.url) ?? [];
}
```

**3. REFACTOR (개선)**:

- 타입 안전성 강화
- 에러 처리 추가
- 성능 최적화

### 테스트 환경

- 환경: JSDOM, 기본 URL `https://x.com`
- 설정: `test/setup.ts` 자동 로드 (폴리필/GM\_\* 모킹/벤더 초기화)
- 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`
- 타임아웃: 테스트 20s, 훅 25s

### 테스트 명령어

```pwsh
npm test                    # 전체 테스트 실행
npm run test:watch          # watch 모드
npm run test:coverage       # 커버리지 리포트
npm run test -- -t "..."    # 특정 테스트 필터
npx vitest run <file>       # 특정 파일만 실행
```

### 외부 의존성 모킹

**벤더 모킹**:

```typescript
import { vi } from 'vitest';
import * as vendors from '@shared/external/vendors';

vi.spyOn(vendors, 'getSolidCore').mockReturnValue({
  createSignal: vi.fn(),
  createEffect: vi.fn(),
});
```

**Userscript 모킹**:

```typescript
import * as adapter from '@shared/external/userscript/adapter';

vi.spyOn(adapter, 'getUserscript').mockReturnValue({
  download: vi.fn().mockResolvedValue(undefined),
});
```

---

## 구현 컨벤션

### Import 순서 (필수)

```typescript
// 1. 타입 import
import type { MediaItem, TweetData } from '@shared/types';

// 2. 외부 라이브러리 getter
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { getUserscript } from '@shared/external/userscript/adapter';

// 3. 내부 모듈
import { MediaService } from '@shared/services';
import { logInfo, logError } from '@shared/logging';

// 4. 스타일
import styles from './Component.module.css';
```

### 네이밍 규칙

- **파일/디렉터리**: kebab-case (`gallery-app.tsx`, `media-service.ts`)
- **변수/함수**: camelCase (`mediaItems`, `extractMediaUrl`)
- **함수**: 동사+명사 (`getMediaUrl`, `createGallery`, `handleClick`)
- **상수**: SCREAMING_SNAKE_CASE (`MAX_CONCURRENCY`, `DEFAULT_TIMEOUT`)
- **타입/인터페이스**: PascalCase (`MediaItem`, `GalleryState`)
- **컴포넌트**: PascalCase (`GalleryApp`, `MediaCounter`)

### 로깅

```typescript
import { logInfo, logError, logDebug, logWarn } from '@shared/logging';

logInfo('Gallery initialized', { itemCount: 5 });
logError('Download failed', { url, error });
logDebug('State updated', { newState });
logWarn('Deprecated API used', { api: 'createGlobalSignal' });
```

### 다운로드/ZIP

**단일 파일 다운로드**:

```typescript
import { getUserscript } from '@shared/external/userscript/adapter';

await getUserscript().download(url, filename);
```

**ZIP 다운로드**:

```typescript
import { createZipFromItems } from '@shared/external/zip/zip-creator';

await createZipFromItems(mediaItems, {
  onProgress: (current, total) => console.log(`${current}/${total}`),
});
```

**❌ 금지 (직접 `<a>` 태그 조작)**:

````typescript
// 절대 하지 마세요!
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
``` X.com 미디어 뷰어/다운로더 • SolidJS Userscript • TDD 우선 • 엄격한 품질 게이트

## 프로젝트 정체성

**목적**: X.com(구 Twitter) 미디어를 향상된 갤러리 UI로 보고 다운로드하는
Userscript
**핵심 가치**: 타입 안전성 · 테스트 가능성 · 접근성 · PC 전용 UX · 품질 우선

**기술 스택**:

- **언어/빌드**: TypeScript 5.9 (strict) + Vite 7
- **UI**: SolidJS 1.9 (vDOM, Light DOM 전용)
- **테스트**: Vitest 3 (JSDOM, 기본 URL `https://x.com`)
- **산출물**: 단일 `.user.js` 번들 + 소스맵 (dev/prod)

**경로 별칭**:

- `@` → `src/`
- `@features` → `src/features/`
- `@shared` → `src/shared/`
- `@assets` → `src/assets/`

**필수 명령어**:

```pwsh
npm run typecheck         # 타입 체크
npm run lint:fix          # 린트 + 자동 수정
npm run format            # Prettier
npm run validate          # 종합 검증 (typecheck + lint + format)
npm test                  # 전체 테스트
npm run build:dev         # 개발 빌드
npm run build:prod        # 프로덕션 빌드
npm run build             # dev + prod + 검증
````

## 아키텍처와 경계

- 3 계층: `features/`(도메인 UI/기능) → `shared/`(services/state/utils/logging)
  → `external/`(브라우저/벤더/유저스크립트 어댑터)
- 외부 라이브러리 접근은 오직 getter 경유: `@shared/external/vendors`가 안전
  API를 제공(TDZ-safe, 모킹 용이)
  - 예)
    `const solid = getSolidCore(); const { createSignal, createEffect } = solid; const { zip } = getFflate();`
  - 직접 import 금지: `solid-js`, `fflate` 등을 코드에서 바로 import 하지 마세요
- Userscript 통합: `shared/external/userscript/adapter.ts`에서 GM\_\* 안전
  래핑(`getUserscript()`), Node/Vitest에서 fallback 제공

### Features 계층 지도와 서비스 경계(요약)

- Features: `gallery/`(주요 UI) · `settings/`(환경설정 UI)
  - 예: `features/gallery/GalleryApp.ts`, `GalleryRenderer.ts`,
    `components/vertical-gallery-view/*`
- Shared Services(순수 로직/API): `shared/services/`
  - Media/다운로드: `MediaService.ts`, `BulkDownloadService.ts`
  - 매핑/추출: `media-extraction/*`, `media-mapping/*`
  - UX: `UnifiedToastManager.ts`, `ThemeService.ts`, `AnimationService.ts`
- State: `shared/state/**`(SolidJS primitives 기반), 파생값은 `createMemo()`
  또는 `@shared/utils/signalSelector.ts` 활용
- External: `shared/external/vendors/*`(벤더 getter),
  `userscript/adapter.ts`(GM\_\*), `external/zip/zip-creator.ts`
  - 규칙: Features → Shared(Service/State/Utils) → External(어댑터) 단방향 의존

## 상태/UI/스타일 규칙

- 상태: SolidJS primitives 중심(`src/shared/state/**`). 전역 상태는
  `createGlobalSignal()`, 파생값은 `createMemo()` 또는
  `@shared/utils/signalSelector.ts` 활용
- UI: SolidJS 컴포넌트. `getSolidCore()`, `getSolidWeb()` getter를 통한 API 사용
- 입력: PC 전용 이벤트만 사용(설계 원칙). 터치/모바일 제스처는 추가하지 않음
- 스타일: CSS Modules + 디자인 토큰만 사용(`docs/CODING_GUIDELINES.md`) —
  색상/라운드 값 하드코딩 금지, `--xeg-*` 토큰만

### PC 전용 입력 범위(허용/금지)

- 허용: click, keydown/keyup(ArrowLeft/Right, Home/End, Escape, Space), wheel,
  contextmenu, mouseenter/leave/move/down/up
- 금지: 모든 TouchEvent(onTouchStart/Move/End/Cancel), PointerEvent
  전반(pointerdown/up/move/enter/leave/cancel), 제스처 전용 이벤트
- 가이드: 네비게이션 키 처리 시 기본 스크롤 충돌을 피하려면 목적 동작에 한해
  `preventDefault()` 적용
- 테스트: 터치/포인터 사용은 테스트로 RED 대상(`docs/CODING_GUIDELINES.md` 참조)

## 테스트 전략 (TDD)

- 환경: Vitest + JSDOM, 기본 URL `https://x.com`, `test/setup.ts` 자동
  로드(폴리필/GM\_\* 모킹/벤더 초기화)
- 포함 경로: `test/**/*.{test,spec}.{ts,tsx}`. 커버리지/타임아웃/스레드 설정은
  `vitest.config.ts` 참고
- 외부 의존성: 벤더/Userscript/DOM API는 반드시 getter를 통해 주입 가능하게 작성
  → 테스트에서 손쉽게 모킹
- 새 기능은 “실패하는 테스트 → 최소 구현 → 리팩토링” 순서로 진행. 타입은
  명시적으로 선언(strict 유지)

### 테스트 제외(Refactoring) 유지 정책

- 임시 제외만 허용: `vitest.config.ts` exclude 예시 →
  `test/refactoring/event-manager-integration.test.ts`,
  `test/refactoring/service-diagnostics-integration.test.ts`
- 추가/갱신 기준: 반드시 PR/이슈 번호를 주석으로 남기고, 기능 안정화 시 재활성화
  검토
- 재활성화 체크: 단일 파일로 실행해 GREEN 확인 후 exclude에서 제거(예:
  `npx vitest run <file>`)

## 구현 시 필수 컨벤션

- Import 순서: 타입 → 외부 라이브러리 getter → 내부 모듈 → 스타일(자세한 규칙은
  `docs/CODING_GUIDELINES.md`)
- 파일/디렉터리: kebab-case, 경로 별칭 사용
- 로깅: `@shared/logging` 사용. 네트워크/압축/다운로드 등은 적절한 로그 레벨
  적용
- 다운로드/ZIP: `getNativeDownload()`와 `shared/external/zip/zip-creator.ts`
  사용. 직접 `a[href]` 작성 금지(Userscript/브라우저 호환 고려)

## 통합 포인트 예시

- Vendors:
  `import { initializeVendors, getSolidCore, getSolidStore, getSolidWeb, getFflate } from '@shared/external/vendors'`
- Userscript:
  `import { getUserscript } from '@shared/external/userscript/adapter'` →
  `await getUserscript().download(url, name)`/`xhr(...)`
- 상태 관리:
  `import { createGlobalSignal } from '@shared/state/createGlobalSignal'` → 전역
  반응형 상태 생성
- 상태 선택자:
  `useSignalSelector(signal, selectorFn)`/`useCombinedSelector([...], combiner)`(`@shared/utils/signalSelector.ts`)

---

## 품질 게이트 (커밋/PR 전 필수)

### 로컬 검증

```pwsh
# 1. 타입 체크
npm run typecheck

# 2. 린트 + 자동 수정
npm run lint:fix

# 3. 포맷팅
npm run format

# 4. 전체 테스트
npm test

# 5. 의존성 그래프 검증 (필요 시)
npm run deps:all

# 종합 검증 (1~3 통합)
npm run validate
```

### 빌드 검증

```pwsh
# 개발 빌드 (소스맵 포함)
npm run build:dev

# 프로덕션 빌드 (최적화)
npm run build:prod

# 전체 빌드 (dev + prod + 자동 검증)
npm run build
```

**빌드 산출물**:

- dev: `dist/xcom-enhanced-gallery.dev.user.js` + `.map`
- prod: `dist/xcom-enhanced-gallery.user.js` + `.map`
- 검증: `scripts/validate-build.js` 자동 실행 (헤더, 소스맵, 크기 확인)

### CI/CD 파이프라인

**CI (`ci.yml`)** — Node 20/22 매트릭스:

1. typecheck → lint → prettier check
2. 테스트 + 커버리지 (Node 20)
3. dev/prod 빌드 + 산출물 검증
4. 커버리지/아티팩트 업로드

**보안 (`security.yml`)**:

- `npm audit` + 라이선스 보고서
- CodeQL 스캔 (SARIF + 요약 + 개선 계획)

**릴리즈 (`release.yml`)** — master 브랜치 버전 변경 시:

1. 프로덕션 빌드 + 검증
2. GitHub Release 생성
3. 산출물: `.user.js`, `checksums.txt`, `metadata.json`, CodeQL 리포트

---

## Git Hooks (Husky)

### 필수 훅 (자동 실행)

- **pre-commit**: 린트 + 포맷팅 검증 (staged 파일만)
- **commit-msg**: Conventional Commits 검증 (commitlint)
- **pre-push**: 타입 체크 + 전체 테스트 (`TEST_SKIP_BUILD=true`)

### 훅 검증 (PowerShell)

```pwsh
# 훅 파일 존재 확인
Test-Path .husky\pre-commit
Test-Path .husky\commit-msg
Test-Path .husky\pre-push
```

### 훅 복구 (누락 시)

```pwsh
npm ci                      # 의존성 재설치
npm run prepare             # Husky 초기화
node ./scripts/setup-dev.js # 개발 도구 일괄 점검
```

### 커밋 메시지 규칙 (Conventional Commits)

**형식**: `type(scope): description`

**type**:

- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `docs`: 문서 수정
- `chore`: 빌드/도구 수정
- `style`: 코드 스타일 변경 (포맷팅)
- `perf`: 성능 개선

**예시**:

```
feat(gallery): add keyboard navigation
fix(download): handle URL encoding errors
refactor(state): migrate to SolidJS native signals
test(media): add extraction service tests
docs(api): update vendor getter usage
```

**사전 검증**:

```pwsh
"feat: message" | npx --no-install commitlint --config commitlint.config.cjs
npx --no-install commitlint --from HEAD~1
```

### Copilot 자동화 정책

**실행 조건**:

1. 세 훅 파일 모두 존재 확인
2. 누락 시 자동 복구 시도 (위 복구 절차)
3. 복구 실패 시 작업 중단 및 보고 (훅 우회 금지)

**실행 정책**:

- `git commit`: `pre-commit` 훅 통과 후 시도
- `git push`: `pre-push` 훅 통과 가능 상태에서만 시도

---

## 유용한 도구

### 의존성 그래프

```pwsh
npm run deps:all          # JSON/DOT/SVG 생성 + 룰 검증
```

산출물: `docs/dependency-graph.(json|dot|svg|html)`

### @connect 헤더 동기화

코드에서 사용하는 외부 호스트를 `vite.config.ts`의 @connect 헤더와 자동 동기화:

```pwsh
npm run sync:connect        # 분석만
npm run sync:connect:fix    # 자동 수정
```

스캔 대상: `src/constants.ts`, `src/shared/utils/url-safety.ts`,
`src/**/*.{ts,tsx}`

### 아이콘 사용 분석

코드베이스 전체에서 아이콘 사용 패턴을 분석:

```pwsh
npm run icon:audit          # 콘솔 출력 (Markdown)
npm run icon:audit:json     # JSON 형식
npm run icon:audit:save     # docs/icon-usage-report.md 저장
```

분석 항목: 사용처, 중복 사용, 미사용 아이콘, 빈도 통계

### CodeQL 분석

```pwsh
npm run codeql:scan         # 로컬 분석
npm run codeql:dry-run      # 미리보기
```

산출물: SARIF, 요약 CSV, 개선 계획 마크다운

---

## Copilot 작업 프로세스 (전처리 규칙)

모든 Copilot 작업은 실행 전에 다음 **전처리**를 수행합니다.

### 1. Intent 분석 (요청 이해)

- 요청자의 목표를 1-3문장으로 요약
- 추출 항목:
  - **요구사항/제약**: 스택, 경로 별칭, 계층 경계, Userscript 정책
  - **Acceptance**: 테스트, 빌드, 산출물, 접근성, 이벤트, 헤더
  - **참조 문서**: `docs/CODING_GUIDELINES.md`, `docs/vendors-safe-api.md`,
    `AGENTS.md`

### 2. 최적화 프롬프트 도출 (실행 계획)

- 목표 (1-3줄)
- 불변 Acceptance
- 성공 지표: GREEN (타입/린트/테스트/빌드 통과)
- 저리스크 가정 1-2개만 선언 → 즉시 코드/문서로 검증
- 경계 확인: Features → Shared → External (단방향), 벤더 접근은 getter만

### 3. 계획/추적 (Todo List)

- 작업 시작 전 Todo 작성 (복잡한 작업만)
- 첫 항목을 `in-progress`로 설정
- 작은 단위로 분해
- 각 항목 완료 즉시 `completed` 처리 (배치 금지)
- 도구 호출 전 배치 요약 (목적/실행/예상 결과 1줄)

### 4. 컨텍스트 수집 (효율적 읽기)

- 큰 의미 블록 중심으로 읽기
- 시맨틱/grep 검색 병행
- 중복 호출 지양
- 외부 네트워크/비밀 유출 금지
- Userscript API는 `@shared/external/userscript/adapter` 경유

### 5. 실행 (TDD)

**RED → GREEN → REFACTOR**:

- RED: 실패하는 테스트 작성
- GREEN: 최소 구현
- REFACTOR: 개선 (타입 안전성, 에러 처리, 성능)

**제약**:

- PC 전용 입력만 사용 (터치/포인터 금지, 위반 시 테스트 RED)
- 벤더 접근은 오직 `@shared/external/vendors`의 getter 사용
- Userscript API는 `@shared/external/userscript/adapter` 사용

### 6. 리포팅 (진행 상황)

- 3~5회 도구 호출마다 핵심 결과와 다음 액션 2-3줄 요약
- 변경 파일 목록 명시

### 7. 종료 전 검증 (품질 게이트)

**TRIAGE 요약**:

- Build: ✅/❌
- Lint: ✅/❌
- Typecheck: ✅/❌
- Tests: ✅/❌
- 요구사항 커버리지: ✅/❌

**산출물 정책 준수**:

- 단일 `.user.js` 파일
- 소스맵 주석 포함 (dev)
- Userscript 헤더 정상
- `scripts/validate-build.js` 통과

---

## 빠른 체크리스트 (작업 시작 전)

**새 기능 구현 시**:

- [ ] TDD로 시작 (RED 테스트 먼저)
- [ ] 벤더 라이브러리는 getter 사용 (`getSolidCore`, `getSolidWeb`, `getFflate`)
- [ ] Userscript API는 adapter 사용 (`getUserscript()`)
- [ ] PC 전용 이벤트만 사용 (터치/포인터 금지)
- [ ] 디자인 토큰만 사용 (색상/시간 하드코딩 금지)
- [ ] Import 순서 준수 (타입 → getter → 내부 → 스타일)
- [ ] TypeScript strict 모드 유지
- [ ] 테스트와 함께 커밋
- [ ] 커밋 메시지 Conventional Commits 형식

**버그 수정 시**:

- [ ] 재현 테스트 작성 (RED 확인)
- [ ] 최소 수정으로 GREEN
- [ ] 기존 테스트 영향 확인
- [ ] 회귀 방지 테스트 추가

**리팩토링 시**:

- [ ] 기존 테스트가 모두 GREEN 확인
- [ ] 동작 변경 없이 구조만 개선
- [ ] 리팩토링 후 테스트 여전히 GREEN
- [ ] 타입 체크 통과

---

## 참조 문서

**필독 문서**:

- 아키텍처: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- 코딩 규칙: [`docs/CODING_GUIDELINES.md`](../docs/CODING_GUIDELINES.md)
- 벤더 API: [`docs/vendors-safe-api.md`](../docs/vendors-safe-api.md)
- 실행/CI: [`AGENTS.md`](../AGENTS.md)

**보조 문서**:

- 의존성 그래프: `docs/dependency-graph.svg`
- 변경 이력: `docs/CHANGELOG.md`
- TDD 백로그: `docs/TDD_REFACTORING_BACKLOG.md`

---

## 프롬프트 단일 소스 (전처리 규칙)

본 섹션은 전처리의 **단일 소스**입니다. 다른 문서의 요약과 불일치 시 본 섹션을
기준으로 정정합니다.

---

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 관련 문서를 참고해
보완하겠습니다.

## 빠른 체크리스트 (AI 요청 문구에 포함)

- “TDD로 … 구현”, “getter 함수 사용하여(벤더/유저스크립트)”, “TypeScript strict
  모드로”, “PC 전용 이벤트만”, “테스트와 함께”

의미가 불명확하거나 누락된 규칙이 있으면 알려주세요. 빌드/테스트/디자인 토큰
규칙 등 세부는 `AGENTS.md`와 `docs/CODING_GUIDELINES.md`를 참고해
보완하겠습니다.

## 프롬프트 전처리 규칙 (의도 분석 → 최적화 프롬프트)

모든 Copilot 작업은 실행(파일 편집/터미널/테스트) 전에 다음 전처리를 수행합니다.

- Intent 분석: 요청자의 목표를 1-3문장으로 요약하고, 다음을 추출합니다.
  - 요구사항/제약(스택, 경로 별칭, 계층 경계, Userscript 정책)
  - Acceptance(테스트/빌드/산출물/접근성/이벤트/헤더)
  - 단일 소스 링크: `docs/CODING_GUIDELINES.md`, `docs/vendors-safe-api.md`,
    `AGENTS.md`
- 최적화 프롬프트 도출: 실행 계획을 간결히 재정의합니다.
  - 목표(1-3줄), 불변 Acceptance, 성공 지표(GREEN: 타입/린트/테스트/빌드)
  - 저리스크 가정 1-2개만 선언하고 즉시 코드/문서로 검증
  - 경계 확인: Features → Shared → External 단방향, 벤더 접근은 getter만
- 계획/추적: 작업 시작 전 Todo 작성 → 첫 항목 in-progress 설정.
  - 작은 단위로 분해, 각 항목 완료 즉시 완료 처리(배치 금지)
  - 도구 호출 전 배치 요약(목적/실행/예상 결과 1줄) 기입
- 컨텍스트 수집: 큰 의미 블록 중심으로 읽기, 시맨틱/grep 검색 병행.
  - 중복 호출 지양, 외부 네트워크/비밀 유출 금지
  - Userscript API는 `@shared/external/userscript/adapter` 경유
- 실행: TDD — RED(실패 테스트) → GREEN(최소 구현) → REFACTOR.
  - PC 전용 입력만 사용(터치/포인터 금지, 위반 시 테스트 RED)
  - 벤더 접근은 오직 `@shared/external/vendors`의 getter 사용 (getSolidCore,
    getSolidStore, getSolidWeb)
- 리포팅: 3~5회 도구 호출마다 핵심 결과와 다음 액션 2-3줄 요약, 변경 파일 요약.
- 종료 전 품질 게이트 요약: Build/Lint/Typecheck/Tests TRIAGE + 요구사항
  커버리지.
  - 산출물 정책(단일 파일, 소스맵 주석, 헤더) 준수 여부 명시

참고: 본 섹션은 전처리의 단일 소스입니다. 다른 문서의 요약과 불일치 시 본 섹션을
기준으로 정정합니다.
