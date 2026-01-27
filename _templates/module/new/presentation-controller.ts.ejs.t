---
to: src/modules/<%= name %>/presentation/controllers/<%= name %>.controller.ts
---
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard } from '@shared/guards';
import { CurrentUser } from '@shared/decorators';
import { Create<%= h.changeCase.pascal(name) %>UseCase } from '../../application/use-cases/create-<%= name %>.use-case';
import { Get<%= h.changeCase.pascal(name) %>UseCase } from '../../application/use-cases/get-<%= name %>.use-case';
import { List<%= h.changeCase.pascal(name) %>sUseCase } from '../../application/use-cases/list-<%= name %>s.use-case';
import { Update<%= h.changeCase.pascal(name) %>UseCase } from '../../application/use-cases/update-<%= name %>.use-case';
import { Delete<%= h.changeCase.pascal(name) %>UseCase } from '../../application/use-cases/delete-<%= name %>.use-case';
import {
  Create<%= h.changeCase.pascal(name) %>Dto,
  Update<%= h.changeCase.pascal(name) %>Dto,
  <%= h.changeCase.pascal(name) %>ResponseDto,
  <%= h.changeCase.pascal(name) %>ListResponseDto,
} from '../dtos/<%= name %>.dto';

/**
 * <%= h.changeCase.pascal(name) %> Controller
 *
 * REST API endpoints for <%= name %> management.
 */
@ApiTags('<%= h.changeCase.pascal(name) %>')
@ApiBearerAuth()
@Controller('<%= name %>s')
@UseGuards(JwtAuthGuard, TenantGuard)
export class <%= h.changeCase.pascal(name) %>Controller {
  constructor(
    private readonly create<%= h.changeCase.pascal(name) %>: Create<%= h.changeCase.pascal(name) %>UseCase,
    private readonly get<%= h.changeCase.pascal(name) %>: Get<%= h.changeCase.pascal(name) %>UseCase,
    private readonly list<%= h.changeCase.pascal(name) %>s: List<%= h.changeCase.pascal(name) %>sUseCase,
    private readonly update<%= h.changeCase.pascal(name) %>: Update<%= h.changeCase.pascal(name) %>UseCase,
    private readonly delete<%= h.changeCase.pascal(name) %>: Delete<%= h.changeCase.pascal(name) %>UseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new <%= name %>' })
  @ApiResponse({ status: 201, description: '<%= h.changeCase.pascal(name) %> created', type: <%= h.changeCase.pascal(name) %>ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() dto: Create<%= h.changeCase.pascal(name) %>Dto,
    @CurrentUser() user: { tenantId: string },
  ): Promise<<%= h.changeCase.pascal(name) %>ResponseDto> {
    const result = await this.create<%= h.changeCase.pascal(name) %>.execute({
      ...dto,
      tenantId: user.tenantId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all <%= name %>s' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '<%= h.changeCase.pascal(name) %> list', type: <%= h.changeCase.pascal(name) %>ListResponseDto })
  async findAll(
    @CurrentUser() user: { tenantId: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<<%= h.changeCase.pascal(name) %>ListResponseDto> {
    const result = await this.list<%= h.changeCase.pascal(name) %>s.execute({
      tenantId: user.tenantId,
      page,
      limit,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a <%= name %> by ID' })
  @ApiResponse({ status: 200, description: '<%= h.changeCase.pascal(name) %> found', type: <%= h.changeCase.pascal(name) %>ResponseDto })
  @ApiResponse({ status: 404, description: '<%= h.changeCase.pascal(name) %> not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { tenantId: string },
  ): Promise<<%= h.changeCase.pascal(name) %>ResponseDto> {
    const result = await this.get<%= h.changeCase.pascal(name) %>.execute({
      id,
      tenantId: user.tenantId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a <%= name %>' })
  @ApiResponse({ status: 200, description: '<%= h.changeCase.pascal(name) %> updated', type: <%= h.changeCase.pascal(name) %>ResponseDto })
  @ApiResponse({ status: 404, description: '<%= h.changeCase.pascal(name) %> not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: Update<%= h.changeCase.pascal(name) %>Dto,
    @CurrentUser() user: { tenantId: string },
  ): Promise<<%= h.changeCase.pascal(name) %>ResponseDto> {
    const result = await this.update<%= h.changeCase.pascal(name) %>.execute({
      id,
      tenantId: user.tenantId,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a <%= name %>' })
  @ApiResponse({ status: 204, description: '<%= h.changeCase.pascal(name) %> deleted' })
  @ApiResponse({ status: 404, description: '<%= h.changeCase.pascal(name) %> not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { tenantId: string },
  ): Promise<void> {
    const result = await this.delete<%= h.changeCase.pascal(name) %>.execute({
      id,
      tenantId: user.tenantId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }
  }
}
