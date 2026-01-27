---
to: src/infrastructure/persistence/typeorm/migrations/<%= locals.timestamp = Date.now() %>-Create<%= h.changeCase.pascal(name) %>s.ts
---
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create <%= h.changeCase.pascal(name) %>s Table
 */
export class Create<%= h.changeCase.pascal(name) %>s<%= locals.timestamp %> implements MigrationInterface {
  name = 'Create<%= h.changeCase.pascal(name) %>s<%= locals.timestamp %>';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "<%= name %>s" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 0,
        "name" varchar(255) NOT NULL,
        "description" text,
        "tenant_id" uuid NOT NULL,
        CONSTRAINT "PK_<%= name %>s" PRIMARY KEY ("id"),
        CONSTRAINT "FK_<%= name %>s_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_<%= name %>s_tenant_id" ON "<%= name %>s" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_<%= name %>s_name_tenant_id" ON "<%= name %>s" ("name", "tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_<%= name %>s_name_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_<%= name %>s_tenant_id"`);
    await queryRunner.query(`DROP TABLE "<%= name %>s"`);
  }
}
