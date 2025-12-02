import { isDownloadUiBusy } from "@shared/state/ui/download-ui-state";
import { describe, expect, it } from "vitest";

describe("download UI busy state helper", () => {
  it("only reports busy when a download is processing", () => {
    expect(
      isDownloadUiBusy({ galleryLoading: true, downloadProcessing: false }),
    ).toBe(false);
    expect(
      isDownloadUiBusy({ galleryLoading: false, downloadProcessing: true }),
    ).toBe(true);
  });

  it("treats undefined flags as false", () => {
    expect(isDownloadUiBusy({})).toBe(false);
  });
});
