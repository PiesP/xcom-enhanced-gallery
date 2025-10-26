/**
 * @fileoverview 기본 컴포넌트 Props 재내보내기
 * @description Phase 2-3A: 타입 통합으로 @shared/types/app.types에서 정의됨
 * @version 2.0.0 - 마이그레이션 완료
 * @deprecated 직접 import 대신 @shared/types/app.types 사용
 * @see {@link @shared/types/app.types} - 새로운 정의 위치
 */

export type {
  BaseComponentProps,
  InteractiveComponentProps,
  LoadingComponentProps,
  SizedComponentProps,
  VariantComponentProps,
  FormComponentProps,
  ContainerComponentProps,
  GalleryComponentProps,
} from '../../types/app.types';
