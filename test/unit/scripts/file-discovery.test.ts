import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fast-glob", () => ({
  default: vi.fn(),
}));

import fg from "fast-glob";
import { chunkArray, discoverFiles } from "scripts/lib/file-discovery";

const fgMock = fg as unknown as Mock;

describe("file-discovery helpers", () => {
  beforeEach(() => {
    fgMock?.mockReset();
  });

  it("deduplicates and sorts discovered files", async () => {
    fgMock?.mockResolvedValueOnce([
      "/tmp/zeta.css",
      "/tmp/alpha.css",
      "/tmp/zeta.css",
    ]);

    const result = await discoverFiles("*.css");
    expect(result).toEqual(["/tmp/alpha.css", "/tmp/zeta.css"]);
    expect(fgMock).toHaveBeenCalledWith(
      ["*.css"],
      expect.objectContaining({ onlyFiles: true }),
    );
  });

  it("chunks arrays without dropping trailing items", () => {
    const items = [1, 2, 3, 4, 5];
    expect(chunkArray(items, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("throws when chunk size is invalid", () => {
    expect(() => chunkArray([1, 2], 0)).toThrow(
      "chunkSize must be greater than zero.",
    );
  });
});
