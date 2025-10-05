# 보안 가이드

> URL 검증, Prototype Pollution 방지, CodeQL 통합

**관련 문서**: [아키텍처](ARCHITECTURE.md) | [코딩 규칙](CODING_GUIDELINES.md) |
[테스트 가이드](TESTING_GUIDE.md)

---

## 📋 개요

이 프로젝트는 X.com(Twitter) 미디어 URL을 처리하므로 XSS, Injection, Prototype
Pollution 등 보안 위협에 노출됩니다. 모든 외부 데이터는 검증을 거쳐야 합니다.

### 보안 원칙

1. **Zero Trust**: 모든 외부 데이터는 악의적이라고 가정
2. **Defense in Depth**: 다층 방어 전략
3. **Secure by Default**: 기본값이 안전한 설정
4. **Least Privilege**: 최소 권한 원칙

---

## 🔒 URL 검증 (XSS/Injection 방지)

### 위협 시나리오

#### 1. Path Injection

```text
❌ https://evil.com/twimg.com/malicious.js
   → "twimg.com"이 경로에 포함되어 검증 우회
```

#### 2. Subdomain Spoofing

```text
❌ https://twimg.com.evil.com/malicious.js
   → 정확한 subdomain이 아닌 hostname에 포함
```

#### 3. Hostname Spoofing

```text
❌ https://twimg-com.evil.com/malicious.js
   → hostname 유사 문자열로 위장
```

### 보안 함수

#### isTrustedTwitterMediaHostname

**위치**: `src/shared/utils/url-safety.ts`

```typescript
import { isTrustedTwitterMediaHostname } from '@shared/utils/url-safety';

// ✅ 올바른 방법
if (src && !isTrustedTwitterMediaHostname(src)) {
  return null; // 악의적 URL 거부
}

// ❌ 금지 (불완전한 검증)
if (src && src.includes('twimg.com')) {
  // 취약: evil.com/twimg.com 또는 twimg.com.evil.com 통과 가능
}
```

**내부 구현** (참고용):

```typescript
const TWITTER_MEDIA_HOSTS = [
  'pbs.twimg.com',
  'video.twimg.com',
  'ton.twitter.com',
  'abs.twimg.com',
];

export function isTrustedTwitterMediaHostname(urlString: string): boolean {
  try {
    // URL 객체로 정확한 hostname 추출
    const urlObj = new URL(urlString);
    const hostname = urlObj.hostname.toLowerCase();

    // 허용된 정확한 hostname만 허용 (startsWith/includes 금지)
    return TWITTER_MEDIA_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}
```

#### isTrustedHostname (커스텀 허용 목록)

```typescript
import { isTrustedHostname } from '@shared/utils/url-safety';

const allowedHosts = ['example.com', 'cdn.example.com'];

if (url && !isTrustedHostname(url, allowedHosts)) {
  throw new Error('Untrusted hostname');
}
```

### 적용 지점

**필수 검증 위치**:

1. **미디어 URL 추출** (`src/shared/utils/media/media-url.util.ts`)
2. **Settings URL 검증** (`src/features/settings/services/SettingsService.ts`)
3. **다운로드 URL 검증** (`src/shared/services/MediaService.ts`)

**예제**:

```typescript
// src/shared/utils/media/media-url.util.ts
export function extractMediaUrl(element: Element): string | null {
  const src = element.getAttribute('src');

  if (!src || !isTrustedTwitterMediaHostname(src)) {
    return null; // lgtm[js/incomplete-url-substring-sanitization]
  }

  return src;
}
```

**CodeQL False Positive 억제**:

```typescript
// lgtm[js/incomplete-url-substring-sanitization]
```

**Rationale**: CodeQL 정적 분석이 `isTrustedTwitterMediaHostname`의 내부 구현을
추적하지 못해 경고 발생. 실제로는 정확한 hostname 검증을 수행함.

---

## 🛡️ Prototype Pollution 방지

### 위협 시나리오

#### 악의적 JSON (Settings Import)

```json
{
  "__proto__": {
    "isAdmin": true
  },
  "constructor": {
    "prototype": {
      "isAdmin": true
    }
  }
}
```

