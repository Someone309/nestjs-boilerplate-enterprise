/**
 * Storage Service Interface (Port)
 *
 * Section 2.4: Infrastructure Layer - Ports & Adapters
 *
 * Defines the contract for file storage operations.
 * Implementations: LocalStorageAdapter, S3StorageAdapter
 */

/**
 * File metadata
 */
export interface FileMetadata {
  /** Original filename */
  originalName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Storage path/key */
  path: string;
  /** Public URL (if applicable) */
  url?: string;
  /** ETag/hash for integrity */
  etag?: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Upload options
 */
export interface UploadOptions {
  /** Target directory/prefix */
  directory?: string;
  /** Custom filename (without extension) */
  filename?: string;
  /** Preserve original filename */
  preserveOriginalName?: boolean;
  /** Make file publicly accessible */
  public?: boolean;
  /** Content disposition (inline/attachment) */
  contentDisposition?: 'inline' | 'attachment';
  /** Cache control header */
  cacheControl?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Signed URL options
 */
export interface SignedUrlOptions {
  /** URL expiration time in seconds */
  expiresIn?: number;
  /** Content disposition for download */
  responseContentDisposition?: string;
  /** Content type override */
  responseContentType?: string;
}

/**
 * List options
 */
export interface ListOptions {
  /** Directory prefix */
  prefix?: string;
  /** Maximum items to return */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Include file metadata */
  includeMetadata?: boolean;
}

/**
 * List result
 */
export interface ListResult {
  files: FileMetadata[];
  cursor?: string;
  hasMore: boolean;
}

/**
 * Storage Service Port
 */
export interface IStorageService {
  /**
   * Upload a file
   */
  upload(
    file: Buffer | NodeJS.ReadableStream,
    originalName: string,
    mimeType: string,
    options?: UploadOptions,
  ): Promise<FileMetadata>;

  /**
   * Download a file
   */
  download(path: string): Promise<Buffer>;

  /**
   * Get file as stream
   */
  getStream(path: string): Promise<NodeJS.ReadableStream>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Delete multiple files
   */
  deleteMany(paths: string[]): Promise<void>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(path: string): Promise<FileMetadata | null>;

  /**
   * Generate signed URL for temporary access
   */
  getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Generate signed URL for upload
   */
  getUploadSignedUrl(
    path: string,
    mimeType: string,
    options?: SignedUrlOptions,
  ): Promise<{ url: string; fields?: Record<string, string> }>;

  /**
   * List files in directory
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Copy file to new location
   */
  copy(sourcePath: string, destinationPath: string): Promise<FileMetadata>;

  /**
   * Move file to new location
   */
  move(sourcePath: string, destinationPath: string): Promise<FileMetadata>;

  /**
   * Get public URL (if supported)
   */
  getPublicUrl(path: string): string | null;
}

/**
 * Storage service injection token
 */
export const STORAGE_SERVICE = Symbol('IStorageService');
