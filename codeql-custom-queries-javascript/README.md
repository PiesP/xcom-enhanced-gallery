# CodeQL Custom Queries for xcom-enhanced-gallery

이 디렉터리는 프로젝트 특화 CodeQL 쿼리를 포함합니다. 각 쿼리는 코딩 규칙을
자동으로 검증합니다.

## 로컬 실행 방법

### 1. CodeQL 도구 설치 (권장 순서)

**옵션 A: GitHub CLI 확장 (권장)**

```pwsh
gh extension install github/gh-codeql
```

**옵션 B: CodeQL CLI 직접 설치**

[CodeQL CLI 다운로드](https://github.com/github/codeql-cli-binaries/releases)에서
바이너리를 다운로드하고 PATH에 추가

### 2. 쿼리 실행

```pwsh
# 스크립트로 자동 실행 (데이터베이스 생성 + 쿼리 실행 + 결과 출력)
node scripts/check-codeql.js

# 결과는 codeql-results/ 디렉터리에 SARIF 형식으로 저장됩니다
```

**참고**: `npm run validate` 실행 시 자동으로 CodeQL 검사가 포함됩니다

## 쿼리 목록

### Error Level (즉시 수정 필요)

#### 1. direct-vendor-imports.ql

벤더 라이브러리의 직접 import 감지

**위반 예시**:

```typescript
// ❌ 금지
import { createSignal } from 'solid-js';

// ✅ 허용
import { getSolid } from '@shared/external/vendors';
const { createSignal } = getSolid();
```

#### 2. forbidden-touch-events.ql

터치/포인터 이벤트 사용 감지. 프로젝트는 PC 전용 입력 정책을 따름

#### 3. unsafe-download-pattern.ql

안전하지 않은 다운로드 패턴 감지

**위반 예시**:

```typescript
// ❌ 금지
const a = document.createElement('a');
a.href = url;
a.download = filename;

// ✅ 허용
await getUserscript().download(url, filename);
```

#### 4. debugger-statement.ql

프로덕션 코드의 debugger 문 감지

#### 5. unsafe-eval.ql

eval() 또는 Function 생성자 사용 감지

### Warning Level (리뷰 후 수정 권장)

#### 6. hardcoded-color-values.ql

하드코딩된 색상값 감지

**위반 예시**:

```typescript
// ❌ 금지
const style = { color: '#1da1f2' };

// ✅ 허용
const style = { color: 'var(--xeg-color-primary)' };
```

#### 7. hardcoded-size-values.ql

하드코딩된 px 크기값 감지

#### 8. console-statements.ql

프로덕션 코드의 console 사용 감지

**위반 예시**:

```typescript
// ❌ 금지 (src/)
console.log('Debug');

// ✅ 허용
import { logger } from '@shared/logging';
logger.debug('Debug');
```

## 실행 방법

### 로컬 실행 (선택적)

```bash
# CodeQL CLI 설치
gh extension install github/gh-codeql

# 쿼리 실행
npm run codeql:check
```

**참고**: CodeQL CLI가 없어도 npm run validate는 정상 실행됩니다

## CI 실행 (자동)

GitHub Actions Security 워크플로우가 자동 실행됩니다:

- master 브랜치 push
- 매주 월요일 오전 9시 (UTC)

## 쿼리 추가 가이드

1. \*.ql 파일 생성
2. README 업데이트
3. 테스트 샘플 추가 (선택적)
4. docs/CODING_GUIDELINES.md에 문서화

## 문제 해결

### CodeQL CLI가 설치되어 있지 않습니다

정상입니다. CI에서 자동으로 실행됩니다. 로컬 설치는 선택사항입니다

### 쿼리 실행이 너무 느립니다

CodeQL은 전체 코드베이스를 분석하므로 시간이 걸립니다. CI 실행을 권장합니다

## 관련 문서

- docs/CODE_QUALITY.md: 전체 점검 도구 가이드
- docs/CODING_GUIDELINES.md: 코딩 규칙 상세
- scripts/check-codeql.js: 실행 스크립트
