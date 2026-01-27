import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

/**
 * Upload File DTO
 */
export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Target directory for the file',
    example: 'avatars',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  directory?: string;

  @ApiPropertyOptional({
    description: 'Make file publicly accessible',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  public?: boolean;
}

/**
 * File Response DTO
 */
export class FileResponseDto {
  @ApiProperty({ example: 'avatar.jpg' })
  originalName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  size!: number;

  @ApiProperty({ example: 'avatars/550e8400-e29b-41d4-a716-446655440000.jpg' })
  path!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/550e8400.jpg' })
  url?: string;

  @ApiPropertyOptional({ example: 'd41d8cd98f00b204e9800998ecf8427e' })
  etag?: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  uploadedAt!: string;
}

/**
 * Presigned URL Response DTO
 */
export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for upload',
    example: 'https://s3.amazonaws.com/bucket/key?X-Amz-...',
  })
  url!: string;

  @ApiProperty({
    description: 'File path/key',
    example: 'uploads/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  path!: string;

  @ApiPropertyOptional({
    description: 'Additional form fields for upload (S3 POST)',
  })
  fields?: Record<string, string>;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
  })
  expiresIn!: number;
}

/**
 * Request Presigned URL DTO
 */
export class RequestPresignedUrlDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @ApiPropertyOptional({
    description: 'Target directory',
    example: 'documents',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  directory?: string;
}

/**
 * Delete File DTO
 */
export class DeleteFileDto {
  @ApiProperty({
    description: 'File path to delete',
    example: 'avatars/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  @IsString()
  @MaxLength(500)
  path!: string;
}

/**
 * Delete Multiple Files DTO
 */
export class DeleteFilesDto {
  @ApiProperty({
    description: 'Array of file paths to delete',
    example: ['avatars/file1.jpg', 'avatars/file2.jpg'],
    type: [String],
  })
  @IsString({ each: true })
  paths!: string[];
}
