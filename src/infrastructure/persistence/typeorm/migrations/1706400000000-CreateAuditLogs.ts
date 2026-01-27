import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Migration: Create Audit Logs Table
 *
 * Creates the audit_logs table for compliance and debugging.
 * Includes indexes optimized for common query patterns.
 */
export class CreateAuditLogs1706400000000 implements MigrationInterface {
  name = 'CreateAuditLogs1706400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Index for action queries
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action',
        columnNames: ['action'],
      }),
    );

    // Composite index for entity history queries
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entity_type_entity_id_created_at',
        columnNames: ['entity_type', 'entity_id', 'created_at'],
      }),
    );

    // Index for user activity queries
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_user_id_created_at',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // Index for tenant-scoped queries
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_tenant_id_created_at',
        columnNames: ['tenant_id', 'created_at'],
      }),
    );

    // Index for time-based queries and cleanup
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_created_at');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_tenant_id_created_at');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_user_id_created_at');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_entity_type_entity_id_created_at');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_action');
    await queryRunner.dropTable('audit_logs');
  }
}
