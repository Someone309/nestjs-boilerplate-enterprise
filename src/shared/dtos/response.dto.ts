import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Delete Response DTO
 */
@ObjectType('DeleteResponse')
export class DeleteResponseDto {
  @ApiProperty({ description: 'Whether deletion was successful' })
  @Field()
  deleted!: boolean;

  @ApiProperty({ description: 'ID of deleted resource', format: 'uuid' })
  @Field()
  id!: string;

  @ApiProperty({ description: 'Timestamp when resource was deleted' })
  @Field()
  deletedAt!: string;
}

/**
 * Success Message Response DTO
 */
@ObjectType('MessageResponse')
export class MessageResponseDto {
  @ApiProperty({ description: 'Success message' })
  @Field()
  message!: string;
}

/**
 * API Error Structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * API Response Envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Success Response Helper
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Error Response Helper
 */
export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}
