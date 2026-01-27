import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus, type TenantSettings } from '../../domain/entities/tenant.entity';

/**
 * Tenant Settings Response DTO
 */
export class TenantSettingsResponseDto {
  @ApiPropertyOptional({ description: 'Maximum users allowed', example: 100 })
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Enabled features',
    type: [String],
    example: ['analytics', 'export'],
  })
  features?: string[];

  @ApiPropertyOptional({ description: 'Custom domain', example: 'app.acme.com' })
  customDomain?: string;

  @ApiPropertyOptional({
    description: 'Theme settings',
    example: { primaryColor: '#3B82F6', logo: 'https://example.com/logo.png' },
  })
  theme?: { primaryColor?: string; logo?: string };
}

/**
 * Tenant Response DTO
 *
 * Section 2.1: Presentation Layer - Response DTOs
 */
export class TenantResponseDto {
  @ApiProperty({
    description: 'Tenant unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Tenant organization name',
    example: 'Acme Corporation',
  })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'acme-corp',
  })
  slug!: string;

  @ApiProperty({
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  status!: TenantStatus;

  @ApiProperty({
    description: 'Tenant configuration settings',
    type: TenantSettingsResponseDto,
  })
  settings!: TenantSettings;

  @ApiPropertyOptional({
    description: 'Owner user ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Trial expiration date',
    example: '2026-02-15T00:00:00.000Z',
    format: 'date-time',
  })
  trialEndsAt?: string;

  @ApiProperty({
    description: 'Whether trial period has expired',
    example: false,
  })
  isTrialExpired!: boolean;

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
 * Tenant List Item DTO
 */
export class TenantListItemDto {
  @ApiProperty({
    description: 'Tenant unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Tenant organization name',
    example: 'Acme Corporation',
  })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'acme-corp',
  })
  slug!: string;

  @ApiProperty({
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  status!: TenantStatus;

  @ApiProperty({
    description: 'Whether trial period has expired',
    example: false,
  })
  isTrialExpired!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;
}
