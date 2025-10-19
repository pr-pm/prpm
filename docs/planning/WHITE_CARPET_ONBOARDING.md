# 🎖️ PRPM White Carpet Onboarding System

**Status:** ✅ Complete and Ready
**Created:** October 19, 2025
**Version:** 1.0.0

## Overview

The White Carpet Onboarding System provides premium, invitation-only author verification for PRPM's top package contributors. This system enables personalized, secure invite links that allow authors to claim their username, verify their identity, and gain full control over their packages.

---

## 🏗️ System Architecture

### Backend Infrastructure (Registry API)

**Database Tables:**
- `author_invites` - Secure invite tokens and status tracking
- `author_claims` - Verification and claim history
- `users` - Extended with author-specific fields

**API Endpoints:**
```
GET  /api/v1/invites/:token          - Validate and view invite
POST /api/v1/invites/:token/claim    - Claim invite (requires auth)
GET  /api/v1/invites/stats           - Admin statistics
```

**Frontend:**
- Static HTML claim page at `/public/claim.html`
- Can be served via: `https://prpm.ai/claim/:token`

---

## 🔐 Security Features

✅ **64-character random tokens** (pgcrypto)
✅ **Single-use invites** (status tracking)
✅ **90-day expiration** (auto-expires)
✅ **Transaction-safe claiming** (ACID compliance)
✅ **Full audit trail** (who claimed what, when)
✅ **Username reservation** (prevents conflicts)

---

## 📋 Invite Flow

### 1. **Admin Creates Invite**

```sql
SELECT create_author_invite(
  'sanjeed5',  -- author username
  NULL,        -- optional email
  (SELECT id FROM users WHERE username = 'admin'),
  'Your personalized message here',
  90           -- days until expiration
);
```

Returns:
```
invite_id: uuid
token: 64-char hex string
claim_url: https://prpm.ai/claim/{token}
```

### 2. **Author Receives Invite**

Admin sends email/DM with personalized claim URL:
```
https://prpm.ai/claim/e3897f9722b225ec974b00529d094e4127a0b02d21c69fd6d8ddabb02dfccca3
```

### 3. **Author Visits Claim Page**

- Sees their username, package count, personalized message
- Views benefits of claiming
- Clicks "Claim Your Profile Now"

### 4. **GitHub OAuth Authentication**

- Redirects to GitHub login
- Verifies identity
- Returns to claim page

### 5. **Claim Completion**

Backend performs (in transaction):
1. Validates invite is still valid
2. Checks username not already claimed
3. Updates user with `claimed_author_username`
4. Marks user as `verified_author`
5. Creates `author_claims` record
6. Updates all packages with `author_id`
7. Marks invite as `claimed`

### 6. **Success**

Author receives:
- ✅ Verified badge
- ✅ Ownership of all packages
- ✅ Access to author dashboard
- ✅ Featured placement

---

## 📊 Current Invites

**10 invites created** for top authors:

| Author | Packages | Claim URL |
|--------|----------|-----------|
| @sanjeed5 | 239 | `...e3897f97...` |
| @patrickjs | 176 | `...215fcb42...` |
| @jhonma82 | 131 | `...199db6db...` |
| @ivangrynenko | 79 | `...de3ebf99...` |
| @voltagent | 70 | `...df284728...` |
| @community | 40 | `...0678e3b8...` |
| @lst97 | 37 | `...65b37028...` |
| @flyeric0212 | 34 | `...003d50be...` |
| @blefnk | 20 | `...abed2280...` |
| @obra | 20 | `...c52266cb...` |

**Total:** 866 packages (83% of registry)
**Expires:** January 17, 2026
**Status:** All pending

Full URLs documented in: `AUTHOR_INVITES.md`

---

## 🎁 Author Benefits

When an author claims their invite, they receive:

### Immediate Benefits
- 🎖️ **Verified Author Badge** - Displayed on profile and packages
- 📦 **Package Ownership** - Edit, update, deprecate their packages
- 📊 **Analytics Dashboard** - Downloads, stars, trending data
- 🔔 **Notification Settings** - Control what emails they receive

### Profile Features
- 📝 **Custom Bio** - Tell their story
- 🔗 **Social Links** - GitHub, Twitter, website
- 🌐 **Author Page** - `prpm.ai/author/@username`
- 📷 **Avatar** - From GitHub or custom upload

### Community Access
- 💬 **Author Forum** - Private community
- 🎤 **Featured Placement** - Homepage, newsletters
- 🏆 **Leaderboards** - Top contributors
- 📢 **Announcements** - Package updates, news

