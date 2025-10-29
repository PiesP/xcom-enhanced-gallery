# TDD 리팩토링 완료 기록

**최종 업데이트**: 2025-10-29 | **최근 완료**: Phase 236

**목적**: 완료된 Phase의 요약 기록 (상세 내역은 필요 시 git 히스토리 참고)

---

## 📊 완료된 Phase 요약 (Phase 197-236)

| Phase       | 날짜       | 제목                                | 핵심 내용                                  |
| ----------- | ---------- | ----------------------------------- | ------------------------------------------ |
| **236**     | 2025-10-29 | DOMContentLoaded 리스너 제거        | @run-at document-idle 활용, 격리 완성      |
| **235**     | 2025-10-29 | Toast 알림 GalleryRenderer 격리     | main.ts → GalleryRenderer, 책임 분리 명확화 |
| **234**     | 2025-10-29 | TESTING_STRATEGY 간소화 (48% 감소)  | 517줄→271줄, 테이블 재구성, 링크 대체      |
| **233**     | 2025-10-29 | 문서 간소화 및 정리 (90% 감소)      | 3개 문서 4667줄→444줄, 개발자 온보딩 개선  |
| **232**     | 2025-10-29 | CodeQL 보안 경고 해결 (6/6)         | URL 검증, Prototype Pollution, 빌드 안전성 |
| **231**     | 2025-10-29 | Phase 199 중단 흔적 제거            | 테스트 정리, 문서 정리                     |
| **230**     | 2025-10-28 | BaseService 초기화 실패 수정        | ThemeService singleton export 추가         |
| **229**     | 2025-10-28 | PC-only 정책 부작용 수정            | 텍스트 선택 복원, Pointer 이벤트 조정      |
| **228**     | 2025-10-28 | 이벤트 캡처 최적화                  | 미디어 컨테이너 fast-path 체크             |
| **227**     | 2025-10-27 | Testability 테스트 정리             | Phase 80.1 테스트 재구성 및 이관           |
| **226**     | 2025-10-27 | Container Module 리팩토링           | service-harness 제거, 구조 최적화          |
| **225**     | 2025-10-27 | Shared Constants 최적화             | i18n 모듈 재구성                           |
| **224**     | 2025-10-27 | Phase 80.1 의존성 피드백 적용       | 상태 동기화 개선                           |
| **223**     | 2025-10-27 | Focus 서비스 TDD 완료               | ObserverManager, Applicator, StateManager  |
| **222**     | 2025-10-27 | Focus 프레임워크 Phase 3 완료       | 서비스 통합 검증                           |
| **221**     | 2025-10-27 | Focus 프레임워크 Phase 2 완료       | Applicator/StateManager 통합               |
| **220**     | 2025-10-27 | Focus 프레임워크 Phase 1 완료       | ObserverManager 추출                       |
| **219**     | 2025-10-27 | Phase 80.1 최종 검증                | 테스트 통과, 문서화 완료                   |
| **218**     | 2025-10-27 | Phase 80.1 E2E 검증                 | Playwright 테스트 추가                     |
| **217**     | 2025-10-27 | Theme Initialization 최적화         | 매직 문자열 상수화, JSDoc 강화             |
| **216**     | 2025-10-27 | Gallery Hooks 점검                  | JSDoc, import 경로 정규화                  |
| **215**     | 2025-10-27 | KeyboardHelpOverlay 재구성          | 컴포넌트 최적화                            |
| **214**     | 2025-10-27 | VerticalGalleryView 현대화          | 29개 import 정규화                         |
| **213**     | 2025-10-27 | Vertical Gallery View Hooks 정리    | 494줄 데드코드 제거                        |
| **212**     | 2025-10-27 | KeyboardHelpOverlay 컴포넌트 현대화 | JSDoc, import 경로 정규화                  |
| **211**     | 2025-10-27 | Bootstrap 최적화                    | 부트스트랩 구조 정리                       |
| **210**     | 2025-10-27 | Global Style Tokens 현대화          | CSS 토큰 체계 정리                         |
| **209**     | 2025-10-27 | dependency-cruiser 설정 최적화      | 의존성 규칙 강화                           |
| **208**     | 2025-10-27 | Scripts 디렉터리 현대화             | JSDoc 표준화, 에러 처리 개선               |
| **207**     | 2025-10-27 | 문서 체계 현대화                    | 문서 구조 정리                             |
| **206**     | 2025-10-27 | Playwright 테스트 통합              | E2E 스모크 테스트 추가                     |
| **205**     | 2025-10-27 | Playwright Accessibility 통합       | WCAG 2.1 AA 자동 검증                      |
| **200-204** | 2025-10-27 | 빌드 및 문서 최적화                 | 빌드 병렬화, 메모리 최적화                 |
| **197-199** | 2025-10-27 | Settings 드롭다운 수정              | PC-only 정책 적용                          |

---

## 📋 Phase 236 상세 (DOMContentLoaded 리스너 제거)

**목표**: 클릭 이벤트 이외의 모든 유저스크립트 요소를 갤러리 앱 내부로 격리

**문제**: main.ts에 DOMContentLoaded 리스너가 잔존하여 트위터 네이티브 페이지에 간섭

**해결**:

1. **핵심 인사이트**: @run-at document-idle 활용
   - 유저스크립트 엔진(Tampermonkey/Greasemonkey)이 DOM 준비 완료 후 실행 보장
   - DOMContentLoaded 리스너 불필요

2. **변경 사항**:
   - main.ts: DOMContentLoaded 리스너 제거 (line 422-426)
   - main.ts: cleanup 함수에서 리스너 제거 로직 제거 (line 207-211)
   - main.ts: 즉시 startApplication 호출 (line 422)

3. **코드 변경**:

```typescript
// AS-IS (제거됨)
if (document.readyState === 'loading') {
  if (import.meta.env.MODE !== 'test') {
    document.addEventListener('DOMContentLoaded', startApplication);
  }
} else {
  startApplication();
}

// TO-BE
/**
 * @run-at document-idle 보장:
 * 유저스크립트 엔진이 DOM 준비 완료 후 실행하므로
 * DOMContentLoaded 리스너가 불필요합니다.
 */
startApplication();
```

**효과**:

- ✅ 트위터 네이티브 페이지 간섭 최소화 (DOMContentLoaded 리스너 제거)
- ✅ main.ts 역할 명확화 (설정 + cleanup만 담당)
- ✅ 코드 단순화 (조건 분기 제거)
- ✅ 테스트 안정성 향상 (리스너 누수 방지)

**검증**:

- ✅ 타입/린트: 0 errors
- ✅ 단위 테스트: 82/82 통과
- ✅ 브라우저 테스트: 111/111 통과
- ✅ E2E 스모크: 87 통과 (5 skipped)
- ✅ 번들 크기: 339.05 KB (변화 없음)

**완료 조건 달성**:

- [x] DOMContentLoaded 리스너 제거
- [x] @run-at document-idle 주석 추가
- [x] cleanup 로직 정리
- [x] 모든 테스트 통과
- [x] 빌드 검증 완료

---

## 📋 Phase 235 상세 (Toast 알림 격리)

```
