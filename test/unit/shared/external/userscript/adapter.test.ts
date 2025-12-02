import { getUserscript } from "@shared/external/userscript/adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Userscript Adapter", () => {
  const mockGM = {
    GM_info: {
      script: {
        name: "Test Script",
        version: "1.0.0",
      },
      scriptHandler: "Tampermonkey",
    },
    GM_download: vi.fn(),
    GM_setValue: vi.fn(),
    GM_getValue: vi.fn(),
    GM_deleteValue: vi.fn(),
    GM_listValues: vi.fn(),
    GM_addStyle: vi.fn(),
    GM_xmlhttpRequest: vi.fn(),
    GM_cookie: {
      list: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.stubGlobal("GM_info", mockGM.GM_info);
    vi.stubGlobal("GM_download", mockGM.GM_download);
    vi.stubGlobal("GM_setValue", mockGM.GM_setValue);
    vi.stubGlobal("GM_getValue", mockGM.GM_getValue);
    vi.stubGlobal("GM_deleteValue", mockGM.GM_deleteValue);
    vi.stubGlobal("GM_listValues", mockGM.GM_listValues);
    vi.stubGlobal("GM_addStyle", mockGM.GM_addStyle);
    vi.stubGlobal("GM_xmlhttpRequest", mockGM.GM_xmlhttpRequest);
    vi.stubGlobal("GM_cookie", mockGM.GM_cookie);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should detect Tampermonkey manager", () => {
    const api = getUserscript();
    expect(api.manager).toBe("tampermonkey");
    expect(api.hasGM).toBe(true);
  });

  it("should return info", () => {
    const api = getUserscript();
    expect(api.info()).toEqual(mockGM.GM_info);
  });

  it("should call GM_download", async () => {
    const api = getUserscript();
    await api.download("url", "filename");
    expect(mockGM.GM_download).toHaveBeenCalledWith("url", "filename");
  });

  it("should call GM_setValue", async () => {
    const api = getUserscript();
    await api.setValue("key", "value");
    expect(mockGM.GM_setValue).toHaveBeenCalledWith("key", "value");
  });

  it("should call GM_getValue", async () => {
    mockGM.GM_getValue.mockReturnValue("value");
    const api = getUserscript();
    const value = await api.getValue("key", "default");
    expect(mockGM.GM_getValue).toHaveBeenCalledWith("key", "default");
    expect(value).toBe("value");
  });

  it("should call GM_deleteValue", async () => {
    const api = getUserscript();
    await api.deleteValue("key");
    expect(mockGM.GM_deleteValue).toHaveBeenCalledWith("key");
  });

  it("should call GM_listValues", async () => {
    mockGM.GM_listValues.mockReturnValue(["key"]);
    const api = getUserscript();
    const values = await api.listValues();
    expect(mockGM.GM_listValues).toHaveBeenCalled();
    expect(values).toEqual(["key"]);
  });

  it("should call GM_addStyle", () => {
    const style = document.createElement("style");
    mockGM.GM_addStyle.mockReturnValue(style);
    const api = getUserscript();
    const result = api.addStyle("css");
    expect(mockGM.GM_addStyle).toHaveBeenCalledWith("css");
    expect(result).toBe(style);
  });

  it("should call GM_xmlhttpRequest", () => {
    const details = { url: "url", method: "GET" } as any;
    const control = { abort: vi.fn() };
    mockGM.GM_xmlhttpRequest.mockReturnValue(control);
    const api = getUserscript();
    const result = api.xmlHttpRequest(details);
    expect(mockGM.GM_xmlhttpRequest).toHaveBeenCalledWith(details);
    expect(result).toBe(control);
  });

  it("should expose cookie API", () => {
    const api = getUserscript();
    expect(api.cookie).toBeDefined();
    expect(api.cookie?.list).toBeDefined();
  });

  it("should handle missing GM APIs", () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    expect(api.hasGM).toBe(false);
    expect(api.manager).toBe("unknown");
    expect(api.info()).toBeNull();
  });

  it("should throw error when calling missing GM_download", async () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    await expect(api.download("url", "filename")).rejects.toThrow(
      "GM_download not available",
    );
  });

  it("should throw error when calling missing GM_setValue", async () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    await expect(api.setValue("key", "value")).rejects.toThrow(
      "GM_setValue not available",
    );
  });

  it("should throw error when calling missing GM_getValue", async () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    await expect(api.getValue("key")).rejects.toThrow(
      "GM_getValue not available",
    );
  });

  it("should throw error when calling missing GM_deleteValue", async () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    await expect(api.deleteValue("key")).rejects.toThrow(
      "GM_deleteValue not available",
    );
  });

  it("should throw error when calling missing GM_listValues", async () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    await expect(api.listValues()).rejects.toThrow(
      "GM_listValues not available",
    );
  });

  it("should throw error when calling missing GM_addStyle", () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    expect(() => api.addStyle("css")).toThrow("GM_addStyle not available");
  });

  it("should throw error when calling missing GM_xmlhttpRequest", () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    expect(() => api.xmlHttpRequest({} as any)).toThrow(
      "GM_xmlhttpRequest not available",
    );
  });

  it("should detect Greasemonkey manager", () => {
    vi.stubGlobal("GM_info", {
      script: { name: "Test Script", version: "1.0.0" },
      scriptHandler: "Greasemonkey",
    });
    const api = getUserscript();
    expect(api.manager).toBe("greasemonkey");
  });

  it("should detect Violentmonkey manager", () => {
    vi.stubGlobal("GM_info", {
      script: { name: "Test Script", version: "1.0.0" },
      scriptHandler: "Violentmonkey",
    });
    const api = getUserscript();
    expect(api.manager).toBe("violentmonkey");
  });

  it("should return unknown for unrecognized script handler", () => {
    vi.stubGlobal("GM_info", {
      script: { name: "Test Script", version: "1.0.0" },
      scriptHandler: "SomeUnknownManager",
    });
    const api = getUserscript();
    expect(api.manager).toBe("unknown");
  });

  it("should return unknown manager when GM_info has no scriptHandler", () => {
    vi.stubGlobal("GM_info", { someOtherProperty: "value" });
    const api = getUserscript();
    expect(api.manager).toBe("unknown");
  });

  it("should return null from info() when GM_info is null", () => {
    vi.stubGlobal("GM_info", null);
    const api = getUserscript();
    expect(api.info()).toBeNull();
  });

  it("should return null from info() when GM_info is undefined", () => {
    vi.unstubAllGlobals();
    const api = getUserscript();
    expect(api.info()).toBeNull();
  });
});
