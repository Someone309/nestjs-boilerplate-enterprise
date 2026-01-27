/* eslint-disable no-console */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../data-source';

/**
 * Database Seeder
 *
 * Seeds initial data for the application:
 * - Default tenant
 * - System roles (super-admin, admin, user)
 * - Admin user
 *
 * Usage: npx ts-node src/infrastructure/persistence/typeorm/seeds/seed.ts
 */
async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if default tenant already exists
    const existingTenant = (await queryRunner.query(
      `SELECT id FROM tenants WHERE slug = 'default' LIMIT 1`,
    )) as { id: string }[];

    if (existingTenant.length > 0) {
      console.log('⚠️  Default tenant already exists. Skipping seed.');
      await queryRunner.rollbackTransaction();
      await dataSource.destroy();
      return;
    }

    // Generate UUIDs
    const defaultTenantId = await generateUUID(queryRunner);
    const superAdminRoleId = await generateUUID(queryRunner);
    const adminRoleId = await generateUUID(queryRunner);
    const userRoleId = await generateUUID(queryRunner);
    const adminUserId = await generateUUID(queryRunner);

    // Create default tenant
    console.log('📦 Creating default tenant...');
    await queryRunner.query(
      `
      INSERT INTO tenants (id, name, slug, status, settings, limits)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        defaultTenantId,
        'Default Organization',
        'default',
        'active',
        JSON.stringify({
          timezone: 'UTC',
          locale: 'en-US',
          dateFormat: 'YYYY-MM-DD',
          features: {
            multiLanguage: true,
            advancedReporting: true,
          },
        }),
        JSON.stringify({
          maxUsers: 100,
          maxStorage: 10737418240, // 10GB
          maxApiCalls: 100000,
        }),
      ],
    );

    // Create system roles
    console.log('🔐 Creating system roles...');

    // Super Admin role
    await queryRunner.query(
      `
      INSERT INTO roles (id, name, description, tenant_id, is_system, is_default, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        superAdminRoleId,
        'super-admin',
        'Super Administrator with full system access',
        defaultTenantId,
        true,
        false,
        JSON.stringify(['tenants:*', 'users:*', 'roles:*', 'settings:*', 'audit:*', 'system:*']),
      ],
    );

    // Admin role
    await queryRunner.query(
      `
      INSERT INTO roles (id, name, description, tenant_id, is_system, is_default, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        adminRoleId,
        'admin',
        'Administrator with tenant-level access',
        defaultTenantId,
        true,
        false,
        JSON.stringify([
          'users:read',
          'users:create',
          'users:update',
          'users:delete',
          'roles:read',
          'roles:create',
          'roles:update',
          'roles:delete',
          'settings:read',
          'settings:update',
        ]),
      ],
    );

    // User role (default)
    await queryRunner.query(
      `
      INSERT INTO roles (id, name, description, tenant_id, is_system, is_default, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        userRoleId,
        'user',
        'Standard user with basic access',
        defaultTenantId,
        true,
        true,
        JSON.stringify(['users:read:own', 'profile:read', 'profile:update']),
      ],
    );

    // Create admin user
    console.log('👤 Creating admin user...');
    const passwordHash = await bcrypt.hash('Admin@123', 12);

    await queryRunner.query(
      `
      INSERT INTO users (id, email, password_hash, first_name, last_name, status, tenant_id, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        adminUserId,
        'admin@example.com',
        passwordHash,
        'System',
        'Admin',
        'active',
        defaultTenantId,
        true,
      ],
    );

    // Assign super-admin and admin roles to admin user
    await queryRunner.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [
      adminUserId,
      superAdminRoleId,
    ]);
    await queryRunner.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [
      adminUserId,
      adminRoleId,
    ]);

    // Update tenant owner
    await queryRunner.query(`UPDATE tenants SET owner_id = $1 WHERE id = $2`, [
      adminUserId,
      defaultTenantId,
    ]);

    await queryRunner.commitTransaction();

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📋 Created:');
    console.log(`   - Tenant: Default Organization (slug: default)`);
    console.log(`   - Roles: super-admin, admin, user`);
    console.log(`   - Admin User: admin@example.com / Admin@123`);
    console.log('');
    console.log('⚠️  Remember to change the admin password in production!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

async function generateUUID(queryRunner: {
  query: (sql: string) => Promise<{ uuid_generate_v4: string }[]>;
}): Promise<string> {
  const result = await queryRunner.query('SELECT uuid_generate_v4()');
  return result[0].uuid_generate_v4;
}

// Run the seeder
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
