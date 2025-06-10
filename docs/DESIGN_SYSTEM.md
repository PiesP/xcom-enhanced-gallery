# X.com Enhanced Gallery - Design System & Auto Theme

## 🎨 현대적 디자인 시스템

### Glassmorphism 효과

모든 UI 컴포넌트에 현대적인 glassmorphism 디자인을 적용했습니다:

- **반투명 배경**: `rgba()` 값으로 투명도 조절
- **백드롭 필터**: `backdrop-filter: blur()` 효과
- **부드러운 그림자**: 다층 box-shadow로 깊이감 표현
- **세련된 테두리**: 미묘한 투명 테두리

### 통일된 색상 팔레트

차분하고 일관된 색조로 재설계되었습니다:

```css
/* 주요 색상 */
--xeg-color-primary: #4785a3; /* 차분한 블루 */
--xeg-color-secondary: #64748b; /* 슬레이트 그레이 */
--xeg-color-success: #10b981; /* 에메랄드 그린 */
--xeg-color-warning: #f59e0b; /* 앰버 */
--xeg-color-error: #dc2626; /* 레드 */

/* 배경 색상 */
--xeg-bg-primary: #fafbfc; /* 미묘한 오프화이트 */
--xeg-bg-secondary: #f1f5f9; /* 연한 슬레이트 */
```

## 🌈 자동 색조 선택 시스템

### 주요 기능

1. **시스템 테마 자동 감지**

   - `prefers-color-scheme`을 통한 라이트/다크 모드 자동 전환
   - 부드러운 테마 전환 애니메이션

2. **시간대 기반 테마**

   - 아침 (6-10시): 상쾌한 블루 톤
   - 낮 (10-17시): 밝고 명료한 톤
   - 저녁 (17-20시): 따뜻한 골든 톤
   - 밤 (20-6시): 차분한 다크 톤

3. **콘텐츠 기반 색상 적응**

   - 이미지의 주요 색상 자동 분석
   - 색온도에 따른 테마 분류:
     - **따뜻한 톤**: 오렌지/레드 계열 이미지
     - **차가운 톤**: 블루/시안 계열 이미지
     - **생동감**: 높은 채도의 이미지
     - **중성 톤**: 그레이스케일 이미지

4. **접근성 자동 조정**
   - 고대비 모드 자동 감지 및 적용
   - 애니메이션 감소 모드 지원
   - 배터리 절약 모드 최적화

### 사용법

```typescript
import { autoThemeHelpers, AutoThemeController } from '@shared/utils/auto-theme';

// 설정 업데이트
autoThemeHelpers.updateSettings({
  enabled: true,
  timeBasedTheme: true,
  contentBasedTheme: true,
  transitionDuration: 600,
  debug: false,
});

// 갤러리 이벤트와 연동
autoThemeHelpers.onGalleryOpen(imageElement);
autoThemeHelpers.onImageChange(imageElement);
autoThemeHelpers.onGalleryClose();
```

### CSS 변수 시스템

자동 테마 시스템은 다음 CSS 변수들을 동적으로 업데이트합니다:

```css
/* 자동 조정되는 변수들 */
--xeg-auto-primary: /* 이미지에 따라 변경 */ --xeg-auto-surface: /* 배경색 자동 조정 */
  --xeg-auto-text: /* 텍스트 색상 자동 조정 */ --xeg-auto-glass-bg: /* glassmorphism 배경 */
  --xeg-auto-glass-border: /* glassmorphism 테두리 */;
```

## 🔧 컴포넌트별 개선사항

### 갤러리 뷰어

- 향상된 glassmorphism 오버레이
- 콘텐츠 기반 자동 색상 적응
- 부드러운 블러 효과와 그림자

### 툴바

- 현대적인 반투명 배경
- 호버 시 상승 효과
- 향상된 버튼 인터랙션

### 버튼 컴포넌트

- glassmorphism 스타일
- cubic-bezier 애니메이션
- 계층적 그림자 효과

### Toast 알림

- 반투명 배경과 백드롭 필터
- 타입별 색상 최적화
- 향상된 슬라이드 애니메이션

## 📱 반응형 디자인

### 모바일 최적화

- 터치 친화적인 버튼 크기
- 단순화된 glassmorphism 효과
- 성능 최적화된 애니메이션

### 데스크톱 경험

- 풀 glassmorphism 효과
- 향상된 호버 상태
- 정밀한 인터랙션

## ⚡ 성능 최적화

### CSS 최적화

- `will-change` 속성으로 GPU 가속
- `contain` 속성으로 레이아웃 최적화
- 하드웨어 가속 애니메이션

### JavaScript 최적화

- 색상 분석 결과 캐싱
- 디바운스된 테마 전환
- 메모리 효율적인 이미지 처리

### 브라우저 호환성

- 최신 CSS 기능 감지 및 폴백
- `backdrop-filter` 미지원 시 대체 스타일
- `color-mix()` 미지원 시 폴백 색상

## 🎯 사용자 경험

### 직관적 인터페이스

- 컨텍스트에 맞는 색상 자동 조정
- 일관된 시각적 언어
- 부드러운 전환 효과

### 접근성 고려

- WCAG 대비율 준수
- 키보드 네비게이션 지원
- 스크린 리더 최적화

### 성능 고려

- 60fps 애니메이션
- 최소한의 리플로우/리페인트
- 효율적인 메모리 사용

---

_이 디자인 시스템은 현대적 웹 표준과 사용자 경험 모범 사례를 기반으로 구축되었습니다._