**공격 결과**: 모든 객체에 `isAdmin` 속성이 추가됨 (Prototype Chain 오염)

### 보안 함수

#### sanitizeSettingsTree

**위치**: `src/features/settings/services/SettingsService.ts`

```typescript
import { sanitizeSettingsTree } from '@features/settings/services/SettingsService';

// ✅ 올바른 방법
const sanitized = sanitizeSettingsTree(externalData, ['mergeContext']);
for (const [key, value] of Object.entries(sanitized)) {
  target[key] = value;
}

// ❌ 금지 (prototype pollution 취약)
for (const [key, value] of Object.entries(externalData)) {
  target[key] = value; // __proto__, constructor 키 차단 없음
}
```

**내부 구현** (참고용):

```typescript
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

export function sanitizeSettingsTree(
  obj: unknown,
  context: string[]
): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }

  const clean = Object.create(null); // Prototype 없는 객체

  for (const [key, value] of Object.entries(obj)) {
    // 위험한 키 차단
    if (DANGEROUS_KEYS.includes(key)) {
      logWarn('Blocked dangerous key', { key, context });
      continue;
    }

    // 재귀적으로 정화
    if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeSettingsTree(value, [...context, key]);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}
```

### 적용 지점

**필수 정화 위치**:

1. **Settings Import** (`SettingsService.importSettings()`)
2. **Settings Merge** (`SettingsService.mergeCategory()`)

**예제**:

```typescript
// src/features/settings/services/SettingsService.ts
public importSettings(jsonString: string): void {
  const parsed = JSON.parse(jsonString);

  // ✅ 정화 후 병합
  const sanitized = sanitizeSettingsTree(parsed, ['importSettings']);

  for (const [category, value] of Object.entries(sanitized)) {
    this.settings[category] = value; // lgtm[js/prototype-pollution-utility]
  }
}
```

**CodeQL False Positive 억제**:

```typescript
// lgtm[js/prototype-pollution-utility]
```

**Rationale**: `sanitizeSettingsTree`로 이미 정화되었으므로 안전. CodeQL이 함수
내부 구현을 추적하지 못해 경고.

---

## 🔍 CodeQL 통합

### 로컬 분석

```pwsh
npm run codeql:scan         # 로컬 분석 (Fallback 쿼리 팩 자동 전환)
npm run codeql:dry-run      # 미리보기
```

**산출물**:

- SARIF: `codeql-results.sarif`
- 요약 CSV: `codeql-results-summary.csv`
- 개선 계획: `codeql-improvement-plan.md`

### CI 환경

**워크플로**: `.github/workflows/security.yml`

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: javascript

