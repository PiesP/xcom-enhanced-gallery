# Factories & Test Utilities (Shared)

> 테스트 헬퍼 및 팩토리 함수 모음
> 최종 업데이트: 2025-10-25 (Phase 188)

## 📋 파일 목록

### Mock & Factory

- `mock-utils.factory.ts`: 테스트 모킹 유틸리티 (mock 생성, 스파이 설정 등)

**상태**: 활성 (유지)
**용도**: 테스트 전반에서 재사용 가능한 팩토리 함수
**적용 범위**: test/unit/shared, test/unit/features

## 🔄 구조

```
test/unit/shared/
├── factories/              ← 테스트 팩토리 & 모킹 유틸
│   └── mock-utils.factory.ts
├── services/
├── components/
├── hooks/
├── integration/
├── setup/
├── external/
├── dom/
├── logging/
├── media/
├── state/
├── types/
├── container/
├── browser/
└── i18n/
```

## 📖 사용 패턴

```typescript
import { createMockService, createSpyEvent } from '@test/unit/shared/factories/mock-utils.factory';

describe('MyTest', () => {
  it('should work', () => {
    const mockService = createMockService();
    const spy = createSpyEvent();
    // ...
  });
});
```

## ✅ 개선 계획

1. **팩토리 확대**: 더 많은 domain-specific 팩토리 추가 가능
2. **타입 안정성**: TypeScript strict mode 유지
3. **문서화**: 각 팩토리 함수 JSDoc 주석 추가

---

**참고**: Phase 188에서 `test/unit/__factories__/`에서 이동했습니다.
