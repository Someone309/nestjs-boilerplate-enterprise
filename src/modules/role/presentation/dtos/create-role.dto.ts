import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Role Request DTO
 *
 * Section 2.1: Presentation Layer - DTOs for data shape validation
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name (must be unique within tenant)',
    example: 'Editor',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Can edit and publish content',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Array of permission strings',
    type: [String],
    example: ['content:read', 'content:write', 'content:publish'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiPropertyOptional({
    description: 'Whether this role is assigned to new users by default',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
