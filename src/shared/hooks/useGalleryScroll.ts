export type UseGalleryScrollOptions = {
  blockTwitterScroll?: boolean;
};

export default function useGalleryScroll(_options?: UseGalleryScrollOptions) {
  // 최소 구현: 이벤트 처리 인터페이스만 제공
  return {
    enable: () => {},
    disable: () => {},
    isEnabled: () => false,
  };
}
