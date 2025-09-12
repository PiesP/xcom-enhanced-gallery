2025-09-12: N5 — 키보드/포커스 흐름 하드닝 완료

- 구현: KeyboardHelpOverlay에 focus trap과 초기 포커스/복원 로직을 안정화.
  useFocusTrap이 ref 기반으로 개선되어 컨테이너 준비 시점에 정확히 활성화되고,
  jsdom 환경에서의 포커스 안정화를 위해 useLayoutEffect 및 이벤트 기반 마지막
  포커스 요소 추적을 도입.
- 테스트: keyboard-help-overlay.accessibility.test.tsx GREEN (열림 시 닫기
  버튼에 포커스, ESC로 닫을 때 트리거로 포커스 복원). 툴바 탭 순서는 기존 가드로
  충분하여 별도 항목은 보류.
- 영향: 접근성 일관성 향상, 회귀 없음(전체 스위트 GREEN).
