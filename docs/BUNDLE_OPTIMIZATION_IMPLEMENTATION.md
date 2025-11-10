# Bundle Size Optimization - Implementation Plan

**상태**: 📋 Ready for Implementation **우선순위**: Phase 1 (CSS 외부 로드)
최우선 **예상 일정**: 1-2주 (단계별)

---

## 🎯 Phase 1: CSS 외부 로드 (Quick Win - 13% 절감)

### 개요

Base64 인코딩된 CSS를 제거하고 `GM_addStyle()` 또는 동적 `<style>` 태그로
변경하여 번들 크기 **50 KB 절감**.

### 현재 구조 분석

**파일**: `vite.config.ts` (줄 160-200)

```typescript
// 현재: createStyleInjector 함수
function createStyleInjector(cssContent: string, isDev: boolean): string {
  if (isDev) {
    // Dev: 포맷된 출력
    return `
      (function() {
        const __cssContent = \`${cssContent}\`;
        GM_addStyle(__cssContent);
      })();
    `;
  } else {
    // Prod: 최소화
    return `(function(){var s='${Buffer.from(cssContent).toString('base64')}';GM_addStyle(atob(s));})();`;
  }
}
```

### 문제점

1. **Base64 인코딩**: 38 KB CSS → 50 KB (33% 증가)
2. **atob() 디코딩**: 런타임 오버헤드 (미미하지만 불필요)
3. **이스케이핑 복잡성**: 특수 문자 처리

### 해결책

#### Option A: 직접 문자열 주입 (권장)

```typescript
function createStyleInjector(cssContent: string, _isDev: boolean): string {
  // CSS를 템플릿 리터럴에 직접 포함
  // 백틱(`) 내에서 ${ }만 주의
  const escaped = cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return `(function(){GM_addStyle(\`${escaped}\`);})();`;
}
```

**예상 결과**:

```
Before: 50 KB (Base64)
After: 38 KB (직접 문자열)
Savings: 12 KB (3%)
```

#### Option B: 주석과 공백 제거 + 문자열 주입

```typescript
function createStyleInjector(cssContent: string, _isDev: boolean): string {
  // PostCSS로 이미 처리되므로 추가 최적화 여지 제한
  // 하지만 개행 문자 제거 가능
  const minified = cssContent.replace(/\n/g, '');
  const escaped = minified.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return `(function(){GM_addStyle(\`${escaped}\`);})();`;
}
```

**예상 결과**:

```
Before: 50 KB (Base64)
After: 36-37 KB (최소화)
Savings: 13-14 KB (3-4%)
```

### 구현 단계

#### Step 1: vite.config.ts 수정

**파일 위치**: `/home/piesp/projects/xcom-enhanced-gallery_local/vite.config.ts`

**변경 범위**: 약 줄 160-200 `createStyleInjector()` 함수

```typescript
// 변경 전:
function createStyleInjector(cssContent: string, isDev: boolean): string {
  // ...
  if (isProd) {
    return `(function(){var s='${btoa(cssContent)}';GM_addStyle(atob(s));})();`;
  }
}

// 변경 후:
function createStyleInjector(cssContent: string, isDev: boolean): string {
  // CSS 콘텐츠 이스케이프 (백틱과 $만)
  const escaped = cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  if (isDev) {
    // Dev: 개행 유지로 디버깅 용이
    return `(function(){GM_addStyle(\`${escaped}\`);})();`;
  } else {
    // Prod: 개행 제거로 크기 최소화
    const minified = escaped.replace(/\n/g, '');
    return `(function(){GM_addStyle(\`${minified}\`);})();`;
  }
}
```

#### Step 2: terserOptions 재검토

**파일 위치**: `vite.config.ts` (줄 430-450)

**확인 사항**:

- `drop_console: true` ✅ (이미 활성화)
- `drop_debugger: true` ✅ (이미 활성화)
- `comments: false` ✅ (이미 활성화)

**추가 가능한 옵션**:

```typescript
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 5,
    pure_getters: true,
    unsafe: true,
    unsafe_methods: true,
    unsafe_arrow: true,  // ← 추가 (화살표 함수 최적화)
    unsafe_comps: true,   // ← 추가 (비교 최적화)
    toplevel: true,
  },
  format: { comments: false },
  mangle: { toplevel: true },
  maxWorkers: 8,
}
```

**예상 추가 절감**: 1-2 KB

#### Step 3: 빌드 및 테스트

```bash
# 1. 구성 파일 변경 후 빌드
npm run build:prod

