# test/unit/shared/services/impl README

## 개요

`test/unit/shared/services/impl/`은 **서비스의 기본 구현(Base Implementation)
테스트**를 위치시킨 디렉터리입니다.

## 📝 포함된 테스트 (6개)

| 파일                                      | 목적                        |
| ----------------------------------------- | --------------------------- |
| `bulk-download-service-base-impl.test.ts` | 다운로드 기본 구현 검증     |
| `download-orchestrator-base-impl.test.ts` | 다운로드 조율자 기본 구현   |
| `event-manager-base-impl.test.ts`         | 이벤트 관리자 기본 구현     |
| `icon-registry-types.test.ts`             | 아이콘 레지스트리 타입      |
| `keyboard-navigator-base-impl.test.ts`    | 키보드 네비게이터 기본 구현 |
| `media-service-base-impl.test.ts`         | 미디어 서비스 기본 구현     |

## 🎯 역할

### 기본 구현 테스트의 특징

- 서비스의 **초기 버전** 또는 **추상 인터페이스** 검증
- 구체적 구현이 있기 전 **계약(Contract)** 검증
- 상속/조합 패턴의 **base 클래스** 동작 검증

### 상위 계층과의 관계

```
src/shared/services/
├── media-service.ts                    ← 실제 구현
└── (tests)
    ├── media-service.test.ts           ← 본 구현 테스트
    ├── media-service.contract.test.ts  ← 계약 검증
    └── impl/
        └── media-service-base-impl.test.ts ← 기본 구현 테스트
```

## 💡 사용 패턴

### 기본 구현 테스트 작성

```typescript
// ✅ 좋은 예: 기본 구현의 역할이 명확함
describe('BulkDownloadService Base Implementation', () => {
  // 초기화, 상태 관리, 에러 처리 등
  // 구체적 다운로드 로직은 아님
});

// ❌ 나쁜 예: 구체적 구현 테스트 (본 파일에서 수행)
describe('BulkDownloadService', () => {
  // 이는 ../bulk-download-service.test.ts에서 수행
});
```

## 📂 구조 개선 (Phase 175+)

이 디렉터리는 기본 구현의 테스트를 중심화합니다:

### Before (Phase 174)

```
test/unit/services/
├── bulk-download-service-base-impl.test.ts
├── media-service-base-impl.test.ts
└── ... (6개)
```

### After (Phase 175+)

```
test/unit/shared/services/impl/
├── bulk-download-service-base-impl.test.ts
├── media-service-base-impl.test.ts
└── ... (6개) + README.md
```

## 🔍 구분 가이드

### impl/ 에 배치할 테스트

- **Base 클래스** 검증
- **추상 인터페이스** 계약
- **상속 패턴** 동작
- 구체 구현 **이전** 단계의 검증

### 상위 shared/services/ 에 배치할 테스트

- **구체 구현** 로직
- **통합 계약** (contract.test.ts)
- **도메인별 구현** (media/, media-extraction/, storage/ 등)

---

## 📊 통계

- **파일 수**: 6개
- **목적**: Base 구현 검증
- **유지보수 수준**: 낮음 (변경 거의 없음)

---

## 관련 문서

- **[test/unit/shared/services/README.md](../README.md)**: 서비스 테스트 전체
  가이드
- **[docs/TESTING_STRATEGY.md](../../../../docs/TESTING_STRATEGY.md)**: 테스트
  전략
- **[docs/ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)**: 아키텍처
