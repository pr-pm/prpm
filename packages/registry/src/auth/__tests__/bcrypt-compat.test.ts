import { describe, expect, it } from 'vitest';
import { compare } from 'bcrypt';

// Generated with bcrypt 5.1.1 to guard existing user passwords during upgrades.
const LEGACY_HASH = '$2b$10$8kMqP.flJeEGA55mV.JHq.Boy1XF0brN/qb/6Oo3ThS9nRHBpsW3q';

describe('bcrypt password compatibility', () => {
  it('verifies a password hash created by bcrypt 5', async () => {
    expect(await compare('legacy-password-2026', LEGACY_HASH)).toBe(true);
    expect(await compare('wrong-password', LEGACY_HASH)).toBe(false);
  });
});
