---
to: src/infrastructure/persistence/mongoose/schemas/index.ts
inject: true
append: true
skip_if: <%= name %>.schema
---
export * from './<%= name %>.schema';
