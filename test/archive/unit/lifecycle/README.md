# test/archive/unit/lifecycle

**라이프사이클 누수 스캔 아카이브** (Phase 187 이동)

---

## 📋 파일 목록

### 1. `lifecycle.cleanup.leak-scan.red.test.ts`

**상태**: 🔴 RED 테스트 (미구현)

**파일 분석**:

- 크기: 152줄
- 상태: RED (실제 구현 미존재)
- 목적: R4 규칙 — 타이머/리스너 누수 스캔 검증

**RED 사유**:

- TimerManager, DOMEventManager 중앙화 미구현
- 타이머/리스너 누수 탐지 정책이 현재 없음
- 검증 인프라 부재

**관련 규칙**:

- **R4**: 타이머/리스너는 중앙 관리자를 통해서만 등록/정리
- 목표: 메모리 누수 방지

**활성 버전**:

- 현재는 개별 이벤트 리스너 정책만 활성 (wheel-listener 등)
- 통합 타이머 관리는 미구현

---

## Phase 187 정리

Phase 187에서 test/unit 디렉토리 1단계 정리 (26개 → 18개)의 일환으로 lifecycle 디렉토리가 아카이브되었습니다.

**목표**:

- 3계층 구조 (Features → Shared → External) 정렬
- RED 테스트 중앙화
- 루트 레벨 1단계 디렉토리 31% 감소

**관련 디렉토리**:

- test/archive/unit/patterns/ (Phase 5 OLD)
- test/unit/shared/ (통합 경로로 정렬)

---

## 마이그레이션 가이드

이 테스트를 다시 활성화하려면:

1. TimerManager, DOMEventManager 구현
2. 누수 탐지 정책 수립
3. test/unit/lifecycle 재생성
4. RED → GREEN 리팩토링 수행

---
