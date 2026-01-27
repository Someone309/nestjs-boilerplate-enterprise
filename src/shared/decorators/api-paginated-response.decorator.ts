import { type Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from '@shared/dtos';

/**
 * Decorator for Swagger documentation of paginated responses
 * Following Section 11.2 response format
 *
 * @example
 * ```typescript
 * @ApiPaginatedResponse(UserListItemDto)
 * @Get('users')
 * getUsers(@Query() query: PaginationQueryDto) {
 *   return this.userService.findPaginated(query);
 * }
 * ```
 */
export function ApiPaginatedResponse(
  model: Type<unknown>,
  description = 'Paginated list response',
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiExtraModels(model, PaginationMetaDto),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: {
            type: 'object',
            properties: {
              pagination: {
                $ref: getSchemaPath(PaginationMetaDto),
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-01-15T10:30:00.000Z',
              },
              requestId: {
                type: 'string',
                example: 'req_abc123',
              },
            },
          },
        },
      },
    }),
  );
}
