# Phase B3.2.4: UnifiedToastManager 커버리지 강화

> **상태**: ✅ 완료 (2025-10-22) **테스트 수**: 51개 (모두 PASS ✅) **빌드
> 크기**: 331.39 KB (제한: 335 KB)

---

## 📋 테스트 구성

### 섹션 1: 에러 처리 및 엣지 케이스 (10개)

- ✅ 빈 제목과 메시지로 toast 생성 가능
- ✅ 매우 긴 제목/메시지 처리 (1000+ 글자)
- ✅ 특수 문자 포함 처리 (XSS, 개행 등)
- ✅ 존재하지 않는 toast 제거 안전성 (반복 호출)
- ✅ 0/음수 duration 처리
- ✅ null/undefined actionText와 onAction 처리
- ✅ 동일한 onAction 함수를 여러 toast에 할당
- ✅ 모든 타입의 토스트 clear() → 다시 생성 가능
- ✅ remove() 후 동일 ID로 새 toast 생성 불가능 (타이밍 다름)
- ✅ live region 접근 실패 시에도 toast-only 계속 작동

### 섹션 2: 상태 관리 및 동시성 (12개)

- ✅ 빠른 연속 show() (10개 호출) 모두 유지
- ✅ 빠른 연속 remove() 안전 작동
- ✅ show() + remove() 교대 호출 일관성 유지
- ✅ clear() 중에 show() 호출 후에도 clear() 결과 유지
- ✅ getToasts() 반환값 content 동일 (signal 참조)
- ✅ 헬퍼 메서드 (success/info/warning/error) 조합 사용 안전
- ✅ 대량 토스트 (100+) 관리 성능 (<1초)
- ✅ signal.value와 getToasts() 동기화
- ✅ 싱글톤 resetInstance 후 독립적 상태
- ✅ cleanup() 후 subscribe() 콜백 호출 차단
- ✅ cleanup() + show() 후 이전 구독자 미호출

### 섹션 3: 라우팅 및 접근성 (10개)

- ✅ 모든 타입이 route 옵션으로 재정의 가능
- ✅ route: "both"는 toast와 live region 모두 추가
- ✅ warning + route: "live-only"는 live region만
- ✅ error + route: "live-only"는 assertive live region 사용
- ✅ 순차적 live region 업데이트 최신 메시지 유지
- ✅ success 타입은 항상 polite live region 사용
- ✅ error 타입은 항상 assertive live region 사용
- ✅ route 명시 없을 때 타입별 기본 라우팅 적용
- ✅ 모든 route 옵션이 정상적으로 toast ID 반환

### 섹션 4: 구독 및 이벤트 (10개)

- ✅ 구독자 없을 때 notifySubscribers는 silent 작동
- ✅ 동일한 콜백을 여러 번 subscribe하면 중복 등록
- ✅ 구독 해제 후 새로운 구독은 이전 상태부터 시작
- ✅ 구독자 콜백 에러는 격리되고 계속 실행
- ✅ signal 변경 시 구독자에게 자동 알림
- ✅ remove() 시 구독자에게 업데이트된 배열 전달
- ✅ clear() 후 구독자는 빈 배열 수신
- ✅ 여러 구독자가 동일한 상태 변경 받음
- ✅ 구독 해제 함수가 항상 구독 제거 보장

### 섹션 5: 통합 시나리오 (5개)

- ✅ 파일 다운로드 진행 상태 알림 흐름
- ✅ 에러 복구 흐름 (error → retry → success)
- ✅ 여러 알림 쌓기 (warning × 2, error × 1)
- ✅ 구독자가 UI 상태 동기화
- ✅ 초기화 및 정리 라이프사이클

### 섹션 6: 성능 및 메모리 (5개)

- ✅ 1000개 toast 추가 성능 (< 5초)
- ✅ 1000개 toast 제거 성능 (< 5초)
- ✅ 1000명 구독자에게 상태 변경 알림 (< 1초)
- ✅ 매우 큰 객체 toast 메모리 효율
- ✅ signal 접근 성능 일정 유지 (< 500ms for 10000 access)

---

## 🔍 검증 결과

```
Test Files  1 passed (1)
Tests  51 passed (51)
Duration  1.56s

Build Size: 331.39 KB (Limit: 335 KB, Margin: 3.61 KB)
Typecheck: ✅ PASS
Lint: ✅ PASS
Dependencies: ✅ OK
```

---

## 📊 누적 성과

| Phase    | 테스트 수 | 상태 | 비고                    |
| -------- | --------- | ---- | ----------------------- |
| A5       | 334       | ✅   | Service Architecture    |
| 145      | 26        | ✅   | Gallery Loading         |
| B3.1     | 108       | ✅   | Coverage Deep Dive      |
| B3.2.1   | 32        | ✅   | GalleryApp.ts           |
| B3.2.2   | 51        | ✅   | MediaService.ts         |
| B3.2.3   | 50        | ✅   | BulkDownloadService     |
| B3.2.4   | **51**    | ✅   | **UnifiedToastManager** |
| B4       | 4         | ✅   | Click Navigation        |
| **합계** | **656**   | ✅   |                         |

---

## 🎯 핵심 학습

1. **에러 격리**: 구독자 콜백 에러는 try-catch로 격리하여 다른 구독자 영향 방지
2. **성능**: 1000개 이상의 토스트/구독자도 효율적으로 관리 가능
3. **라우팅 정책**: 타입별 기본 라우팅(info/success → live-only, warning/error →
   toast-only) + route 옵션으로 재정의 가능
4. **접근성**: polite/assertive live region 구분으로 스크린리더 사용자 경험 향상
5. **신뢰성**: cleanup 후 구독자 정리로 메모리 누수 방지

---

## 📝 다음 작업

1. **B3.3**: 서비스 간 통합 시나리오 (예정: 50개+)
2. **B3.4**: 성능 최적화 검증
3. **기존 이슈 해결**: sample-based-click-detection.test.ts, GalleryContainer
   테스트
