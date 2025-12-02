import { logger } from "@shared/logging";
import { getCookieService } from "@shared/services/cookie-service";
import { TwitterAuthService } from "@shared/services/media/twitter-auth-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@shared/services/cookie-service", () => ({
  getCookieService: vi.fn(),
}));

vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe("TwitterAuthService", () => {
  const mockCookieService = {
    getValueSync: vi.fn(),
    getValue: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getCookieService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockCookieService,
    );

    // Reset static state
    (
      TwitterAuthService as unknown as { _tokensInitialized: boolean }
    )._tokensInitialized = false;
    (
      TwitterAuthService as unknown as { _csrfToken: string | undefined }
    )._csrfToken = undefined;
    // We need to ensure the static cookieService is set to our mock
    // Since it's readonly and initialized at module load, we might need to force it
    (
      TwitterAuthService as unknown as { cookieService: unknown }
    ).cookieService = mockCookieService;
  });

  it("should initialize tokens and return csrfToken", () => {
    mockCookieService.getValueSync.mockReturnValue("test-token");
    mockCookieService.getValue.mockResolvedValue("test-token");

    const token = TwitterAuthService.csrfToken;

    expect(token).toBe("test-token");
    expect(mockCookieService.getValueSync).toHaveBeenCalledWith("ct0");
  });

  it("should not re-initialize if already initialized", () => {
    mockCookieService.getValueSync.mockReturnValue("test-token");
    mockCookieService.getValue.mockResolvedValue("test-token");

    // First call
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    TwitterAuthService.csrfToken;

    // Second call
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    TwitterAuthService.csrfToken;

    expect(mockCookieService.getValueSync).toHaveBeenCalledTimes(1);
  });

  it("should handle async cookie retrieval success", async () => {
    mockCookieService.getValueSync.mockReturnValue(undefined);
    mockCookieService.getValue.mockResolvedValue("async-token");

    // Trigger initialization
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    TwitterAuthService.csrfToken;

    // Wait for promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockCookieService.getValue).toHaveBeenCalledWith("ct0");
    expect(
      (TwitterAuthService as unknown as { _csrfToken: string })._csrfToken,
    ).toBe("async-token");
  });

  it("should handle async cookie retrieval failure", async () => {
    mockCookieService.getValueSync.mockReturnValue(undefined);
    const error = new Error("Cookie error");
    mockCookieService.getValue.mockRejectedValue(error);

    // Trigger initialization
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    TwitterAuthService.csrfToken;

    // Wait for promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logger.debug).toHaveBeenCalledWith(
      "Failed to hydrate CSRF token from GM_cookie",
      error,
    );
  });
});
