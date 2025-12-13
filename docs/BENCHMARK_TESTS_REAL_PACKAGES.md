# AI Assistant Benchmark Tests - Real PRPM Packages

**Specific test cases mapped to actual PRPM packages in the registry**

This document contains the exact prompts and evaluation criteria for benchmarking AI assistants using real PRPM packages.

## Test Suite Overview

- **Total tests**: 15 tests across 5 categories
- **Packages tested**: 9 real PRPM packages
- **Time per assistant**: ~5 hours (20 min per test)
- **Output**: Data for public leaderboard + blog content

---

## 🔧 CODE GENERATION (6 tests)

### Test 1: React Custom Hook (react-best-practices)
**Package**: `react-best-practices`
**Difficulty**: 4/10
**Category**: code-generation

**Prompt**:
```
Using React best practices, create a custom hook called useFetch that:
- Accepts a URL string as parameter
- Returns an object with { data, loading, error, refetch }
- Handles loading states properly (starts as true, false when complete)
- Handles error states (network errors, non-200 responses)
- Cleans up on unmount to prevent memory leaks
- Uses TypeScript with proper generic types for the data
- Includes a refetch function to re-trigger the fetch
- Handles race conditions if URL changes while fetching

Example usage:
const { data, loading, error, refetch } = useFetch<User>('/api/user/123');
```

**Success Criteria**:
- ✅ Hook returns correct shape { data, loading, error, refetch }
- ✅ Loading state managed correctly
- ✅ Error handling for network and HTTP errors
- ✅ Cleanup function prevents memory leaks
- ✅ TypeScript generic types work properly
- ✅ Handles race conditions (AbortController or ref)
- ✅ No infinite loops
- ✅ Follows React hooks naming (use...)
- ✅ Dependencies array correct in useEffect

**Scoring**:
- Correctness: Does it work? Test with real fetch
- Quality: TypeScript types, no `any`, clean code
- Context: Follows React best practices from package
- Speed: Response time

---

### Test 2: Next.js API Route (nextjs-pro)
**Package**: `nextjs-pro` collection
**Difficulty**: 5/10
**Category**: code-generation

**Prompt**:
```
Create a Next.js App Router API route at /app/api/users/[id]/route.ts that:
- Handles GET requests to fetch a single user by ID
- Validates that ID is a valid UUID
- Returns 400 if ID is invalid
- Returns 404 if user not found
- Returns 500 for database errors
- Uses proper Next.js 14 App Router patterns
- Implements TypeScript with proper types
- Uses Zod for request validation
- Includes error logging
- Returns JSON with proper status codes

Assume database access via: getUserById(id: string): Promise<User | null>
```

**Success Criteria**:
- ✅ Uses Next.js App Router pattern (export async function GET)
- ✅ Proper TypeScript types for request/response
- ✅ UUID validation (Zod or regex)
- ✅ Correct HTTP status codes (200, 400, 404, 500)
- ✅ Error handling with try/catch
- ✅ JSON responses formatted correctly
- ✅ Type-safe database call
- ✅ Logging for errors

---

### Test 3: TypeScript Utility Function (typescript-strict)
**Package**: `typescript-strict`
**Difficulty**: 6/10
**Category**: code-generation

**Prompt**:
```
Write a TypeScript utility function deepMerge that:
- Accepts two objects of any shape
- Recursively merges them (second object overrides first)
- Handles nested objects properly
- Handles arrays by concatenating them
- Uses strict TypeScript (no any, no as, proper generics)
- Returns a properly typed result
- Handles edge cases (null, undefined, primitives)
- Includes JSDoc comments
- Includes type tests to prove it works

Example:
const a = { x: 1, y: { z: 2 } };
const b = { y: { w: 3 }, k: 4 };
const result = deepMerge(a, b);
// Result: { x: 1, y: { z: 2, w: 3 }, k: 4 }
```

**Success Criteria**:
- ✅ Proper TypeScript generics
- ✅ No `any`, `as`, or type assertions
- ✅ Handles nested objects recursively
- ✅ Handles arrays correctly
- ✅ Edge cases handled (null, undefined, primitives)
- ✅ Return type is properly inferred
- ✅ JSDoc comments included
- ✅ Works with strict TypeScript config

---

