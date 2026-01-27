import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Role Request DTO
 *
 * Section 2.1: Presentation Layer - DTOs for data shape validation
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Updated role name',
    example: 'Senior Editor',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated role description',
    example: 'Can edit, publish, and manage other editors',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated array of permission strings',
    type: [String],
    example: ['content:read', 'content:write', 'content:publish', 'content:manage'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Whether this role is assigned to new users by default',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
