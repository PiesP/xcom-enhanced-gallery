import { logger } from "@shared/logging";
import { BaseServiceImpl } from "@shared/services/base-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock logger
vi.mock("@shared/logging", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

class TestService extends BaseServiceImpl {
  constructor() {
    super("TestService");
  }

  // Expose hooks for spying
  public onInitializeMock = vi.fn();
  public onDestroyMock = vi.fn();

  protected async onInitialize(): Promise<void> {
    await this.onInitializeMock();
  }

  protected onDestroy(): void {
    this.onDestroyMock();
  }
}

describe("BaseServiceImpl", () => {
  let service: TestService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestService();
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      expect(service.isInitialized()).toBe(false);

      await service.initialize();

      expect(service.onInitializeMock).toHaveBeenCalled();
      expect(service.isInitialized()).toBe(true);
      expect(logger.info).toHaveBeenCalledWith("TestService initializing...");
      expect(logger.info).toHaveBeenCalledWith("TestService initialized");
    });

    it("should be idempotent", async () => {
      await service.initialize();
      await service.initialize();

      expect(service.onInitializeMock).toHaveBeenCalledTimes(1);
    });

    it("should handle initialization failure", async () => {
      const error = new Error("Init failed");
      service.onInitializeMock.mockRejectedValue(error);

      await expect(service.initialize()).rejects.toThrow(error);

      expect(service.isInitialized()).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        "TestService initialization failed:",
        error,
      );
    });
  });

  describe("destroy", () => {
    it("should destroy successfully", async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      service.destroy();

      expect(service.onDestroyMock).toHaveBeenCalled();
      expect(service.isInitialized()).toBe(false);
      expect(logger.info).toHaveBeenCalledWith("TestService destroying...");
      expect(logger.info).toHaveBeenCalledWith("TestService destroyed");
    });

    it("should be idempotent", async () => {
      await service.initialize();
      service.destroy();
      service.destroy();

      expect(service.onDestroyMock).toHaveBeenCalledTimes(1);
    });

    it("should not destroy if not initialized", () => {
      service.destroy();
      expect(service.onDestroyMock).not.toHaveBeenCalled();
    });

    it("should handle destruction failure gracefully", async () => {
      await service.initialize();
      const error = new Error("Destroy failed");
      service.onDestroyMock.mockImplementation(() => {
        throw error;
      });

      expect(() => service.destroy()).not.toThrow();

      expect(service.isInitialized()).toBe(false); // Should still set to false
      expect(logger.error).toHaveBeenCalledWith(
        "TestService destroy failed:",
        error,
      );
    });
  });
});
