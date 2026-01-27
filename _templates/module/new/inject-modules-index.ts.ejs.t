---
to: src/modules/index.ts
inject: true
append: true
skip_if: <%= name %>
---
export * from './<%= name %>';
