# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장을 위한 필수 규칙**

## 📚 관련 문서

- 구조/계층/경계: `ARCHITECTURE.md`
- 의존성 정책: `DEPENDENCY-GOVERNANCE.md`
- TDD 계획: `TDD_REFACTORING_PLAN.md`

---

## 🎯 핵심 원칙

### 1. Solid.js 반응성 (Vendor Getter 필수)

```typescript
// ✅ Vendor getter 사용 (TDZ-safe)
import { getSolid, getSolidStore } from '@shared/external/vendors';

const { createSignal, createMemo, createEffect } = getSolid();
const { createStore } = getSolidStore();

// ❌ 직접 import 금지
// import { createSignal } from 'solid-js';
```

### 2. PC 전용 이벤트

```typescript
// ✅ 허용: 마우스, 키보드, 휠
(onClick, onKeyDown, onKeyUp, onWheel, onContextMenu);
(onMouseEnter, onMouseLeave, onMouseMove);

// ❌ 금지: 터치, 포인터
(onTouchStart, onTouchMove, onPointerDown);
```

### 3. CSS 디자인 토큰

```css
/* ✅ 토큰 사용 */
color: var(--xeg-color-primary);
border-radius: var(--xeg-radius-md);
padding: var(--xeg-spacing-sm);

/* ❌ 하드코딩 금지 */
color: #1da1f2;
border-radius: 8px;
```

### 4. 경로 별칭

```typescript
// ✅ 별칭 사용
import { MediaService } from '@shared/services';
import { GalleryApp } from '@features/gallery';

// ❌ 상대 경로 지양
// import { MediaService } from '../../../shared/services';
```

---

## 📂 아키텍처 경계

```text
Features (UI/기능)
    ↓
Shared (서비스/상태/유틸)
    ↓
External (어댑터/벤더)
```

- **단방향 의존만 허용**: Features → Shared → External
- **배럴 표면 최소화**: 실제 사용되는 심볼만 export
- **순환 참조 금지**: dependency-cruiser로 강제

---

## 🧪 테스트 전략 (TDD)

### RED → GREEN → REFACTOR

```typescript
// 1. RED: 실패하는 테스트 작성
describe('MediaService', () => {
  it('should extract media from tweet', () => {
    const result = service.extract(tweetData);
    expect(result).toHaveLength(4);
  });
});

// 2. GREEN: 최소 구현
class MediaService {
  extract(data: unknown) {
    return extractImages(data);
  }
}

// 3. REFACTOR: 개선
class MediaService {
  extract(data: TweetData): MediaItem[] {
    return this.strategy.extract(data);
  }
}
```

---

## 📦 Import 순서

```typescript
// 1. 타입
import type { MediaItem, GalleryState } from '@shared/types';

// 2. 외부 라이브러리 (Vendor getter)
import { getSolid } from '@shared/external/vendors';

// 3. 내부 모듈
import { MediaService } from '@shared/services';

// 4. 스타일
import styles from './Component.module.css';
```

---

## 🎨 스타일 규칙

### 파일 네이밍 (kebab-case 필수)

**기본 규칙**: 모든 파일명은 kebab-case를 사용합니다.

```text
✅ 올바른 파일명
gallery-view.tsx
media-processor.ts
bulk-download-service.ts
dom-batcher.ts
signal-selector.ts

❌ 잘못된 파일명
GalleryView.tsx          # PascalCase 금지
mediaProcessor.ts        # camelCase 금지
Bulk_Download_Service.ts # snake_case 금지
```

**Semantic Suffix 허용**: 의미론적 suffix는 점(`.`)으로 구분하여 사용 가능

```text
✅ Semantic Suffix 패턴
app.types.ts             # 타입 정의
gallery.interfaces.ts    # 인터페이스 정의
media.test.ts            # 테스트 파일
service.mock.ts          # 모킹 파일
button.module.css        # CSS Modules
config.d.ts              # 타입 선언
```

**디렉터리 구조**: 모든 디렉터리명도 kebab-case 사용

```text
✅ 올바른 구조
src/
  features/
    gallery/
    settings/
  shared/
    services/
      media-extraction/
      media-mapping/
    utils/
      dom/
      performance/
```

**자동 검증**: Phase 24 테스트 스위트가 파일명 규칙을 강제합니다.

```powershell
# Phase 24 테스트 실행
npx vitest run test/phase-24a-file-naming-convention.test.ts
npx vitest run test/phase-24b-file-naming-convention.test.ts
npx vitest run test/phase-24c-file-naming-convention.test.ts

# 또는 전체 실행
npm test
```

**검증 범위**:

