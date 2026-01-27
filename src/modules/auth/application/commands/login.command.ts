import { BaseCommand } from '@core/application/base';

/**
 * Login Command Input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Login Command
 *
 * Command to authenticate a user.
 */
export class LoginCommand extends BaseCommand {
  public readonly input: LoginInput;

  constructor(input: LoginInput, props?: { tenantId?: string; correlationId?: string }) {
    super(props);
    this.input = input;
  }
}
