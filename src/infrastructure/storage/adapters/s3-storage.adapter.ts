import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import { generateUUID } from '@shared/utils';
import type { Readable } from 'stream';
import type {
  IStorageService,
  FileMetadata,
  UploadOptions,
  SignedUrlOptions,
  ListOptions,
  ListResult,
} from '@core/domain/ports/services';

/**
 * S3 Storage Adapter
 *
 * Section 2.4: Infrastructure Layer - Storage Adapter
 *
 * Stores files on Amazon S3 or compatible services (MinIO, DigitalOcean Spaces, etc.)
 */
@Injectable()
export class S3StorageAdapter implements IStorageService {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('storage.s3.region', 'us-east-1');
    this.bucket = this.configService.get<string>('storage.s3.bucket', '');
    this.publicUrl = this.configService.get<string>('storage.s3.publicUrl') || null;

    const endpoint = this.configService.get<string>('storage.s3.endpoint');
    const accessKeyId = this.configService.get<string>('storage.s3.accessKeyId', '');
    const secretAccessKey = this.configService.get<string>('storage.s3.secretAccessKey', '');

    this.client = new S3Client({
      region: this.region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint, // Required for MinIO and other S3-compatible services
    });
  }

  async upload(
    file: Buffer | NodeJS.ReadableStream,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    const directory = options.directory || '';
    const extension = path.extname(originalName);
    const filename = options.preserveOriginalName
      ? originalName
      : `${options.filename || generateUUID()}${extension}`;

    const key = directory ? `${directory}/${filename}` : filename;

    // Convert stream to buffer if needed
    let body: Buffer;
    if (Buffer.isBuffer(file)) {
      body = file;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of file as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      ContentDisposition: options.contentDisposition,
      CacheControl: options.cacheControl || 'max-age=31536000',
      ACL: options.public ? 'public-read' : 'private',
      Metadata: options.metadata,
    });

    const response = await this.client.send(command);

    const metadata: FileMetadata = {
      originalName,
      mimeType,
      size: body.length,
      path: key,
      url: this.getPublicUrl(key) || undefined,
      etag: response.ETag?.replace(/"/g, ''),
      uploadedAt: new Date(),
      metadata: options.metadata,
    };

    this.logger.debug(`File uploaded to S3: ${key}`);

    return metadata;
  }

  async download(filePath: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });

    const response = await this.client.send(command);
    const stream = response.Body as Readable;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
  }

  async getStream(filePath: string): Promise<NodeJS.ReadableStream> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });

    const response = await this.client.send(command);
    return response.Body as NodeJS.ReadableStream;
  }

  async delete(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });

    await this.client.send(command);
    this.logger.debug(`File deleted from S3: ${filePath}`);
  }

  async deleteMany(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: paths.map((key) => ({ Key: key })),
      },
    });

    await this.client.send(command);
    this.logger.debug(`${paths.length} files deleted from S3`);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if ((error as { name: string }).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });

      const response = await this.client.send(command);

      return {
        originalName: path.basename(filePath),
        mimeType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0,
        path: filePath,
        url: this.getPublicUrl(filePath) || undefined,
        etag: response.ETag?.replace(/"/g, ''),
        uploadedAt: response.LastModified || new Date(),
        metadata: response.Metadata,
      };
    } catch (error) {
      if ((error as { name: string }).name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  async getSignedUrl(filePath: string, options: SignedUrlOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      ResponseContentDisposition: options.responseContentDisposition,
      ResponseContentType: options.responseContentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600, // Default 1 hour
    });
  }

  async getUploadSignedUrl(
    filePath: string,
    mimeType: string,
    options: SignedUrlOptions = {},
  ): Promise<{ url: string; fields?: Record<string, string> }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });

    return { url };
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options.prefix,
      MaxKeys: options.limit || 100,
      ContinuationToken: options.cursor,
    });

    const response = await this.client.send(command);

    const files: FileMetadata[] = (response.Contents || []).map((item) => ({
      originalName: path.basename(item.Key || ''),
      mimeType: 'application/octet-stream',
      size: item.Size || 0,
      path: item.Key || '',
      url: this.getPublicUrl(item.Key || '') || undefined,
      etag: item.ETag?.replace(/"/g, ''),
      uploadedAt: item.LastModified || new Date(),
    }));

    return {
      files,
      cursor: response.NextContinuationToken,
      hasMore: response.IsTruncated || false,
    };
  }

  async copy(sourcePath: string, destinationPath: string): Promise<FileMetadata> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourcePath}`,
      Key: destinationPath,
    });

    await this.client.send(command);

    const metadata = await this.getMetadata(destinationPath);
    if (!metadata) {
      throw new Error('Failed to copy file');
    }

    return metadata;
  }

  async move(sourcePath: string, destinationPath: string): Promise<FileMetadata> {
    const metadata = await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
    return metadata;
  }

  getPublicUrl(filePath: string): string | null {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filePath}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
  }
}
