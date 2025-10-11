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
// ❌ 금지
const style = { color: '#ffffff', background: 'rgb(0, 0, 0)' };

// ✅ 허용
const style = {
  color: 'var(--xeg-color-text)',
  background: 'var(--xeg-color-bg)',
};
```

**예외**:

- 디자인 토큰 정의 파일
- 테스트 파일
- `#000000` / `transparent` (보더/섀도우용)

**이유**: 일관된 테마 적용, 다크모드 지원

---

### 4. `unsafe-download-pattern.ql` (경고)

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
