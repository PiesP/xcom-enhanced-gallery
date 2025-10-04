# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic CODEQL-SECURITY-HARDENING 활성화

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심
- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

---

## 2. 활성 Epic 현황

### Epic CODEQL-SECURITY-HARDENING (활성)

**승격일**: 2025-10-05 **출처**: GitHub Security 점검 (CodeQL 분석 결과)
**우선순위**: HIGH (보안 취약점 5건)

#### 목표

CodeQL 정적 분석으로 발견된 보안 경고 5건을 해결하여 프로젝트의 보안 등급을
향상시킵니다.

**발견된 보안 이슈**:

1. **js/incomplete-url-substring-sanitization** (4건, WARNING)
   - `src/shared/utils/media/media-url.util.ts:159, 163`
   - `test/__mocks__/twitter-dom.mock.ts:304, 414`
   - 문제: `includes('twimg.com')` 방식의 불완전한 URL 검증
   - 공격 예: `https://evil.com/twimg.com/malicious.js` 통과 가능

2. **js/prototype-pollution-utility** (1건, WARNING)
   - `src/features/settings/services/SettingsService.ts:232`
   - 문제: `mergeCategory()` 함수의 재귀적 속성 할당 시 prototype pollution 위험

#### 솔루션 분석

##### Issue 1: URL Substring Sanitization

| 옵션                                                              | 장점                                                                                                           | 단점                                                                                               | 선택        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| **Option A**: 기존 `isTrustedTwitterMediaHostname` 가드 일관 사용 | 이미 구현된 안전한 검증 로직 활용 / 코드 일관성 향상 / 추가 번들 비용 없음 / URL API 기반 정확한 hostname 추출 | 기존 코드 6곳 수정 필요 (실제 2곳 + mock 4곳)                                                      | ✅ **채택** |
| **Option B**: 정규식 기반 호스트명 추출                           | 간단한 구현                                                                                                    | 중복 로직 (url-safety.ts와 중복) / Edge case 처리 복잡 (IPv6, port, encoding) / 유지보수 부담 증가 | ❌ 기각     |

##### Issue 2: Prototype Pollution

| 옵션                                                          | 장점                                                          | 단점                              | 선택        |
| ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------- | ----------- |
| **Option A**: `mergeCategory`에 `sanitizeSettingsTree` 적용   | 기존 보안 레이어 활용 / 일관된 보안 아키텍처 / 최소 코드 변경 | 약간의 성능 오버헤드 (재귀 호출)  | ✅ **채택** |
| **Option B**: `mergeCategory` 내부에 직접 prototype 체크 추가 | 성능 최적화 가능                                              | 중복 로직 / 유지보수 부담         | ❌ 기각     |
| **Option C**: 안전한 merge 유틸 별도 작성                     | 명시적인 안전성                                               | 추가 번들 비용 / Over-engineering | ❌ 기각     |

**최종 선택**: 두 이슈 모두 **기존 안전 함수 활용** (Option A)

#### Phase 1: RED (보안 취약점 재현 테스트)

**작업 파일**:

- `test/security/url-sanitization-hardening.contract.test.ts` (신규)
- `test/security/prototype-pollution-hardening.contract.test.ts` (신규)

**테스트 스펙**:

```typescript
describe('URL Sanitization Hardening', () => {
  it('should reject malicious URL with twimg.com in path', () => {
    const malicious = 'https://evil.com/twimg.com/malicious.js';
    expect(() => createMediaInfoFromVideo({ src: malicious })).toThrow();
  });

  it('should reject malicious URL with twimg.com subdomain', () => {
    const malicious = 'https://twimg.com.evil.com/malicious.js';
    expect(() => createMediaInfoFromVideo({ src: malicious })).toThrow();
  });
});

describe('Prototype Pollution Hardening', () => {
  it('should reject settings with __proto__ key', () => {
    const malicious = { gallery: { __proto__: { isAdmin: true } } };
    expect(() => SettingsService.prototype.set('gallery', malicious)).toThrow(
      SettingsSecurityError
    );
  });

  it('should reject settings with constructor key', () => {
    const malicious = {
      gallery: { constructor: { prototype: { isAdmin: true } } },
    };
    expect(() => SettingsService.prototype.set('gallery', malicious)).toThrow(
      SettingsSecurityError
    );
  });
});
```

**수용 기준**:

- [ ] 6개 이상 보안 테스트 작성 (URL 4개 + Prototype 2개)
- [ ] 모든 테스트 초기 RED 확인
- [ ] `npm run typecheck` GREEN
- [ ] `npm run lint:fix` GREEN

#### Phase 2: GREEN (최소 수정으로 보안 강화)

**Issue 1 수정**:

`src/shared/utils/media/media-url.util.ts`:

```typescript
// Before (Line 159, 163)
if (src && src.includes('twimg.com') && !isTrustedTwitterMediaHostname(src)) {
  return null;
}

if (
  poster &&
  poster.includes('twimg.com') &&
  !isTrustedTwitterMediaHostname(poster)
) {
  return null;
}

// After
if (src && !isTrustedTwitterMediaHostname(src)) {
  return null;
}

if (poster && !isTrustedTwitterMediaHostname(poster)) {
  return null;
}
```

**Issue 2 수정**:

`src/features/settings/services/SettingsService.ts`:

