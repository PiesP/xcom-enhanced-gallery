const I18N = {
    ko: {
        prevImage: '이전 이미지',
        nextImage: '다음 이미지',
        fitWidth: '너비 맞춤',
        fitHeight: '높이 맞춤',
        fitWindow: '창 맞춤',
        originalSize: '원본 크기',
        saveCurrentImage: '현재 이미지 저장',
        saveAllImages: '모든 이미지 저장',
        close: '닫기 (Esc키로도 닫힘)',
        downloadFailed: '이미지 다운로드 실패',
        unknownUser: '알 수 없는 사용자',
        unknownID: '알 수 없는 ID',
        currentImageIndicator: '현재 이미지: %1 / %2',
        positionAdaptive: '위치 자동 조정',
        positionTop: '이미지 상단 정렬',
        positionCenter: '이미지 중앙 정렬'
    },
    en: {
        prevImage: 'Previous Image',
        nextImage: 'Next Image',
        fitWidth: 'Fit to Width',
        fitHeight: 'Fit to Height',
        fitWindow: 'Fit to Window',
        originalSize: 'Original Size',
        saveCurrentImage: 'Save Current Image',
        saveAllImages: 'Save All Images',
        close: 'Close (or press Esc)',
        downloadFailed: 'Image download failed',
        unknownUser: 'Unknown User',
        unknownID: 'Unknown ID',
        currentImageIndicator: 'Current image: %1 of %2',
        positionAdaptive: 'Adaptive Image Position',
        positionTop: 'Align Image to Top',
        positionCenter: 'Center Image in View'
    }
};

const userLang = (navigator.language || navigator.userLanguage).split('-')[0];
const lang = I18N[userLang] ? userLang : 'ko';

export function translate(key, ...args) {
    let text = I18N[lang][key] || I18N.ko[key] || key;
    args.forEach((arg, index) => {
        text = text.replace(`%${index + 1}`, arg);
    });
    return text;
}
