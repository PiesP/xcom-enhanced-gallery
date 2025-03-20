export const STYLE_ID = 'xcom-image-viewer-styles';

export const CSS = `
    #xcom-image-viewer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        overflow-y: auto;
        z-index: 10000;
        overscroll-behavior: contain;
        touch-action: pan-y pinch-zoom;
        cursor: pointer;
    }

    #optionsBar {
        width: 100%;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10004;
        transition: transform 0.3s ease;
        transform: translateY(0);
    }

    #thumbnailBar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: transform 0.3s ease;
        transform: translateY(0);
        z-index: 10004;
        padding: 0 10px;
        overflow-x: auto;
    }

    .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border: none;
        cursor: pointer;
        font-size: 16px;
        border-radius: 4px;
    }

    .icon-button:hover {
        opacity: 0.8;
    }

    .icon-button:focus {
        outline: 2px solid #1da1f2;
    }

    .viewer-image {
        display: block;
        width: auto;
        height: auto;
        max-width: 100%;
        object-fit: contain;
        transition: all 0.3s ease;
        transform-origin: top center;
        margin: 0;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        -webkit-user-drag: none;
    }

    .image-container {
        position: relative;
        margin: 5px 0;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        z-index: 10001;
    }

    .image-container-wrapper {
        pointer-events: none;
    }

    .thumbnail {
        height: 60px;
        max-height: 60px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 3px solid transparent;
        pointer-events: auto;
    }

    .thumbnail:hover {
        transform: scale(1.05);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
    }

    .thumbnail.active {
        border-color: #1da1f2;
        transform: scale(1.1);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
    }

    .image-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #1da1f2;
        box-shadow: 0 0 5px white;
        pointer-events: none;
        z-index: 10003;
    }

    #current-image-indicator {
        position: fixed;
        top: 10px;
        right: 100px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10004;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        .icon-button {
            padding: 8px;
        }

        #optionsBar {
            flex-wrap: wrap;
            justify-content: space-around;
        }

        .thumbnail {
            height: 50px;
        }
    }
`;