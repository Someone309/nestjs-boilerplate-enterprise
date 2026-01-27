---
to: src/infrastructure/persistence/mongoose/repositories/index.ts
inject: true
append: true
skip_if: <%= name %>.repository
---
export * from './<%= name %>.repository';
