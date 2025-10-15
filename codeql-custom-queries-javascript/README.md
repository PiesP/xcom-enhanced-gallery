# CodeQL Custom Queries for xcom-enhanced-gallery

이 디렉토리는 프로젝트 특화 CodeQL 쿼리를 포함합니다. 각 쿼리는
`docs/CODING_GUIDELINES.md`와 `.github/copilot-instructions.md`에 정의된 코딩
규칙을 자동으로 검증합니다.

## 쿼리 목록

### 1. `direct-vendor-imports.ql` (오류)

**목적**: 벤더 라이브러리의 직접 import 감지

**위반 예시**:

```typescript
// ❌ 금지
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

// ✅ 허용
import { getSolid, getSolidStore } from '@shared/external/vendors';
const { createSignal } = getSolid();
const { createStore } = getSolidStore();
```

**이유**: 테스트 모킹 용이성, TDZ 안전성, 아키텍처 경계 유지

---

### 2. `forbidden-touch-events.ql` (오류)

**목적**: 터치/포인터 이벤트 사용 감지

**위반 예시**:

```typescript
// ❌ 금지
element.addEventListener('touchstart', handler);
<div onTouchMove={handler} />
element.addEventListener('pointerdown', handler);

// ✅ 허용 (PC 전용 이벤트)
element.addEventListener('click', handler);
element.addEventListener('keydown', handler);
element.addEventListener('wheel', handler);
```

**이유**: 프로젝트는 PC 전용 입력 정책을 따름 (설계 원칙)

---

### 3. `hardcoded-color-values.ql` (경고)

**목적**: 하드코딩된 색상값 감지

**위반 예시**:

```typescript
// ❌ 금지: hex, rgb, rgba, hsl
const style = { color: '#1da1f2', background: 'rgb(29, 161, 242)' };

// ✅ 허용: oklch() 전용
const style = {
  color: 'oklch(0.7 0.15 220)', // 파란색
  background: 'oklch(0 0 0 / var(--opacity-overlay-light))', // 검은색 + opacity
};

// ✅ 허용: 디자인 토큰
const style = {
  color: 'var(--xeg-color-primary)',
  background: 'var(--xeg-color-bg)',
};
```

**예외**:

- 디자인 토큰 정의 파일 (`design-tokens*.css`)
- 테스트 파일
- 흑백 기본값: `#000000`, `#ffffff`, `transparent`
- oklch 형식은 항상 허용

**이유**: 일관된 테마 적용, oklch 색공간 사용 (CODING_GUIDELINES.md)

---

### 4. `hardcoded-size-values.ql` (경고)

**목적**: 하드코딩된 px 크기값 감지

**위반 예시**:

```typescript
// ❌ 금지: JavaScript/TypeScript에서 px 직접 사용
const style = {
  padding: '16px',
  fontSize: '14px',
  borderRadius: '8px',
};

// ✅ 허용: rem (절대 크기) / em (상대 크기) 토큰
const style = {
  padding: 'var(--space-md)', // 1rem
  fontSize: 'var(--font-size-base)', // 0.9375rem
  borderRadius: 'var(--radius-md)', // 0.375em
};
```

**예외**:

- 디자인 토큰 정의 파일 (`design-tokens*.css`)
- 테스트 파일
- 설정 파일 (`vite.config.ts`, `postcss.config.js`)

**이유**: rem/em 단위 사용으로 접근성 향상, 일관된 스케일링

**참고**: CSS 파일의 px 검증은 stylelint가 담당 (`.stylelintrc.json`)

---

### 5. `unsafe-download-pattern.ql` (경고)

**목적**: 부적절한 다운로드 패턴 감지

**위반 예시**:

```typescript
// ❌ 금지
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();

// ✅ 허용
const { getUserscript } = await import('@shared/external/userscript/adapter');
await getUserscript().download(url, filename);
```

**예외**:

- `shared/external/userscript/` (어댑터 구현)
- `shared/services/download/` (서비스 계층)
- 테스트 파일

**이유**: 유저스크립트 환경 호환성, GM_download API 활용

---

## Stylelint 통합 ⭐ (CSS 규칙)

CSS 규칙(크기/색상)은 CodeQL 대신 **stylelint**로 강제합니다.

### 설정 파일: `.stylelintrc.json`

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "unit-disallowed-list": [
      ["px"],
      {
        "ignoreProperties": {
          "px": ["/^--/"]
        },
        "message": "Use design tokens (rem/em) instead"
      }
    ],
    "color-function-notation": "modern",
    "alpha-value-notation": "percentage"
  },
  "ignoreFiles": ["**/design-tokens*.css"]
}
```

### 실행

```powershell
# CSS 린트 (추가 예정)
npm run lint:css

# 자동 수정
npm run lint:css -- --fix
```

### 강제되는 규칙

1. **크기 단위**: px 하드코딩 금지 (토큰 정의 파일 제외)
2. **색상 함수**: 최신 표기법 (oklch) 권장
3. **투명도**: percentage 표기법 권장

---

## 로컬 실행

```pwsh
# CodeQL CLI 설치 필요
# https://github.com/github/codeql-cli-binaries/releases

# 데이터베이스 생성
codeql database create xeg-db --language=javascript

# 쿼리 실행
codeql database analyze xeg-db codeql-custom-queries-javascript/ --format=sarif-latest --output=results.sarif

# 결과 보기
codeql github upload-results --repository=PiesP/xcom-enhanced-gallery --ref=refs/heads/master --commit=$(git rev-parse HEAD) --sarif=results.sarif
```

## CI 통합

이 쿼리들은 `.github/workflows/security.yml`에서 자동으로 실행됩니다:

```yaml
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  with:
    category: '/language:javascript'
    queries: ./codeql-custom-queries-javascript
```

## 쿼리 추가 가이드

새 쿼리를 추가할 때는:

1. **메타데이터 필수 항목**:
   - `@name`: 사람이 읽을 수 있는 이름
   - `@description`: 상세 설명
   - `@kind problem`: 문제 감지 쿼리
   - `@problem.severity`: error | warning | recommendation
   - `@id`: `javascript/xeg/<query-name>`
   - `@tags`: 분류 태그

2. **예외 처리**:
   - 테스트 파일은 기본적으로 제외
   - 구현 파일(어댑터/서비스)은 명시적 허용
   - 명확한 `isAllowedException()` 술어 정의

3. **메시지 품질**:
   - 무엇이 문제인지
   - 왜 금지되는지
   - 어떻게 수정하는지 (대안 제시)

## 참고 문서

- [CodeQL for JavaScript](https://codeql.github.com/docs/codeql-language-guides/codeql-for-javascript/)
- [프로젝트 코딩 가이드라인](../docs/CODING_GUIDELINES.md)
- [Copilot 개발 지침](../.github/copilot-instructions.md)
- [아키텍처 문서](../docs/ARCHITECTURE.md)
