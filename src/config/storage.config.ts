import { registerAs } from '@nestjs/config';

/**
 * Storage Configuration
 *
 * Section 7: Infrastructure Components - Storage
 *
 * Environment variables:
 * - STORAGE_DRIVER: 'local' | 's3' (default: 'local')
 * - STORAGE_LOCAL_PATH: Local storage path (default: './uploads')
 * - STORAGE_LOCAL_BASE_URL: Local storage URL prefix (default: '/uploads')
 * - STORAGE_S3_BUCKET: S3 bucket name
 * - STORAGE_S3_REGION: S3 region (default: 'us-east-1')
 * - STORAGE_S3_ACCESS_KEY_ID: AWS access key
 * - STORAGE_S3_SECRET_ACCESS_KEY: AWS secret key
 * - STORAGE_S3_ENDPOINT: Custom S3 endpoint (for MinIO, etc.)
 * - STORAGE_S3_PUBLIC_URL: Custom public URL for S3 files
 */
export const storageConfig = registerAs('storage', () => ({
  driver: (process.env.STORAGE_DRIVER as 'local' | 's3') || 'local',

  local: {
    path: process.env.STORAGE_LOCAL_PATH || './uploads',
    baseUrl: process.env.STORAGE_LOCAL_BASE_URL || '/uploads',
  },

  s3: {
    bucket: process.env.STORAGE_S3_BUCKET || '',
    region: process.env.STORAGE_S3_REGION || 'us-east-1',
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    publicUrl: process.env.STORAGE_S3_PUBLIC_URL,
  },

  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: (
      process.env.UPLOAD_ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/json'
    ).split(','),
    maxFiles: parseInt(process.env.UPLOAD_MAX_FILES || '10', 10),
  },
}));

export type StorageConfig = ReturnType<typeof storageConfig>;
