import { SERVICE_KEYS } from '@/constants';
import { CoreService } from '@shared/services/service-manager';
import { FilenameService } from '@shared/services/filename-service';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

/**
 * Register core services to the CoreService container.
 * This is called during application bootstrap.
 */
export async function registerCoreServices(): Promise<void> {
  const core = CoreService.getInstance();

  // Register services that are accessed via CoreService/AppContainer
  core.register(SERVICE_KEYS.THEME, ThemeService.getInstance());
  core.register(SERVICE_KEYS.LANGUAGE, LanguageService.getInstance());
  core.register(SERVICE_KEYS.MEDIA_FILENAME, FilenameService.getInstance());
  core.register(SERVICE_KEYS.MEDIA_SERVICE, MediaService.getInstance());
}
