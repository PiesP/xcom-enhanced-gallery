/**
 * @fileoverview Tests for download utilities
 */
import { ensureUniqueFilenameFactory } from "@shared/services/download/download-utils";
import { describe, expect, it } from "vitest";

describe("ensureUniqueFilenameFactory", () => {
    it("should return original filename if not used", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("image.jpg")).toBe("image.jpg");
        expect(getUniqueName("another.png")).toBe("another.png");
    });

    it("should add suffix for duplicate filenames", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("image.jpg")).toBe("image.jpg");
        expect(getUniqueName("image.jpg")).toBe("image-1.jpg");
        expect(getUniqueName("image.jpg")).toBe("image-2.jpg");
    });

    it("should handle files without extensions", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("README")).toBe("README");
        expect(getUniqueName("README")).toBe("README-1");
        expect(getUniqueName("README")).toBe("README-2");
    });

    it("should handle files with multiple dots in name", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("image.2024.01.jpg")).toBe("image.2024.01.jpg");
        expect(getUniqueName("image.2024.01.jpg")).toBe("image.2024.01-1.jpg");
    });

    it("should track different base names independently", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("a.jpg")).toBe("a.jpg");
        expect(getUniqueName("b.jpg")).toBe("b.jpg");
        expect(getUniqueName("a.jpg")).toBe("a-1.jpg");
        expect(getUniqueName("b.jpg")).toBe("b-1.jpg");
        expect(getUniqueName("a.jpg")).toBe("a-2.jpg");
    });

    it("should create independent factories", () => {
        const factory1 = ensureUniqueFilenameFactory();
        const factory2 = ensureUniqueFilenameFactory();

        expect(factory1("test.jpg")).toBe("test.jpg");
        expect(factory2("test.jpg")).toBe("test.jpg");
        expect(factory1("test.jpg")).toBe("test-1.jpg");
        expect(factory2("test.jpg")).toBe("test-1.jpg");
    });

    it("should handle empty extension correctly", () => {
        const getUniqueName = ensureUniqueFilenameFactory();

        expect(getUniqueName("file.")).toBe("file.");
        expect(getUniqueName("file.")).toBe("file-1.");
    });
});
