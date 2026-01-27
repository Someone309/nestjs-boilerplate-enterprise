import { BaseCommand } from '@core/application/base';

/**
 * Logout Command Input
 */
export interface LogoutInput {
  refreshToken?: string;
  allDevices?: boolean;
}

/**
 * Logout Command
 *
 * Command to log out a user.
 */
export class LogoutCommand extends BaseCommand {
  public readonly input: LogoutInput;

  constructor(
    input: LogoutInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
