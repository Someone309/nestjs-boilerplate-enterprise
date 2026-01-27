---
to: src/infrastructure/persistence/typeorm/repositories/index.ts
inject: true
append: true
skip_if: <%= name %>.repository
---
export * from './<%= name %>.repository';
