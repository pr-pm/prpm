---
description: Webapp development patterns (Next.js)
globs:
  - "packages/webapp/**/*.ts"
  - "packages/webapp/**/*.tsx"
---

# Webapp Package Rules

## Architecture

The webapp is a Next.js application with:
- App router in `src/app/`
- Components in `src/components/`
- Server actions for data mutations

## Component Structure

```typescript
// Client components
'use client';

import { useState } from 'react';

export function MyComponent({ prop }: { prop: string }) {
  const [state, setState] = useState('');
  return <div>{prop}</div>;
}
```

```typescript
// Server components (default)
import { db } from '@/lib/db';

export async function ServerComponent() {
  const data = await db.query.packages.findMany();
  return <div>{data.map(/* ... */)}</div>;
}
```

## Server Actions

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function updatePackage(formData: FormData) {
  // Validate input
  // Perform mutation
  revalidatePath('/packages');
}
```

## API Routes

For REST endpoints in the webapp:

```typescript
// app/api/packages/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const packages = await getPackages();
  return NextResponse.json(packages);
}
```

## Registry Client Usage

Use the shared registry client:

```typescript
import { getRegistryClient } from '@pr-pm/registry-client';

const client = getRegistryClient();
const pkg = await client.getPackage(name);
```

## Type Safety

Import types from the shared types package:

```typescript
import type { Package, PackageVersion } from '@pr-pm/types';
```

## Environment Variables

Access via process.env with validation:

```typescript
const registryUrl = process.env.REGISTRY_URL;
if (!registryUrl) {
  throw new Error('REGISTRY_URL is required');
}
```
