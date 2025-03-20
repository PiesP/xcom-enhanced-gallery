import { Utils } from "../Utils.js";
import { translate } from "../I18N.js";

export class ViewerDownload {
    constructor(viewer) {
        this.viewer = viewer;
    }

    async downloadCurrentImage(tweetInfo, currentIndex) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            const url = tweetInfo.imageUrls[currentIndex];
            const ext = Utils.getFileExtension(url);
            const filename = `${tweetInfo.user}_${tweetInfo.id}_${currentIndex + 1}.${ext}`;

            const downloadIndicator = document.createElement('div');
            downloadIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                max-width: 80%;
            `;

            const preview = document.createElement('img');
            preview.src = url.replace(/&name=orig/, '&name=small');
            preview.style.cssText = `
                max-width: 150px;
                max-height: 150px;
                border: 2px solid white;
            `;

            downloadIndicator.innerHTML = `
                <h3>Downloading Image ${currentIndex + 1} of ${tweetInfo.imageUrls.length}</h3>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            this.viewer.appendChild(downloadIndicator);

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                if (typeof saveAs === 'function') {
                    saveAs(url, filename);
                } else {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } catch (err) {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            downloadIndicator.innerHTML = `
                <h3>Download Complete!</h3>
                <p>Image ${currentIndex + 1} of ${tweetInfo.imageUrls.length} saved as:</p>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            setTimeout(() => {
                if (downloadIndicator.parentNode) {
                    downloadIndicator.parentNode.removeChild(downloadIndicator);
                }
            }, 1500);
        } catch (e) {
            const existingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (existingIndicator) {
                existingIndicator.parentNode.removeChild(existingIndicator);
            }
            console.error("Error downloading image:", e);
        }
    }

    async downloadAllImages(tweetInfo) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            if (typeof JSZip !== 'function' && typeof window.JSZip !== 'function') {
                alert("JSZip library is not available. Please reload the page or use single image download.");
                return;
            }

            const ZipConstructor = typeof JSZip === 'function' ? JSZip : window.JSZip;
            const zip = new ZipConstructor();
            const folder = zip.folder(`${tweetInfo.user}_${tweetInfo.id}`);

            const loadingIndicator = document.createElement('div');
            loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
            `;
            loadingIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Downloading images...</p>';
            this.viewer.appendChild(loadingIndicator);

            const downloadPromises = tweetInfo.imageUrls.map(async (url, index) => {
                try {
                    const ext = Utils.getFileExtension(url);
                    const filename = `${tweetInfo.user}_${tweetInfo.id}_${index + 1}.${ext}`;
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    folder.file(filename, blob);

                    loadingIndicator.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                        <p>Downloading images (${index + 1}/${tweetInfo.imageUrls.length})...</p>
                    `;
                } catch (error) {
                    console.warn(`${translate('downloadFailed')}: ${url}`, error);
                }
            });

            await Promise.allSettled(downloadPromises);

            try {
                const zipContent = await zip.generateAsync({ type: 'blob' });
                
                if (typeof saveAs === 'function') {
                    saveAs(zipContent, `${tweetInfo.user}_${tweetInfo.id}.zip`);
                } else if (typeof window.saveAs === 'function') {
                    window.saveAs(zipContent, `${tweetInfo.user}_${tweetInfo.id}.zip`);
                } else {
                    const url = URL.createObjectURL(zipContent);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${tweetInfo.user}_${tweetInfo.id}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error(`Error creating zip file: ${error.message}`);
                alert(`Error creating zip file: ${error.message}`);
            }

            if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
        } catch (e) {
            const loadingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
            console.error("Error downloading all images:", e);
            alert(`Error downloading all images: ${e.message}`);
        }
    }
}