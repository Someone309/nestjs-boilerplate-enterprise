---
to: src/modules/<%= name %>/application/use-cases/index.ts
---
export * from './create-<%= name %>.use-case';
export * from './get-<%= name %>.use-case';
export * from './list-<%= name %>s.use-case';
export * from './update-<%= name %>.use-case';
export * from './delete-<%= name %>.use-case';
