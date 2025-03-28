/**
 * @file ViewerNavigationManager.js
 * @description Manager for navigation functionality in the viewer component.
 * Provides methods for navigating between images, selecting specific images,
 * and updating the UI to reflect navigation changes.
 */

import { debugLog } from "../debug.js";

/**
 * @class ViewerNavigationManager
 * @description Manager class for viewer navigation functionality.
 * Responsible for handling all aspects of image navigation including
 * movement between images, direct selection, and coordinating UI updates
 * to reflect the current navigation state.
 */
export class ViewerNavigationManager {
    /**
     * @method prevImage
     * @static
     * @description Navigate to the previous image in the sequence.
     * If at the first image, wraps around to the last image.
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     */
    static prevImage(core) {
        try {
            debugLog('ViewerNavigationManager.prevImage called');
            const newIndex = core.state.navigatePrev();
            this.updateViewerForIndex(core, newIndex);
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error navigating to previous image - ${error.message}`);
        }
    }
    
    /**
     * @method nextImage
     * @static
     * @description Navigate to the next image in the sequence.
     * If at the last image, wraps around to the first image.
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     */
    static nextImage(core) {
        try {
            debugLog('ViewerNavigationManager.nextImage called');
            const newIndex = core.state.navigateNext();
            this.updateViewerForIndex(core, newIndex);
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error navigating to next image - ${error.message}`);
        }
    }
    
    /**
     * @method selectImage
     * @static
     * @description Select a specific image by index
     * @param {ViewerCore} core - Viewer core instance
     * @param {number} index - Index of image to select
     * @param {boolean} smooth - Whether to use smooth scrolling
     */
    static selectImage(core, index, smooth = true) {
        debugLog(`ViewerNavigationManager.selectImage called: index=${index}, smooth=${smooth}`);
        
        // Prevent duplicate selection if already in progress
        if (!core.state.canSelectImage()) {
            debugLog('Selection already in progress');
            return;
        }
        
        try {
            core.state.startSelecting();
            
            // Validate index range
            const totalImages = core.getTotalImages();
            if (index < 0 || index >= totalImages) {
                debugLog(`Invalid index: ${index}, valid range: 0-${totalImages - 1}`);
                core.state.endSelecting();
                return;
            }
            
            // Update index
            core.state.selectImage(index);
            
            // Update UI for the new index
            this.updateViewerForIndex(core, index, smooth);
            
            // End selection process
            core.state.endSelecting();
        } catch (e) {
            debugLog('Error during image selection', e);
            core.state.endSelecting(0); // Immediate termination
        }
    }
    
    /**
     * @method goToFirst
     * @static
     * @description Navigate directly to the first image in the sequence
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     */
    static goToFirst(core) {
        try {
            debugLog('ViewerNavigationManager.goToFirst called');
            const newIndex = core.state.goToFirst();
            this.updateViewerForIndex(core, newIndex);
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error navigating to first image - ${error.message}`);
        }
    }
    
    /**
     * @method goToLast
     * @static
     * @description Navigate directly to the last image in the sequence
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     */
    static goToLast(core) {
        try {
            debugLog('ViewerNavigationManager.goToLast called');
            const newIndex = core.state.goToLast();
            this.updateViewerForIndex(core, newIndex);
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error navigating to last image - ${error.message}`);
        }
    }
    
    /**
     * @method updateCurrentIndex
     * @static
     * @description Update the current image index and refresh UI elements.
     * This method is used when the index change is triggered by external factors
     * like scrolling or intersection observations, not direct user navigation.
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     * @param {number} index - New index value to set as current
     */
    static updateCurrentIndex(core, index) {
        try {
            debugLog(`ViewerNavigationManager.updateCurrentIndex called: ${index}`);
            
            // Validate index range
            const totalImages = core.getTotalImages();
            if (index < 0 || index >= totalImages) {
                debugLog(`Invalid index: ${index}, valid range: 0-${totalImages - 1}`);
                return;
            }
            
            // Update state and UI
            if (core.state.updateIndex(index)) {
                // Update thumbnails and options bar
                if (core.dom && core.thumbnailBar) {
                    core.dom.updateThumbnails(core.thumbnailBar, index);
                }
                
                if (core.dom && core.optionsBar) {
                    core.dom.updateOptionsBar(core.optionsBar, index);
                }
                
                if (core.thumbnailManager) {
                    core.thumbnailManager.setCurrentIndex(index);
                    core.thumbnailManager.updateThumbnailFocus();
                }
            }
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error updating current index - ${error.message}`);
        }
    }
    
    /**
     * @method updateViewerForIndex
     * @static
     * @description Update all viewer UI elements and focus the image at the specified index.
     * This is a comprehensive update that both changes the current index in the state
     * and ensures the UI reflects this change, including scrolling to make the image visible.
     * @param {ViewerCore} core - Viewer core instance with state and UI components
     * @param {number} index - New index value to set as current
     * @param {boolean} smooth - Whether to use smooth scrolling for focusing the image
     */
    static updateViewerForIndex(core, index, smooth = true) {
        try {
            debugLog(`ViewerNavigationManager.updateViewerForIndex called: index=${index}, smooth=${smooth}`);
            
            // Update index
            this.updateCurrentIndex(core, index);
            
            // Focus image
            if (core.focus) {
                core.focus.focusImageByIndex(index, smooth);
            } else if (core.navigation) {
                // For backward compatibility
                core.navigation.focusCurrentImage(core.imageContainer, smooth);
            }
        } catch (error) {
            debugLog(`ViewerNavigationManager: Error updating viewer for index - ${error.message}`);
        }
    }
}