---

## 🛠️ Technical Implementation

### Database Schema

```sql
-- Author invites table
CREATE TABLE author_invites (
  id UUID PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  author_username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  package_count INTEGER,
  status VARCHAR(50) CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  expires_at TIMESTAMP,
  claimed_by UUID REFERENCES users(id),
  claimed_at TIMESTAMP,
  -- ...
);

-- Author claims tracking
CREATE TABLE author_claims (
  id UUID PRIMARY KEY,
  invite_id UUID REFERENCES author_invites(id),
  user_id UUID REFERENCES users(id),
  author_username VARCHAR(100),
  verification_method VARCHAR(50),
  github_verified BOOLEAN,
  packages_claimed INTEGER,
  -- ...
);

-- Extended users table
ALTER TABLE users ADD COLUMN claimed_author_username VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN verified_author BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN author_bio TEXT;
-- ...
```

### Helper Functions

```sql
-- Generate secure token
CREATE FUNCTION generate_invite_token() RETURNS VARCHAR(64);

-- Create invite (returns claim URL)
CREATE FUNCTION create_author_invite(
  p_author_username VARCHAR(100),
  p_email VARCHAR(255),
  p_invited_by UUID,
  p_invite_message TEXT,
  p_expires_days INTEGER
) RETURNS TABLE (invite_id UUID, token VARCHAR(64), claim_url TEXT);
```

### Views

```sql
-- Active invites
CREATE VIEW active_author_invites AS
SELECT * FROM author_invites
WHERE status = 'pending' AND expires_at > NOW();

-- Top unclaimed authors
CREATE VIEW top_unclaimed_authors AS
SELECT
  author_username,
  COUNT(*) as package_count,
  is_claimed,
  has_pending_invite
FROM packages
GROUP BY author_username
HAVING COUNT(*) >= 5
ORDER BY package_count DESC;
```

---

## 📡 API Reference

### Get Invite Details

```http
GET /api/v1/invites/:token
```

**Response 200:**
```json
{
  "invite": {
    "id": "uuid",
    "author_username": "sanjeed5",
    "package_count": 239,
    "invite_message": "Thank you for...",
    "status": "pending",
    "expires_at": "2026-01-17T00:00:00Z",
    "created_at": "2025-10-19T00:00:00Z"
  }
}
```

**Error Responses:**
- 404: Invite not found
- 410: Invite expired or already claimed
- 403: Invite revoked

### Claim Invite

```http
POST /api/v1/invites/:token/claim
Authorization: Bearer <jwt_token>

{
  "github_username": "sanjeed5",
  "email": "email@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Successfully claimed @sanjeed5! You now own 239 packages.",
  "user": {
    "id": "uuid",
    "username": "sanjeed5",
    "claimed_author_username": "sanjeed5",
    "verified_author": true,
    "package_count": 239
  }
}
```

**Error Responses:**
- 401: Not authenticated
- 404: Invalid token
- 409: Username already claimed
- 410: Invite expired

### Get Statistics (Admin)

```http
GET /api/v1/invites/stats
Authorization: Bearer <admin_jwt_token>
```

**Response 200:**
```json
{
  "total_invites": 10,
  "pending": 10,
  "claimed": 0,
  "expired": 0,
  "revoked": 0,
  "total_packages": 866,
  "claimed_packages": 0
}
```

---

## 🚀 Deployment

### Prerequisites

1. ✅ PostgreSQL with `pgcrypto` extension
2. ✅ Migration `004_add_author_invites.sql` applied
3. ✅ GitHub OAuth configured
4. ✅ Email service (optional, for notifications)

### Configuration

```env
# .env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_CALLBACK_URL=https://prpm.ai/api/v1/auth/github/callback

# Optional: Email for invite notifications
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_api_key
FROM_EMAIL=invites@prpm.ai
```

### Serve Static Files

Add to `src/index.ts`:

```typescript
import fastifyStatic from '@fastify/static';
import path from 'path';

// Serve static files
server.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/claim/',
  serve: true
});

// Redirect /claim/:token to /claim/?token=:token
server.get('/claim/:token', async (request, reply) => {
  const { token } = request.params as { token: string };
  return reply.redirect(`/claim/?token=${token}`);
});
```

---

## 📧 Email Templates (Future)

### Invite Email