# 2. 크기 측정
wc -c dist/xcom-enhanced-gallery.user.js

# 3. 유효성 검사
npm run validate:pre

# 4. 유닛 테스트
npm test:unit:batched

# 5. 브라우저 테스트 (필수)
npm test:browser

# 6. E2E 스모크 테스트
npm run e2e:smoke
```

#### Step 4: 검증

**성공 기준**:

- [ ] 번들 크기: 379 KB → 330 KB 이상 (50 KB 이상 절감)
- [ ] 모든 테스트 통과
- [ ] GM_addStyle 호출 정상 작동 확인 (브라우저 검사)
- [ ] CSS 적용 확인 (갤러리 UI 렌더링)

---

## 🎯 Phase 2: CSS 최적화 (5-10% 절감)

### 2a: 불필요한 CSS 규칙 제거

#### 감시 대상

**파일**: `src/shared/styles/design-tokens.*.css` (12 KB)

```css
/* ❌ 현재: 정의된 모든 변수 */
--xeg-color-primary: oklch(50% 0.2 240); /* 사용 */
--xeg-color-secondary: oklch(60% 0.15 180); /* 미사용? */
--xeg-color-accent: oklch(70% 0.25 300); /* 미사용? */
--xeg-color-danger: oklch(50% 0.2 25); /* 미사용? */
--xeg-color-success: oklch(50% 0.2 120); /* 미사용? */
/* ... 20+ 변수 */

/* ✅ 최적화: 사용되는 것만 유지 */
--xeg-color-primary: oklch(50% 0.2 240); /* 사용 */
--xeg-color-secondary: oklch(60% 0.15 180); /* 사용 */
--xeg-color-accent: oklch(70% 0.25 300); /* 사용 */
/* 나머지 제거 */
```

#### 감시 방법

```bash
# 1. CSS 클래스 사용 현황 파악
grep -r "xeg_[a-z0-9]" src --include="*.tsx" --include="*.ts" | wc -l

# 2. 정의된 클래스 확인
grep "^\." src/**/*.css | wc -l

# 3. 비교: 미사용 클래스 식별
# (수작업 또는 PurgeCSS 사용)

# 4. PurgeCSS로 자동 감시 (선택)
npx purgecss --content "src/**/*.{tsx,ts}" --css "src/**/*.css"
```

#### 제거 대상 식별

```bash
# 실제 사용 현황 확인
# 예: grep "Gallery" src/shared/styles/*.css
# 결과: 8 개 클래스 사용

# 정의된 Gallery 관련 클래스
# 결과: 15 개 클래스 정의 (7개 미사용)
```

#### 예상 절감

| 항목                   | 크기 | 절감      |
| ---------------------- | ---- | --------- |
| 미사용 색상 변수       | 5 KB | 🎯        |
| 미사용 컴포넌트 스타일 | 3 KB | 🎯        |
| 미디어 쿼리 (PC-only)  | 2 KB | 🎯        |
| **합계**               | -    | **10 KB** |

### 2b: CSS 미니화 강화

**도구**: cssnano (이미 PostCSS에 포함)

**현재 설정 (`postcss.config.js`)**:

```javascript
module.exports = {
  plugins: [
    // ... 기존 플러그인
    [
      'cssnano',
      {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            // 추가 최적화
            normalizeUnicode: true,
            reduceIdents: true,
            uniqueSelectors: true,
          },
        ],
      },
    ],
  ],
};
```

**추가 최적화** (선택):

```javascript
// postcss.config.js 개선
{
  preset: [
    'default',
    {
      minifyFontValues: true,
      minifyHexColors: true,
      minifyParams: true,
      normalizeCharset: true,
      normalizeUrl: true,
      discardDuplicates: true,
      discardOverridden: true,
    },
  ],
}
```

**예상 절감**: 2-3 KB

### 2c: 설계 토큰 검토

**파일 목록**:

- `src/shared/styles/design-tokens.component.css` (5 KB)
- `src/shared/styles/design-tokens.primitive.css` (4 KB)
- `src/shared/styles/design-tokens.semantic.css` (3 KB)

**최적화 기회**:

```css
/* ❌ 분산된 정의 */
/* design-tokens.component.css */
--xeg-button-bg: oklch(...);
--xeg-button-color: oklch(...);

