# UI 시각적 일관성 TDD 리팩토링 계획 (정리판)

## 1. 요약 목표

- 툴바 Fit 모드 버튼 그룹의 "하얀 박스"(별도 배경/보더) 제거 → 모든 아이콘 버튼
  시각적 일관성
- Border-radius 스케일을 명확한 정책(MD=인터랙션, LG=Surface, PILL=Chips)에 따라
  통일

## 2. 진행 현황 (간결 요약)

| 항목 | 상태 | 비고 |
| ---- | ---- | ---- |
| Fit 모드 그룹 white box 제거 | 완료 | 계약 테스트로 회귀 방지 |
| Radius 정책 수립/테스트 | 완료 | primitive ↔ semantic 1:1, 위반 차단 |
| IconButton 추출 & 적용 | 완료 | 중복 스타일 제거 |
| Isolated radius alias 제거 | 완료 | semantic 직접 사용 |
| ToolbarButton CSS 통합 | 완료 | Unified 파일 삭제, 레거시 selector 흡수 |
| Cross-component consistency 단일화 | 완료 | clean/legacy 중복 제거, 정책 기반 검사 |
| 정책 파서 자동화 | 완료 | 테스트에서 가이드 문서 파싱 (deriveRoleTokenExpectations) |
| CODING_GUIDELINES Toast/Gallery 예시 | 완료 | 실사용 맥락 추가 |
| FocusTrap / a11y / dynamic import 후속 | 완료 | 해당 영향 테스트 GREEN |
| 시각 회귀 (snapshot) | 보류 | 별도 PR 예정 |

테스트 핵심 스코프 GREEN. 제거/정리된 레거시: UnifiedToolbarButton CSS, 중복 consistency *clean* 테스트, tokenization 전용 Unified 테스트.

## 3. 완료/후속

- 현 스코프 추가 작업 없음.
- 후속 제안: (a) 시각 회귀(Playwright 또는 percy) (b) Icon 시스템 리팩터로 dynamic import 관련 OUT-OF-SCOPE 테스트 정리.

## 4. 핵심 TDD 테스트 (요약)

- toolbar-fit-group-contract: Fit 그룹 white box 제거 회귀 (PASS)
- radius-policy: 버튼/툴바 radius 정책 준수 (PASS)
- gallery-component-tokenization: semantic radius 직접 사용 (PASS)

## 5. 테스트 전략 (최종)

- 정책 파생: 문서 → 테스트 (GUIDELINES 파싱) 경로 확립
- 소스 CSS 텍스트 스캔으로 디자인 토큰 위반 조기 검출
- 시각 회귀는 후속 도구 도입 시 본 문서 업데이트 예정

## 6. 위험 & 대응 (축약)

| 위험                                 | 대응                                  |
| ------------------------------------ | ------------------------------------- |
| CSS 모듈 해시로 런타임 스타일 미검증 | 소스 CSS 텍스트 직접 읽어 패턴 테스트 |
| 정책 신규 위반                       | radius-policy 테스트로 PR 차단        |

## 7. 완료 정의 (Final)

스코프 목표 충족:
1. White box 제거 (계약 테스트)
2. Radius 정책 확정 & 위반 차단 (primitive/semantic, 문서-코드 동기화)
3. IconButton 도입 및 ToolbarButton 통합 (중복 제거)
4. Semantic 토큰 직접 사용 (alias 제거)
5. 테스트 자동화: 문서 파싱 기반 정책 검증
6. 문서 최신화 (GUIDELINES + 본 계획)

후속 범위는 별도 이니셔티브로 분리 (시각 회귀 / Icon 시스템 성능).

---

(v3 정리)
