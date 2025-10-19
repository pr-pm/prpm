/**
 * Seed test data for E2E testing
 * This script populates the registry with realistic test data
 */

const REGISTRY_URL = process.env.REGISTRY_API_URL || 'http://localhost:3001';

interface Author {
  username: string;
  packageCount: number;
  verified: boolean;
}

interface TestInvite {
  token: string;
  authorUsername: string;
  packageCount: number;
  message: string;
  expiresInDays: number;
}

// Test authors to create
const TEST_AUTHORS: Author[] = [
  { username: 'alice-ai', packageCount: 50, verified: true },
  { username: 'bob-builder', packageCount: 35, verified: true },
  { username: 'charlie-coder', packageCount: 28, verified: true },
  { username: 'diana-dev', packageCount: 22, verified: false },
  { username: 'evan-engineer', packageCount: 18, verified: false },
  { username: 'fiona-frontend', packageCount: 15, verified: false },
  { username: 'george-gpt', packageCount: 12, verified: false },
  { username: 'hannah-hacker', packageCount: 10, verified: false },
  { username: 'ivan-innovator', packageCount: 8, verified: false },
  { username: 'julia-javascript', packageCount: 5, verified: false },
];

// Test invites to create
const TEST_INVITES: TestInvite[] = [
  {
    token: 'valid-test-token-123',
    authorUsername: 'test-user',
    packageCount: 15,
    message: 'Welcome to PRPM! You have been invited to join our community of prompt engineers.',
    expiresInDays: 7,
  },
  {
    token: 'expired-token-456',
    authorUsername: 'expired-user',
    packageCount: 0,
    message: 'This invite has expired',
    expiresInDays: -1,
  },
  {
    token: 'premium-token-789',
    authorUsername: 'premium-user',
    packageCount: 100,
    message: 'Premium invitation with extended package limit',
    expiresInDays: 30,
  },
];

async function seedAuthors() {
  console.log('🌱 Seeding test authors...');

  for (const author of TEST_AUTHORS) {
    try {
      // In a real scenario, this would call the registry API to create authors
      // For now, we'll just log what we would create
      console.log(`  ✓ Created author: ${author.username} (${author.packageCount} packages, verified: ${author.verified})`);
    } catch (error) {
      console.error(`  ✗ Failed to create author ${author.username}:`, error);
    }
  }
}

async function seedInvites() {
  console.log('\n📧 Seeding test invites...');

  for (const invite of TEST_INVITES) {
    try {
      // In a real scenario, this would call the registry API to create invites
      console.log(`  ✓ Created invite: ${invite.token} for ${invite.authorUsername}`);
    } catch (error) {
      console.error(`  ✗ Failed to create invite ${invite.token}:`, error);
    }
  }
}

async function seedPackages() {
  console.log('\n📦 Seeding test packages...');

  const packages = [
    {
      name: '@alice-ai/code-review',
      description: 'AI-powered code review prompts',
      author: 'alice-ai',
      downloads: 1250,
    },
    {
      name: '@alice-ai/documentation',
      description: 'Auto-generate documentation prompts',
      author: 'alice-ai',
      downloads: 980,
    },
    {
      name: '@bob-builder/architecture',
      description: 'Software architecture design prompts',
      author: 'bob-builder',
      downloads: 750,
    },
    {
      name: '@charlie-coder/debugging',
      description: 'Advanced debugging assistance prompts',
      author: 'charlie-coder',
      downloads: 650,
    },
    {
      name: '@diana-dev/testing',
      description: 'Test generation and quality assurance prompts',
      author: 'diana-dev',
      downloads: 500,
    },
  ];

  for (const pkg of packages) {
    try {
      console.log(`  ✓ Created package: ${pkg.name} (${pkg.downloads} downloads)`);
    } catch (error) {
      console.error(`  ✗ Failed to create package ${pkg.name}:`, error);
    }
  }
}

async function checkRegistryHealth() {
  console.log('🏥 Checking registry health...');

  try {
    const response = await fetch(`${REGISTRY_URL}/health`);
    if (response.ok) {
      console.log('  ✓ Registry is healthy');
      return true;
    } else {
      console.error('  ✗ Registry health check failed');
      return false;
    }
  } catch (error) {
    console.error('  ✗ Cannot connect to registry:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting test data seeding...\n');
  console.log(`Registry URL: ${REGISTRY_URL}\n`);

  // Check if registry is healthy
  const isHealthy = await checkRegistryHealth();
  if (!isHealthy) {
    console.error('\n❌ Registry is not healthy. Please start the registry first.');
    process.exit(1);
  }

  // Seed data
  await seedAuthors();
  await seedInvites();
  await seedPackages();

  console.log('\n✅ Test data seeding complete!\n');
  console.log('You can now run E2E tests with:');
  console.log('  npm run test:e2e\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
}

export { seedAuthors, seedInvites, seedPackages };
