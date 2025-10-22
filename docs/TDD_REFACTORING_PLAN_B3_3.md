# Phase B3.3: 서비스 간 통합 시나리오 커버리지

> xcom-enhanced-gallery 프로젝트 - TDD 리팩토링 Phase B3.3  
> **상태**: 준비 중  
> **목표**: 여러 서비스의 협력 흐름 테스트 강화  
> **예정 테스트**: 50개+

---

## 🎯 목표

현재까지는 **단일 서비스 중심 테스트** (MediaService, BulkDownloadService 등)를
완료했습니다.  
B3.3에서는 **다중 서비스 통합 시나리오**를 커버하여 실제 사용 흐름의 안정성을
보장합니다.

---

## 📋 테스트 범위

### 1. Gallery 초기화 흐름 (10개)

- GalleryApp 마운트 → ServiceContainer 초기화 → 미디어 추출 시작
- 에러 경우: 초기화 실패 → 에러 토스트 → 복구 시도
- 네트워크 지연 → 타임아웃 → Graceful degradation
- 상태 동기화 검증 (gallerySignals ↔ SettingsService)

### 2. 미디어 추출 → 다운로드 통합 (12개)

- MediaService.extract() → BulkDownloadService 연계
- 부분 실패 처리: 일부 미디어만 다운로드 가능
- 동시성 제어: 여러 사용자 요청 처리
- 메모리 누수 방지 (ServiceContainer.dispose() 호출 검증)

### 3. 이벤트 라우팅 (10개)

- KeyboardNavigator → GalleryApp 이벤트 전파
- ThemeService → UI 상태 업데이트
- ToastManager → 다중 토스트 큐잉 및 우선순위
- 이벤트 구독/해제 라이프사이클 (가비지 수집 안정성)

### 4. 설정 변경 → 상태 반영 (10개)

- SettingsService 변경 → Gallery 재구성 감지
- 테마 변경 → 실시간 CSS 적용
- 다운로드 옵션 변경 → 기존 큐 상태 유지
- 마이그레이션 시나리오 (v0.3→v0.4)

### 5. E2E 시나리오 (8개)

- 사용자 흐름: 갤러리 열기 → 이미지 탐색 → 대량 다운로드
- 중단 처리: 다운로드 중 창 닫기 → AbortSignal 전파 확인
- 복구: 일시적 네트워크 오류 → 재시도 → 성공
- 메모리 프로파일링: 1000개 이미지 → 메모리 안정성

---

## 🔍 핵심 검증 항목

### 서비스 간 의존성

```
GalleryApp
  ├─ ServiceContainer (초기화/폐기)
  ├─ MediaService (추출 로직)
  ├─ BulkDownloadService (다운로드)
  ├─ SettingsService (설정 구독)
  ├─ ThemeService (테마)
  └─ ToastManager (알림)
```

### 상태 흐름

```
User Action
  → KeyboardNavigator
  → GalleryApp Event Handler
  → Service Call (MediaService or BulkDownloadService)
  → State Update (gallerySignals or settingsStore)
  → UI Re-render (Solid.js reactivity)
  → Toast Notification (ToastManager)
```

### 에러 전파

```
Network Error
  → MediaService.extract() throws
  → GalleryApp catches
  → ToastManager.error()
  → User sees notification
  → GalleryApp retries or degrades
```

---

## ✅ 수용 기준

- [ ] 50개 이상 통합 테스트 작성
- [ ] 모든 테스트 PASS
- [ ] 메모리 누수 없음 (dispose() 호출 검증)
- [ ] 빌드 크기 335 KB 이하 유지
- [ ] 타입체크/린트 오류 없음
- [ ] 커버리지 70%+ 유지

---

## 📝 참고

- **테스트 패턴**: `test/unit/services/phase-*.test.ts`
- **서비스 하네스**: `src/shared/container/service-harness.ts`
- **통합 테스트 예시**:
  `test/unit/events/event-lifecycle.abort-signal.integration.test.ts`
- **상태 검증**: `src/shared/state/gallery-signals.ts`

---

## 🚀 예상 일정

- 설계: 1-2시간
- 구현: 4-6시간
- 리뷰/정리: 1-2시간
- **총 소요: 6-10시간**

---

**작성일**: 2025-10-22  
**상태**: 준비 중 → 시작 대기 중
