/**
 * Media Domain Models
 *
 * This module contains domain models for media handling in X.com Enhanced Gallery:
 * - Value Objects: MediaUrl, FileName, MediaType, MediaSize
 * - Entities: MediaItem
 * - Aggregates: MediaCollection
 * - Domain Errors: MediaDomainError variants
 */

import {
  AggregateRoot,
  DomainError,
  Entity,
  EntityId,
  EntityProps,
  Result,
  ValueObject,
} from '../base/DomainPrimitives';

// =============================================================================
// Domain Errors
// =============================================================================

export class MediaDomainError extends DomainError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, details);
    this.name = 'MediaDomainError';
  }
}

// =============================================================================
// Value Objects
// =============================================================================

/**
 * 미디어 URL을 나타내는 Value Object
 */
export class MediaUrl extends ValueObject<string> {
  protected override validate(value: string): void {
    super.validate(value);

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new MediaDomainError('MediaUrl: URL must be a non-empty string', 'INVALID_MEDIA_URL', {
        url: value,
      });
    }

    try {
      new URL(value);
    } catch {
      throw new MediaDomainError('MediaUrl: Invalid URL format', 'INVALID_URL_FORMAT', {
        url: value,
      });
    }
  }

  protected override transform(value: string): string {
    return value.trim();
  }

  public get domain(): string {
    return new URL(this.value).hostname;
  }

  public get pathname(): string {
    return new URL(this.value).pathname;
  }

  /**
   * Create MediaUrl from string
   */
  public static create(url: string): Result<MediaUrl> {
    try {
      return Result.success(new MediaUrl(url));
    } catch (error) {
      return Result.failure(error as MediaDomainError);
    }
  }
}

/**
 * 파일명을 나타내는 Value Object
 */
export class FileName extends ValueObject<string> {
  private static readonly INVALID_CHARS = /[<>:"/\\|?*]/g;
  private static readonly MAX_LENGTH = 255;

  protected override validate(value: string): void {
    super.validate(value);

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new MediaDomainError(
        'FileName: File name must be a non-empty string',
        'INVALID_FILE_NAME',
        { fileName: value }
      );
    }

    if (value.length > FileName.MAX_LENGTH) {
      throw new MediaDomainError(
        `FileName: File name must be less than ${FileName.MAX_LENGTH} characters`,
        'FILE_NAME_TOO_LONG',
        { fileName: value, maxLength: FileName.MAX_LENGTH }
      );
    }

    if (FileName.INVALID_CHARS.test(value)) {
      throw new MediaDomainError(
        'FileName: File name contains invalid characters',
        'INVALID_FILE_NAME_CHARS',
        { fileName: value }
      );
    }
  }

  protected override transform(value: string): string {
    return value.trim().replace(FileName.INVALID_CHARS, '_');
  }

  public get extension(): string {
    const lastDot = this.value.lastIndexOf('.');
    return lastDot >= 0 ? this.value.substring(lastDot + 1).toLowerCase() : '';
  }

  public get nameWithoutExtension(): string {
    const lastDot = this.value.lastIndexOf('.');
    return lastDot >= 0 ? this.value.substring(0, lastDot) : this.value;
  }

  /**
   * Create FileName from string
   */
  public static create(fileName: string): Result<FileName> {
    try {
      return Result.success(new FileName(fileName));
    } catch (error) {
      return Result.failure(error as MediaDomainError);
    }
  }
}

/**
 * 미디어 타입을 나타내는 Enum과 Value Object
 */
export enum MediaTypeEnum {
  IMAGE = 'image',
  VIDEO = 'video',
  GIF = 'gif',
  UNKNOWN = 'unknown',
}

export class MediaType extends ValueObject<MediaTypeEnum> {
  private static readonly EXTENSION_MAP: Record<string, MediaTypeEnum> = {
    jpg: MediaTypeEnum.IMAGE,
    jpeg: MediaTypeEnum.IMAGE,
    png: MediaTypeEnum.IMAGE,
    webp: MediaTypeEnum.IMAGE,
    mp4: MediaTypeEnum.VIDEO,
    webm: MediaTypeEnum.VIDEO,
    mov: MediaTypeEnum.VIDEO,
    gif: MediaTypeEnum.GIF,
  };

  protected override validate(value: MediaTypeEnum): void {
    super.validate(value);

    if (!Object.values(MediaTypeEnum).includes(value)) {
      throw new MediaDomainError('MediaType: Invalid media type', 'INVALID_MEDIA_TYPE', {
        mediaType: value,
      });
    }
  }

