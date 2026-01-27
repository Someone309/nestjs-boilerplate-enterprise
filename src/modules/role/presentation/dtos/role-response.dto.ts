import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Role Response DTO
 *
 * Section 2.1: Presentation Layer - Response DTOs
 */
export class RoleResponseDto {
  @ApiProperty({
    description: 'Role unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Editor',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Can edit and publish content',
  })
  description?: string;

  @ApiProperty({
    description: 'Array of permission strings',
    type: [String],
    example: ['content:read', 'content:write', 'content:publish'],
  })
  permissions!: string[];

  @ApiProperty({
    description: 'Whether this is a system-defined role (cannot be modified)',
    example: false,
  })
  isSystem!: boolean;

  @ApiProperty({
    description: 'Whether this role is assigned to new users by default',
    example: false,
  })
  isDefault!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

/**
 * Role List Item DTO
 */
export class RoleListItemDto {
  @ApiProperty({
    description: 'Role unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Editor',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Can edit and publish content',
  })
  description?: string;

  @ApiProperty({
    description: 'Number of permissions assigned to this role',
    example: 5,
  })
  permissionCount!: number;

  @ApiProperty({
    description: 'Whether this is a system-defined role',
    example: false,
  })
  isSystem!: boolean;

  @ApiProperty({
    description: 'Whether this role is assigned to new users by default',
    example: false,
  })
  isDefault!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;
}
