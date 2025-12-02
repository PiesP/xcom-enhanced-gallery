import {
    HttpError,
    HttpRequestService,
    getHttpRequestService,
} from "@shared/services/http-request-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const mockXmlHttpRequest = vi.fn();
const mockAbort = vi.fn();

const mockUserscript = {
  xmlHttpRequest: mockXmlHttpRequest,
};

vi.mock("@shared/external/userscript/adapter", () => ({
  getUserscript: () => mockUserscript,
}));

describe("HttpRequestService", () => {
  let service: HttpRequestService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpRequestService as any).instance = null;

    mockXmlHttpRequest.mockReturnValue({
      abort: mockAbort,
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpRequestService as any).instance = null;
  });

  describe("Singleton", () => {
    it("should return the same instance", () => {
      service = HttpRequestService.getInstance();
      const instance2 = getHttpRequestService();
      expect(service).toBe(instance2);
    });
  });

  describe("HTTP Methods", () => {
    beforeEach(() => {
      service = HttpRequestService.getInstance();
    });

    it("should perform GET request", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({
          status: 200,
          statusText: "OK",
          response: { success: true },
          responseHeaders:
            "Content-Type: application/json\r\nDate: Mon, 01 Jan 2024 00:00:00 GMT",
        });
        return { abort: mockAbort };
      });

      const response = await service.get("https://api.example.com/data");

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      expect(response.headers["content-type"]).toBe("application/json");
      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://api.example.com/data",
        }),
      );
    });

    it("should perform POST request with JSON data", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({
          status: 201,
          statusText: "Created",
          response: { id: 1 },
        });
        return { abort: mockAbort };
      });

      const data = { name: "test" };
      const response = await service.post(
        "https://api.example.com/users",
        data,
      );

      expect(response.status).toBe(201);
      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "https://api.example.com/users",
          data: JSON.stringify(data),
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
        }),
      );
    });

    it("should perform PUT request", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.put("https://api.example.com/users/1", { name: "updated" });

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should perform DELETE request", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 204, response: null });
        return { abort: mockAbort };
      });

      await service.delete("https://api.example.com/users/1");

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("should perform PATCH request", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.patch("https://api.example.com/users/1", {
        name: "patched",
      });

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });
  });

  describe("Binary Requests", () => {
    beforeEach(() => {
      service = HttpRequestService.getInstance();
    });

    it("should perform postBinary request", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: { success: true } });
        return { abort: mockAbort };
      });

      const binaryData = new Uint8Array([1, 2, 3]);
      await service.postBinary("https://api.example.com/upload", binaryData);

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          data: binaryData,
          headers: expect.objectContaining({
            "content-type": "application/octet-stream",
          }),
        }),
      );
    });

    it("should respect custom content type in postBinary", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      const binaryData = new Uint8Array([1, 2, 3]);
      await service.postBinary("https://api.example.com/upload", binaryData, {
        contentType: "image/png",
      });

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "content-type": "image/png",
          }),
        }),
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      service = HttpRequestService.getInstance();
    });

    it("should handle network errors", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onerror({ status: 0, statusText: "Network Error" });
        return { abort: mockAbort };
      });

      await expect(service.get("https://api.example.com/fail")).rejects.toThrow(
        HttpError,
      );
    });

    it("should handle timeouts", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.ontimeout();
        return { abort: mockAbort };
      });

      await expect(
        service.get("https://api.example.com/timeout"),
      ).rejects.toThrow("Request timeout");
    });

    it("should handle abort signal", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onabort();
        return { abort: mockAbort };
      });

      const controller = new AbortController();
      const promise = service.get("https://api.example.com/abort", {
        signal: controller.signal,
      });

      // Simulate abort triggering the onabort callback
      // In real implementation, the event listener calls control.abort(), which might trigger onabort
      // Here we just simulate the flow
      controller.abort();

      // We need to manually trigger the abort logic in the mock if we want to test the event listener
      // But since we mock xmlHttpRequest, we can just verify the abort method was called if we trigger the signal

      // Wait for promise rejection
      await expect(promise).rejects.toThrow("Request was aborted");
    });

    it("should call abort on the request control when signal aborts", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        return {
          abort: () => {
            mockAbort();
            // Manually trigger onabort to settle the promise
            details.onabort();
          },
        };
      });

      const controller = new AbortController();
      const promise = service.get("https://api.example.com/abort", {
        signal: controller.signal,
      });

      controller.abort();

      expect(mockAbort).toHaveBeenCalled();

      await expect(promise).rejects.toThrow("Request was aborted");
    });
  });

  describe("Data Handling", () => {
    beforeEach(() => {
      service = HttpRequestService.getInstance();
    });

    it("should not stringify Blob/ArrayBuffer/FormData", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      const blob = new Blob(["test"]);
      await service.post("https://api.example.com/blob", blob);

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: blob,
        }),
      );
    });

    it("should parse response headers correctly", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({
          status: 200,
          response: {},
          responseHeaders: "X-Custom: Value\r\nContent-Type: text/plain",
        });
        return { abort: mockAbort };
      });

      const response = await service.get("https://api.example.com/headers");
      expect(response.headers).toEqual({
        "x-custom": "Value",
        "content-type": "text/plain",
      });
    });
  });
});