  public get isImage(): boolean {
    return this.value === MediaTypeEnum.IMAGE;
  }

  public get isVideo(): boolean {
    return this.value === MediaTypeEnum.VIDEO;
  }

  public get isGif(): boolean {
    return this.value === MediaTypeEnum.GIF;
  }

  public get isAnimated(): boolean {
    return this.value === MediaTypeEnum.VIDEO || this.value === MediaTypeEnum.GIF;
  }

  /**
   * Create MediaType from file extension
   */
  public static fromExtension(extension: string): MediaType {
    const normalizedExt = extension.toLowerCase().replace('.', '');
    const mediaType = MediaType.EXTENSION_MAP[normalizedExt] ?? MediaTypeEnum.UNKNOWN;
    return new MediaType(mediaType);
  }

  /**
   * Create MediaType from string
   */
  public static create(type: string): Result<MediaType> {
    try {
      const mediaType = type as MediaTypeEnum;
      return Result.success(new MediaType(mediaType));
    } catch (error) {
      return Result.failure(error as MediaDomainError);
    }
  }
}

/**
 * 미디어 크기를 나타내는 인터페이스와 Value Object
 */
export interface MediaDimensions {
  width: number;
  height: number;
}

export class MediaSize extends ValueObject<MediaDimensions> {
  protected override validate(value: MediaDimensions): void {
    super.validate(value);

    if (typeof value !== 'object' || value === null) {
      throw new MediaDomainError('MediaSize: Size must be an object', 'INVALID_MEDIA_SIZE', {
        size: value,
      });
    }

    if (typeof value.width !== 'number' || typeof value.height !== 'number') {
      throw new MediaDomainError(
        'MediaSize: Width and height must be numbers',
        'INVALID_SIZE_DIMENSIONS',
        { size: value }
      );
    }

    if (value.width <= 0 || value.height <= 0) {
      throw new MediaDomainError(
        'MediaSize: Width and height must be positive',
        'INVALID_SIZE_VALUES',
        { size: value }
      );
    }
  }

  public get width(): number {
    return this.value.width;
  }

  public get height(): number {
    return this.value.height;
  }

  public get aspectRatio(): number {
    return this.width / this.height;
  }

  public get isLandscape(): boolean {
    return this.width > this.height;
  }

  public get isPortrait(): boolean {
    return this.height > this.width;
  }

  public get isSquare(): boolean {
    return this.width === this.height;
  }

  /**
   * Create MediaSize from dimensions
   */
  public static create(width: number, height: number): Result<MediaSize> {
    try {
      return Result.success(new MediaSize({ width, height }));
    } catch (error) {
      return Result.failure(error as MediaDomainError);
    }
  }
}

// =============================================================================
// Entities
// =============================================================================

/**
 * MediaItem Entity Properties
 */
export interface MediaItemProps extends EntityProps {
  url: MediaUrl;
  fileName: FileName;
  mediaType: MediaType;
  size?: MediaSize;
  fileSize?: number;
  downloadUrl?: MediaUrl;
  thumbnailUrl?: MediaUrl;
}

/**
 * 개별 미디어 아이템을 나타내는 Entity
 */
export class MediaItem extends Entity<MediaItemProps> {
  private constructor(props: MediaItemProps, id?: EntityId) {
    super(props, id);
  }

