# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 211 진행중 🔄 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## � 현재 작업

### Phase 211 ✅ (2025-10-27) - Bootstrap 최적화 및 구조 정리

**목표**: Bootstrap 디렉터리 파일 현대화 및 계층 구조 정비

**배경**:

- Bootstrap 파일들이 구식 JSDoc 및 import 경로 사용
- `initialize-theme.ts`가 bootstrap에 있지만 실제로는 Gallery 기능에 속함
- 3계층 아키텍처(Features → Shared → External) 미준수

**완료 항목**:

1. ✅ `environment.ts` - 경로 통일, JSDoc 현대화, 에러 처리 추가
2. ✅ `events.ts` - 경로 통일, JSDoc 현대화
3. ✅ `features.ts` - 경로 통일, 상세한 JSDoc 추가
4. ✅ `initialize-theme.ts` →
   `src/features/gallery/services/theme-initialization.ts`로 이동
5. ✅ 모든 import 경로 업데이트 (3개 파일)
6. ✅ 타입체크/린트/테스트/빌드 모두 통과

**수용 기준**: ✅ 모두 충족

- ✅ 테스트 통과 (smoke 9/9, unit 111/111)
- ✅ 타입체크/린트 통과
- ✅ 빌드 성공 (dev: 768 KB, prod: 341 KB)
- ✅ 성능 저하 없음

**결과**: Bootstrap 계층이 명확하게 정리됨 (애플리케이션 전역 초기화만 담당)

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

## 📝 새로운 Phase 템플릿

```markdown
### Phase XXX 🔄 (YYYY-MM-DD) - [작업 제목]

**목표**: [한 줄 설명]

**배경**:

- 현재 문제점
- 개선이 필요한 이유

**계획**:

1. [ ] 작업 항목 1
2. [ ] 작업 항목 2
3. [ ] 작업 항목 3

**수용 기준**:

- [ ] 테스트 통과 (unit + integration + E2E)
- [ ] 타입체크/린트 통과
- [ ] 빌드 크기 유지 (≤420 KB)
- [ ] 성능 저하 없음

**예상 시간**: X 시간
```

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-210 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)

---

## ✅ 모든 Phase 완료

| Phase | 기간       | 내용                              | 상태 |
| ----- | ---------- | --------------------------------- | ---- |
| 210   | 2025-10-27 | Global Style Tokens Modernization | ✅   |
| 209   | 2025-10-27 | Dependency-cruiser 설정 최적화    | ✅   |
| 208   | 2025-10-27 | Scripts 디렉터리 현대화           | ✅   |
| 207   | 2025-10-27 | 문서 체계 현대화                  | ✅   |
| 206   | 2025-10-27 | Playwright 테스트 통합            | ✅   |
| 205   | 2025-10-27 | Playwright Accessibility 통합     | ✅   |
| 등    | -          | Phase 197-204 완료                | ✅   |

**다음 작업**은 필요시 새로운 Phase로 계획하세요. 자세한 내용은 완료 기록을
참조하세요.

---

**작성**: 2025-10-26 | **최종 업데이트**: 2025-10-27 | **상태**: ✅ 활성 작업
없음
