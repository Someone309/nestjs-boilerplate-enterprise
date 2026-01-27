import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Change Password Request DTO
 *
 * Section 7.4: Security - Password Change
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentP@ss123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, must include uppercase, lowercase, number, special char)',
    example: 'NewP@ssword456',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;

  @ApiPropertyOptional({
    description: 'Revoke all other active sessions after password change',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  revokeAllSessions?: boolean;
}

/**
 * Change Password Response DTO
 */
export class ChangePasswordResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Password changed successfully' })
  message!: string;

  @ApiProperty({ example: false })
  sessionsRevoked!: boolean;
}
