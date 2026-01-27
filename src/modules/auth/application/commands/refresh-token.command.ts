import { BaseCommand } from '@core/application/base';

/**
 * Refresh Token Command Input
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

/**
 * Refresh Token Command
 *
 * Command to refresh access token.
 */
export class RefreshTokenCommand extends BaseCommand {
  public readonly input: RefreshTokenInput;

  constructor(input: RefreshTokenInput, props?: { tenantId?: string; correlationId?: string }) {
    super(props);
    this.input = input;
  }
}
