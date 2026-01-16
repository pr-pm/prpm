---
description: Registry API development patterns
paths:
  - "packages/registry/**/*.ts"
---

# Registry Package Rules

## Architecture

The registry is a Fastify-based REST API with:
- Routes in `src/routes/`
- Services for business logic in `src/services/`
- Drizzle ORM for database access

## Route Structure

```typescript
import { FastifyPluginAsync } from 'fastify';

export const myRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/endpoint', {
    schema: {
      params: ParamsSchema,
      response: { 200: ResponseSchema },
    },
  }, async (request, reply) => {
    const result = await myService.doSomething(request.params);
    return result;
  });
};
```

## Workspace Dependencies

Registry uses workspace references:

```json
{
  "dependencies": {
    "@pr-pm/converters": "*",
    "@pr-pm/types": "*"
  }
}
```

## Version Resolution

Always resolve "latest" to actual versions before returning:

```typescript
// WRONG
return { version: requestedVersion };  // Could be "latest"

// CORRECT
const resolved = requestedVersion === 'latest'
  ? await getLatestVersion(packageName)
  : requestedVersion;
return { version: resolved };
```

## Error Responses

Use consistent error format:

```typescript
reply.status(404).send({
  error: 'Not Found',
  message: `Package ${name} not found`,
  statusCode: 404,
});
```

## Database Operations

Use Drizzle ORM patterns:

```typescript
import { db } from '../db/index.js';
import { packages } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const pkg = await db.query.packages.findFirst({
  where: eq(packages.name, name),
  with: { versions: true },
});
```

## Authentication Middleware

Protect routes that modify data:

```typescript
fastify.post('/publish', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  // request.user is available here
});
```