  /**
   * Create MediaItem
   */
  public static create(
    props: Omit<MediaItemProps, 'id' | 'createdAt' | 'updatedAt'>,
    id?: EntityId
  ): Result<MediaItem> {
    try {
      const now = new Date();
      const entityProps: MediaItemProps = {
        ...props,
        id: id ?? crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      return Result.success(new MediaItem(entityProps, id));
    } catch (error) {
      return Result.failure(
        new MediaDomainError('Failed to create MediaItem', 'MEDIA_ITEM_CREATION_FAILED', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  // Getters
  public get url(): MediaUrl {
    return this.props.url;
  }

  public get fileName(): FileName {
    return this.props.fileName;
  }

  public get mediaType(): MediaType {
    return this.props.mediaType;
  }

  public get size(): MediaSize | undefined {
    return this.props.size;
  }

  public get fileSize(): number | undefined {
    return this.props.fileSize;
  }

  public get downloadUrl(): MediaUrl | undefined {
    return this.props.downloadUrl;
  }

  public get thumbnailUrl(): MediaUrl | undefined {
    return this.props.thumbnailUrl;
  }

  public override get createdAt(): Date {
    return this.props.createdAt;
  }

  public override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  public updateSize(size: MediaSize): void {
    this.updateProps({ size });
  }

  public updateFileSize(fileSize: number): void {
    if (fileSize <= 0) {
      throw new MediaDomainError('File size must be positive', 'INVALID_FILE_SIZE', { fileSize });
    }
    this.updateProps({ fileSize });
  }

  public setDownloadUrl(downloadUrl: MediaUrl): void {
    this.updateProps({ downloadUrl });
  }

  public setThumbnailUrl(thumbnailUrl: MediaUrl): void {
    this.updateProps({ thumbnailUrl });
  }

  public updateFileName(fileName: FileName): void {
    this.updateProps({ fileName });
  }

  public isDownloadable(): boolean {
    return this.props.downloadUrl !== undefined;
  }

  public hasThumbnail(): boolean {
    return this.props.thumbnailUrl !== undefined;
  }
}

// =============================================================================
// Aggregates
// =============================================================================

/**
 * MediaCollection Aggregate Properties
 */
export interface MediaCollectionProps extends EntityProps {
  name: string;
  description?: string | undefined;
  items: MediaItem[];
}

/**
 * 미디어 컬렉션을 나타내는 Aggregate Root
 */
export class MediaCollection extends AggregateRoot<MediaCollectionProps> {
  private constructor(props: MediaCollectionProps, id?: EntityId) {
    super(props, id);
  }

  /**
   * Create MediaCollection
   */
  public static create(name: string, description?: string, id?: EntityId): Result<MediaCollection> {
    try {
      const now = new Date();
      const props: MediaCollectionProps = {
        id: id ?? crypto.randomUUID(),
        name: name.trim(),
        description: description?.trim(),
        items: [],
        createdAt: now,
        updatedAt: now,
      };

      const collection = new MediaCollection(props, id);

      collection.addDomainEvent({
        eventId: crypto.randomUUID(),
        eventType: 'MediaCollectionCreated',
        data: { collectionId: collection.id, name },
      });

      return Result.success(collection);
    } catch (error) {
      return Result.failure(
        new MediaDomainError(
          'Failed to create MediaCollection',
          'MEDIA_COLLECTION_CREATION_FAILED',
          { error: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  }

  // Getters
  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get items(): readonly MediaItem[] {
    return [...this.props.items];
  }

  public get itemCount(): number {
    return this.props.items.length;
  }

  public override get createdAt(): Date {
    return this.props.createdAt;
  }

  public override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  public addItem(item: MediaItem): void {
    if (this.props.items.some(existingItem => existingItem.equals(item))) {
      throw new MediaDomainError('Item already exists in collection', 'DUPLICATE_MEDIA_ITEM', {
        itemId: item.id,
        collectionId: this.id,
      });
    }

    this.updateProps({
      items: [...this.props.items, item],
    });

    this.addDomainEvent({
      eventId: crypto.randomUUID(),
      eventType: 'MediaItemAdded',
      data: { collectionId: this.id, itemId: item.id },
    });
  }

  public removeItem(itemId: EntityId): void {
    const index = this.props.items.findIndex(item => item.id === itemId);

    if (index === -1) {
      throw new MediaDomainError('Item not found in collection', 'MEDIA_ITEM_NOT_FOUND', {
        itemId,
        collectionId: this.id,
      });
    }

    const newItems = [...this.props.items];
    newItems.splice(index, 1);

    this.updateProps({ items: newItems });

    this.addDomainEvent({
      eventId: crypto.randomUUID(),
      eventType: 'MediaItemRemoved',
      data: { collectionId: this.id, itemId },
    });
  }

  public findItem(itemId: EntityId): MediaItem | undefined {
    return this.props.items.find(item => item.id === itemId);
  }

  public getItemsByType(mediaType: MediaType): MediaItem[] {
    return this.props.items.filter(item => item.mediaType.equals(mediaType));
  }

  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new MediaDomainError('Collection name cannot be empty', 'INVALID_COLLECTION_NAME', {
        name,
      });
    }

    this.updateProps({ name: name.trim() });

    this.addDomainEvent({
      eventId: crypto.randomUUID(),
      eventType: 'MediaCollectionRenamed',
      data: { collectionId: this.id, oldName: this.props.name, newName: name },
    });
  }

  public updateDescription(description?: string): void {
    this.updateProps({ description: description?.trim() });
  }

  public isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  public clear(): void {
    this.updateProps({ items: [] });

    this.addDomainEvent({
      eventId: crypto.randomUUID(),
      eventType: 'MediaCollectionCleared',
      data: { collectionId: this.id },
    });
  }
}
