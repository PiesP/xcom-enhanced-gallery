/**
 * @fileoverview Media Extraction & Processing Services
 *
 * 주의: FilenameService는 `@shared/services/file-naming`으로 이동되었습니다.
 * 이 모듈은 미디어 DOM 추출 파이프라인에만 집중합니다.
 */

// MediaProcessor & Pipeline 모듈
// (참고: MediaProcessor는 사실상 미사용 상태. 테스트 목적으로만 유지)
export { MediaProcessor, processMedia } from './media-processor';
export { collectNodes, extractRawData, normalize, dedupe, validate } from './pipeline';

// 타입 정의
export type { MediaDescriptor, MediaType, MediaVariant, RawMediaCandidate, Result } from './types';
