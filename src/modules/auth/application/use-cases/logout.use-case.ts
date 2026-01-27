import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { TokenBlacklistService } from '../../infrastructure/services/token-blacklist.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '@infrastructure/persistence/typeorm/repositories/refresh-token.repository';

/**
 * Logout Input
 */
export interface LogoutInput {
  accessToken: string;
  refreshToken?: string;
  logoutAll?: boolean; // Revoke all sessions
}

/**
 * Logout Output
 */
export interface LogoutOutput {
  success: boolean;
  message: string;
}

/**
 * Logout Use Case
 *
 * Invalidates user tokens and ends session.
 *
 * Section 12.5: Token Blacklist Implementation
 */
@Injectable()
export class LogoutUseCase extends BaseUseCase<LogoutInput, LogoutOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly jwtService: JwtService,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: LogoutInput,
    context?: UseCaseContext,
  ): Promise<Result<LogoutOutput>> {
    try {
      const userId = context?.userId;

      // Blacklist the access token
      const decoded = this.jwtService.decodeToken(input.accessToken);
      if (decoded?.jti && decoded?.exp) {
        await this.tokenBlacklistService.blacklist(decoded.jti, decoded.exp);
      }

      // Revoke refresh token if provided
      if (input.refreshToken) {
        const refreshTokenEntity = await this.refreshTokenRepository.findByToken(
          input.refreshToken,
        );
        if (refreshTokenEntity) {
          await this.refreshTokenRepository.revokeToken(refreshTokenEntity.id);
        }
      }

      // If logoutAll is true, revoke all user sessions
      if (input.logoutAll && userId) {
        await this.refreshTokenRepository.revokeAllUserTokens(userId);
        this.logger.log(`All sessions revoked for user: ${userId}`, 'LogoutUseCase');
      }

      return Result.ok({
        success: true,
        message: input.logoutAll ? 'All sessions have been logged out' : 'Successfully logged out',
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
