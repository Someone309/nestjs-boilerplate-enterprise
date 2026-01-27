import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { FileController } from './presentation/controllers/file.controller';

/**
 * File Module
 *
 * Provides file upload, download, and management capabilities.
 *
 * Features:
 * - Single and multiple file uploads
 * - Presigned URLs for direct upload to S3
 * - File download and streaming
 * - File metadata retrieval
 * - File deletion
 */
@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('storage.upload.maxFileSize', 10485760),
          files: configService.get<number>('storage.upload.maxFiles', 10),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FileController],
})
export class FileModule {}
