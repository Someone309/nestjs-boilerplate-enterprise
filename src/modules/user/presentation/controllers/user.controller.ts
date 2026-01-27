import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Auth,
  CurrentUser,
  ApiStandardResponses,
  ApiPaginatedResponse,
  Cacheable,
  CacheEvict,
} from '@shared/decorators';
import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';
import { PaginationQueryDto } from '@shared/dtos';
import type { Result } from '@core/application/base';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserListItemDto, type UserResponseDto } from '../dtos/user-response.dto';
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from '../../application/use-cases';
import type { CreateUserOutput } from '../../application/use-cases/create-user.use-case';
import type { GetUserOutput } from '../../application/use-cases/get-user.use-case';
import type { ListUsersOutput } from '../../application/use-cases/list-users.use-case';
import type { UpdateUserOutput } from '../../application/use-cases/update-user.use-case';
import type { DeleteUserOutput } from '../../application/use-cases/delete-user.use-case';

/**
 * User Filter Query DTO
 */
class UserFilterQueryDto extends PaginationQueryDto {
  status?: string;
  search?: string;
  roleId?: string;
}

/**
 * User Controller
 *
 * Handles user management HTTP endpoints.
 *
 * Section 2.1: Presentation Layer - Controllers for REST API endpoints
 */
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  /**
   * Create a new user
   * POST /users
   */
  @Post()
  @Auth({ roles: ['admin', 'user-manager'], permissions: ['users:create'] })
  @CacheEvict({ key: 'users:list:{tenant}', allEntries: true })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiStandardResponses()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: UserResponseDto }> {
    const result: Result<CreateUserOutput> = await this.createUserUseCase.executeInTransaction(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleIds: dto.roleIds,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const createdUser = result.value;
    return {
      data: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        fullName: `${createdUser.firstName} ${createdUser.lastName}`,
        status: createdUser.status,
        roleIds: [],
        emailVerified: false,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  @Get(':id')
  @Auth({ permissions: ['users:read'] })
  @Cacheable({ key: 'user:{param.id}', ttl: 300 })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiStandardResponses({ includeNotFound: true })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: UserResponseDto }> {
    const result: Result<GetUserOutput> = await this.getUserUseCase.execute(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const userData = result.value;
    return {
      data: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        status: userData.status,
        roleIds: [...userData.roleIds],
        emailVerified: userData.emailVerified,
        lastLoginAt: userData.lastLoginAt?.toISOString() ?? null,
        createdAt: userData.createdAt.toISOString(),
        updatedAt: userData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * List users
   * GET /users
   */
  @Get()
  @Auth({ permissions: ['users:list'] })
  @Cacheable({ key: 'users:list:{tenant}:{query.page}:{query.limit}', ttl: 60 })
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiPaginatedResponse(UserListItemDto, 'Paginated list of users')
  async findAll(
    @Query() query: UserFilterQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: UserListItemDto[]; meta: { pagination: ListUsersOutput['pagination'] } }> {
    const result: Result<ListUsersOutput> = await this.listUsersUseCase.execute(
      {
        page: query.page,
        limit: query.limit,
        sortField: query.sortField,
        sortOrder: query.sortOrder,
        status: query.status,
        search: query.search,
        roleId: query.roleId,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const listData = result.value;
    return {
      data: listData.data.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        status: u.status,
        emailVerified: u.emailVerified,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: {
        pagination: listData.pagination,
      },
    };
  }

  /**
   * Update user
   * PATCH /users/:id
   */
  @Patch(':id')
  @Auth({ permissions: ['users:update'] })
  @CacheEvict({ keys: ['user:{param.id}', 'users:list:{tenant}:*'], allEntries: true })
  @ApiOperation({ summary: 'Update user details' })
  @ApiStandardResponses({ includeNotFound: true })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: UserResponseDto }> {
    const result: Result<UpdateUserOutput> = await this.updateUserUseCase.executeInTransaction(
      {
        id,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleIds: dto.roleIds,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const userData = result.value;
    return {
      data: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        status: userData.status,
        roleIds: [...userData.roleIds],
        emailVerified: userData.emailVerified,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: userData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete user
   * DELETE /users/:id
   */
  @Delete(':id')
  @Auth({ roles: ['admin'], permissions: ['users:delete'] })
  @CacheEvict({ keys: ['user:{param.id}', 'users:list:{tenant}:*'], allEntries: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiStandardResponses({ includeNotFound: true })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: { deleted: boolean; id: string; deletedAt: string } }> {
    const result: Result<DeleteUserOutput> = await this.deleteUserUseCase.executeInTransaction(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const deleteData = result.value;
    return {
      data: {
        deleted: deleteData.deleted,
        id: deleteData.id,
        deletedAt: deleteData.deletedAt.toISOString(),
      },
    };
  }
}
