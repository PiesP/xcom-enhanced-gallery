export function ensureUniqueFilenameFactory() {
  const usedNames = new Set<string>();
  const baseCounts = new Map<string, number>();
  return (desired: string): string => {
    if (!usedNames.has(desired)) {
      usedNames.add(desired);
      baseCounts.set(desired, 0);
      return desired;
    }
    const lastDot = desired.lastIndexOf(".");
    const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
    const ext = lastDot > 0 ? desired.slice(lastDot) : "";
    const baseKey = desired;
    let count = baseCounts.get(baseKey) ?? 0;
    while (true) {
      count += 1;
      const candidate = `${name}-${count}${ext}`;
      if (!usedNames.has(candidate)) {
        baseCounts.set(baseKey, count);
        usedNames.add(candidate);
        return candidate;
      }
    }
  };
}
