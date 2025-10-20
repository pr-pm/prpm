# TypeScript Type Safety - Claude Code Skill

**Official PRPM Skill**

Eliminate TypeScript `any` types and enforce strict type safety through proper interfaces, type guards, and module augmentation.

## Installation

```bash
prpm install @prpm-official/typescript-type-safety
```

## What This Skill Does

- Identifies and eliminates all `any` types in your codebase
- Teaches proper TypeScript patterns (interfaces, type guards, generics)
- Shows how to augment third-party library types
- Provides type-safe error handling patterns
- Includes strict TSConfig settings

## When to Use

Use this skill when you encounter:
- `: any` in function parameters or return types
- `as any` type assertions
- TypeScript errors you're tempted to ignore with `@ts-ignore`
- External libraries without proper types
- Catch blocks with implicit `any`

## What You'll Learn

- **Type Safety Hierarchy**: What to prefer over `any`
- **Error Handling**: Type-safe error catching and processing
- **Unknown Data**: Validating JSON/API responses with type guards
- **Module Augmentation**: Extending third-party library types
- **Generic Constraints**: Writing reusable type-safe functions

## Quick Example

Before:
```typescript
catch (error: any) {
  console.error(error.message);
}
```

After:
```typescript
catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

## Real-World Impact

- ✅ Catch errors at compile time instead of runtime
- ✅ Better IntelliSense and autocomplete
- ✅ Confident refactoring with compiler help
- ✅ Self-documenting code through types
- ✅ Prevent production bugs from type mismatches

## Tags

`typescript` `type-safety` `code-quality` `development`

## License

MIT
