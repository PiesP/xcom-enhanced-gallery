export { BaseServiceImpl } from "./base-service";

export { EventManager } from "./event-manager";
export { LanguageService, languageService } from "./language-service";
export { MediaService } from "./media-service";
export { ThemeService, themeService } from "./theme-service";

export { CookieService, getCookieService } from "./cookie-service";
export {
    getNotificationService, NotificationService
} from "./notification-service";
export { getPersistentStorage, PersistentStorage } from "./persistent-storage";
export { getStyleRegistry, StyleRegistry } from "./style-registry";
export { DownloadOrchestrator as DownloadService };

import { DownloadOrchestrator } from "./download/download-orchestrator";
export const downloadService = DownloadOrchestrator.getInstance();
export { ensureDownloadServiceRegistered } from "./lazy-service-registration";

export {
    getHttpRequestService,
    HttpError, HttpRequestService
} from "./http-request-service";

export {
    CoreService, getService,
    registerServiceFactory, serviceManager
} from "./core-service-manager";
