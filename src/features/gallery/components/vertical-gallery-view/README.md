# Vertical Gallery View - Simple Implementation

## 개요

이 문서는 수직 갤러리 뷰를 이전 커밋의 간단하고 효과적인 구현을 기반으로 수정한 내용을 설명합니다.

## 변경사항

### 1. 단순화된 구현

기존의 복잡한 버전들을 백업으로 이동하고, GalleryRenderer의 fallback 구현을 기반으로 한 간단하고 효과적인 버전을 기본으로 설정했습니다.

### 2. 파일 구조

```
VerticalGalleryView.tsx                 # 기본 간단 구현 (NEW)
VerticalGalleryView.backup.module.css   # 간단 구현용 스타일
VerticalGalleryView.complex.tsx         # 기존 복잡한 구현 (백업)
VerticalGalleryView.enhanced.tsx        # 향상된 구현 (백업)
VerticalGalleryView.ultra.tsx           # Ultra 구현 (백업)
VerticalGalleryView.v5.tsx              # v5 구현 (백업)
```

### 3. 핵심 기능

#### 기본 기능

- **풀스크린 모달**: 전체 화면을 덮는 갤러리 뷰
- **간단한 네비게이션**: 이전/다음 버튼으로 미디어 탐색
- **키보드 지원**: ESC (닫기), 화살표 키 (탐색)
- **다운로드**: 현재 미디어 및 전체 다운로드 지원
- **토스트 메시지**: 사용자 피드백

#### 스타일링

- **모던 디자인**: glassmorphism과 backdrop blur 효과
- **반응형**: 모바일/태블릿 지원
- **접근성**: 고대비 모드, 움직임 줄이기 설정 지원
- **CSS 변수**: 일관된 디자인 시스템 활용

#### 미디어 지원

- **이미지**: 자동 크기 조정 (최대 90vw/90vh)
- **비디오**: 컨트롤러 포함, 자동 재생 (음소거)
- **오류 처리**: 미디어 로드 실패 시 대체 메시지

### 4. 설계 원칙

#### 단순성

- 복잡한 훅과 상태 관리를 제거
- 핵심 기능에만 집중
- 직관적인 인터페이스

#### 성능

- 메모이제이션 최소화
- 불필요한 리렌더링 방지
- 가벼운 DOM 구조

#### 유지보수성

- 명확한 컴포넌트 구조
- 이해하기 쉬운 코드
- 모듈화된 스타일

### 5. 사용법

```tsx
import { VerticalGalleryView } from '@features/gallery/components/vertical-gallery-view';

function MyComponent() {
  const [mediaItems] = useState<MediaInfo[]>([...]);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <VerticalGalleryView
      mediaItems={mediaItems}
      currentIndex={currentIndex}
      onClose={() => setIsOpen(false)}
      onPrevious={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
      onNext={() => setCurrentIndex(prev => Math.min(mediaItems.length - 1, prev + 1))}
      onDownloadCurrent={() => downloadMedia(mediaItems[currentIndex])}
      onDownloadAll={() => downloadAllMedia(mediaItems)}
      showToast={showToast}
      toastMessage="다운로드 완료!"
      toastType="success"
    />
  );
}
```

### 6. 고급 버전 활용

필요에 따라 더 복잡한 기능이 필요한 경우 다른 버전들을 사용할 수 있습니다:

```tsx
// 향상된 기능이 필요한 경우
import { VerticalGalleryViewEnhanced } from '@features/gallery/components/vertical-gallery-view';

// Ultra 기능이 필요한 경우 (가상 스크롤링 등)
import { VerticalGalleryViewUltra } from '@features/gallery/components/vertical-gallery-view';
```

## 마이그레이션 가이드

기존 코드에서 이 새로운 버전으로 마이그레이션하는 경우:

1. **Props 확인**: 기본 props는 동일하게 유지됨
2. **스타일 조정**: 필요한 경우 CSS 변수로 커스터마이징
3. **기능 제거**: 복잡한 기능이 필요한 경우 Enhanced 또는 Ultra 버전 사용

## 호환성

- **Preact**: 기존 Preact 기반 유지
- **CSS Modules**: 기존 스타일 시스템과 호환
- **TypeScript**: 완전한 타입 안전성
- **접근성**: WCAG 가이드라인 준수

이 간단한 구현은 대부분의 사용 사례에 충분하며, 필요에 따라 점진적으로 고급 기능을 추가할 수 있는 확장 가능한 구조를 제공합니다.
