# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: 현재 계획 없음 ✅ |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 📋 다음 작업 후보

현재 진행 중인 활성 Phase는 없습니다. 다음 최적화는 아래 항목 중 선택 예정:

### 후보 1: GalleryApp 컴포넌트 현대화 (Phase 215)

**이유**: Gallery 메인 조율 컴포넌트 현대화 **범위**: JSDoc 강화, import 경로
정리, 이벤트 핸들러 정리 **영향도**: 높음 (모든 Gallery 기능 통합) **예상
시간**: 2-3시간

### 후보 2: Shared Services 현대화 (Phase 216)

**이유**: 비즈니스 로직 계층 정리 **범위**: 서비스 인터페이스 정렬, 에러 처리
강화 **영향도**: 높음 (전체 기능 영향) **예상 시간**: 3-4시간

### 후보 3: Settings UI 컴포넌트 현대화 (Phase 217)

**이유**: 설정 패널 컴포넌트 개선 **범위**: JSDoc 강화, import 경로 정리
**영향도**: 중간 (설정 기능) **예상 시간**: 2시간

---

## 📊 최종 상태

| 항목                        | 상태            | 비고                        |
| --------------------------- | --------------- | --------------------------- |
| 빌드                        | ✅ 안정         | 병렬화 + 메모리 최적화 완료 |
| 성능                        | ✅ 14.7% 향상   | 병렬 실행으로 7.3초 단축    |
| 테스트                      | ✅ 111/111 통과 | Smoke + Browser 모두 통과   |
| 접근성 테스트               | ✅ 34/34 통과   | 통합 완료                   |
| Phase 211 (Bootstrap)       | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 212 (KeyboardOverlay) | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 213 (Hooks Cleanup)   | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 214 (VerticalGallery) | ✅ 완료         | 2025-10-27 master 병합      |
| 타입/린트                   | ✅ 0 errors     | 모두 통과 (CSS 린트 포함)   |
| 의존성                      | ✅ 0 violations | 3계층 구조 강제             |
| 번들 크기                   | ✅ 340 KB       | 목표 ≤420 KB (80 KB 여유)   |
| Scripts                     | ✅ 정리 완료    | JSDoc 현대화 및 표준 준수   |
| 문서                        | ✅ 정리 완료    | 현대화 및 간결화            |
| Import 경로                 | ✅ 정규화 완료  | @shared/@features 별칭 통일 |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-214 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
