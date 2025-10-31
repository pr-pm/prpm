import { describe, it, expect } from 'vitest';
import { users, type User, type NewUser } from '../users.js';

describe('Users Schema', () => {
  it('should have correct TypeScript types for User', () => {
    // This test verifies compile-time type safety for the select type
    const user: User = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'testuser',
      email: null,
      passwordHash: null,
      githubId: null,
      githubUsername: null,
      avatarUrl: null,
      nangoConnectionId: null,
      incomingConnectionId: null,
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: false,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
  });

  it('should have correct TypeScript types for NewUser', () => {
    // This test verifies compile-time type safety for the insert type
    const newUser: NewUser = {
      username: 'newuser',
      email: 'newuser@example.com',
      githubId: 'gh123456',
      githubUsername: 'newuser',
      avatarUrl: 'https://example.com/avatar.png',
    };

    expect(newUser).toBeDefined();
    expect(newUser.username).toBe('newuser');
  });

  it('should allow minimal user creation with just username', () => {
    // Verify that fields with defaults are optional
    const minimalUser: NewUser = {
      username: 'minimaluser',
    };

    expect(minimalUser).toBeDefined();
    expect(minimalUser.username).toBe('minimaluser');
  });

  it('should handle GitHub OAuth user', () => {
    // Test type safety for GitHub OAuth authenticated user
    const githubUser: User = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'githubuser',
      email: 'github@example.com',
      passwordHash: null,
      githubId: 'gh987654',
      githubUsername: 'githubuser',
      avatarUrl: 'https://github.com/avatars/githubuser.png',
      nangoConnectionId: 'nango_conn_123',
      incomingConnectionId: null,
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: false,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    expect(githubUser).toBeDefined();
    expect(githubUser.githubId).toBe('gh987654');
    expect(githubUser.nangoConnectionId).toBe('nango_conn_123');
  });

  it('should handle password-authenticated user', () => {
    // Test type safety for password-authenticated user
    const passwordUser: User = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'passworduser',
      email: 'password@example.com',
      passwordHash: 'hashed_password_here',
      githubId: null,
      githubUsername: null,
      avatarUrl: null,
      nangoConnectionId: null,
      incomingConnectionId: null,
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: false,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    expect(passwordUser).toBeDefined();
    expect(passwordUser.email).toBe('password@example.com');
    expect(passwordUser.passwordHash).toBe('hashed_password_here');
  });

  it('should handle verified author with claimed username', () => {
    // Test type safety for verified author with claimed username
    const verifiedAuthor: User = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'authoruser',
      email: 'author@example.com',
      passwordHash: null,
      githubId: 'gh111222',
      githubUsername: 'authoruser',
      avatarUrl: 'https://example.com/author-avatar.png',
      nangoConnectionId: 'nango_conn_456',
      incomingConnectionId: null,
      claimedAuthorUsername: 'famous-author',
      authorBio: 'A well-known package author',
      authorWebsite: 'https://author-website.com',
      authorTwitter: '@famousauthor',
      authorClaimedAt: new Date('2025-01-15'),
      website: 'https://personal-site.com',
      verifiedAuthor: true,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    expect(verifiedAuthor).toBeDefined();
    expect(verifiedAuthor.verifiedAuthor).toBe(true);
    expect(verifiedAuthor.claimedAuthorUsername).toBe('famous-author');
    expect(verifiedAuthor.authorBio).toBe('A well-known package author');
  });

  it('should handle admin user', () => {
    // Test type safety for admin user
    const adminUser: User = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'admin',
      email: 'admin@pr-pm.dev',
      passwordHash: 'hashed_admin_password',
      githubId: null,
      githubUsername: null,
      avatarUrl: null,
      nangoConnectionId: null,
      incomingConnectionId: null,
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: true,
      isAdmin: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    expect(adminUser).toBeDefined();
    expect(adminUser.isAdmin).toBe(true);
    expect(adminUser.verifiedAuthor).toBe(true);
  });

  it('should correctly map camelCase to snake_case', () => {
    // Verify that the schema correctly maps TypeScript camelCase to database snake_case
    const table = users;

    // Check that the table name is correct
    expect(table).toBeDefined();

    // Verify column name mappings exist
    expect(table.passwordHash.name).toBe('password_hash');
    expect(table.githubId.name).toBe('github_id');
    expect(table.githubUsername.name).toBe('github_username');
    expect(table.avatarUrl.name).toBe('avatar_url');
    expect(table.nangoConnectionId.name).toBe('nango_connection_id');
    expect(table.incomingConnectionId.name).toBe('incoming_connection_id');
    expect(table.claimedAuthorUsername.name).toBe('claimed_author_username');
    expect(table.authorBio.name).toBe('author_bio');
    expect(table.authorWebsite.name).toBe('author_website');
    expect(table.authorTwitter.name).toBe('author_twitter');
    expect(table.authorClaimedAt.name).toBe('author_claimed_at');
    expect(table.verifiedAuthor.name).toBe('verified_author');
    expect(table.isAdmin.name).toBe('is_admin');
    expect(table.isActive.name).toBe('is_active');
    expect(table.createdAt.name).toBe('created_at');
    expect(table.updatedAt.name).toBe('updated_at');
    expect(table.lastLoginAt.name).toBe('last_login_at');
  });

  it('should enforce type constraints', () => {
    // Test that TypeScript catches type errors at compile time
    const user: User = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'testuser',
      email: null,
      passwordHash: null,
      githubId: null,
      githubUsername: null,
      avatarUrl: null,
      nangoConnectionId: null,
      incomingConnectionId: null,
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: false,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    // These should be the correct types
    const idIsString: string = user.id;
    const usernameIsString: string = user.username;
    const isAdminIsBoolean: boolean = user.isAdmin;
    const createdAtIsDate: Date = user.createdAt;

    expect(idIsString).toBeDefined();
    expect(usernameIsString).toBeDefined();
    expect(isAdminIsBoolean).toBeDefined();
    expect(createdAtIsDate).toBeDefined();
  });

  it('should handle user with Nango connection ID migration', () => {
    // Test type safety for user during Nango connection migration
    const userMigrating: User = {
      id: '550e8400-e29b-41d4-a716-446655440005',
      username: 'migrating-user',
      email: 'migrating@example.com',
      passwordHash: null,
      githubId: 'gh_migrate',
      githubUsername: 'migrating-user',
      avatarUrl: 'https://example.com/avatar.png',
      nangoConnectionId: 'old_conn_123',
      incomingConnectionId: 'new_conn_456',
      claimedAuthorUsername: null,
      authorBio: null,
      authorWebsite: null,
      authorTwitter: null,
      authorClaimedAt: null,
      website: null,
      verifiedAuthor: false,
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    expect(userMigrating).toBeDefined();
    expect(userMigrating.nangoConnectionId).toBe('old_conn_123');
    expect(userMigrating.incomingConnectionId).toBe('new_conn_456');
  });
});
