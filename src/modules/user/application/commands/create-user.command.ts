import { BaseCommand } from '@core/application/base';

/**
 * Create User Command Input
 */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

/**
 * Create User Command
 *
 * Command to create a new user account.
 *
 * Section 2.2: Application Layer - Commands for write operations
 */
export class CreateUserCommand extends BaseCommand {
  public readonly input: CreateUserInput;

  constructor(
    input: CreateUserInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
