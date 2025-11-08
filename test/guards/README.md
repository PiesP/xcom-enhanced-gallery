# test/guards

프로젝트 상태 및 정책 준수를 검증하는 Guard 테스트들입니다.

## 📋 개요

Guards는 프로젝트 건강 상태와 코드 정책 준수를 자동으로 검증하여 배포 전 문제를
조기 발견합니다.

## 🎯 테스트 카테고리

### 1. 프로젝트 상태 검증

- `project-health.test.ts`: Phase 170B+ 현황 체크

### 2. 상수 정책 검증

- `stable-selectors.scan.test.ts`: STABLE_SELECTORS 선택자 정책 (Phase 179)
  - 선택자 우선순위 검증
  - CSS 문법 유효성
  - 성능 최적화 규칙

### 3. 아키텍처 정책 (26개 파일)

#### Vendor & Import Policy (9개)

- `direct-imports-source-scan.test.js`: 직접 import 감지
- `vendor-getter.strict.scan.red.test.ts`: Vendor getter 엄격 정책
- `vendor-api.imports.scan.red.test.ts`: 벤더 API import
- `userscript-gm.direct-usage.scan.red.test.ts`: GM\_\* 직접 사용
- `zip-direct-usage.scan.red.test.ts`: ZIP API 직접 사용
- `runtime-appcontainer.imports.red.test.ts`: AppContainer 런타임 import
- `vendor-manager.runtime-imports.red.test.ts`: VendorManager 런타임 import
- `service-keys.direct-usage.scan.red.test.ts`: SERVICE_KEYS 직접 사용
- `features-no-servicemanager.imports.red.test.ts`: Features의 ServiceManager
  import 금지

#### Dependency & Circular Reference (5개)

- `barrel-reimport.cycle.scan.red.test.ts`: 배럴 역참조 (순환)
- `media-cycle.prune.red.test.ts`: Media 순환 참조
- `utils-services-boundary.scan.red.test.ts`: Utils-Services 경계

#### Module Export Policy (4개)

- `features-barrel.class-exports.scan.red.test.ts`: Features 클래스 export
- `features-barrel.surface.scan.red.test.ts`: Features 표면 export
- `media-barrel.avoidance.guard.test.ts`: Media 배럴 회피
- `zip-api-surface.scan.red.test.ts`: ZIP API 표면

#### Type & Naming Policy (4개)

- `type-only-imports.policy.red.test.ts`: 타입 전용 import 정책
- `service-keys.naming.scan.test.ts`: SERVICE_KEYS 명명 규칙 (Phase 179)
- `i18n-literal.scan.red.test.ts`: i18n 리터럴
- `icons-used-only.scan.red.test.ts`: Icons 사용 규칙

#### Component State & Behavior (2개)

- `toast-ui-barrel.stateful-exports.guard.test.ts`: Toast UI 상태 export
- `toast-ui-components.no-local-state.guard.test.ts`: Toast UI 로컬 상태 금지

#### Other Policies (2개)

- `lint-getter-policy.test.ts`: Getter 정책 lint
- `test-console-logs.test.ts`: 콘솔 로그 정책
- `timer-direct-usage.scan.red.test.ts`: Timer 직접 사용
- `animation-alias-removal.test.ts`: Animation 별칭 제거

## 🔍 파일명 규칙

- `*.test.ts`: 활성 테스트
- `*.scan.test.ts`: 코드 스캔 기반
- `*.scan.red.test.ts`: RED 테스트 (의도적 실패)
- `*.guard.test.ts`: Guard 규칙 강제

## ✅ 실행 방법

```bash
# 모든 Guards 실행
npx vitest run test/guards/

# 특정 파일만 실행
npx vitest run test/guards/project-health.test.ts

# 감시 모드
npx vitest watch test/guards/
```

## 💡 사용 사례

### 배포 전 검증

```bash
npm run build  # 모든 guards 포함
```

### CI 파이프라인

Guards는 CI에서 자동으로 실행되어 코드 정책 위반을 조기 감지합니다.

## 📝 새 Guard 추가 가이드

1. **파일명**: `{policy}-{type}.test.ts` (예:
   `service-keys.naming.scan.test.ts`)
2. **목적**: 명확한 정책 1개에 집중
3. **검증**: 규칙 위반 시 명확한 오류 메시지
4. **문서화**: 파일 상단 주석으로 목적 설명

### 예제

```typescript
/**
 * {정책명} 검증 테스트
 * {정책 설명}
 */

import { describe, it, expect } from 'vitest';

describe('Policy Name', () => {
  it('should enforce {rule}', () => {
    // 검증 로직
    expect(condition).toBe(true);
  });
});
```

---

관련 문서: `docs/CODING_GUIDELINES.md` · `docs/ARCHITECTURE.md` ·
`docs/DEPENDENCY-GOVERNANCE.md`
