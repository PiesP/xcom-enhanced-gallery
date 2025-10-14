# 💻 코딩 가이드라인

> **일관된 코드 스타일과 품질 보장을 위한 필수 규칙**

## 📚 관련 문서

- 구조/계층: `ARCHITECTURE.md` · 의존성: `DEPENDENCY-GOVERNANCE.md` · TDD:
  `TDD_REFACTORING_PLAN.md`

---

## 🎯 3대 핵심 원칙

### 1. Vendor Getter (필수)

```typescript
// ✅ Getter 사용 (TDZ-safe, 테스트 친화)
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();

// ❌ 직접 import 금지
// import { createSignal } from 'solid-js';
```

### 2. PC 전용 이벤트

```typescript
// ✅ 허용: click, keydown/up, wheel, contextmenu, mouse*
// ❌ 금지: touchstart/move/end, pointerdown/up/move
```

### 3. CSS 디자인 토큰

```css
/* ✅ 토큰 사용 */
color: var(--xeg-color-primary);
border-radius: var(--xeg-radius-md);

/* ❌ 하드코딩 금지 (테스트에서 차단) */
color: #1da1f2;
border-radius: 8px;
```

---

## 🎨 디자인 토큰 체계 (3계층)

### 계층 구조

```css
/* 1. Primitive (design-tokens.css) */
--color-gray-800: #2a2a2a;

/* 2. Semantic (design-tokens.semantic.css) */
--color-bg-elevated: var(--color-base-white);

/* 3. Component (design-tokens.semantic.css) */
--xeg-modal-bg-light: var(--color-bg-elevated);
--xeg-modal-bg: var(--xeg-modal-bg-light);
```

### 컴포넌트 토큰 규칙

**필수**: 모든 `--xeg-*` 토큰은 `design-tokens.semantic.css`에 정의

```css
:root {
  /* Light defaults */
  --xeg-modal-bg-light: var(--color-bg-elevated);
  --xeg-modal-bg: var(--xeg-modal-bg-light);
}

[data-theme='dark'] {
  /* Dark overrides */
  --xeg-modal-bg-dark: var(--color-gray-800);
  --xeg-modal-bg: var(--xeg-modal-bg-dark);
}
```

**고대비 접근성**:

```css
.toolbar.highContrast {
  background: var(--xeg-toolbar-bg-high-contrast) !important;
}
```

---

## 🧪 TDD 워크플로

```typescript
// 1. RED: 실패하는 테스트 작성
describe('MediaService', () => {
  it('should extract 4 images', () => {
    const result = service.extract(tweetData);
    expect(result).toHaveLength(4); // ❌ 실패
  });
});

// 2. GREEN: 최소 구현
class MediaService {
  extract(data: unknown) {
    return extractImages(data); // ✅ 통과
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

## 📦 파일 네이밍 (kebab-case 필수)

```text
✅ 올바른 파일명
gallery-view.tsx
media-processor.ts
bulk-download-service.ts

✅ Semantic Suffix 허용
app.types.ts             # 타입 정의
gallery.test.ts          # 테스트
button.module.css        # CSS Modules

❌ 잘못된 파일명
GalleryView.tsx          # PascalCase 금지
mediaProcessor.ts        # camelCase 금지
```

**자동 검증**: Phase 24 테스트 스위트가 강제 **Regex**:
`/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z]+)?\.(?:ts|tsx)$/`

---

## 📂 Import 순서

```typescript
// 1. 타입
import type { MediaItem, GalleryState } from '@shared/types';

// 2. 외부 라이브러리 (Vendor getter)
import { getSolid } from '@shared/external/vendors';

// 3. 내부 모듈 (경로 별칭 사용)
import { MediaService } from '@shared/services';
import { GalleryApp } from '@features/gallery';

// 4. 스타일
import styles from './Component.module.css';
```

---

## 🏗️ 아키텍처 경계

```text
Features (UI/기능)
    ↓
Shared (서비스/상태/유틸)
    ↓
External (어댑터/벤더)
```

- **단방향 의존만 허용**: Features → Shared → External
- **순환 참조 금지**: dependency-cruiser로 강제
- **배럴 표면 최소화**: 필요한 심볼만 export

---

## 🚀 빌드 & 검증

```powershell
# 빠른 검증
npm run validate      # typecheck + lint + format

# 테스트
npm run test:smoke    # 스모크 테스트 (빠름)
npm run test:fast     # 단위 테스트
npm run e2e:smoke     # E2E 스모크

# 빌드
npm run build:dev     # 개발 빌드 (sourcemap 포함)
npm run build:prod    # 프로덕션 빌드

# 종합 검증
npm run build         # dev + prod + validate-build
```

---

## 🚫 금지 사항

| 항목            | ❌ 금지                            | ✅ 허용                                         |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| **Vendor**      | `import { createSignal } from...`  | `const { createSignal } = getSolid()`           |
| **이벤트**      | `onTouchStart`, `onPointerDown`    | `onClick`, `onKeyDown`, `onWheel`               |
| **스타일**      | `color: #1da1f2; padding: 16px;`   | `color: var(--xeg-*); padding: var(--xeg-*);`   |
| **경로**        | `import from '../../../shared'`    | `import from '@shared'`                         |
| **서비스 접근** | `ServiceManager` 직접 import       | `@shared/container/service-accessors` 헬퍼 사용 |
| **파일명**      | `GalleryView.tsx`, `media_util.ts` | `gallery-view.tsx`, `media-util.ts`             |

---

## 📝 커밋 규칙 (Conventional Commits)

```bash
# 타입: 설명
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
```

---

## 🔍 코드 리뷰 체크리스트

- [ ] Vendor getter 사용 (직접 import 없음)
- [ ] PC 전용 이벤트만 사용
- [ ] CSS 디자인 토큰 사용 (하드코딩 없음)
- [ ] 경로 별칭 사용 (`@shared`, `@features` 등)
- [ ] 파일명 kebab-case 준수
- [ ] 타입 명시 (TypeScript strict)
- [ ] 테스트 추가/수정 (TDD)
- [ ] 린트/포맷 통과
- [ ] 빌드 성공

---

## 🎯 성능 & 품질 목표

### 번들 크기

- **Dev**: ~730 KB (sourcemap 포함)
- **Prod**: ~320 KB (예산: 325 KB)
- **Gzip**: ~88 KB

### 접근성

- **focus-visible**: 모든 인터랙션 요소
- **high contrast**: 디자인 토큰으로 지원
- **reduced motion**: 애니메이션 최소화

### 테스트

- **커버리지**: 주요 경로 >80%
- **타임아웃**: 테스트 20s, 훅 25s
- **격리**: 각 테스트는 독립 실행

---

**💻 일관된 코드 스타일은 팀 생산성을 높입니다.**
