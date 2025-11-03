import { eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { users, type User, type NewUser } from '../schema/users.js';

/**
 * User Repository
 *
 * Provides type-safe database operations for users.
 * Used by authentication routes, author management, and user profile endpoints.
 */
export class UserRepository {
  /**
   * Find user by ID
   *
   * Primary lookup method for authenticated requests.
   * Used by /api/v1/auth/me and permission checks.
   */
  async findById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by username
   *
   * Used for username validation during registration
   * and for public author profile lookups.
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by username', {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by username (case-insensitive)
   *
   * Used for author profile lookups where case doesn't matter.
   * Returns user with additional author-relevant fields.
   */
  async findByUsernameCaseInsensitive(username: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${username})`)
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by username (case-insensitive)', {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by email
   *
   * Used by email/password login endpoint.
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by GitHub ID
   *
   * Used by Nango webhook to check if user already exists
   * during GitHub OAuth login flow.
   */
  async findByGithubId(githubId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by GitHub ID', {
        githubId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by Nango incoming connection ID
   *
   * Used by authentication polling endpoint to check if
   * webhook has processed the GitHub OAuth callback.
   */
  async findByIncomingConnectionId(connectionId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.incomingConnectionId, connectionId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by incoming connection ID', {
        connectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get user's GitHub username
   *
   * Used by package claiming endpoint to match packages
   * to users by GitHub username.
   */
  async getGithubUsername(userId: string): Promise<string | null> {
    try {
      const [user] = await db
        .select({
          githubUsername: users.githubUsername,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user?.githubUsername || null;
    } catch (error) {
      console.error('Failed to get GitHub username', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get basic user profile fields
   *
   * Used by /api/v1/auth/me endpoint.
   * Returns only public-safe fields.
   */
  async getProfile(
    userId: string
  ): Promise<Pick<
    User,
    | 'id'
    | 'username'
    | 'email'
    | 'avatarUrl'
    | 'website'
    | 'verifiedAuthor'
    | 'isAdmin'
  > | null> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          avatarUrl: users.avatarUrl,
          website: users.website,
          verifiedAuthor: users.verifiedAuthor,
          isAdmin: users.isAdmin,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to get user profile', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if username exists
   *
   * Lightweight check used during registration validation.
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return !!user;
    } catch (error) {
      console.error('Failed to check username existence', {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if email exists
   *
   * Lightweight check used during registration validation.
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return !!user;
    } catch (error) {
      console.error('Failed to check email existence', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new user
   *
   * Used by registration and GitHub OAuth webhook.
   * Returns full user record with generated ID.
   */
  async create(data: NewUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(data)
        .returning();

      return user;
    } catch (error) {
      console.error('Failed to create user', {
        username: data.username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update last login timestamp
   *
   * Called after successful authentication.
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Failed to update last login', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update user website
   *
   * Used by /api/v1/auth/me PATCH endpoint.
   */
  async updateWebsite(userId: string, website: string | null): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          website,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return user;
    } catch (error) {
      console.error('Failed to update user website', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update Nango connection IDs
   *
   * Called by Nango webhook when processing GitHub OAuth.
   * Handles both new connections and returning user logins.
   */
  async updateNangoConnection(
    userId: string,
    data: {
      nangoConnectionId?: string;
      incomingConnectionId?: string;
      githubUsername?: string;
    }
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          ...data,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Failed to update Nango connection', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update verified author status
   *
   * Called by admin endpoints to verify authors.
   */
  async updateVerifiedStatus(userId: string, verified: boolean): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          verifiedAuthor: verified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Failed to update verified status', {
        userId,
        verified,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update user active status
   *
   * Used to soft-delete or reactivate user accounts.
   */
  async updateActiveStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Failed to update active status', {
        userId,
        isActive,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update user profile fields
   *
   * Generic update method for profile customization.
   */
  async updateProfile(
    userId: string,
    data: {
      website?: string | null;
      authorBio?: string | null;
      authorWebsite?: string | null;
      authorTwitter?: string | null;
    }
  ): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return user;
    } catch (error) {
      console.error('Failed to update user profile', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