/* design-tokens.semantic.css */
--xeg-semantic-primary: var(--xeg-button-bg);

/* ✅ 통합 (선택) */
/* design-tokens.css (단일 파일) */
--xeg-primary: oklch(...);
--xeg-button-bg: var(--xeg-primary);
```

**예상 절감**: 1-2 KB (메타데이터)

---

## 🎯 Phase 5: SVG 아이콘 최적화 (3-5% 절감)

### 5a: SVGO를 사용한 아이콘 최적화

#### 설치

```bash
npm install --save-dev svgo
```

#### 스크립트 작성

**파일**: `scripts/optimize-icons.ts`

```typescript
import { optimize } from 'svgo';
import * as fs from 'fs';
import * as path from 'path';

const ICONS_DIR = 'src/shared/components/ui/Icon/hero';

const svgoConfig = {
  plugins: [
    'preset-default',
    {
      name: 'removeViewBox',
      active: false, // viewBox 유지
    },
    {
      name: 'convertStyleToAttrs',
      active: true,
    },
  ],
};

async function optimizeIcons() {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.tsx'));

  for (const file of files) {
    const filePath = path.join(ICONS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // TSX 파일에서 SVG 추출
    const svgMatch = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
    if (!svgMatch) continue;

    const svg = svgMatch[0];
    const result = optimize(svg, svgoConfig);

    const optimizedSvg = result.data;
    const newContent = content.replace(svg, optimizedSvg);

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Optimized: ${file}`);
  }
}

optimizeIcons().catch(console.error);
```

#### 실행

```bash
npx tsx scripts/optimize-icons.ts
```

#### 예상 결과

```
Before: ~100 bytes per icon × 15 icons = 1500 bytes
After: ~70 bytes per icon × 15 icons = 1050 bytes
Savings: 450 bytes (0.1%)

Total with cleanup: 5-10 KB (선택 아이콘 제거 시)
```

### 5b: 아이콘 네이밍 및 사용 감시

**현재 아이콘 목록**:

```
src/shared/components/ui/Icon/hero/
├─ HeroZoomIn.tsx          (사용)
├─ HeroCog6Tooth.tsx       (사용)
├─ HeroDownload.tsx        (사용)
├─ HeroArrowSmallRight.tsx (미사용?)
├─ HeroChevronRight.tsx    (사용)
├─ HeroChevronLeft.tsx     (사용)
├─ HeroFileZip.tsx         (사용)
├─ HeroSettings.tsx        (사용)
├─ HeroX.tsx               (사용)
├─ HeroArrowSmallLeft.tsx  (미사용?)
├─ HeroArrowsRightLeft.tsx (사용)
├─ HeroArrowsUpDown.tsx    (사용)
├─ HeroArrowsPointingOut.tsx (사용)
├─ HeroChatBubbleLeftRight.tsx (미사용?)
├─ HeroArrowsPointingIn.tsx (사용)
├─ HeroArrowDownOnSquareStack.tsx (사용)
├─ HeroDocumentText.tsx    (미사용?)
└─ HeroArrowLeftOnRectangle.tsx (미사용?)
```

**감시 명령**:

```bash
# 아이콘 사용 현황
for icon in src/shared/components/ui/Icon/hero/*.tsx; do
  name=$(basename "$icon")
  count=$(grep -r "$(echo $name | sed 's/\.tsx//')" src --include="*.tsx" | wc -l)
  [ $count -eq 1 ] && echo "❌ $name (정의만, 미사용)" || echo "✅ $name (사용: $count)"
done
```

**예상 절감**: 2-4 KB (미사용 아이콘 제거 시)

---

## 📊 Phase 1-5 완료 후 예상 결과

| 단계       | 조치          | 절감 | 누적 | 최종 크기 |
| ---------- | ------------- | ---- | ---- | --------- |
| 기준       | -             | -    | 0%   | 379 KB    |
| Phase 1    | CSS 외부 로드 | 13%  | 13%  | 330 KB    |
| Phase 2a   | CSS 규칙 제거 | 5%   | 18%  | 310 KB    |
| Phase 2b-c | CSS 미니화    | 2%   | 20%  | 303 KB    |
| Phase 5a-b | 아이콘 최적화 | 4%   | 24%  | 288 KB    |

**최종 예상**: 288 KB (24% 절감)

### 추가 목표: 250 KB 달성

Phase 3-4 (코드 분할 + 런타임 최적화) 추가 필요:

- Phase 3: 코드 분할 + lazy loading (5% = 14 KB)
- Phase 4: Solid.js 런타임 최적화 (3% = 9 KB)

**최종 예상**: **250-260 KB** (34% 절감) ✅

---

## ✅ 검증 & 테스트 전략

### 빌드 검증

```bash
# 1. 구성 변경 후 빌드
npm run build:prod

# 2. 크기 측정
echo "Bundle size: $(wc -c < dist/xcom-enhanced-gallery.user.js) bytes"

# 3. 타입 확인
npm run typecheck

# 4. Lint 확인
npm run lint:all
```

### 기능 검증

```bash
# 1. 유닛 테스트
npm test:unit:batched

# 2. 브라우저 테스트 (CSS 적용 확인)
npm test:browser -- --run

# 3. E2E 스모크 테스트
npm run e2e:smoke
```

### 수동 테스트 체크리스트

- [ ] CSS 스타일 정상 적용 (갤러리 UI 렌더링)
- [ ] 모든 아이콘 표시됨
- [ ] 버튼 클릭 반응
- [ ] 드롭다운 메뉴 작동
- [ ] 모달 팝업 표시
- [ ] 다운로드 기능 작동

---

## 🔗 관련 파일

| 파일                                  | 목적       | 수정 필요       |
| ------------------------------------- | ---------- | --------------- |
| `vite.config.ts`                      | 번들 구성  | Phase 1: ⭐⭐⭐ |
| `postcss.config.js`                   | CSS 최적화 | Phase 2: ⭐⭐   |
| `src/shared/styles/*.css`             | CSS 콘텐츠 | Phase 2: ⭐⭐   |
| `src/shared/components/ui/Icon/hero/` | 아이콘     | Phase 5: ⭐     |

---

## 📅 타임라인

| 단계                    | 예상 시간 | 우선순위           |
| ----------------------- | --------- | ------------------ |
| Phase 1 (CSS 외부 로드) | 2시간     | 🔴 HIGHEST         |
| Phase 2 (CSS 최적화)    | 4시간     | 🟡 HIGH            |
| Phase 5 (아이콘 최적화) | 1시간     | 🟡 MEDIUM          |
| Phase 3-4 (코드 최적화) | 6시간     | 🟢 LOW (추가 작업) |

**총 예상 시간**: 13시간 (3-4일 개발)

---

## 🎯 Success Metrics

### 정량적 지표

- **번들 크기**: 379 KB → 250 KB (34% 절감) ✅ Goal: Phase 1-5
- **로드 시간**: 2-3초 → 1-2초
- **Gzip 크기**: 110 KB → 90 KB (18% 절감)

### 정성적 지표

- ✅ 모든 기능 정상 작동
- ✅ UI 렌더링 정상
- ✅ 테스트 100% 통과
- ✅ 버그 0개

---

**작성일**: 2025-11-10 **최종 검토**: 대기 중 **상태**: 📋 Ready for
Implementation
