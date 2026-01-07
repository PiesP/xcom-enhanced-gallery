type UniqueFilenameFactory = (desired: string) => string;

export function ensureUniqueFilenameFactory(): UniqueFilenameFactory {
  const usedNames = new Set<string>();
  const baseCounts = new Map<string, number>();

  return (desired: string): string => {
    if (!usedNames.has(desired)) {
      usedNames.add(desired);
      baseCounts.set(desired, 0);
      return desired;
    }

    const lastDot = desired.lastIndexOf('.');
    const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
    const ext = lastDot > 0 ? desired.slice(lastDot) : '';
    const baseKey = desired;
    let count = baseCounts.get(baseKey) ?? 0;
    let candidate = '';

    do {
      count += 1;
      candidate = `${name}-${count}${ext}`;
    } while (usedNames.has(candidate));

    baseCounts.set(baseKey, count);
    usedNames.add(candidate);
    return candidate;
  };
}
