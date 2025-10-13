# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13 **상태**: Phase 43까지 완료 ✅

## 프로젝트 상태

- **빌드**: dev 734.31 KB / prod 322.07 KB ✅
- **테스트**: 689 passing, 1 skipped (정책 가드) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (268 modules, 738 dependencies) ✅
- **번들 예산**: 322.07 KB / 325 KB (2.93 KB 여유) ⚠️ 예산 근접

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-43 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 현재 상태

### Phase 43까지 완료 ✅

Phase 1-43의 모든 리팩토링 작업이 완료되었습니다. 세부 내역은
`TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

**주요 성과**:

- ✅ ToolbarWithSettings 통합 완료
- ✅ Settings Modal 레거시 코드 완전 제거
- ✅ 테스트 커버리지 개선 (skipped 96% 감소)
- ✅ 의존성 정책 강화 및 그래프 갱신
- ✅ 문서 간소화 완료

---

## 백로그 (선택적)

### 번들 크기 최적화 (권장 시점: 323 KB 초과 시)

**현재**: 322.07 KB / 325 KB (2.93 KB 여유)

**고려 사항**:

1. CSS 최적화: 중복 토큰 제거, 미사용 규칙 정리 (예상 2-3 KB)
2. Tree-shaking: 미사용 export 확인, barrel export 최소화
3. 대형 컴포넌트 분석: 50 KB 초과 컴포넌트 타겟팅

### Toolbar Expandable Settings (Phase 44-50) - 대안 솔루션

**목표**: 설정 모달을 툴바 내부 확장 형태로 재구성하여 번들 크기 최적화 (예상 7
KB 절약)

**단계**:

1. **Phase 44**: Toolbar에 확장/축소 상태 관리 추가
2. **Phase 45**: SettingsModal 핵심 기능을 Toolbar로 통합
3. **Phase 46**: glassmorphism 디자인 일관성 유지
4. **Phase 47**: ARIA 속성 및 키보드 네비게이션 구현
5. **Phase 48**: SettingsModal 레거시 제거
6. **Phase 49**: 테스트 마이그레이션
7. **Phase 50**: 최적화 및 검증

**예상 효과**:

- 번들 크기 감소: ~315 KB (10 KB 여유)
- 코드 복잡도 감소: focus trap, scroll lock 등 제거
- UX 개선: 설정이 툴바에 통합되어 더 직관적

**참고**: 세부 계획은 Git 커밋 히스토리 참조 (fb866403)

---

## 중기 계획 (향후 1-2주)

1. **성능 모니터링**: 번들 크기 추이 관찰, 빌드 시간 최적화 검토
2. **E2E 테스트 강화**: Playwright 스모크 테스트 확장, 주요 사용자 시나리오
   커버리지
3. **의존성 정리**: 미사용 devDependencies 검토, `depcheck` 실행 후 정리

---

## 프로젝트 건강도 지표

- **번들 크기**: 322.07 KB / 325 KB ⚠️ 예산 근접
- **테스트 통과율**: 100% (689/689) ✅
- **Skipped 테스트**: 1개 (정책 가드, 의도적) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅

**전반적 평가**: 프로젝트는 안정적이며 유지보수 가능한 상태입니다. Phase 1-43의
모든 리팩토링이 성공적으로 완료되었습니다.
