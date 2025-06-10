# Copilot Instructions for X.com Enhanced Gallery

## 프로젝트 개요

- **X.com Enhanced Gallery**는 트위터(X) 미디어 뷰어와 다운로드 기능을 향상시키는 브라우저 확장 프로그램입니다.
- 주요 특징: Preact 기반 UI, 모듈식 아키텍처, TypeScript 기반 개발, 번들링된 외부 라이브러리
- 현재 진행 중인 리팩토링: Feature-based 아키텍처로 전환 중

## 새로운 아키텍처 구조

### 디렉토리 구조

```
src/
├── app/                      # 애플리케이션 설정
├── features/                 # 기능별 모듈
│   ├── gallery/             # 갤러리 기능
│   ├── media/               # 미디어 처리
│   └── settings/            # 설정 관리
├── shared/                   # 공통 재사용 모듈
│   ├── components/          # UI 컴포넌트
│   ├── hooks/               # 커스텀 훅
│   ├── utils/               # 유틸리티
│   └── types/               # 공통 타입
├── core/                    # 핵심 비즈니스 로직
│   ├── state/               # 상태 관리
│   ├── services/            # 비즈니스 서비스
│   └── constants/           # 상수
├── infrastructure/          # 외부 의존성
│   ├── i18n/               # 국제화
│   ├── logging/            # 로깅
│   └── storage/            # 스토리지
└── assets/                 # 정적 자원
```

## 코드 작성/수정 원칙

### 1. 외부 라이브러리 접근

- fflate, Motion One, Preact 등 외부 라이브러리는 반드시 `src/utils/vendors/index.ts`의 getter(`getFflate`, `getMotion`, `getPreact` 등)만 사용합니다.
- 직접 import 또는 window 접근은 금지하며, 예외는 진단/테스트 코드에 한정합니다.

### 2. 의존성 규칙

```
features → shared → core → infrastructure
```

- Features는 shared, core, infrastructure에서 import 가능
- Shared는 core, infrastructure에서만 import 가능
- Core는 infrastructure에서만 import 가능
- Infrastructure는 자체 완결형

### 3. 컴포넌트 작성

- Preact 함수형 컴포넌트 사용
- CSS Modules을 통한 스타일 격리
- TypeScript 타입 안전성 보장
- 배럴 export 패턴 활용

### 4. 상태 관리

- Preact Signals를 사용한 반응형 상태 관리
- Signal 파일별로 기능 영역 분리
- 컴포넌트에서 직접 signal 값 변경 금지 (action 함수 사용)

### 5. 타입 및 인터페이스

- 모든 함수와 클래스에 명확한 TypeScript 타입 지정
- 공통 타입은 적절한 디렉토리에 정의하여 재사용
- DOM 요소와 관련된 타입은 정확한 HTML 요소 타입 사용

### 6. 문서화

- 모든 유틸리티/다운로드 관련 함수는 JSDoc 주석 포함
- 주요 변경 시 관련 문서 업데이트
- 새로운 함수 추가 시 사용법/예시/주의사항 문서화

### 7. 코드 품질

- ESLint, Prettier 규칙 준수
- 사용하지 않는 import, 변수, 함수 제거
- 비동기 코드는 적절한 에러 처리 포함

## 예시 패턴

```typescript
// 외부 라이브러리 사용
import { getFflate, getMotion } from '@shared/utils/vendors';

// 컴포넌트 작성
import { signal } from '@preact/signals';
import styles from './Component.module.css';

interface Props {
  title: string;
  onAction: () => void;
}

export function Component({ title, onAction }: Props) {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}

// 상태 관리
export const mediaItems = signal<MediaItem[]>([]);

export function addMediaItem(item: MediaItem) {
  mediaItems.value = [...mediaItems.value, item];
}
```

## 참고 문서

- [docs/REFACTORING_PLAN.md](../docs/REFACTORING_PLAN.md)
- [docs/PROJECT_STRUCTURE.md](../docs/PROJECT_STRUCTURE.md)
- [docs/UTILS.md](../docs/UTILS.md)
- [docs/dev/DEVELOPMENT_UNIFIED.md](../docs/dev/DEVELOPMENT_UNIFIED.md)

---

이 문서는 X.com Enhanced Gallery의 코드 일관성, 유지보수성, 문서화 품질을 보장하기 위한 가이드입니다.
질문이 있을 경우, 관련 문서와 새로운 아키텍처 구조를 우선 참고하세요.
