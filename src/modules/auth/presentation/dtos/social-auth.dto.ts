import { ApiProperty } from '@nestjs/swagger';

/**
 * Social Auth Response DTO
 */
export class SocialAuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...' })
  refreshToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: false, description: 'True if this is a new user' })
  isNewUser!: boolean;
}

/**
 * Social Auth Error DTO
 */
export class SocialAuthErrorDto {
  @ApiProperty({ example: 'social_auth_failed' })
  error!: string;

  @ApiProperty({ example: 'Failed to authenticate with Google' })
  message!: string;
}

/**
 * Social Provider Info DTO
 */
export class SocialProviderInfoDto {
  @ApiProperty({ example: 'google' })
  provider!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: '/auth/google' })
  authUrl!: string;
}

/**
 * Available Providers Response DTO
 */
export class AvailableProvidersResponseDto {
  @ApiProperty({ type: [SocialProviderInfoDto] })
  providers!: SocialProviderInfoDto[];
}
