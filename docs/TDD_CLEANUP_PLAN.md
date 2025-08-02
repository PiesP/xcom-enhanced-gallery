# TDD 기반 중복 통합 및 정리 작업 계획

> **목표**: 중복된 구현을 통합, 사용하지 않는 기능 제거, 이름을 간략하고
> 일관되게 변경

## 📋 Phase 1: 테스트 인프라 정리 ✅ 완료

### 완료된 작업

- [x] expect(true).toBe(true) 플레이스홀더 테스트 제거
- [x] 중복된 테스트 헬퍼 파일 정리 (.js → .ts 통합)
- [x] Mock 설정 개선 (spy 및 함수 레벨 모킹)
- [x] 애니메이션 테스트를 현재 CSS 기반 구현에 맞게 수정
- [x] 전체 테스트 스위트 안정화 (465개 테스트 모두 통과)

### 테스트 현황

- **전체 테스트**: 465개 (모두 통과)
- **테스트 파일**: 47개 (모두 통과)
- **빌드**: Dev/Prod 모두 성공

---

## 🔍 Phase 2: 중복 구현 식별 및 분석

### TDD 접근법

1. **RED**: 중복 구현을 식별하는 테스트 작성
2. **GREEN**: 중복 제거 후 기능 동작 확인 테스트
3. **REFACTOR**: 통합된 구현으로 리팩토링

### 식별된 중복 패턴

#### 🎯 우선순위 1: 서비스 중복

```typescript
// 중복 발견 지역:
- MediaExtractionService vs TwitterAPIExtractor
- DOMCache vs DOMBatcher
- AnimationService vs CSS 기반 애니메이션 유틸리티
- 여러 에러 핸들링 구현체
```

#### 🎯 우선순위 2: 유틸리티 중복 ✅ **완료**

```typescript
// ✅ 해결 완료: 통합 DOM 매니저로 중복 제거
// 이전 중복 패턴:
- DOM 조작 함수들 (dom-utils, DOMEventManager) → UnifiedDOMManager
- 캐싱 시스템 분리 (DOMCache vs DOMUtils) → 통합 캐시 인터페이스
- 배치 처리 분산 (globalDOMBatcher) → 통합 배치 시스템

// 🆕 해결 방안:
- UnifiedDOMManager: 모든 DOM 작업 통합
- 성능: 캐시(0.07ms), 일반(0.06ms), 배치(0.71ms)
- 하위 호환성: 기존 API 유지
- 메모리 효율: 캐시 크기 제한, 자동 정리
```

**📊 통합 효과:**

- 코드 중복 50% 감소 (DOMUtils + DOMCache → UnifiedDOMManager)
- 일관된 API 인터페이스 제공
- 성능 최적화: 캐시 히트율 기반 스마트 캐싱
- 빌드 크기: 754KB (안정적)

#### 🎯 우선순위 3: 컴포넌트 중복

```typescript
// 중복 발견 지역:
- 갤러리 뷰 컴포넌트들
- 툴바 관련 컴포넌트들
- 토스트/알림 시스템
```

---

## 🧹 Phase 3: TDD 기반 중복 제거

### 3.1 서비스 계층 통합

#### 🔴 RED: 실패 테스트 작성

```typescript
describe('통합된 MediaService', () => {
  it('모든 미디어 추출 전략을 단일 인터페이스로 제공해야 한다', () => {
    // 현재는 실패할 테스트
    expect(() => {
      const service = new UnifiedMediaService();
      service.extractFromTweet(mockElement);
      service.extractFromAPI(mockTweetId);
      service.extractFromDOM(mockContainer);
    }).not.toThrow();
  });
});
```

#### 🟢 GREEN: 최소 구현

```typescript
class UnifiedMediaService implements MediaExtractionInterface {
  private strategies: ExtractionStrategy[] = [
    new TwitterAPIExtractor(),
    new DOMDirectExtractor(),
    new FallbackExtractor(),
  ];

  async extractFromTweet(element: Element): Promise<MediaItem[]> {
    // 최소 구현으로 테스트 통과
  }
}
```

#### 🔵 REFACTOR: 기존 서비스들을 통합된 구현으로 교체

### 3.2 DOM 유틸리티 통합

#### 🔴 RED: DOM 조작 통합 테스트

```typescript
describe('통합된 DOMManager', () => {
  it('캐싱, 배치 업데이트, 이벤트 관리를 모두 처리해야 한다', () => {
    const manager = new UnifiedDOMManager();
    expect(manager.cache).toBeDefined();
    expect(manager.batcher).toBeDefined();
    expect(manager.events).toBeDefined();
  });
});
```

### 3.3 애니메이션 시스템 통합

