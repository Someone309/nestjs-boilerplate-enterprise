---
to: src/modules/<%= name %>/presentation/dtos/<%= name %>.dto.ts
---
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Create <%= h.changeCase.pascal(name) %> DTO
 */
export class Create<%= h.changeCase.pascal(name) %>Dto {
  @ApiProperty({ description: '<%= h.changeCase.pascal(name) %> name', example: 'My <%= h.changeCase.pascal(name) %>' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: '<%= h.changeCase.pascal(name) %> description' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

/**
 * Update <%= h.changeCase.pascal(name) %> DTO
 */
export class Update<%= h.changeCase.pascal(name) %>Dto {
  @ApiPropertyOptional({ description: '<%= h.changeCase.pascal(name) %> name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: '<%= h.changeCase.pascal(name) %> description' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

/**
 * <%= h.changeCase.pascal(name) %> Response DTO
 */
export class <%= h.changeCase.pascal(name) %>ResponseDto {
  @ApiProperty({ description: '<%= h.changeCase.pascal(name) %> ID' })
  id!: string;

  @ApiProperty({ description: '<%= h.changeCase.pascal(name) %> name' })
  name!: string;

  @ApiPropertyOptional({ description: '<%= h.changeCase.pascal(name) %> description' })
  description?: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId!: string;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Updated at' })
  updatedAt?: Date;
}

/**
 * <%= h.changeCase.pascal(name) %> List Item DTO
 */
export class <%= h.changeCase.pascal(name) %>ListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt!: Date;
}

/**
 * <%= h.changeCase.pascal(name) %> List Response DTO
 */
export class <%= h.changeCase.pascal(name) %>ListResponseDto {
  @ApiProperty({ type: [<%= h.changeCase.pascal(name) %>ListItemDto] })
  data!: <%= h.changeCase.pascal(name) %>ListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
