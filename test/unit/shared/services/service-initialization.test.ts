import { registerCoreServices } from '@shared/services/service-initialization';
import { CoreService } from '@shared/services/service-manager';
import { ThemeService } from '@shared/services/theme-service';
import { LanguageService } from '@shared/services/language-service';
import { FilenameService } from '@shared/services/filename-service';
import { MediaService } from '@shared/services/media-service';
import { SERVICE_KEYS } from '@/constants';

// Mock dependencies
vi.mock('@shared/services/service-manager');
vi.mock('@shared/services/theme-service');
vi.mock('@shared/services/language-service');
vi.mock('@shared/services/filename-service');
vi.mock('@shared/services/media-service');

describe('Service Initialization', () => {
  let mockCoreService: { register: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Setup CoreService mock
    mockCoreService = {
      register: vi.fn(),
    };
    vi.mocked(CoreService.getInstance).mockReturnValue(mockCoreService as any);

    // Setup other service mocks
    vi.mocked(ThemeService.getInstance).mockReturnValue({} as any);
    vi.mocked(LanguageService.getInstance).mockReturnValue({} as any);
    vi.mocked(FilenameService.getInstance).mockReturnValue({} as any);
    vi.mocked(MediaService.getInstance).mockReturnValue({} as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register all core services', async () => {
    await registerCoreServices();

    expect(CoreService.getInstance).toHaveBeenCalled();

    // Verify ThemeService registration
    expect(ThemeService.getInstance).toHaveBeenCalled();
    expect(mockCoreService.register).toHaveBeenCalledWith(SERVICE_KEYS.THEME, expect.anything());

    // Verify LanguageService registration
    expect(LanguageService.getInstance).toHaveBeenCalled();
    expect(mockCoreService.register).toHaveBeenCalledWith(SERVICE_KEYS.LANGUAGE, expect.anything());

    // Verify FilenameService registration
    expect(FilenameService.getInstance).toHaveBeenCalled();
    expect(mockCoreService.register).toHaveBeenCalledWith(
      SERVICE_KEYS.MEDIA_FILENAME,
      expect.anything()
    );

    // Verify MediaService registration
    expect(MediaService.getInstance).toHaveBeenCalled();
    expect(mockCoreService.register).toHaveBeenCalledWith(
      SERVICE_KEYS.MEDIA_SERVICE,
      expect.anything()
    );

    // Verify total registration count
    expect(mockCoreService.register).toHaveBeenCalledTimes(4);
  });
});
