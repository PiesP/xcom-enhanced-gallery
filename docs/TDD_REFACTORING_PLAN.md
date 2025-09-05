# TDD 기반 Button 디자인 통합 & 레거시 정리 리팩토링 계획

목표: 버튼 UI의 시각적/구조적 불일치를 제거하고 단일 컴포넌트 + 단일 스타일
소스로 일원화. (Design Tokens → UnifiedButton)

## 0. 진행 현황 (Completed / In-Progress 요약)

완료 (✅):

- Unified Button 컴포넌트 (`shared/components/ui/Button/Button.tsx`) 구현 및
  variant/size/intent 구조 수립
- IconOnly/Loading/ARIA 상태 처리 테스트 기반 구조 (기존 `aria-contract` 테스트
  사용 가능 상태)
- Legacy Wrapper 컴포넌트 잔존 (`ToolbarButton`, `IconButton`, `Button-legacy`)
  → Deprecated 주석 및 경고 이미 존재
- 정책 테스트 존재: radius / token coverage / interaction state / legacy cleanup
  스켈레톤

미완료 (🚧 / 제거 대상):

- `ToolbarButton.module.css` / `IconButton.css` 독립 스타일 중복 제거 필요
- Legacy wrapper 제거 전 마이그레이션 자동화(Codemod) 부재
- Button 전용 semantic design token 레이어 미정의 (`button.ts` 없음)
- 중복/불일치 스타일 회귀 방지 Red 테스트(통합 후 중복 존재 시 실패) 보강 필요
- 번들 크기 측정 기준/스크립트 미구현
- 문서: 최종 API/토큰 매핑 문서 미작성

## 1. 현 문제 (Residual Gaps)

중복 스타일 소스 유지: `ToolbarButton.module.css`, `IconButton.css` 가
`Button.module.css`와 기능/토큰 사용 중복 → 유지보수 비용 & 불일치 위험. 추가로
wrapper 3종(IconButton / ToolbarButton / Button-legacy)이 렌더 경로를 분기.

리스크:

- 스타일 동기화 누락 (호버/활성/다크/고대비)
- Token 미스매치 (일부 secondary/outline 변형 이름 상이)
- Wrapper 잔존으로 탐색성 저하 + 번들 크기 증가
- CSS Module 간 크기/spacing/radius 정책 중복

## 2. 목표 (Definition of Done)

1. 모든 신규/기존 호출 경로 Button 단일 컴포넌트로 수렴 (wrappers 제거)
2. Button 관련 스타일 정의 파일 1개만 유지 (`Button.module.css`)
3. Semantic Button Tokens (`button.ts`) 정의 → CSS 변수 소비 (raw color/px 0)
4. 정책 테스트: radius / token / interaction / legacy / consolidation 모두 Green
5. Wrapper & legacy CSS 삭제 후 grep 검사 잔여 참조 0
6. 번들 분석: 버튼 관련 CSS bytes ≥15% 감소 (삭제 전 대비)
7. 문서: `docs/components/Button.md` 작성 (API + Tokens + Migration)

## 3. 전략 요약

선택 전략: 기존 UnifiedButton 유지 + Wrapper 제거 → CSS 단일화 → Token 레이어
도입 순서 가속. Codemod으로 wrapper import → Button import 치환. 불필요한 장황한
대안 표는 제거 (내부 기록 보존 불요).

## 4. 잔여 단계별 TDD 플랜 (정제)

Red → Green → Refactor 반복.

Phase 1 (RED 강화):

- 추가 Red 테스트: wrapper 컴포넌트 존재 시 실패 (import 탐지)
- 추가 Red 테스트: `ToolbarButton.module.css` / `IconButton.css` 중복 variant
  정의 탐지
- 추가 Red 테스트: raw color(hex/rgba) & px radius 검사 확장 (Button 관련 경로)

Phase 2 (Token Layer 도입):

- `src/shared/styles/tokens/button.ts` 생성 (semantic map + runtime get 함수)
- 테스트: export shape, 키 누락 시 실패, raw color 없음
- Button.module.css 일부 변수명을 semantic token 네임으로 alias

Phase 3 (CSS 통합):

- Toolbar/IconButton CSS 변형을 Button.module.css로 이관 후 해당 파일 삭제
- Red 테스트 Green 처리 (중복 사라짐)

Phase 4 (Wrapper 제거 & Codemod):

- Codemod: IconButton/ToolbarButton/Button-legacy import → Button 변환
- 제거 후 빌드 & grep 테스트 (wrapper 심볼 0)

Phase 5 (정책/회귀/성능):

- Metrics 스크립트: preSnapshot(현재) vs postSnapshot(CSS bytes)
- 목표 달성 assert (>=15% 감소) 또는 원인 리포트

Phase 6 (문서 & 마무리):

- `docs/components/Button.md` 작성
- 마이그레이션 가이드 (주의점, Codemod 결과, token 매핑표)
- ESLint/정적 검사 룰 추가 (선택): raw color 차단(기존 룰 없을 시)

Phase 7 (Cleanup & 계약 고정):

- Public API freeze note (변형 enum 추가 지침)
- 테스트 스냅샷 업데이트 & 최종 PR 체커

## 5. 위험 & 대응

| 위험           | 설명                   | 대응                                   |
| -------------- | ---------------------- | -------------------------------------- |
| 시각적 회귀    | 이관 시 일부 상태 누락 | Red 중복 탐지 + 시각 diff(옵션)        |
| Wrapper 잔존   | Codemod 누락 import    | grep + 테스트 실패 강제                |
| Token 누락     | 새 semantic token 빠짐 | shape 테스트 (keys strict)             |
| 성능 미달      | 15% 감소 실패          | 원인(삭제 전/후 diff) 리포트 후 재조정 |
| 신규 요구 변형 | variant enum 폭발      | 문서화 + design review 게이트          |

## 6. 메트릭

- Raw color/radius 위반 → 0
- Wrapper import 건수 → 0
- Button CSS bytes 감소율 >= 15%
- Variant/Size/Intent prop 테스트 커버리지 >= 90%
- Token shape 테스트 100% 통과

## 7. 실행 순서 (Updated)

1. Phase 1 Red 테스트 추가 & 실패 확인
2. Phase 2 Token layer 도입 → 테스트 Green
3. Phase 3 CSS 통합 & 중복 파일 삭제
4. Phase 4 Codemod + wrapper 제거
5. Phase 5 Metrics 측정 & 정책 테스트 재검증
6. Phase 6 문서화 & 룰 추가
7. Phase 7 Freeze & 최종 정리

---

Phase 1 RED 테스트 완료 → 통합 가드 확보. Phase 2 Semantic Token Layer 완료
(`button.ts`). Phase 3 CSS Consolidation 완료 (중복 스타일 통합, 원본 파일
placeholder 축소 처리).

Next Action: Phase 4 Wrapper 제거 & Codemod (ToolbarButton/IconButton/legacy →
Button).
