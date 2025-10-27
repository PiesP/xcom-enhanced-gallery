# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 212 진행중 🔄 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 📋 현재 작업

### Phase 212 🔄 (2025-10-27) - KeyboardHelpOverlay 최적화 및 현대화

**목표**: KeyboardHelpOverlay 컴포넌트의 코드 품질 향상 및 구조 정리

**배경**:

- 컴포넌트의 JSDoc이 기본적이고 상세함 부족
- import 경로가 장거리 상대 경로 사용
- 이벤트 핸들러 중복 가능성 (useFocusTrap + createEffect에서 키보드 처리)
- 현대적인 주석 및 문서화 필요

**계획**:

1. [ ] JSDoc 현대화 - 상세한 설명, 파라미터/반환값 문서화
2. [ ] import 경로 정리 - 절대 경로(`@features` 등) 사용으로 변경
3. [ ] 이벤트 핸들러 통합 - 불필요한 중복 제거
4. [ ] 타이머 관리 검토 - globalTimerManager 사용 최적화
5. [ ] 타입체크/린트/테스트 모두 통과 확인
6. [ ] 빌드 검증

**수용 기준**:

- [ ] JSDoc이 현대적이고 상세함
- [ ] import 경로가 절대 경로로 통일됨
- [ ] 불필요한 코드 제거로 가독성 향상
- [ ] 타입체크/린트 통과
- [ ] 모든 테스트 통과
- [ ] 빌드 크기 유지 (≤420 KB)

**예상 시간**: 1시간

---

## 📊 최종 상태

| 항목           | 상태            | 비고                             |
| -------------- | --------------- | -------------------------------- |
| 빌드           | ✅ 안정         | 병렬화 + 메모리 최적화 완료      |
| 성능           | ✅ 14.7% 향상   | 병렬 실행으로 7.3초 단축         |
| 테스트         | ✅ 111/111 통과 | Smoke + Browser 모두 통과        |
| 접근성 테스트  | ✅ 33/33 통과   | 통합 완료                        |
| 타입/린트      | ✅ 0 errors     | 모두 통과 (CSS 린트 포함)        |
| 의존성         | ✅ 0 violations | 3계층 구조 강제                  |
| 번들 크기      | ✅ 341 KB       | 목표 ≤420 KB (79 KB 여유)        |
| Scripts        | ✅ 정리 완료    | JSDoc 현대화 및 표준 준수        |
| 문서           | ✅ 정리 완료    | 현대화 및 간결화                 |
| Bootstrap 구조 | ✅ 정리 완료    | Phase 211: initialize-theme 이동 |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-211 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