- Phase 24-A: 소형 디렉터리 (container, dom, external, logging, state)
- Phase 24-B: 중형 디렉터리 (components, hooks, interfaces, media, state,
  styles, types)
- Phase 24-C: 대형 디렉터리 (services, utils)

**Regex 패턴**: `/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z]+)?\.(?:ts|tsx)$/`

이 패턴은 다음을 허용합니다:

- 소문자 영숫자와 하이픈으로 구성된 파일명
- 선택적 semantic suffix (예: `.types`, `.test`, `.mock`)
- `.ts` 또는 `.tsx` 확장자

### CSS Modules

```css
/* Component.module.css */
.container {
  display: flex;
  gap: var(--xeg-spacing-md);
  padding: var(--xeg-spacing-lg);
  background: var(--xeg-color-bg-primary);
  border-radius: var(--xeg-radius-lg);
}

.button {
  color: var(--xeg-color-text-primary);
  transition: var(--xeg-transition-fast);
}

.button:hover {
  transform: translateY(var(--xeg-button-lift));
}
```

---

## 🚀 빌드 & 검증

```powershell
# 타입 체크
npm run typecheck

# 린트 & 포맷
npm run lint:fix
npm run format

# 테스트
npm run test:smoke    # 스모크 테스트
npm run test:fast     # 빠른 단위 테스트
npm run e2e:smoke     # E2E 스모크

# 빌드
npm run build:dev     # 개발 빌드
npm run build:prod    # 프로덕션 빌드

# 종합 검증
npm run validate      # typecheck + lint + format
```

---

## 🚫 금지 사항

### ❌ 직접 import

```typescript
// ❌ Solid.js 직접 import
import { createSignal } from 'solid-js';

// ✅ Vendor getter 사용
import { getSolid } from '@shared/external/vendors';
const { createSignal } = getSolid();
```

### ❌ 터치 이벤트

```typescript
// ❌ 터치 이벤트 핸들러
<div onTouchStart={handler} />

// ✅ PC 전용 이벤트
<div onClick={handler} />
```

### ❌ 하드코딩

```css
/* ❌ 하드코딩된 값 */
color: #1da1f2;
padding: 16px;

/* ✅ 디자인 토큰 */
color: var(--xeg-color-primary);
padding: var(--xeg-spacing-md);
```

---

## 📝 커밋 규칙

```bash
# Conventional Commits
feat: 새로운 기능
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 (포맷, 세미콜론 등)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/도구 변경

# 예시
git commit -m "feat: add keyboard navigation to gallery"
git commit -m "fix: resolve memory leak in media loader"
git commit -m "docs: update coding guidelines"
```

---

## 🔍 코드 리뷰 체크리스트

- [ ] Vendor getter 사용 (직접 import 없음)
- [ ] PC 전용 이벤트만 사용
- [ ] CSS 디자인 토큰 사용
- [ ] 경로 별칭 사용
- [ ] 타입 명시 (TypeScript strict)
- [ ] 테스트 추가/수정
- [ ] 린트/포맷 통과
- [ ] 빌드 성공

---

## 📖 핵심 정책 요약

### Vendor Getter (필수)

- 외부 라이브러리는 반드시 getter를 통해 접근
- `@shared/external/vendors`의 `getSolid()`, `getSolidStore()` 사용
- 테스트 가능성과 TDZ 안전성 보장

### PC 전용 입력

- 마우스/키보드/휠 이벤트만 허용
- 터치/포인터 이벤트 사용 금지
- 테스트에서 자동 검증

### 디자인 토큰

- 모든 색상/간격/라운드 값은 토큰 사용
- 하드코딩 금지 (테스트에서 차단)
- 일관된 테마 지원

### 서비스 접근

- `ServiceManager` 직접 import 지양
- `@shared/container/service-accessors` 헬퍼 사용
- 타입 안전한 경계 유지

### 테스트 우선

- 새 기능: 실패 테스트 → 최소 구현 → 리팩토링
- 외부 의존성은 getter를 통해 모킹 가능
- 커버리지/타임아웃/스레드 설정은 `vitest.config.ts` 참고

---

## 🎯 성능 & 품질

### 번들 크기

- Dev: ~730 KB
- Prod: ~325 KB (gzip: ~88 KB)
- 크기 예산: WARN 120KB, FAIL 160KB (gzip)

### 접근성

- `focus-visible`: 모든 인터랙션 요소에 포커스 링
- `high contrast`: 디자인 토큰 레이어에서 지원
- `reduced motion`: 애니메이션/트랜지션 최소화

---

**💻 일관된 코드 스타일은 팀 생산성을 높입니다.**
