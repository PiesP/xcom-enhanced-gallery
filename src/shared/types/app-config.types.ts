/**
 * @fileoverview AppConfig type definition
 * @description Application configuration interface
 */

export interface AppConfig {
  readonly version: string;
  readonly isDevelopment: boolean;
  readonly debug: boolean;
  readonly autoStart: boolean;
}
