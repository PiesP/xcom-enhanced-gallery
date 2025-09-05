# Border Radius 정책

| Context                                      | Token                                                | 값 출처        |
| -------------------------------------------- | ---------------------------------------------------- | -------------- |
| Interactive Button/Icon (Toolbar, Icon Only) | `var(--xeg-radius-md)`                               | semantic token |
| Surface (Modal / Elevated Container)         | `var(--xeg-radius-lg)`                               | semantic token |
| Chips / Pills / Progress Bars ends           | `var(--xeg-radius-pill)` or `var(--xeg-radius-full)` | semantic token |
| Small badges / counters                      | `var(--xeg-radius-sm)`                               | semantic token |

## 규칙

- 동일한 인터랙션 그룹 내 혼합 사용 금지 (예: 같은 Toolbar 안에서 md + lg 혼합
  X)
- 새 컴포넌트 추가 시 위 표 중 하나를 반드시 명시 (doc 업데이트 필요)
- Isolated 스타일에서도 별도 scale 생성 금지: 코어 토큰 재참조

## 위반 감지

- `radius-policy.test.ts`에서 CSS 원본을 스캔하여 Toolbar/Button에서 허용되지
  않은 px/비표준 radius가 사용되면 실패
