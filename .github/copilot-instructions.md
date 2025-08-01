# GitHub Copilot 개발 지침

> **AI와 함께하는 TDD 기반 개발 협업 가이드**

## 🎯 핵심 원칙

### TDD 기반 AI 협업

1. **테스트 우선 개발**
   - 모든 기능은 테스트부터 작성 요청
   - Red → Green → Refactor 사이클 준수
   - 테스트 가능한 설계 우선 제안

2. **타입 안전성 보장**
   - TypeScript strict 모드 100% 준수
   - 모든 함수에 명시적 타입 정의
   - 런타임 에러 방지 우선

3. **외부 의존성 격리**
   - getter 함수를 통한 라이브러리 접근만 허용
   - 직접 import 금지 (preact, fflate 등)
   - 모킹 가능한 구조 설계

## 🔄 TDD 개발 사이클

### Red-Green-Refactor with AI

```typescript
# GitHub Copilot 협업 지침

> **AI와의 효율적인 TDD 기반 개발 협업**

## 🎯 AI 협업 원칙

### TDD 우선 개발

```

"TDD로 MediaProcessor를 구현해주세요:

1. 실패하는 테스트 먼저 작성
2. 최소 구현으로 테스트 통과
3. 리팩토링으로 완성"

```

### 의존성 격리 요청

```

"getter 함수를 사용하여 외부 라이브러리에 접근하고, 모킹 가능한 구조로
설계해주세요"

```

### 타입 안전성 보장

```

"TypeScript strict 모드로 작성하고, 모든 함수에 명시적 타입을 정의해주세요"

```

## 🔄 AI 협업 워크플로

### 1단계: 테스트 작성 요청

```

"다음 기능의 테스트를 먼저 작성해주세요:

- 기능: HTML에서 미디어 URL 추출
- 입력: HTMLElement
- 출력: string[]
- 예외: 빈 배열 반환"

```

### 2단계: 구현 요청

```

"위 테스트를 통과하는 최소 구현을 작성해주세요"

```

### 3단계: 리팩토링 요청

```

"다음 기준으로 리팩토링해주세요:

- 성능 최적화
- 에러 처리 추가
- 코드 가독성 개선"

```

## 📋 AI 요청 체크리스트

### 요청 시 포함할 키워드

- [ ] "TDD로"
- [ ] "getter 함수 사용하여"
- [ ] "TypeScript strict 모드로"
- [ ] "PC 전용 이벤트만"
- [ ] "테스트와 함께"

### 품질 확인 요청

```

"작성된 코드를 다음 기준으로 검토해주세요:

- 테스트 커버리지
- 타입 안전성
- 의존성 격리
- 성능 최적화"

```

---

**🤖 효과적인 AI 협업**: 명확한 요구사항과 구체적인 제약조건을 제시하세요.
```
