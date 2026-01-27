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
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { RoleListItemDto, type RoleResponseDto } from '../dtos/role-response.dto';
import {
  CreateRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
} from '../../application/use-cases';

/**
 * Role Filter Query DTO
 */
class RoleFilterQueryDto extends PaginationQueryDto {
  name?: string;
  isSystem?: string; // "true" or "false" as query string
}

/**
 * Role Controller
 *
 * Handles role management HTTP endpoints.
 *
 * Section 7.4: Security - Authorization with RBAC
 */
@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  /**
   * Create a new role
   * POST /roles
   */
  @Post()
  @Auth({ roles: ['admin'], permissions: ['roles:create'] })
  @CacheEvict({ key: 'roles:list:{tenant}', allEntries: true })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiStandardResponses()
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: RoleResponseDto }> {
    const result = await this.createRoleUseCase.executeInTransaction(
      {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions,
        isDefault: dto.isDefault,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const roleData = result.value;
    return {
      data: {
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        permissions: [...roleData.permissions],
        isSystem: roleData.isSystem,
        isDefault: roleData.isDefault,
        createdAt: roleData.createdAt.toISOString(),
        updatedAt: roleData.createdAt.toISOString(),
      },
    };
  }

  /**
   * Get role by ID
   * GET /roles/:id
   */
  @Get(':id')
  @Auth({ permissions: ['roles:read'] })
  @Cacheable({ key: 'role:{param.id}', ttl: 300 })
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiStandardResponses({ includeNotFound: true })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: RoleResponseDto }> {
    const result = await this.getRoleUseCase.execute(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const roleData = result.value;
    return {
      data: {
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        permissions: [...roleData.permissions],
        isSystem: roleData.isSystem,
        isDefault: roleData.isDefault,
        createdAt: roleData.createdAt.toISOString(),
        updatedAt: roleData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * List roles
   * GET /roles
   */
  @Get()
  @Auth({ permissions: ['roles:list'] })
  @Cacheable({ key: 'roles:list:{tenant}:{query.page}:{query.limit}', ttl: 60 })
  @ApiOperation({ summary: 'List roles with pagination' })
  @ApiPaginatedResponse(RoleListItemDto, 'Paginated list of roles')
  async findAll(
    @Query() query: RoleFilterQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: RoleListItemDto[]; meta: { pagination: unknown } }> {
    const result = await this.listRolesUseCase.execute(
      {
        page: query.page,
        limit: query.limit,
        sortField: query.sortField,
        sortOrder: query.sortOrder,
        name: query.name,
        isSystem: query.isSystem ? query.isSystem === 'true' : undefined,
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
      data: listData.data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissionCount: r.permissionCount,
        isSystem: r.isSystem,
        isDefault: r.isDefault,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        pagination: listData.pagination,
      },
    };
  }

  /**
   * Update role
   * PATCH /roles/:id
   */
  @Patch(':id')
  @Auth({ roles: ['admin'], permissions: ['roles:update'] })
  @CacheEvict({ keys: ['role:{param.id}', 'roles:list:{tenant}:*'], allEntries: true })
  @ApiOperation({ summary: 'Update role' })
  @ApiStandardResponses({ includeNotFound: true })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: RoleResponseDto }> {
    const result = await this.updateRoleUseCase.executeInTransaction(
      {
        id,
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions,
        isDefault: dto.isDefault,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const roleData = result.value;
    return {
      data: {
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        permissions: [...roleData.permissions],
        isSystem: roleData.isSystem,
        isDefault: roleData.isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: roleData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete role
   * DELETE /roles/:id
   */
  @Delete(':id')
  @Auth({ roles: ['admin'], permissions: ['roles:delete'] })
  @CacheEvict({ keys: ['role:{param.id}', 'roles:list:{tenant}:*'], allEntries: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete role' })
  @ApiStandardResponses({ includeNotFound: true })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: { deleted: boolean; id: string; deletedAt: string } }> {
    const result = await this.deleteRoleUseCase.executeInTransaction(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    return {
      data: {
        deleted: result.value.deleted,
        id: result.value.id,
        deletedAt: result.value.deletedAt.toISOString(),
      },
    };
  }
}
