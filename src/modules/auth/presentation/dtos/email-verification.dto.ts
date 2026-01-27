import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Verify Email DTO
 */
export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123token', description: 'Email verification token' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;
}

/**
 * Resend Verification Email DTO
 */
export class ResendVerificationDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

/**
 * Verify Email Response DTO
 */
export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 'Email verified successfully' })
  message!: string;
}

/**
 * Resend Verification Response DTO
 */
export class ResendVerificationResponseDto {
  @ApiProperty({ example: true })
  sent!: boolean;

  @ApiProperty({ example: 'Verification email sent successfully' })
  message!: string;
}