```typescript
// Before (Line 68-79)
function mergeCategory<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Record<string, unknown>
): T {
  const target = Object.create(null) as Record<string, unknown>;

  for (const [key, value] of Object.entries(defaults)) {
    target[key] = value;
  }

  if (overrides && typeof overrides === 'object') {
    for (const [key, value] of Object.entries(overrides)) {
      target[key] = value; // ⚠️ prototype pollution 위험
    }
  }

  return target as T;
}

// After
function mergeCategory<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Record<string, unknown>
): T {
  const target = Object.create(null) as Record<string, unknown>;

  for (const [key, value] of Object.entries(defaults)) {
    target[key] = value;
  }

  if (overrides && typeof overrides === 'object') {
    const sanitizedOverrides = sanitizeSettingsTree(overrides, [
      'mergeCategory',
    ]);
    for (const [key, value] of Object.entries(sanitizedOverrides)) {
      target[key] = value; // ✅ sanitized
    }
  }

  return target as T;
}
```

**Mock 파일 수정**:

`test/__mocks__/twitter-dom.mock.ts` (Line 304, 414):

```typescript
// Before
if (
  target &&
  target.tagName === 'IMG' &&
  target.src.includes('pbs.twimg.com')
) {
  // ...
}

// After
import {
  isTrustedHostname,
  TWITTER_MEDIA_HOSTS,
} from '@shared/utils/url-safety';

if (
  target &&
  target.tagName === 'IMG' &&
  isTrustedHostname(target.src, TWITTER_MEDIA_HOSTS)
) {
  // ...
}
```

**수용 기준**:

- [ ] Phase 1의 모든 테스트 GREEN
- [ ] 기존 테스트 회귀 없음 (전체 테스트 GREEN)
- [ ] `npm run typecheck` GREEN
- [ ] `npm run lint:fix` GREEN
- [ ] CodeQL 재스캔 시 경고 5건 → 0건

#### Phase 3: REFACTOR (문서화 및 검증 강화)

**작업 항목**:

1. **문서 업데이트**:
   - `docs/CODING_GUIDELINES.md`에 URL 검증 규칙 추가
   - `docs/ARCHITECTURE.md`의 보안 섹션 강화
   - `codeql-improvement-plan.md` 체크박스 완료 처리

2. **추가 테스트 커버리지**:
   - Edge case 추가: IPv6, 포트 번호, URL 인코딩
   - Prototype pollution: nested object, array 케이스

3. **린트 규칙 강화 (선택)**:
   - ESLint 커스텀 규칙: `.includes('twimg.com')` 사용 금지
   - `url-safety.ts`의 가드 함수 사용 강제

**수용 기준**:

- [ ] 전체 테스트 GREEN (회귀 없음)
- [ ] CodeQL 재스캔 결과: 경고 0건
- [ ] 문서 업데이트 완료 (3개 파일)
- [ ] `npm run build:dev` + `npm run build:prod` 성공
- [ ] 번들 크기 변화: +150 bytes raw 미만 (기존 함수 활용으로 최소화)

#### 예상 영향

**보안**:

- ✅ CodeQL 경고 5건 → 0건
- ✅ URL 공격 벡터 차단 (path injection, subdomain spoofing)
- ✅ Prototype pollution 완전 방지

**번들**:

- 📦 +150 bytes raw (import 문 추가, 조건문 간소화로 상쇄)
- 📦 +50 bytes gzip

**성능**:

- ⚡ URL 검증: 기존 함수 활용으로 영향 없음
- ⚡ Settings merge: +0.1ms/call (재귀 호출 오버헤드, 무시 가능)

**호환성**:

- ✅ Breaking Change 없음 (내부 구현만 변경)
- ✅ 기존 테스트 100% 호환

#### 참고 문서

- CodeQL 결과: `codeql-results-summary.csv`, `codeql-improvement-plan.md`
- URL Safety: `src/shared/utils/url-safety.ts`
- Settings Security: `src/features/settings/services/SettingsService.ts`
- 가이드라인: `docs/CODING_GUIDELINES.md`

---

**현재 테스트 상태** (2025-10-04):

- Test Files: 423 passed | 18 skipped (441)
- Tests: 2646 passed | 107 skipped | 1 todo (2754)
- 모든 테스트 GREEN ✅

---

## 3. 최근 완료 Epic (요약)

최근 완료된 Epic들은 모두 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로
이관되었습니다.

**주요 Epic (2025-01-09 ~ 2025-10-04)**:

- **FFLATE-DEPRECATED-API-REMOVAL** (2025-10-04): deprecated fflate API 완전
  제거 ✅
  - Breaking Change: `getFflate()` API 제거
  - Phase 1-3 완료, 16/16 contract tests PASS
  - 15 files changed (1 deleted, 14 modified)
- **TEST-FAILURE-ALIGNMENT-PHASE2** (2025-01-09): 29/29 tests GREEN ✅
  - Signal Native pattern, Toolbar CSS, Settings/Language, Integration 테스트
    정렬
- **TEST-FAILURE-FIX-REMAINING** (2025-10-04): 테스트 실패 38→29개 개선 ✅
  - Bundle budget, Tooltip 타임아웃, Hardcoded values, LanguageService 싱글톤
- **CODEQL-STANDARD-QUERY-PACKS** (2025-10-04): 부분 완료 ⚠️
  - 로컬/CI CodeQL 권한 제약으로 Backlog HOLD 상태

**이전 Epic (2025-01-04 ~ 2025-01-08)**:

- CUSTOM-TOOLTIP-COMPONENT, UI-TEXT-ICON-OPTIMIZATION, JSX-PRAGMA-CLEANUP,
  GALLERY-NAV-ENHANCEMENT, SOLIDJS-REACTIVE-ROOT-CONTEXT 등

전체 상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
