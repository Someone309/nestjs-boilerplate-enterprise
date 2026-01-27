import { Controller, Get, Query, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards';
import { Roles } from '@shared/decorators';
import { RolesGuard } from '@shared/guards/roles.guard';
import { AuditService } from '../../application/services/audit.service';
import type { AuditAction } from '../../domain/entities/audit-log.entity';
import { AuditLogResponseDto, AuditLogListResponseDto } from '../dtos/audit-log.dto';

/**
 * Audit Controller
 *
 * REST endpoints for querying audit logs.
 * Restricted to admin users.
 */
@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List audit logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved', type: AuditLogListResponseDto })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AuditLogListResponseDto> {
    const result = await this.auditService.findMany(
      {
        action,
        entityType,
        entityId,
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      { page: page ?? 1, limit: limit ?? 20 },
      { field: 'createdAt', order: 'DESC' },
    );

    return {
      data: result.data.map((log) => this.toDto(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  @Get('entity/:entityType/:entityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit history for an entity' })
  @ApiResponse({ status: 200, description: 'Entity audit history', type: AuditLogListResponseDto })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<AuditLogListResponseDto> {
    const result = await this.auditService.getEntityHistory(entityType, entityId, {
      page: page ?? 1,
      limit: limit ?? 20,
    });

    return {
      data: result.data.map((log) => this.toDto(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit history for a user' })
  @ApiResponse({ status: 200, description: 'User audit history', type: AuditLogListResponseDto })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<AuditLogListResponseDto> {
    const result = await this.auditService.getUserHistory(userId, {
      page: page ?? 1,
      limit: limit ?? 20,
    });

    return {
      data: result.data.map((log) => this.toDto(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  private toDto(
    log: import('../../domain/entities/audit-log.entity').AuditLog,
  ): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      tenantId: log.tenantId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      changedFields: log.getChangedFields(),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      createdAt: log.createdAt,
    };
  }
}