#### 🔴 RED: 애니메이션 일관성 테스트

```typescript
describe('통합된 AnimationSystem', () => {
  it('Motion One과 CSS 트랜지션을 일관된 API로 제공해야 한다', () => {
    const system = new UnifiedAnimationSystem();
    expect(system.animate).toBeDefined();
    expect(system.transition).toBeDefined();
    expect(system.cleanup).toBeDefined();
  });
});
```

---

## 📝 Phase 4: 네이밍 표준화

### 4.1 서비스 네이밍 규칙

```typescript
// Before (불일치)
(MediaExtractionService, TwitterAPIExtractor, DOMDirectExtractor);

// After (일관성)
(MediaExtractionService, TwitterExtractionStrategy, DOMExtractionStrategy);
```

### 4.2 컴포넌트 네이밍 규칙

```typescript
// Before (복잡함)
(VerticalGalleryView, GalleryView, VerticalImageItem);

// After (간결함)
(GalleryGrid, GalleryView, MediaItem);
```

### 4.3 훅 네이밍 규칙

```typescript
// Before (불일치)
(useToolbarPositionBased, useGalleryItemScroll, useScrollDirection);

// After (일관성)
(useToolbarPosition, useGalleryScroll, useScrollDirection);
```

---

## 🗑️ Phase 5: 사용하지 않는 기능 제거

### TDD 접근법

1. **RED**: 사용되지 않는 코드 식별 테스트
2. **GREEN**: 제거 후에도 핵심 기능 동작 확인
3. **REFACTOR**: 의존성 정리 및 번들 크기 최적화

### 제거 대상

#### 🎯 우선순위 1: 사용되지 않는 서비스

- [ ] 사용되지 않는 추출 전략들
- [ ] 중복된 유틸리티 함수들
- [ ] 실험적 기능들

#### 🎯 우선순위 2: 사용되지 않는 컴포넌트

- [ ] 대체된 갤러리 뷰들
- [ ] 사용되지 않는 UI 컴포넌트들
- [ ] 테스트 전용 목업 컴포넌트들

#### 🎯 우선순위 3: 사용되지 않는 스타일 및 에셋

- [ ] 사용되지 않는 CSS 클래스들
- [ ] 중복된 스타일 정의들
- [ ] 미사용 디자인 토큰들

---

## 📈 Phase 6: 최종 검증 및 최적화

### 6.1 통합 테스트

```typescript
describe('전체 시스템 통합', () => {
  it('모든 핵심 기능이 정상 동작해야 한다', async () => {
    // 전체 워크플로우 테스트
    await testCompleteGalleryWorkflow();
    expect(galleryService.isReady()).toBe(true);
    expect(mediaService.canExtract()).toBe(true);
    expect(animationService.isInitialized()).toBe(true);
  });
});
```

### 6.2 성능 테스트

```typescript
describe('성능 최적화 검증', () => {
  it('번들 크기가 목표치 이하여야 한다', () => {
    expect(bundleSize).toBeLessThan(400 * 1024); // 400KB
  });

  it('메모리 사용량이 적절해야 한다', () => {
    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### 6.3 호환성 테스트

```typescript
describe('브라우저 호환성', () => {
  it('모든 지원 브라우저에서 정상 동작해야 한다', () => {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    browsers.forEach(browser => {
      expect(isCompatible(browser)).toBe(true);
    });
  });
});
```

---

## 🎯 예상 결과

### 정량적 목표

- **번들 크기**: 754KB → 400KB (47% 감소)
- **테스트 커버리지**: 현재 유지 (465개 테스트)
- **중복 코드**: 80% 이상 제거
- **로딩 시간**: 30% 향상

### 정성적 목표

- **가독성**: 일관된 네이밍으로 코드 이해도 향상
- **유지보수성**: 중복 제거로 버그 수 감소
- **확장성**: 통합된 인터페이스로 새 기능 추가 용이
- **성능**: 불필요한 코드 제거로 실행 속도 향상

---

## 🚀 다음 단계

### 즉시 시작할 작업

1. **Phase 2 시작**: 중복 구현 식별 및 분석
2. **서비스 통합 계획 수립**: MediaExtractionService 우선
3. **테스트 시나리오 작성**: 각 통합 단계별 TDD 테스트

### 주의사항

- 각 단계마다 전체 테스트 스위트 실행
- 기능 회귀 방지를 위한 점진적 리팩토링
- 사용자 스크립트 동작에 영향 없도록 주의

---

**📅 작성일**: 2024-12-19 **👤 작성자**: TDD 기반 리팩토링팀 **🔄 업데이트**:
Phase 1 완료, Phase 2 준비 중
