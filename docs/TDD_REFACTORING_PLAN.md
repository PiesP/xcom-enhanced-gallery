# TDD 리팩토링 활성 계획

현재 상태: Phase 17.3 준비 최종 업데이트: 2025-01-11

---

## 현재 상태

Phase 17.1-17.2 완료 → COMPLETED.md로 이관. Phase 17.3 (UI 컨트롤) 준비 완료.

---

## Phase 17.3: 휠 스크롤 설정 UI 추가 (진행 대기)

### 목표

SettingsModal에 휠 스크롤 배율 조절 슬라이더 추가

### 작업 계획

1. **SettingsModal 확장**
   - 갤러리 섹션에 슬라이더 추가
   - 라벨: "휠 스크롤 속도" / "Wheel Scroll Speed"
   - 범위: 0.5 ~ 3.0, 단계: 0.1
   - 현재값 표시: `{value}x`

2. **테스트 추가**
   - 슬라이더 렌더링 검증
   - 값 변경 시 설정 업데이트 검증

### 예상 산출물

- SettingsModal 수정: 1 file
- 테스트 추가: 1 file (+3 tests)

---

## 참고 문서

- AGENTS.md: 개발 환경 및 워크플로
- TDD_REFACTORING_PLAN_COMPLETED.md: Phase 1-17.2 완료 내역
