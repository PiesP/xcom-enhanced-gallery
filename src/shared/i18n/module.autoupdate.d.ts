export function resolveModuleKeys(): string[];
export function readExistingVersions(filePath: string): Record<string, number>;
export function buildModuleVersions(existing?: Record<string, number>): Record<string, number>;
export function formatModuleVersionsContent(map: Record<string, number>): string;
export function writeModuleVersions(filePath: string, map: Record<string, number>): void;
