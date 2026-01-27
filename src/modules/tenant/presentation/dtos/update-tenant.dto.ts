import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '../../domain/entities/tenant.entity';
import { TenantSettingsDto } from './create-tenant.dto';

/**
 * Update Tenant Request DTO
 *
 * Section 2.1: Presentation Layer - DTOs for data shape validation
 */
export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Updated tenant name',
    example: 'Acme Industries',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated tenant settings (partial update)',
    type: TenantSettingsDto,
  })
  @IsOptional()
  @IsObject()
  settings?: Partial<TenantSettingsDto>;

  @ApiPropertyOptional({
    description: 'Updated tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
