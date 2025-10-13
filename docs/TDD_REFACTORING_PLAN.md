# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13
>
> **브랜치**: feature/phase-33-step-2-events
>
> **상태**: 테스트 수정 완료, Phase 33 Step 3 준비 ✅

## 프로젝트 상태

- **빌드**: dev 726.60 KB / prod 318.04 KB ✅
- **테스트**: 652/677 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (269 modules, 736 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-33 Step 2C 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙
- `docs/bundle-analysis.html`: JavaScript 번들 분석 리포트

---

## 활성 작업

### Phase 33 Step 3: 코드 품질 개선 및 최적화

**상태**: **계획** 📋

**목표**:

1. 번들 크기 추가 최적화 (318.04 KB → 301 KB 이하)
2. 코드 구조 및 가독성 개선
3. 성능 최적화 기회 탐색

#### 번들 크기 분석 (현재)

**프로덕션 번들**: 318.04 KB (목표: 301 KB 이하, **17 KB 초과**)

**주요 크기 기여 파일들** (추정):

1. `Toolbar.tsx` - 고도로 최적화됨, 추가 절감 어려움
2. `SettingsModal.tsx` - 중복 핸들러 제거 완료
3. `event-manager.ts` - 이벤트 관리 로직
4. Solid.js 런타임 및 반응성 시스템

#### 최적화 전략 옵션

##### Option A: Tree-shaking 개선

- 사용하지 않는 export 제거
- 동적 import 활용 (Settings, KeyboardHelp 등)
- 장점: 실질적인 번들 크기 감소
- 단점: 코드 분할로 인한 복잡도 증가

##### Option B: 미니파이케이션 설정 강화

- Vite/Rollup 설정 조정
- Terser 옵션 최적화
- 장점: 설정만 변경
- 단점: 디버깅 어려움, 효과 제한적

##### Option C: 추가 코드 리팩토링 (권장)

- 중복 로직 추출
- 인라인 함수 최소화
- 상수 통합
- 장점: 코드 품질과 번들 크기 동시 개선
- 단점: 시간 소요

#### 다음 단계 (우선순위 순)

1. **번들 분석 리포트 재검토** - `docs/bundle-analysis.html` 상세 분석
2. **Tree-shaking 개선** - 사용하지 않는 export 제거
3. **코드 리팩토링** - 중복 로직 제거 및 구조 개선
4. **E2E 테스트 실행** - 런타임 동작 검증

---

## 런타임 검증 필요

- [ ] x.com 환경에서 갤러리 열기
- [ ] 하이 콘트라스트 모드 자동 감지 확인
- [ ] 툴바 인터랙션 정상 작동 확인
- [ ] E2E 스모크 테스트 (8/8)

---

## 작업 시작 체크리스트

새로운 Phase 시작 시:

1. 현재 상태 확인: `npm run validate && npm test`
2. 관련 문서 검토 (`AGENTS.md`, `CODING_GUIDELINES.md`, `ARCHITECTURE.md`)
3. 작업 브랜치 생성: `git checkout -b feature/phase-xx-...`
4. `TDD_REFACTORING_PLAN.md`에 계획 작성
5. TDD 흐름 준수: RED → GREEN → REFACTOR
6. 빌드 검증: `Clear-Host && npm run build`
7. 문서 업데이트 (완료 시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이동)
8. 유지보수 점검: `npm run maintenance:check`

---

**다음 작업**: Phase 33 Step 3 - 번들 분석 및 최적화 전략 수립
