import { BaseCommand } from '@core/application/base';

/**
 * Delete User Command Input
 */
export interface DeleteUserInput {
  targetUserId: string;
  hardDelete?: boolean;
}

/**
 * Delete User Command
 *
 * Command to delete a user account.
 *
 * Section 2.2: Application Layer - Commands for write operations
 */
export class DeleteUserCommand extends BaseCommand {
  public readonly input: DeleteUserInput;

  constructor(
    input: DeleteUserInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
