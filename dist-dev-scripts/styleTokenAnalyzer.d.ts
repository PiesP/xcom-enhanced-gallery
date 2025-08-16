export interface StyleTokenAnalysisOptions {
  definitionRoots: string[];
  componentFiles: string[];
  cwd?: string;
  tokenPrefixFilter?: string;
  /**
   * 정의 파일 내부에서의 var(--token) 참조도 사용으로 계산할지 여부
   * 기본값: true (alias / 계층형 토큰들이 UNUSED로 잘못 분류되는 것 방지)
   */
  includeDefinitionReferences?: boolean;
}
export interface StyleTokenAnalysisResult {
  definedTokens: Set<string>;
  referencedTokens: Set<string>;
  missingTokens: Set<string>;
  unusedTokens: Set<string>;
  meta: {
    definitionFiles: number;
    componentFiles: number;
  };
}
export declare function analyzeStyleTokens(
  opts: StyleTokenAnalysisOptions
): Promise<StyleTokenAnalysisResult>;