### Test 4: Python Data Pipeline (python-data)
**Package**: `python-data` collection
**Difficulty**: 5/10
**Category**: code-generation

**Prompt**:
```
Create a Python pandas pipeline that:
- Reads a CSV file with columns: date, product, quantity, price
- Cleans the data:
  - Converts date to datetime
  - Handles missing values (drop rows with missing product/quantity, fill missing price with mean)
  - Removes duplicate rows
  - Filters out negative quantities
- Calculates total revenue per product (quantity * price)
- Groups by product and aggregates: total_quantity, total_revenue, avg_price
- Sorts by total_revenue descending
- Exports to CSV

Use type hints, docstrings, and proper pandas best practices.
```

**Success Criteria**:
- ✅ Proper pandas operations (no loops)
- ✅ Correct data cleaning logic
- ✅ Type hints on function
- ✅ Docstring explaining pipeline
- ✅ Efficient operations (vectorized)
- ✅ Handles edge cases (empty dataframe)
- ✅ Exports correctly

---

### Test 5: Docker Multi-Stage Build (devops-complete)
**Package**: `devops-complete` collection
**Difficulty**: 5/10
**Category**: code-generation

**Prompt**:
```
Create a Dockerfile for a Next.js application that:
- Uses multi-stage build pattern
- Stage 1: Build the app (install deps, run build)
- Stage 2: Production runtime (minimal image)
- Uses Node 20 Alpine
- Optimizes for cache (copy package files first)
- Runs as non-root user
- Exposes port 3000
- Includes health check
- Uses .dockerignore to exclude node_modules, .git, etc.
- Final image should be < 200MB

Also create the .dockerignore file.
```

**Success Criteria**:
- ✅ Multi-stage build implemented
- ✅ Dependencies cached efficiently
- ✅ Runs as non-root user
- ✅ Health check included
- ✅ Minimal final image size
- ✅ Security best practices
- ✅ .dockerignore present
- ✅ Properly documented with comments

---

### Test 6: Database Repository Pattern (typescript-strict)
**Package**: `typescript-strict`
**Difficulty**: 7/10
**Category**: code-generation

**Prompt**:
```
Implement a repository pattern for a User entity with:
- Interface IUserRepository with methods: findById, findByEmail, create, update, delete
- Concrete implementation PostgresUserRepository
- Dependency injection support
- Caching layer (in-memory cache, 5 min TTL)
- Cache invalidation on create/update/delete
- Full TypeScript types (no any)
- Error handling with custom errors
- Transaction support for update/delete
- Type-safe query builder usage

Use these types:
type User = { id: string; email: string; name: string; createdAt: Date };
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
```

**Success Criteria**:
- ✅ Interface defined correctly
- ✅ Repository pattern implemented
- ✅ Caching implemented with TTL
- ✅ Cache invalidation logic
- ✅ Full TypeScript types
- ✅ Custom error classes
- ✅ Transaction support
- ✅ Dependency injection ready
- ✅ No business logic in repository

---

## 🐛 DEBUGGING (3 tests)

### Test 7: Fix React Memory Leak (react-best-practices)
**Package**: `react-best-practices`
**Difficulty**: 5/10
**Category**: debugging

**Prompt**:
```
This React component has a memory leak. Identify and fix it:

\`\`\`tsx
function LiveChat() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      setMessages([...messages, event.data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, []);

  return (
    <div>
      {messages.map((msg, i) => <div key={i}>{msg}</div>)}
    </div>
  );
}
\`\`\`

Explain what's wrong and provide the fixed code.
```

**Success Criteria**:
- ✅ Identifies missing cleanup (no ws.close())
- ✅ Identifies stale closure issue (messages in onmessage)
- ✅ Adds cleanup function to useEffect
- ✅ Fixes stale closure (useCallback or functional setState)
- ✅ Explanation is clear and correct
- ✅ Fixed code runs without leaks
- ✅ Follows React best practices

---

### Test 8: Fix TypeScript Type Error (typescript-strict)
**Package**: `typescript-strict`
**Difficulty**: 6/10
**Category**: debugging

