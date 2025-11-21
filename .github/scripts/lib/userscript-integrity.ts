const METADATA_PATTERN = /\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/;
const MERGE_CONFLICT_PATTERN = /^(?:<{7}|={7}|>{7})/m;

export type UserscriptValidationErrorCode =
  | 'missing-metadata-block'
  | 'empty-metadata-directives'
  | 'merge-conflict-marker';

export interface UserscriptValidationError {
  code: UserscriptValidationErrorCode;
  message: string;
}

export type UserscriptValidationReporter = (error: UserscriptValidationError) => void;

export function validateUserscriptContent(content: string): UserscriptValidationError[] {
  const errors: UserscriptValidationError[] = [];
  const metadataMatch = content.match(METADATA_PATTERN);

  if (!metadataMatch) {
    errors.push({
      code: 'missing-metadata-block',
      message: 'UserScript metadata block is missing.',
    });
  } else {
    const metadataBlock = metadataMatch[1] ?? '';
    const metadataLines = metadataBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('// @'));

    if (metadataLines.length === 0) {
      errors.push({
        code: 'empty-metadata-directives',
        message: 'UserScript metadata block contains no @ directives.',
      });
    }
  }

  if (MERGE_CONFLICT_PATTERN.test(content)) {
    errors.push({
      code: 'merge-conflict-marker',
      message: 'Build output still contains merge conflict markers.',
    });
  }

  return errors;
}

export function ensureUserscriptIntegrity(
  content: string,
  reporter?: UserscriptValidationReporter
): void {
  const errors = validateUserscriptContent(content);
  if (errors.length === 0) {
    return;
  }

  for (const error of errors) {
    reporter?.(error);
  }

  const summary = errors.map(error => error.message).join('\n');
  throw new Error(`Userscript validation failed:\n${summary}`);
}
