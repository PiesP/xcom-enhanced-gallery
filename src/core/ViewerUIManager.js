/**
 * @file ViewerUIManager.js
 * @description Manager for UI-related operations in the viewer component.
 * This class encapsulates UI operations like updating elements, adjusting images,
 * and handling downloads with a consistent error handling approach.
 */

import { debugLog } from "../debug.js";
import { ViewerDOMFacade } from "../components/dom/ViewerDOMFacade.js";

/**
 * @class ViewerUIManager
 * @description Manages UI operations for the viewer component.
 * Provides static methods for updating UI elements, adjusting images,
 * and handling download operations. Works as a layer between the ViewerCore
 * and the DOM-level components, focusing on UI operations logic.
 */
export class ViewerUIManager {
    /**
     * @method updateAllUIElements
     * @static
     * @description Updates all UI elements based on the current state of the viewer.
     * This includes updating the options bar and thumbnail bar to reflect
     * the current image index and adjustment mode.
     * @param {ViewerCore} core - Viewer core instance containing all necessary components
     */
    static updateAllUIElements(core) {
        try {
            debugLog('ViewerUIManager: Updating all UI elements');
            
            if (!core.optionsBar || !core.thumbnailBar) {
                debugLog('ViewerUIManager: Missing UI elements, skipping update');
                return;
            }
            
            const currentIndex = core.state.getCurrentIndex();
            const currentAdjustMode = core.state.getCurrentAdjustMode() || 'fit';
            
            ViewerDOMFacade.updateOptionsBar(
                core.optionsBar,
                currentIndex,
                currentAdjustMode
            );
            
            ViewerDOMFacade.updateThumbnails(
                core.thumbnailBar,
                currentIndex
            );
        } catch (error) {
            debugLog(`ViewerUIManager: Error updating UI elements - ${error.message}`);
        }
    }
    
    /**
     * @method adjustImages
     * @static
     * @description Adjusts the display mode of all images in the viewer.
     * Updates the state with the new adjustment mode and applies it to all
     * visible images, then updates the UI to reflect the change.
     * @param {ViewerCore} core - Viewer core instance
     * @param {string} mode - Adjustment mode: 'original', 'fit', 'width', 'height', or 'window'
     */
    static adjustImages(core, mode) {
        try {
            debugLog(`ViewerUIManager: Adjusting images with mode: ${mode}`);
            
            if (!core.imageContainer || !core.adjustment) {
                debugLog('ViewerUIManager: Missing components for image adjustment');
                return;
            }
            
            // Update state
            core.state.setCurrentAdjustMode(mode);
            
            // Apply adjustment
            core.adjustment.adjustAllImages(mode);
            
            // Update UI
            if (core.optionsBar) {
                ViewerDOMFacade.updateOptionsBar(
                    core.optionsBar,
                    core.state.getCurrentIndex(),
                    mode
                );
            }
        } catch (error) {
            debugLog(`ViewerUIManager: Error adjusting images - ${error.message}`);
        }
    }
    
    /**
     * @method downloadCurrentImage
     * @static
     * @description Downloads the currently displayed image.
     * Extracts the image URL from the tweet info based on current index
     * and initiates the download process with appropriate filename.
     * @param {ViewerCore} core - Viewer core instance
     */
    static downloadCurrentImage(core) {
        try {
            debugLog('ViewerUIManager: Downloading current image');
            
            if (!core.download) {
                debugLog('ViewerUIManager: Download component missing');
                return;
            }
            
            const currentIndex = core.state.getCurrentIndex();
            const tweetInfo = core.state.getTweetInfo();
            
            if (!tweetInfo) {
                debugLog('ViewerUIManager: Missing tweet info for download');
                return;
            }
            
            if (!tweetInfo.imageUrls || !Array.isArray(tweetInfo.imageUrls) || tweetInfo.imageUrls.length === 0) {
                debugLog('ViewerUIManager: No image URLs available for download');
                return;
            }
            
            if (currentIndex < 0 || currentIndex >= tweetInfo.imageUrls.length) {
                debugLog(`ViewerUIManager: Invalid image index: ${currentIndex}`);
                return;
            }
            
            const userName = tweetInfo.userName || tweetInfo.user || 'unknown';
            const tweetId = tweetInfo.tweetId || tweetInfo.id || 'unknown';
            
            core.download.downloadImage(
                tweetInfo.imageUrls[currentIndex],
                `${userName}_${tweetId}_${currentIndex}`
            );
        } catch (error) {
            debugLog(`ViewerUIManager: Error downloading image - ${error.message}`);
        }
    }
    
    /**
     * @method downloadAllImages
     * @static
     * @description Downloads all images from the current tweet as a ZIP archive.
     * Collects all image URLs from the tweet info and initiates a batch
     * download process, creating a ZIP file with an appropriate filename.
     * @param {ViewerCore} core - Viewer core instance
     */
    static downloadAllImages(core) {
        try {
            debugLog('ViewerUIManager: Downloading all images');
            
            if (!core.download) {
                debugLog('ViewerUIManager: Download component missing');
                return;
            }
            
            const tweetInfo = core.state.getTweetInfo();
            
            if (!tweetInfo) {
                debugLog('ViewerUIManager: Missing tweet info for download');
                return;
            }
            
            if (!tweetInfo.imageUrls || !Array.isArray(tweetInfo.imageUrls) || tweetInfo.imageUrls.length === 0) {
                debugLog('ViewerUIManager: No image URLs available for download');
                return;
            }
            
            const userName = tweetInfo.userName || tweetInfo.user || 'unknown';
            const tweetId = tweetInfo.tweetId || tweetInfo.id || 'unknown';
            
            core.download.downloadAllImages(
                tweetInfo.imageUrls,
                `${userName}_${tweetId}`
            );
        } catch (error) {
            debugLog(`ViewerUIManager: Error downloading all images - ${error.message}`);
        }
    }
}