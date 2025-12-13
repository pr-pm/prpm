-- Seed Benchmark Test Data
-- Run with: psql -h localhost -U prpm -d prpm_registry -f seed-benchmarks.sql

-- First, ensure we have a suite
INSERT INTO benchmark_suites (id, name, description, version, test_count, is_active)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'PRPM Core v1.0',
  'Initial benchmark suite testing AI assistants on popular PRPM packages across code generation, debugging, refactoring, explanation, and testing tasks.',
  '1.0.0',
  0,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET description = EXCLUDED.description,
    version = EXCLUDED.version;

-- ============================================================================
-- CODE GENERATION TESTS (30% of suite)
-- ============================================================================

INSERT INTO benchmark_tests (suite_id, name, category, difficulty, prompt, expected_behavior, language, framework, tags)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Generate React Component with State',
  'code-generation',
  3,
  'Create a React component called UserProfile that displays a user''s name and email. Include a button to toggle between showing and hiding the email. Use React hooks for state management.',
  'Component should use useState hook, handle click events, conditionally render email, and follow React best practices.',
  'typescript',
  'react',
  ARRAY['react', 'hooks', 'component', 'state']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Create FastAPI Endpoint',
  'code-generation',
  4,
  'Create a FastAPI endpoint POST /api/users that accepts a JSON body with name and email fields, validates that email is a valid format, and returns a 201 status with the created user object.',
  'Should include Pydantic model for validation, proper HTTP status codes, email validation, and type hints.',
  'python',
  'fastapi',
  ARRAY['python', 'fastapi', 'api', 'validation']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Generate TypeScript Utility Function',
  'code-generation',
  2,
  'Write a TypeScript function debounce that takes a function and a delay in milliseconds, and returns a debounced version of that function.',
  'Should properly type the function, handle this context, use closures correctly, and include JSDoc comments.',
  'typescript',
  'utility',
  ARRAY['typescript', 'utility', 'functional', 'debounce']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Create Database Migration',
  'code-generation',
  5,
  'Create a PostgreSQL migration to add a users table with id (UUID primary key), email (unique, not null), name (not null), created_at (timestamp), and updated_at (timestamp). Include appropriate indexes.',
  'Should use gen_random_uuid(), create indexes on email and created_at, use proper types, and include both up and down migrations.',
  'sql',
  'postgresql',
  ARRAY['sql', 'postgresql', 'migration', 'database']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Generate GraphQL Resolver',
  'code-generation',
  6,
  'Create a GraphQL resolver for a query getUserById that takes an id argument, fetches a user from the database, and returns the user object with fields id, name, and email. Include error handling for user not found.',
  'Should include TypeScript types, database query, null checking, proper GraphQL response format, and error handling.',
  'typescript',
  'graphql',
  ARRAY['graphql', 'typescript', 'resolver', 'database']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Create Tailwind Component',
  'code-generation',
  3,
  'Create a responsive navigation bar component using Tailwind CSS with a logo on the left, menu items in the center, and a user profile dropdown on the right. Make it mobile-friendly with a hamburger menu.',
  'Should use Tailwind utility classes, be responsive (hidden on mobile, visible on desktop), include proper accessibility attributes, and handle menu toggle state.',
  'typescript',
  'tailwind',
  ARRAY['tailwind', 'react', 'responsive', 'ui']
);

-- ============================================================================
-- DEBUGGING TESTS (20% of suite)
-- ============================================================================

