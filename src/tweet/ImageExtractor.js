/**
 * 트윗으로부터 이미지를 추출하는 클래스
 */
export class ImageExtractor {
    /**
     * 트윗 컨테이너에서 모든 이미지 URL 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {Array} 이미지 URL 배열
     */
    static getAllImagesFromTweet(containerElement, isMediaTab) {
        try {
            // 일반 타임라인과 미디어란 모두에서 이미지 찾기
            let images = [...containerElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]')]
                .map(img => img.src.replace(/&name=\w+/, '&name=orig'));
            
            // 미디어란에서는 추가적인 방법으로 이미지 찾기 시도
            if (isMediaTab && images.length === 0) {
                // 클릭한 이미지가 있는지 확인
                const clickedImage = containerElement.tagName === 'IMG' ? 
                                    containerElement : 
                                    containerElement.querySelector('img');
                
                if (clickedImage && clickedImage.src && clickedImage.src.includes('pbs.twimg.com/media/')) {
                    // 클릭한 이미지를 추가
                    images.push(clickedImage.src.replace(/&name=\w+/, '&name=orig'));
                }
            }
            
            // 이미지 중복 제거
            return [...new Set(images)];
        } catch (e) {
            console.error("Error getting images from tweet:", e);
            return [];
        }
    }
}