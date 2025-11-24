import { SERVICE_KEYS } from "@/constants";
import { CoreService } from "@shared/services/core-service-manager";
import { filenameService } from "@shared/services/filename-service";
import { languageService } from "@shared/services/language-service";
import { MediaService } from "@shared/services/media-service";
import { themeService } from "@shared/services/theme-service";

/**
 * Register core services to the CoreService container.
 * This is called during application bootstrap.
 */
export async function registerCoreServices(): Promise<void> {
  const core = CoreService.getInstance();

  // Register services that are accessed via CoreService/AppContainer
  core.register(SERVICE_KEYS.THEME, themeService);
  core.register(SERVICE_KEYS.LANGUAGE, languageService);
  core.register(SERVICE_KEYS.MEDIA_FILENAME, filenameService);
  core.register(SERVICE_KEYS.MEDIA_SERVICE, MediaService.getInstance());
}