INSERT INTO benchmark_tests (suite_id, name, category, difficulty, prompt, expected_behavior, language, framework, tags, test_code)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fix React useEffect Dependency',
  'debugging',
  4,
  E'The following React component has a bug - it re-fetches data on every render:\n\n```tsx\nfunction UserData({ userId }) {\n  const [data, setData] = useState(null);\n  \n  useEffect(() => {\n    fetchUser(userId).then(setData);\n  });\n  \n  return <div>{data?.name}</div>;\n}\n```\n\nFix the bug and explain what was wrong.',
  'Should identify missing dependency array in useEffect, add [userId] dependency, explain infinite loop issue, and optionally add cleanup for race conditions.',
  'typescript',
  'react',
  ARRAY['react', 'hooks', 'debugging', 'useeffect'],
  'function UserData({ userId }) { const [data, setData] = useState(null); useEffect(() => { fetchUser(userId).then(setData); }); return <div>{data?.name}</div>; }'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fix TypeScript Type Error',
  'debugging',
  5,
  E'This TypeScript code has a type error:\n\n```ts\ninterface User {\n  id: string;\n  name: string;\n}\n\nfunction getUserName(user: User | null): string {\n  return user.name;\n}\n```\n\nFix the type error and explain the issue.',
  'Should identify null check missing, add user?.name or user !== null check, explain optional chaining or type narrowing, and handle null case properly.',
  'typescript',
  NULL,
  ARRAY['typescript', 'debugging', 'types', 'null-safety'],
  'interface User { id: string; name: string; } function getUserName(user: User | null): string { return user.name; }'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fix SQL N+1 Query',
  'debugging',
  7,
  E'This code causes an N+1 query problem:\n\n```python\nusers = db.query("SELECT * FROM users")\nfor user in users:\n    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)\n    user.orders = orders\n```\n\nOptimize this to eliminate the N+1 queries.',
  'Should identify N+1 problem, use JOIN or subquery, fetch all data in single query, explain performance impact, and demonstrate proper ORM usage or raw SQL optimization.',
  'python',
  'sql',
  ARRAY['sql', 'performance', 'debugging', 'optimization'],
  'users = db.query("SELECT * FROM users")\nfor user in users:\n    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)\n    user.orders = orders'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fix Memory Leak in Event Listener',
  'debugging',
  6,
  E'This React component has a memory leak:\n\n```tsx\nfunction ScrollTracker() {\n  const [scrollY, setScrollY] = useState(0);\n  \n  useEffect(() => {\n    window.addEventListener(''scroll'', () => {\n      setScrollY(window.scrollY);\n    });\n  }, []);\n  \n  return <div>Scrolled: {scrollY}px</div>;\n}\n```\n\nIdentify and fix the memory leak.',
  'Should identify missing cleanup function, add removeEventListener in useEffect return, optionally memoize handler function, and explain memory leak implications.',
  'typescript',
  'react',
  ARRAY['react', 'debugging', 'memory-leak', 'cleanup'],
  'function ScrollTracker() { const [scrollY, setScrollY] = useState(0); useEffect(() => { window.addEventListener(''scroll'', () => { setScrollY(window.scrollY); }); }, []); return <div>Scrolled: {scrollY}px</div>; }'
);

-- ============================================================================
-- REFACTORING TESTS (20% of suite)
-- ============================================================================

INSERT INTO benchmark_tests (suite_id, name, category, difficulty, prompt, expected_behavior, language, framework, tags, test_code)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Convert Class Component to Hooks',
  'refactoring',
  5,
  E'Convert this React class component to a functional component using hooks:\n\n```tsx\nclass Counter extends React.Component {\n  state = { count: 0 };\n  \n  increment = () => {\n    this.setState({ count: this.state.count + 1 });\n  };\n  \n  render() {\n    return (\n      <div>\n        <p>Count: {this.state.count}</p>\n        <button onClick={this.increment}>+</button>\n      </div>\n    );\n  }\n}\n```',
  'Should use useState hook, functional component syntax, preserve behavior, use const for component, and follow modern React patterns.',
  'typescript',
  'react',
  ARRAY['react', 'refactoring', 'hooks', 'modernization'],
  'class Counter extends React.Component { state = { count: 0 }; increment = () => { this.setState({ count: this.state.count + 1 }); }; render() { return ( <div> <p>Count: {this.state.count}</p> <button onClick={this.increment}>+</button> </div> ); } }'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Extract Reusable Hook',
  'refactoring',
  6,
  E'This component has duplicated logic for fetching data. Extract it into a reusable custom hook:\n\n```tsx\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n  \n  useEffect(() => {\n    fetch(''/api/users'')\n      .then(res => res.json())\n      .then(setUsers)\n      .catch(setError)\n      .finally(() => setLoading(false));\n  }, []);\n  \n  // ... render logic\n}\n```\n\nCreate a useFetch hook.',
  'Should create generic useFetch(url) hook, return {data, loading, error}, handle cleanup, support TypeScript generics, and demonstrate usage in component.',
  'typescript',
  'react',
  ARRAY['react', 'refactoring', 'custom-hooks', 'abstraction'],
  'function UserList() { const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); useEffect(() => { fetch(''/api/users'').then(res => res.json()).then(setUsers).catch(setError).finally(() => setLoading(false)); }, []); }'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Simplify Nested Conditionals',
  'refactoring',
  4,
  E'Refactor this function to reduce nesting:\n\n```ts\nfunction processUser(user: User | null) {\n  if (user) {\n    if (user.email) {\n      if (user.verified) {\n        if (user.premium) {\n          return sendPremiumEmail(user.email);\n        } else {\n          return sendRegularEmail(user.email);\n        }\n      } else {\n        return sendVerificationEmail(user.email);\n      }\n    }\n  }\n  return null;\n}\n```',
  'Should use early returns, eliminate nesting, improve readability, maintain same logic flow, and add appropriate error handling or logging.',
  'typescript',
  NULL,
  ARRAY['typescript', 'refactoring', 'readability', 'early-return'],
  'function processUser(user: User | null) { if (user) { if (user.email) { if (user.verified) { if (user.premium) { return sendPremiumEmail(user.email); } else { return sendRegularEmail(user.email); } } else { return sendVerificationEmail(user.email); } } } return null; }'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Migrate to TypeScript',
  'refactoring',
  7,
  E'Convert this JavaScript module to TypeScript with proper types:\n\n```js\nexport function createUser(data) {\n  return {\n    id: generateId(),\n    name: data.name,\n    email: data.email,\n    createdAt: new Date()\n  };\n}\n\nexport function validateEmail(email) {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}\n```',
  'Should add interfaces for User and CreateUserInput, type function parameters and returns, use strict types, add JSDoc comments, and handle edge cases.',
  'typescript',
  NULL,
  ARRAY['typescript', 'migration', 'refactoring', 'types'],
  'export function createUser(data) { return { id: generateId(), name: data.name, email: data.email, createdAt: new Date() }; } export function validateEmail(email) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email); }'
);

