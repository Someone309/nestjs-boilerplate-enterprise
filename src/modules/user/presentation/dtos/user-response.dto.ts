import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../domain/enums/user-status.enum';

/**
 * User Response DTO
 *
 * Section 2.1: Presentation Layer - No domain entity exposure
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'User full name (firstName + lastName)',
    example: 'John Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Array of assigned role IDs',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  roleIds!: string[];

  @ApiProperty({
    description: 'Whether user email is verified',
    example: true,
  })
  emailVerified!: boolean;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2026-01-15T10:30:00.000Z',
    nullable: true,
  })
  lastLoginAt!: string | null;

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
 * User List Item Response DTO
 */
export class UserListItemDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Whether user email is verified',
    example: true,
  })
  emailVerified!: boolean;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2026-01-15T10:30:00.000Z',
    nullable: true,
  })
  lastLoginAt!: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;
}
