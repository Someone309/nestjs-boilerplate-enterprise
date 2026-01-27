---
to: src/infrastructure/persistence/typeorm/entities/index.ts
inject: true
append: true
skip_if: <%= name %>.entity
---
export * from './<%= name %>.entity';