-- ============================================================================
-- EXPLANATION TESTS (15% of suite)
-- ============================================================================

INSERT INTO benchmark_tests (suite_id, name, category, difficulty, prompt, expected_behavior, language, tags)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Explain React useCallback',
  'explanation',
  3,
  'Explain what React''s useCallback hook does, when you should use it, and provide a clear example of a situation where it''s necessary.',
  'Should explain memoization, dependency array, performance optimization, child component re-renders, and provide concrete example with React.memo.',
  'typescript',
  ARRAY['react', 'hooks', 'performance', 'explanation']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Explain Database Indexing',
  'explanation',
  5,
  'Explain how database indexes work, why they improve query performance, and when you should and should not use them.',
  'Should explain B-tree structure, lookup time complexity, trade-offs (write performance), covering indexes, and provide specific examples.',
  'sql',
  ARRAY['database', 'indexing', 'performance', 'explanation']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Explain Event Loop',
  'explanation',
  6,
  'Explain how the JavaScript event loop works, including the call stack, task queue, and microtask queue. Use an example with setTimeout and Promise.',
  'Should explain single-threaded execution, call stack, event loop phases, microtasks vs macrotasks, and provide concrete code example with execution order.',
  'javascript',
  ARRAY['javascript', 'async', 'event-loop', 'explanation']
);

-- ============================================================================
-- TESTING TESTS (15% of suite)
-- ============================================================================

INSERT INTO benchmark_tests (suite_id, name, category, difficulty, prompt, expected_behavior, language, framework, tags)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Write React Component Test',
  'testing',
  4,
  'Write a comprehensive test suite for a Login component that has email and password inputs and a submit button. Use React Testing Library.',
  'Should test rendering, user input, form submission, validation errors, loading states, and accessibility. Use proper queries and user-event.',
  'typescript',
  'react',
  ARRAY['testing', 'react', 'rtl', 'unit-test']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Write API Endpoint Test',
  'testing',
  5,
  'Write tests for a FastAPI endpoint POST /api/users that creates a user. Test success case, validation errors, and duplicate email.',
  'Should use pytest, test client, check status codes, response bodies, database state, and edge cases. Include fixtures for test data.',
  'python',
  'fastapi',
  ARRAY['testing', 'pytest', 'api', 'integration-test']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Write E2E Test',
  'testing',
  7,
  'Write an end-to-end test using Playwright that tests a user signup flow: navigate to /signup, fill form, submit, verify success message, and check user appears in database.',
  'Should use Playwright, page object pattern, proper waits, database verification, and handle async operations. Clean up test data.',
  'typescript',
  'playwright',
  ARRAY['testing', 'e2e', 'playwright', 'integration-test']
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Write Unit Test with Mocks',
  'testing',
  6,
  'Write unit tests for a UserService class that depends on a Database and EmailService. Mock the dependencies and test the createUser method.',
  'Should use Jest or Vitest, mock dependencies, test success and error cases, verify mock calls, and use proper TypeScript types for mocks.',
  'typescript',
  'jest',
  ARRAY['testing', 'mocking', 'unit-test', 'jest']
);

-- Update suite test count
UPDATE benchmark_suites
SET test_count = (SELECT COUNT(*) FROM benchmark_tests WHERE suite_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    updated_at = NOW()
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Summary
SELECT
  'Benchmark Suite Created' AS status,
  name AS suite_name,
  version AS suite_version,
  test_count AS total_tests
FROM benchmark_suites
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT
  category,
  COUNT(*) AS count
FROM benchmark_tests
WHERE suite_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
GROUP BY category
ORDER BY count DESC;