- name: Autobuild
  uses: github/codeql-action/autobuild@v3

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
```

**쿼리 팩**:

| 환경 | 쿼리 팩                                  | 규칙 수 | 접근 권한                     |
| ---- | ---------------------------------------- | ------- | ----------------------------- |
| 로컬 | `codeql/javascript-queries`              | 50+     | 무료                          |
| CI   | `codeql/javascript-security-and-quality` | 400+    | GitHub Advanced Security 필요 |

### False Positive 억제

**사용 조건**: 보안 함수가 이미 검증을 수행하지만 CodeQL이 추적하지 못하는 경우

**형식**:

```typescript
// lgtm[rule-id]
```

**예제**:

```typescript
export function extractMediaUrl(element: Element): string | null {
  const src = element.getAttribute('src');

  if (!src || !isTrustedTwitterMediaHostname(src)) {
    return null; // lgtm[js/incomplete-url-substring-sanitization]
  }

  return src;
}
```

**Rationale 주석 (필수)**:

```typescript
// Rationale: `isTrustedTwitterMediaHostname`는 정확한 hostname 검증을 수행하여
// URL 객체로 추출한 hostname을 허용 목록과 정확히 비교합니다.
// CodeQL 정적 분석이 함수 내부 구현을 추적하지 못해 경고가 발생하지만,
// 실제로는 Path Injection, Subdomain Spoofing, Hostname Spoofing 공격을 모두 차단합니다.
```

---

## 🧪 보안 테스트

### URL Sanitization Tests

**위치**: `test/security/url-sanitization-hardening.contract.test.ts`

```typescript
describe('URL Sanitization Hardening', () => {
  it('should reject path injection', () => {
    const malicious = 'https://evil.com/twimg.com/malicious.js';
    expect(isTrustedTwitterMediaHostname(malicious)).toBe(false);
  });

  it('should reject subdomain spoofing', () => {
    const malicious = 'https://twimg.com.evil.com/malicious.js';
    expect(isTrustedTwitterMediaHostname(malicious)).toBe(false);
  });

  it('should reject hostname spoofing', () => {
    const malicious = 'https://twimg-com.evil.com/malicious.js';
    expect(isTrustedTwitterMediaHostname(malicious)).toBe(false);
  });

  it('should accept valid Twitter media URL', () => {
    const valid = 'https://pbs.twimg.com/media/abc.jpg';
    expect(isTrustedTwitterMediaHostname(valid)).toBe(true);
  });
});
```

### Prototype Pollution Tests

**위치**: `test/security/prototype-pollution-hardening.contract.test.ts`

```typescript
describe('Prototype Pollution Hardening', () => {
  it('should block __proto__ key', () => {
    const malicious = { __proto__: { isAdmin: true } };
    const sanitized = sanitizeSettingsTree(malicious, ['test']);

    expect(sanitized).not.toHaveProperty('__proto__');
    expect(Object.prototype).not.toHaveProperty('isAdmin');
  });

  it('should block constructor key', () => {
    const malicious = { constructor: { prototype: { isAdmin: true } } };
    const sanitized = sanitizeSettingsTree(malicious, ['test']);

    expect(sanitized).not.toHaveProperty('constructor');
  });

  it('should preserve safe keys', () => {
    const safe = { theme: 'dark', language: 'en' };
    const sanitized = sanitizeSettingsTree(safe, ['test']);

    expect(sanitized).toHaveProperty('theme', 'dark');
    expect(sanitized).toHaveProperty('language', 'en');
  });
});
```

---

## 🎯 보안 체크리스트

### 코드 작성 시

- [ ] 모든 외부 URL은 `isTrustedTwitterMediaHostname` 검증
- [ ] JSON 파싱 후 `sanitizeSettingsTree` 정화
- [ ] 사용자 입력은 항상 검증/이스케이프
- [ ] innerHTML 사용 금지 (textContent 사용)
- [ ] eval(), Function() 생성자 사용 금지

### PR 리뷰 시

- [ ] 보안 함수 일관성 적용 확인
- [ ] False Positive 억제 주석에 Rationale 포함
- [ ] 보안 테스트 추가 확인
- [ ] CodeQL 경고 0건 확인

### 릴리즈 전

- [ ] CodeQL 로컬 스캔 실행
- [ ] 보안 테스트 전체 GREEN
- [ ] `npm audit` 취약점 0건
- [ ] 의존성 라이선스 검토

---

## 📚 참고 문서

- 아키텍처 (보안 정책): [`ARCHITECTURE.md`](ARCHITECTURE.md#보안-정책)
- CodeQL 로컬 가이드: [`CODEQL_LOCAL_GUIDE.md`](CODEQL_LOCAL_GUIDE.md)
- URL 안전 유틸: `src/shared/utils/url-safety.ts`
- Settings 서비스: `src/features/settings/services/SettingsService.ts`
- 보안 테스트: `test/security/`

---

## 🚨 보안 이슈 보고

보안 취약점을 발견한 경우:

1. **비공개 보고**: GitHub Security Advisories 사용
2. **긴급도 표시**: Critical / High / Medium / Low
3. **재현 단계 포함**: PoC 코드 또는 시나리오
4. **영향 범위**: 영향받는 버전 및 기능

**보고 경로**: `.github/SECURITY.md` 참조

---

본 가이드는 보안 전략의 단일 소스입니다. 새로운 위협이 발견되면 이 문서를
업데이트하고, 테스트로 회귀를 방지하세요.
