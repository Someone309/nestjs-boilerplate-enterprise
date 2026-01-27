import { BaseCommand } from '@core/application/base';

/**
 * Update User Command Input
 */
export interface UpdateUserInput {
  targetUserId: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
}

/**
 * Update User Command
 *
 * Command to update user profile.
 *
 * Section 2.2: Application Layer - Commands for write operations
 */
export class UpdateUserCommand extends BaseCommand {
  public readonly input: UpdateUserInput;

  constructor(
    input: UpdateUserInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