```
Subject: 🎖️ You're Invited to Claim Your PRPM Author Profile!

Hi @{author_username},

You've been invited to claim your verified author profile on PRPM!

Your {package_count} packages have been helping developers worldwide,
and we'd love to officially recognize your contributions.

Claim your profile to get:
✓ Verified author badge
✓ Edit access to all your packages
✓ Package analytics dashboard
✓ Featured placement on PRPM

Claim your profile: {claim_url}

This invite expires on {expiry_date}.

Best regards,
The PRPM Team
```

### Expiration Reminder (7 days before)

```
Subject: ⏰ Your PRPM Invite Expires in 7 Days

Hi @{author_username},

Your PRPM author invite will expire in 7 days.

Don't miss out on claiming your verified profile!
Claim now: {claim_url}

Questions? Reply to this email.
```

### Welcome Email (After Claim)

```
Subject: 🎉 Welcome to PRPM, @{author_username}!

Congratulations! You've successfully claimed your author profile.

Next steps:
1. Complete your profile: {profile_url}
2. Explore your dashboard: {dashboard_url}
3. Join our author community: {community_url}

You now have full control over your {package_count} packages.

Welcome to the PRPM family!
```

---

## 📊 Monitoring & Analytics

### SQL Queries

**Check invite status:**
```sql
SELECT * FROM active_author_invites;
```

**See claim rate:**
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM author_invites
GROUP BY status;
```

**Top unclaimed authors:**
```sql
SELECT * FROM top_unclaimed_authors LIMIT 20;
```

**Recent claims:**
```sql
SELECT
  ac.*,
  u.username,
  u.email,
  ai.package_count
FROM author_claims ac
JOIN users u ON ac.user_id = u.id
JOIN author_invites ai ON ac.invite_id = ai.id
ORDER BY ac.claimed_at DESC
LIMIT 10;
```

---

## 🎯 Success Metrics

### Key Performance Indicators

- **Claim Rate:** % of invites claimed within 30 days
- **Time to Claim:** Average days between invite and claim
- **Package Coverage:** % of packages with verified authors
- **Author Engagement:** % of claimed authors who edit packages

### Target Goals

- 📈 **80% claim rate** within 30 days
- ⚡ **<7 days** average time to claim
- 🎯 **90% package coverage** with verified authors
- 💪 **60% author engagement** (active authors)

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features

- [ ] **Email Automation** - Auto-send invites and reminders
- [ ] **Batch Invite Creation** - UI for creating multiple invites
- [ ] **Custom Invite Messages** - Template system with variables
- [ ] **Invite Analytics Dashboard** - Track claim rates, engagement
- [ ] **Author Tiers** - Bronze, Silver, Gold, Platinum based on contributions
- [ ] **Referral System** - Authors can invite other authors
- [ ] **Integration with GitHub** - Auto-verify via GitHub commits
- [ ] **Social Proof** - Show verified badges across site

### Phase 3: Community Building

- [ ] **Author Directory** - Public listing of verified authors
- [ ] **Author Collaboration** - Co-ownership of packages
- [ ] **Author Insights** - Impact metrics, reach statistics
- [ ] **Monthly Highlights** - Feature top authors
- [ ] **AMA Sessions** - Author Q&A events
- [ ] **Bounty System** - Rewards for contributions

---

## 📝 Notes for Admins

### Creating New Invites

```sql
-- For individual authors
SELECT create_author_invite(
  'username',
  'email@example.com',  -- optional
  (SELECT id FROM users WHERE username = 'admin'),
  'Personal message here',
  90  -- days
);

-- Batch create for top 20 unclaimed authors
INSERT INTO author_invites (token, author_username, package_count, ...)
SELECT
  generate_invite_token(),
  author_username,
  package_count,
  ...
FROM top_unclaimed_authors
WHERE NOT has_pending_invite
LIMIT 20;
```

### Revoking Invites

```sql
UPDATE author_invites
SET status = 'revoked', updated_at = NOW()
WHERE author_username = 'username' AND status = 'pending';
```

### Extending Expiration

```sql
UPDATE author_invites
SET expires_at = expires_at + INTERVAL '30 days'
WHERE author_username = 'username';
```

---

## 🎖️ Summary

The White Carpet Onboarding System provides a **premium, personalized experience** for PRPM's most valuable contributors:

✅ **10 invites created** for top authors
✅ **866 packages** (83% of registry) ready to claim
✅ **Secure, single-use tokens** with 90-day expiration
✅ **Beautiful claim page** with personalized messaging
✅ **Full API implementation** with transaction safety
✅ **Comprehensive documentation** for admins and developers

**Status:** Production-ready and waiting for author outreach!

---

**Last Updated:** October 19, 2025
**Maintained By:** PRPM Core Team
**Contact:** authors@prpm.ai
