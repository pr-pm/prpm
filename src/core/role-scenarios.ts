/**
 * Role-based test scenarios
 * Pre-defined test scenarios for each specialized role
 */

import { TestScenario } from './test-runner';

export const ROLE_SCENARIOS: Record<string, TestScenario[]> = {
  'code-reviewer': [
    {
      name: 'Code Quality Review',
      description: 'Test review of poorly formatted code',
      context: `Review this code for quality issues:

function x(a,b){return a+b}
const data=[1,2,3]
if(data.length>0){console.log(data)}`,
      expectedPatterns: ['formatting', 'naming', 'readability'],
    },
    {
      name: 'Best Practices Check',
      description: 'Test identification of anti-patterns',
      context: `Review this React component:

function UserList() {
  const [users, setUsers] = useState([]);

  fetch('/api/users')
    .then(res => res.json())
    .then(data => setUsers(data));

  return users.map(u => <div>{u.name}</div>);
}`,
      expectedPatterns: ['useEffect', 'dependency', 'key prop'],
    },
    {
      name: 'Error Handling Review',
      description: 'Test detection of missing error handling',
      context: `Review this function:

async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();
  return data;
}`,
      expectedPatterns: ['error handling', 'try-catch', 'status check'],
    },
    {
      name: 'Code Documentation',
      description: 'Test suggestion for missing documentation',
      context: `Review this function:

function calculateDiscount(price, type, isVip) {
  let discount = 0;
  if (type === 'seasonal') discount = 0.1;
  if (type === 'clearance') discount = 0.3;
  if (isVip) discount += 0.05;
  return price * (1 - discount);
}`,
      expectedPatterns: ['documentation', 'JSDoc', 'comment', 'parameters'],
    },
    {
      name: 'Type Safety',
      description: 'Test recommendation for type annotations',
      context: `Review this TypeScript code:

function processData(data) {
  return data.map(item => ({
    id: item.id,
    value: item.value * 2
  }));
}`,
      expectedPatterns: ['type annotation', 'interface', 'type safety'],
    },
  ],

  'security-reviewer': [
    {
      name: 'SQL Injection Detection',
      description: 'Test detection of SQL injection vulnerability',
      context: `Review this code for security issues:

app.get('/user/:id', (req, res) => {
  const query = 'SELECT * FROM users WHERE id = ' + req.params.id;
  db.query(query, (err, results) => {
    res.json(results);
  });
});`,
      expectedPatterns: ['SQL injection', 'parameterized', 'prepared statement', 'vulnerability'],
    },
    {
      name: 'XSS Vulnerability',
      description: 'Test detection of cross-site scripting',
      context: `Review this code:

app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  res.send('<h1>Results for: ' + searchTerm + '</h1>');
});`,
      expectedPatterns: ['XSS', 'cross-site scripting', 'sanitize', 'escape'],
    },
    {
      name: 'Exposed Secrets',
      description: 'Test detection of hardcoded credentials',
      context: `Review this configuration:

const config = {
  apiKey: 'sk-1234567890abcdef',
  dbPassword: 'admin123',
  jwtSecret: 'my-secret-key'
};`,
      expectedPatterns: ['secret', 'credential', 'environment variable', 'hardcoded'],
    },
    {
      name: 'Authentication Weakness',
      description: 'Test detection of weak authentication',
      context: `Review this login handler:

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (password === users[username].password) {
    res.json({ token: generateToken(username) });
  }
});`,
      expectedPatterns: ['password hashing', 'bcrypt', 'plain text', 'weak'],
    },
    {
      name: 'CSRF Protection',
      description: 'Test detection of missing CSRF protection',
      context: `Review this state-changing endpoint:

app.post('/transfer', (req, res) => {
  const { to, amount } = req.body;
  transferMoney(req.user.id, to, amount);
  res.json({ success: true });
});`,
      expectedPatterns: ['CSRF', 'token', 'protection', 'state-changing'],
    },
    {
      name: 'Path Traversal',
      description: 'Test detection of path traversal vulnerability',
      context: `Review this file handler:

app.get('/files/:filename', (req, res) => {
  const filePath = './uploads/' + req.params.filename;
  res.sendFile(filePath);
});`,
      expectedPatterns: ['path traversal', 'validation', 'sanitize', 'directory'],
    },
  ],

  'planner': [
    {
      name: 'Architecture Planning',
      description: 'Test creation of system architecture plan',
      context: `Plan the architecture for a real-time chat application with:
- User authentication
- Message persistence
- Presence detection
- File sharing
Scale: 10,000 concurrent users`,
      expectedPatterns: ['WebSocket', 'database', 'architecture', 'scalability', 'components'],
    },
    {
      name: 'Feature Breakdown',
      description: 'Test decomposition of complex feature',
      context: `Break down this feature into implementation tasks:

Feature: Multi-tenant SaaS billing system with:
- Subscription plans (free, pro, enterprise)
- Usage-based billing
- Invoice generation
- Payment processing (Stripe)
- Webhook handling`,
      expectedPatterns: ['task', 'milestone', 'dependency', 'priority'],
    },
    {
      name: 'Technology Selection',
      description: 'Test recommendation of tech stack',
      context: `Recommend a tech stack for an e-commerce platform with requirements:
- High traffic (1M+ daily users)
- Real-time inventory
- Multi-region deployment
- Mobile app support
- SEO critical`,
      expectedPatterns: ['technology', 'framework', 'database', 'justification'],
    },
    {
      name: 'Migration Strategy',
      description: 'Test planning of system migration',
      context: `Plan a migration from monolith to microservices for a legacy application:
- Current: Rails monolith
- Target: Microservices (Node.js)
- Zero downtime requirement
- 2M active users`,
      expectedPatterns: ['migration', 'strategy', 'risk', 'rollback', 'phase'],
    },
  ],

  'debugger': [
    {
      name: 'Null Pointer Bug',
      description: 'Test identification of null reference error',
      context: `Debug this error:

Error: Cannot read property 'name' of undefined

Code:
function getUserName(userId) {
  const user = users.find(u => u.id === userId);
  return user.name.toUpperCase();
}`,
      expectedPatterns: ['null check', 'optional chaining', 'undefined', 'guard'],
    },
    {
      name: 'Race Condition',
      description: 'Test detection of async race condition',
      context: `Debug this intermittent bug:

let counter = 0;

async function increment() {
  const current = counter;
  await delay(100);
  counter = current + 1;
}

// Called 10 times concurrently
// Expected: counter = 10
// Actual: counter = 1`,
      expectedPatterns: ['race condition', 'concurrency', 'async', 'lock'],
    },
    {
      name: 'Memory Leak',
      description: 'Test identification of memory leak',
      context: `Debug memory leak in this React component:

function DataFetcher() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/data').then(res => res.json()).then(setData);
    }, 1000);
  }, []);

  return <div>{data.length} items</div>;
}`,
      expectedPatterns: ['memory leak', 'cleanup', 'clearInterval', 'unmount'],
    },
    {
      name: 'Off-by-One Error',
      description: 'Test detection of boundary error',
      context: `Debug this function that sometimes fails:

function getWeekDays(startDate) {
  const days = [];
  for (let i = 0; i <= 7; i++) {
    days.push(new Date(startDate.getTime() + i * 86400000));
  }
  return days;
}`,
      expectedPatterns: ['off-by-one', 'boundary', 'loop', 'iteration'],
    },
    {
      name: 'State Mutation Bug',
      description: 'Test detection of state mutation',
      context: `Debug why this React component doesn't re-render:

function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    todos.push({ id: Date.now(), text });
    setTodos(todos);
  };

  return todos.map(todo => <div>{todo.text}</div>);
}`,
      expectedPatterns: ['mutation', 'immutability', 'spread', 'new array'],
    },
  ],

  'tester': [
    {
      name: 'Unit Test Generation',
      description: 'Test generation of unit tests',
      context: `Generate unit tests for this function:

function calculateShippingCost(weight, distance, isPriority) {
  let cost = weight * 0.5 + distance * 0.1;
  if (isPriority) cost *= 1.5;
  if (weight > 50) cost += 10;
  return Math.round(cost * 100) / 100;
}`,
      expectedPatterns: ['test', 'expect', 'describe', 'it', 'edge case'],
    },
    {
      name: 'Integration Test',
      description: 'Test creation of integration test',
      context: `Create integration tests for this API endpoint:

POST /api/orders
{
  "userId": "123",
  "items": [{"id": "456", "quantity": 2}],
  "payment": {"method": "card", "token": "tok_123"}
}

Should:
- Validate user exists
- Check inventory
- Process payment
- Create order
- Send confirmation email`,
      expectedPatterns: ['integration', 'mock', 'setup', 'teardown', 'assertion'],
    },
    {
      name: 'E2E Test Scenario',
      description: 'Test creation of end-to-end test',
      context: `Create E2E test for user registration flow:

1. Visit /signup
2. Fill form (email, password, confirm password)
3. Submit
4. Verify email sent
5. Click confirmation link
6. Verify redirected to dashboard`,
      expectedPatterns: ['E2E', 'Playwright', 'Cypress', 'selector', 'assertion'],
    },
    {
      name: 'Test Edge Cases',
      description: 'Test identification of edge cases',
      context: `What edge cases should be tested for this function?

function divide(a, b) {
  return a / b;
}`,
      expectedPatterns: ['edge case', 'zero', 'infinity', 'NaN', 'negative'],
    },
  ],

  'documenter': [
    {
      name: 'API Documentation',
      description: 'Test generation of API docs',
      context: `Document this API endpoint:

app.post('/api/users', async (req, res) => {
  const { email, name, role } = req.body;
  const user = await User.create({ email, name, role });
  res.status(201).json(user);
});`,
      expectedPatterns: ['endpoint', 'parameter', 'response', 'status code', 'example'],
    },
    {
      name: 'Function Documentation',
      description: 'Test generation of JSDoc',
      context: `Document this function:

function filterProducts(products, filters) {
  return products.filter(p => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    return true;
  });
}`,
      expectedPatterns: ['JSDoc', '@param', '@returns', 'description'],
    },
    {
      name: 'README Generation',
      description: 'Test creation of README',
      context: `Create a README for this project:

Project: react-data-table
A customizable, sortable, filterable data table component for React.

Features:
- Sorting (ascending/descending)
- Filtering (text search)
- Pagination
- Custom cell renderers
- TypeScript support`,
      expectedPatterns: ['installation', 'usage', 'example', 'features', 'API'],
    },
    {
      name: 'Code Comments',
      description: 'Test addition of inline comments',
      context: `Add comments to explain this algorithm:

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`,
      expectedPatterns: ['comment', 'explanation', 'algorithm', 'step'],
    },
  ],

  'refactorer': [
    {
      name: 'Extract Function',
      description: 'Test extraction of repeated code',
      context: `Refactor this code to reduce duplication:

function processOrder(order) {
  if (order.type === 'online') {
    const tax = order.amount * 0.08;
    const shipping = order.amount > 50 ? 0 : 5;
    const total = order.amount + tax + shipping;
    return { tax, shipping, total };
  } else {
    const tax = order.amount * 0.08;
    const total = order.amount + tax;
    return { tax, total };
  }
}`,
      expectedPatterns: ['extract', 'function', 'DRY', 'reusable'],
    },
    {
      name: 'Simplify Conditionals',
      description: 'Test simplification of complex conditionals',
      context: `Refactor this nested conditional:

function getUserDiscount(user) {
  if (user.isPremium) {
    if (user.yearsActive > 5) {
      return 0.25;
    } else if (user.yearsActive > 2) {
      return 0.15;
    } else {
      return 0.10;
    }
  } else {
    if (user.yearsActive > 3) {
      return 0.05;
    } else {
      return 0;
    }
  }
}`,
      expectedPatterns: ['simplify', 'early return', 'guard clause', 'readability'],
    },
    {
      name: 'Remove Dead Code',
      description: 'Test identification of unused code',
      context: `Refactor and remove unused code:

function processData(data) {
  const filtered = data.filter(x => x.active);
  const sorted = data.sort((a, b) => a.id - b.id);
  const mapped = filtered.map(x => ({ ...x, processed: true }));
  const reduced = data.reduce((acc, x) => acc + x.value, 0);
  return mapped;
}`,
      expectedPatterns: ['dead code', 'unused', 'remove', 'cleanup'],
    },
    {
      name: 'Modernize Syntax',
      description: 'Test modernization to ES6+',
      context: `Modernize this code:

function getUsers() {
  var users = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].active === true) {
      users.push(data[i]);
    }
  }
  return users;
}`,
      expectedPatterns: ['const', 'let', 'arrow function', 'filter', 'modern'],
    },
  ],

  'performance-optimizer': [
    {
      name: 'Inefficient Loop',
      description: 'Test optimization of loop performance',
      context: `Optimize this code:

function processItems(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(items[i] * 2);
  }
  return results;
}`,
      expectedPatterns: ['map', 'optimization', 'performance'],
    },
    {
      name: 'N+1 Query Problem',
      description: 'Test detection of N+1 queries',
      context: `Optimize this database query pattern:

async function getUsersWithPosts() {
  const users = await User.findAll();
  for (const user of users) {
    user.posts = await Post.findAll({ where: { userId: user.id } });
  }
  return users;
}`,
      expectedPatterns: ['N+1', 'eager loading', 'include', 'join', 'batch'],
    },
    {
      name: 'Unnecessary Re-renders',
      description: 'Test optimization of React re-renders',
      context: `Optimize this React component:

function ExpensiveList({ items, onSelect }) {
  return items.map(item => (
    <ExpensiveItem
      key={item.id}
      data={item}
      onClick={() => onSelect(item.id)}
    />
  ));
}`,
      expectedPatterns: ['memo', 'useCallback', 'useMemo', 're-render'],
    },
    {
      name: 'Memory Usage',
      description: 'Test reduction of memory usage',
      context: `Optimize memory usage:

function processLargeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\\n');
  return lines.map(line => line.trim()).filter(line => line.length > 0);
}`,
      expectedPatterns: ['stream', 'chunk', 'memory', 'buffer'],
    },
    {
      name: 'Caching Strategy',
      description: 'Test addition of caching',
      context: `Add caching to this expensive function:

function calculateComplexMetrics(userId) {
  const userData = db.query('SELECT * FROM users WHERE id = ?', [userId]);
  const transactions = db.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
  // Complex calculations...
  return metrics;
}`,
      expectedPatterns: ['cache', 'memoize', 'Redis', 'performance'],
    },
  ],

  'api-designer': [
    {
      name: 'RESTful API Design',
      description: 'Test design of REST endpoints',
      context: `Design a RESTful API for a blog platform with:
- Posts (CRUD)
- Comments (nested under posts)
- Tags
- Authors
- Search functionality`,
      expectedPatterns: ['REST', 'endpoint', 'HTTP method', 'resource', 'status code'],
    },
    {
      name: 'API Versioning',
      description: 'Test API versioning strategy',
      context: `Design versioning for this API that needs breaking changes:

Current: GET /users returns { id, name, email }
New: Need to add { id, firstName, lastName, email, phone }

How to handle backward compatibility?`,
      expectedPatterns: ['version', 'backward compatible', 'deprecation', 'migration'],
    },
    {
      name: 'Error Response Format',
      description: 'Test design of error responses',
      context: `Design a consistent error response format for:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found (404)
- Server errors (500)`,
      expectedPatterns: ['error format', 'status code', 'message', 'consistent'],
    },
    {
      name: 'Pagination Design',
      description: 'Test design of pagination',
      context: `Design pagination for this endpoint:

GET /api/products

Should support:
- Page size selection
- Navigation to any page
- Total count
- Cursor-based pagination (for real-time data)`,
      expectedPatterns: ['pagination', 'cursor', 'limit', 'offset', 'total'],
    },
  ],

  'accessibility-reviewer': [
    {
      name: 'Semantic HTML',
      description: 'Test review of HTML semantics',
      context: `Review this HTML for accessibility:

<div class="header">
  <div class="logo">MyApp</div>
  <div class="nav">
    <div onClick="navigate('/home')">Home</div>
    <div onClick="navigate('/about')">About</div>
  </div>
</div>`,
      expectedPatterns: ['semantic', 'header', 'nav', 'button', 'anchor'],
    },
    {
      name: 'Keyboard Navigation',
      description: 'Test keyboard accessibility',
      context: `Review this modal for keyboard navigation:

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}`,
      expectedPatterns: ['keyboard', 'focus', 'trap', 'escape', 'tabindex'],
    },
    {
      name: 'Screen Reader Support',
      description: 'Test screen reader accessibility',
      context: `Review this button for screen readers:

<button onClick={handleSubmit}>
  <Icon name="check" />
</button>`,
      expectedPatterns: ['aria-label', 'screen reader', 'accessible name', 'alt text'],
    },
    {
      name: 'Color Contrast',
      description: 'Test color contrast compliance',
      context: `Review this design for accessibility:

<div style={{
  background: '#f0f0f0',
  color: '#c0c0c0',
  fontSize: '14px'
}}>
  Important warning message
</div>`,
      expectedPatterns: ['contrast', 'WCAG', 'readability', 'color'],
    },
    {
      name: 'Form Accessibility',
      description: 'Test form accessibility',
      context: `Review this form:

<form>
  <input type="text" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <div style={{color: 'red'}}>Invalid email</div>
  <button>Submit</button>
</form>`,
      expectedPatterns: ['label', 'aria-describedby', 'error message', 'validation'],
    },
  ],
};

/**
 * Get test scenarios for a specific role
 */
export function getRoleScenarios(role: string): TestScenario[] | null {
  return ROLE_SCENARIOS[role] || null;
}

/**
 * List all available roles with scenario counts
 */
export function listAvailableRoles(): Array<{ role: string; scenarioCount: number }> {
  return Object.entries(ROLE_SCENARIOS).map(([role, scenarios]) => ({
    role,
    scenarioCount: scenarios.length,
  }));
}

/**
 * Detect role from prompt content or filename
 */
export function detectRoleFromPrompt(promptPath: string, content?: string): string | null {
  const filename = promptPath.toLowerCase();

  // Check filename for role keywords
  for (const role of Object.keys(ROLE_SCENARIOS)) {
    if (filename.includes(role) || filename.includes(role.replace('-', ''))) {
      return role;
    }
  }

  // Check content for role keywords (if provided)
  if (content) {
    const contentLower = content.toLowerCase();
    for (const role of Object.keys(ROLE_SCENARIOS)) {
      const keywords = role.split('-');
      if (keywords.every(keyword => contentLower.includes(keyword))) {
        return role;
      }
    }
  }

  return null;
}
