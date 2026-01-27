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
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { TenantListItemDto, type TenantResponseDto } from '../dtos/tenant-response.dto';
import { TenantStatus } from '../../domain/entities/tenant.entity';
import {
  CreateTenantUseCase,
  GetTenantUseCase,
  ListTenantsUseCase,
  UpdateTenantUseCase,
  DeleteTenantUseCase,
} from '../../application/use-cases';

/**
 * Tenant Filter Query DTO
 */
class TenantFilterQueryDto extends PaginationQueryDto {
  name?: string;
  status?: string;
}

/**
 * Tenant Controller
 *
 * Handles tenant management HTTP endpoints.
 *
 * Section 3.2: Feature Modules - TenantModule
 */
@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly deleteTenantUseCase: DeleteTenantUseCase,
  ) {}

  /**
   * Create a new tenant
   * POST /tenants
   */
  @Post()
  @Auth({ roles: ['super-admin'], permissions: ['tenants:create'] })
  @CacheEvict({ key: 'tenants:list:*', allEntries: true })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant (super-admin only)' })
  @ApiStandardResponses()
  async create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: TenantResponseDto }> {
    const result = await this.createTenantUseCase.executeInTransaction(
      {
        name: dto.name,
        slug: dto.slug,
        settings: dto.settings as Record<string, unknown> | undefined,
        trialDays: dto.trialDays,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
        isSuperAdmin: user.roles?.includes('super-admin'),
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const tenantData = result.value;
    return {
      data: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        status: tenantData.status,
        settings: tenantData.settings,
        trialEndsAt: tenantData.trialEndsAt?.toISOString(),
        isTrialExpired: false,
        createdAt: tenantData.createdAt.toISOString(),
        updatedAt: tenantData.createdAt.toISOString(),
      },
    };
  }

  /**
   * Get tenant by ID
   * GET /tenants/:id
   */
  @Get(':id')
  @Auth({ permissions: ['tenants:read'] })
  @Cacheable({ key: 'tenant:{param.id}', ttl: 300 })
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiStandardResponses({ includeNotFound: true })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: TenantResponseDto }> {
    const result = await this.getTenantUseCase.execute(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
        isSuperAdmin: user.roles?.includes('super-admin'),
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const tenantData = result.value;
    return {
      data: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        status: tenantData.status,
        settings: tenantData.settings,
        ownerId: tenantData.ownerId,
        trialEndsAt: tenantData.trialEndsAt?.toISOString(),
        isTrialExpired: tenantData.isTrialExpired,
        createdAt: tenantData.createdAt.toISOString(),
        updatedAt: tenantData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * List tenants
   * GET /tenants
   */
  @Get()
  @Auth({ roles: ['super-admin'], permissions: ['tenants:list'] })
  @Cacheable({ key: 'tenants:list:{query.page}:{query.limit}', ttl: 60 })
  @ApiOperation({ summary: 'List all tenants (super-admin only)' })
  @ApiPaginatedResponse(TenantListItemDto, 'Paginated list of tenants')
  async findAll(
    @Query() query: TenantFilterQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: TenantListItemDto[]; meta: { pagination: unknown } }> {
    const result = await this.listTenantsUseCase.execute(
      {
        page: query.page,
        limit: query.limit,
        sortField: query.sortField,
        sortOrder: query.sortOrder,
        name: query.name,
        status: query.status as TenantStatus | undefined,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
        isSuperAdmin: user.roles?.includes('super-admin'),
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const listData = result.value;
    return {
      data: listData.data.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        isTrialExpired: t.isTrialExpired,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: {
        pagination: listData.pagination,
      },
    };
  }

  /**
   * Update tenant
   * PATCH /tenants/:id
   */
  @Patch(':id')
  @Auth({ permissions: ['tenants:update'] })
  @CacheEvict({ keys: ['tenant:{param.id}', 'tenants:list:*'], allEntries: true })
  @ApiOperation({ summary: 'Update tenant' })
  @ApiStandardResponses({ includeNotFound: true })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: TenantResponseDto }> {
    const result = await this.updateTenantUseCase.executeInTransaction(
      {
        id,
        name: dto.name,
        settings: dto.settings,
        status: dto.status,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
        isSuperAdmin: user.roles?.includes('super-admin'),
      },
    );

    if (!result.success) {
      throw result.error;
    }

    const tenantData = result.value;
    return {
      data: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        status: tenantData.status,
        settings: tenantData.settings,
        isTrialExpired: false,
        createdAt: new Date().toISOString(),
        updatedAt: tenantData.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete tenant
   * DELETE /tenants/:id
   */
  @Delete(':id')
  @Auth({ roles: ['super-admin'], permissions: ['tenants:delete'] })
  @CacheEvict({ keys: ['tenant:{param.id}', 'tenants:list:*'], allEntries: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tenant (super-admin only)' })
  @ApiStandardResponses({ includeNotFound: true })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: { deleted: boolean; id: string; deletedAt: string } }> {
    const result = await this.deleteTenantUseCase.executeInTransaction(
      { id },
      {
        userId: user.sub,
        tenantId: user.tenantId,
        isSuperAdmin: user.roles?.includes('super-admin'),
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
