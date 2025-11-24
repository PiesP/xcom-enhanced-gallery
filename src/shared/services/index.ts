export { BaseServiceImpl } from "./base-service";

export { EventManager } from "./event-manager";
export { MediaService } from "./media-service";
export { ThemeService, themeService } from "./theme-service";
export { LanguageService, languageService } from "./language-service";

export {
  NotificationService,
  getNotificationService,
} from "./notification-service";
export { PersistentStorage, getPersistentStorage } from "./persistent-storage";
export { CookieService, getCookieService } from "./cookie-service";
export { StyleRegistry, getStyleRegistry } from "./style-registry";

import { DownloadOrchestrator } from "./download/download-orchestrator";
export { DownloadOrchestrator as DownloadService };
export const downloadService = DownloadOrchestrator.getInstance();
export { ensureDownloadServiceRegistered } from "./lazy-service-registration";

export {
  HttpRequestService,
  getHttpRequestService,
  HttpError,
} from "./http-request-service";

export {
  CoreService,
  serviceManager,
  getService,
  registerServiceFactory,
} from "./core-service-manager";
