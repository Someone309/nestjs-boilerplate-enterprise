import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tenant Theme Settings DTO
 */
export class TenantThemeDto {
  @ApiPropertyOptional({
    description: 'Primary brand color',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;
}

/**
 * Tenant Settings DTO
 */
export class TenantSettingsDto {
  @ApiPropertyOptional({
    description: 'Maximum number of users allowed',
    example: 100,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Enabled features for this tenant',
    type: [String],
    example: ['analytics', 'export', 'api-access'],
  })
  @IsOptional()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Custom domain for tenant',
    example: 'app.acme.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customDomain?: string;

  @ApiPropertyOptional({
    description: 'Custom theme settings',
    type: TenantThemeDto,
  })
  @IsOptional()
  @IsObject()
  theme?: TenantThemeDto;
}

/**
 * Create Tenant Request DTO
 *
 * Section 2.1: Presentation Layer - DTOs for data shape validation
 */
export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant organization name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'acme-corp',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tenant configuration settings',
    type: TenantSettingsDto,
  })
  @IsOptional()
  @IsObject()
  settings?: TenantSettingsDto;

  @ApiPropertyOptional({
    description: 'Number of trial days (0 for no trial)',
    example: 14,
    minimum: 0,
    maximum: 365,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  trialDays?: number;
}
