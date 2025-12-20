export interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssRemoveComments: boolean;
  readonly cssVariableShortening: boolean;
  readonly cssValueMinify: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

export interface LicenseInfo {
  readonly fileName: string;
  readonly name: string;
  readonly text: string;
}

export interface UserscriptMeta {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly match: readonly string[];
  readonly grant: readonly string[];
  readonly connect: readonly string[];
  readonly runAt: 'document-start' | 'document-end' | 'document-idle';
  readonly supportURL: string;
  readonly homepageURL?: string;
  readonly downloadURL: string;
  readonly updateURL: string;
  readonly noframes: boolean;
  readonly icon?: string;
  readonly require?: readonly string[];
  readonly compatible?: Record<string, string>;
}

export type UserscriptBaseConfig = Omit<UserscriptMeta, 'version' | 'downloadURL' | 'updateURL'>;
