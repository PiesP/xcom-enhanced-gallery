export type SmartImageFitOptions = {
  maxWidth?: number;
  maxHeight?: number;
};

export default function useSmartImageFit(_options?: SmartImageFitOptions) {
  return {
    calculate: (width: number, height: number) => ({ width, height }),
    fitMode: 'contain' as const,
  };
}