**Prompt**:
```
This TypeScript code has type errors. Fix them without using `any` or type assertions:

\`\`\`typescript
interface ApiResponse<T> {
  data: T;
  status: number;
}

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(\`/api/users/\${id}\`);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message);
  }

  return {
    data: json,
    status: response.status
  };
}

function processUser(user: User | null) {
  return user.name.toUpperCase();
}

const result = await fetchUser('123');
console.log(processUser(result));
\`\`\`

Fix all type errors and explain what was wrong.
```

**Success Criteria**:
- ✅ Identifies `json` as `any` (needs type annotation or validation)
- ✅ Identifies null check missing in processUser
- ✅ Identifies result is ApiResponse, not User
- ✅ No `any` or type assertions used
- ✅ Proper runtime validation (Zod or manual)
- ✅ Null checking via optional chaining or guard
- ✅ Explanation of each fix

---

### Test 9: Debug Slow Database Query (systematic-debugging)
**Package**: `systematic-debugging`
**Difficulty**: 7/10
**Category**: debugging

**Prompt**:
```
This SQL query is taking 45 seconds on a table with 10M rows. Optimize it:

\`\`\`sql
SELECT
  u.id,
  u.name,
  u.email,
  (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
  (SELECT SUM(total) FROM orders WHERE user_id = u.id) as total_spent
FROM users u
WHERE u.created_at > '2024-01-01'
  AND u.email LIKE '%@gmail.com'
ORDER BY u.created_at DESC
LIMIT 100;
\`\`\`

Table schemas:
users: id (uuid PK), name, email, created_at
orders: id (uuid PK), user_id (uuid FK), total (decimal), created_at

Current indexes:
- users(id)
- orders(id)

Provide the optimized query and explain what indexes to add.
```

**Success Criteria**:
- ✅ Identifies N+1 query problem (subqueries)
- ✅ Uses JOIN instead of subqueries
- ✅ Recommends index on users(created_at, email)
- ✅ Recommends index on orders(user_id)
- ✅ Uses EXPLAIN to justify changes
- ✅ Final query is significantly faster
- ✅ Clear explanation of optimizations

---

## ♻️ REFACTORING (3 tests)

### Test 10: Class to Hooks Migration (react-best-practices)
**Package**: `react-best-practices`
**Difficulty**: 5/10
**Category**: refactoring

**Prompt**:
```
Convert this React class component to a functional component with hooks:

\`\`\`tsx
class UserProfile extends React.Component {
  state = {
    user: null,
    loading: true,
    error: null
  };

  async componentDidMount() {
    try {
      const response = await fetch(\`/api/users/\${this.props.userId}\`);
      const user = await response.json();
      this.setState({ user, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  componentWillUnmount() {
    // Cleanup
  }

  render() {
    const { user, loading, error } = this.state;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return null;

    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    );
  }
}
\`\`\`
```

**Success Criteria**:
- ✅ Uses functional component syntax
- ✅ useState for state management
- ✅ useEffect for data fetching
- ✅ Proper cleanup in useEffect return
- ✅ TypeScript types added
- ✅ Follows modern React patterns
- ✅ Behavior preserved exactly

---

### Test 11: Extract Custom Hook (react-best-practices)
**Package**: `react-best-practices`
**Difficulty**: 6/10
**Category**: refactoring

**Prompt**:
```
This component has duplicated logic. Extract a reusable custom hook:

\`\`\`tsx
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ... render
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ... render
}
\`\`\`

Create a useApi(url) hook and refactor both components to use it.
```

**Success Criteria**:
- ✅ Custom hook created with proper naming
- ✅ Generic TypeScript types
- ✅ Returns { data, loading, error }
- ✅ Both components refactored
- ✅ Handles edge cases (cleanup, errors)
- ✅ Optional refetch function
- ✅ Follows hooks rules

---

### Test 12: Simplify Nested Logic (typescript-strict)
**Package**: `typescript-strict`
**Difficulty**: 4/10
**Category**: refactoring

**Prompt**:
```
Refactor this nested conditional logic to be more readable:

\`\`\`typescript
function calculateDiscount(user: User, order: Order): number {
  if (user) {
    if (user.isPremium) {
      if (order.total > 100) {
        if (order.items.length > 5) {
          return 0.25;
        } else {
          return 0.15;
        }
      } else {
        return 0.10;
      }
    } else {
      if (order.total > 200) {
        return 0.05;
      } else {
        return 0;
      }
    }
  }
  return 0;
}
\`\`\`

Use early returns, extract logic, improve readability.
```

