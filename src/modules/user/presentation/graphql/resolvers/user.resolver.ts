import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { UserType, PaginatedUsersType } from '../types';
import { UpdateUserInput } from '../inputs';
import { JwtAuthGuard } from '@shared/guards';
import { CurrentUser } from '@shared/decorators';
import type { JwtPayload } from '@modules/auth/infrastructure/services';
import { USER_REPOSITORY, type IUserRepository } from '@modules/user/domain/repositories';
import { PaginationQueryDto } from '@shared/dtos';
import type { User } from '@modules/user/domain/entities';

/**
 * User GraphQL Resolver
 */
@Resolver(() => UserType)
export class UserResolver {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Get current authenticated user
   */
  @Query(() => UserType, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload): Promise<UserType> {
    const foundUser = await this.userRepository.findById(user.sub);
    if (!foundUser) {
      throw new Error('User not found');
    }
    return this.mapToType(foundUser);
  }

  /**
   * Get user by ID
   */
  @Query(() => UserType, { name: 'user', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<UserType | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.mapToType(user) : null;
  }

  /**
   * Get all users with pagination
   */
  @Query(() => PaginatedUsersType, { name: 'users' })
  @UseGuards(JwtAuthGuard)
  async getUsers(
    @Args('pagination', { nullable: true }) pagination?: PaginationQueryDto,
  ): Promise<PaginatedUsersType> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;

    const result = await this.userRepository.findMany(
      {}, // empty filter
      { page, limit },
      pagination?.sortField
        ? { field: pagination.sortField, order: pagination.sortOrder || 'DESC' }
        : undefined,
    );

    return {
      data: result.data.map((u: User) => this.mapToType(u)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  /**
   * Update current user
   */
  @Mutation(() => UserType)
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserType> {
    const user = await this.userRepository.findById(currentUser.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // Update profile if firstName or lastName provided
    if (input.firstName || input.lastName) {
      user.updateProfile(input.firstName || user.firstName, input.lastName || user.lastName);
    }

    const updated = await this.userRepository.save(user);
    return this.mapToType(updated);
  }

  /**
   * Map domain entity to GraphQL type
   */
  private mapToType(user: User): UserType {
    return {
      id: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      isEmailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