**Success Criteria**:
- ✅ Uses early returns
- ✅ Eliminates nesting
- ✅ More readable
- ✅ Same logic/behavior
- ✅ Better variable names
- ✅ Optional: Extract helper functions
- ✅ TypeScript types preserved

---

## 📖 EXPLANATION (2 tests)

### Test 13: Explain React useCallback (react-best-practices)
**Package**: `react-best-practices`
**Difficulty**: 4/10
**Category**: explanation

**Prompt**:
```
Explain what React's useCallback hook does, when you should use it, and when you shouldn't.

Include:
- What problem it solves
- How it works (in simple terms)
- A clear example showing when it's necessary
- A clear example showing when it's NOT necessary (premature optimization)
- Connection to React.memo and child component re-renders
```

**Success Criteria**:
- ✅ Correct explanation of memoization
- ✅ Explains dependency array
- ✅ Shows practical "necessary" example
- ✅ Shows "unnecessary" example (premature optimization)
- ✅ Connects to React.memo
- ✅ Clear, beginner-friendly language
- ✅ Technically accurate

---

### Test 14: Explain Test-Driven Development (test-driven-development)
**Package**: `test-driven-development`
**Difficulty**: 3/10
**Category**: explanation

**Prompt**:
```
Explain Test-Driven Development (TDD) to a developer who has never used it.

Include:
- The Red-Green-Refactor cycle
- Benefits of TDD
- Common misconceptions
- A simple example in TypeScript (e.g., testing a sum function)
- When TDD works well vs. when it might not

Keep it practical and persuasive.
```

**Success Criteria**:
- ✅ Clear explanation of Red-Green-Refactor
- ✅ Accurate benefits listed
- ✅ Addresses misconceptions
- ✅ Working code example
- ✅ Honest about limitations
- ✅ Persuasive tone
- ✅ Beginner-friendly

---

## ✅ TESTING (1 test)

### Test 15: Write React Component Tests (test-driven-development)
**Package**: `test-driven-development`
**Difficulty**: 6/10
**Category**: testing

**Prompt**:
```
Write comprehensive tests for this React Login component using React Testing Library:

\`\`\`tsx
function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        disabled={loading}
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}
\`\`\`

Test coverage should include:
- Rendering
- User input
- Form submission
- Validation errors
- Loading states
- API errors
- Accessibility
```

**Success Criteria**:
- ✅ Uses React Testing Library (not Enzyme)
- ✅ Tests user interactions with userEvent
- ✅ Tests validation logic
- ✅ Tests loading states
- ✅ Tests error handling
- ✅ Mocks onSubmit properly
- ✅ Checks accessibility (role="alert")
- ✅ Good test naming
- ✅ No implementation details tested
- ✅ Tests cover all branches

---

## Scoring Guide

### Per Test Scoring
```
Total = (Correctness × 40%) + (Quality × 30%) + (Context × 20%) + (Speed × 10%)
```

### Overall Leaderboard
```
Overall Score = Average of all test scores
Category Score = Average within category (code-gen, debugging, etc.)
Pass Rate = % of tests with score ≥ 70
```

## Data Collection Template

| Test | Package | Assistant | Correctness | Quality | Context | Speed(s) | Total | Notes |
|------|---------|-----------|-------------|---------|---------|----------|-------|-------|
| 1 | react-best-practices | Cursor | 90 | 85 | 90 | 3.2 | 88.3 | Great cleanup |
| 1 | react-best-practices | Claude | 95 | 92 | 88 | 4.5 | 91.3 | Added AbortController |
| 1 | react-best-practices | Copilot | 85 | 80 | 75 | 2.1 | 82.8 | Fast but basic |

## Next Steps

1. **This week**: Run Tests 1-5 for Cursor (2-3 hours)
2. **Refine methodology**: Adjust scoring rubric based on first 5 tests
3. **Week 2**: Complete all 15 tests for Cursor, start Claude Code
4. **Week 3**: Finish Claude Code and Copilot
5. **Week 4**: Publish first benchmark results

---

**These are real, production-ready benchmark tests using actual PRPM packages.**
