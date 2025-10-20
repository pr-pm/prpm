# Pre-Launch Gap Analysis

**Date:** 2025-10-20
**Launch Target:** Few hours
**Status:** 🟡 CRITICAL GAPS IDENTIFIED

---

## Executive Summary

### ⚠️ CRITICAL ISSUES (Must Fix Before Launch)

1. **❌ Database Password Typo** - `.env` has `prmp` instead of `prpm`
2. **❌ Database Not Running** - Server cannot start due to DB connection failure
3. **⚠️ Migration Conflicts** - Duplicate migration numbers (002, 003, 004, 005)
4. **⚠️ AI Scoring Not Configured** - No ANTHROPIC_API_KEY set
5. **⚠️ GitHub OAuth Not Configured** - Missing CLIENT_ID/SECRET

### ✅ READY Components

- Code builds successfully (webapp + registry)
- 35/35 tests passing (100%)
- Infrastructure code complete (Pulumi)
- Documentation comprehensive
- Logging system enhanced
- Quality scoring implemented

---

## 🔴 CRITICAL GAPS (Blocker)

### 1. Database Connection Issues

**Problem:**
```bash
# Current .env has typo
DATABASE_URL=postgresql://prpm:prmp@localhost:5432/prpm_registry
                               ^^^^
                              WRONG
```

**Impact:** Server cannot start, all API endpoints fail

**Fix Required:**
```bash
# Correct password
DATABASE_URL=postgresql://prpm:prpm@localhost:5432/prpm_registry
```

**Estimated Time:** 1 minute

---

### 2. Migration File Conflicts

**Problem:** Duplicate migration numbers

**Current State:**
```
001_initial_schema.sql           ✅
002_add_quality_scoring.sql      🔴 CONFLICT
002_search_optimization.sql      🔴 CONFLICT
003_add_collections.sql          🔴 CONFLICT
003_add_official_column.sql      🔴 CONFLICT
004_add_author_invites.sql       🔴 CONFLICT
004_add_category_index.sql       🔴 CONFLICT
005_enhanced_analytics.sql       🔴 CONFLICT
005_add_mcp_remote_field.sql     🔴 CONFLICT
006_add_password_auth.sql        ✅
```

**Impact:** Migrations will fail or run in wrong order

**Fix Required:** Renumber migrations sequentially:
```
001_initial_schema.sql
002_add_quality_scoring.sql
003_search_optimization.sql
004_add_collections.sql
005_add_official_column.sql
006_add_author_invites.sql
007_add_category_index.sql
008_enhanced_analytics.sql
009_add_mcp_remote_field.sql
010_add_password_auth.sql
```

**Estimated Time:** 15 minutes

---

### 3. Database Not Running

**Problem:** Database service not started

**Evidence:**
```
{"level":50,"time":1760939439760,"error":"password authentication failed"}
```

**Fix Required:**
1. Start PostgreSQL service:
   ```bash
   sudo systemctl start postgresql
   # OR if using Docker:
   docker-compose up -d postgres
   ```

2. Create database if not exists:
   ```bash
   createdb -U prpm prpm_registry
   ```

3. Run migrations:
   ```bash
   npm run migrate
   ```

**Estimated Time:** 5 minutes

---

## 🟡 HIGH PRIORITY (Should Fix)

### 4. AI Scoring Configuration

**Problem:** ANTHROPIC_API_KEY not set in .env

**Current State:**
```bash
# Missing from .env
# ANTHROPIC_API_KEY=sk-ant-xxx
# AI_EVALUATION_ENABLED=true
```

**Impact:**
- AI-powered quality scoring will fall back to heuristics
- Lower quality score accuracy
- Missing key differentiator feature

**Fix Required:**
1. Get Anthropic API key from https://console.anthropic.com/
2. Add to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   AI_EVALUATION_ENABLED=true
   ```

**Estimated Time:** 5 minutes (if you have API key)

---

### 5. GitHub OAuth Not Configured

**Problem:** Missing OAuth credentials

**Current State:**
```bash
# From .env.example, but not in actual .env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Impact:**
- Users cannot sign in with GitHub
- Only email/password auth available
- Reduced user adoption

**Fix Required:**
1. Create GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - New OAuth App
   - Homepage URL: `https://prpm.dev` (or your domain)
   - Callback URL: `https://prpm.dev/api/v1/auth/github/callback`

2. Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=Iv1.xxxxx
   GITHUB_CLIENT_SECRET=xxxxx
   GITHUB_CALLBACK_URL=https://prpm.dev/api/v1/auth/github/callback
   ```

**Estimated Time:** 10 minutes

---

### 6. JWT Secret Not Production-Ready

**Problem:** Using default/weak JWT secret

**Current State:**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**Impact:** Security risk, tokens could be forged

**Fix Required:**
```bash
# Generate strong secret
JWT_SECRET=$(openssl rand -hex 64)

# Or use:
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

**Estimated Time:** 2 minutes

---

## 🟢 NICE TO HAVE (Optional)

### 7. Redis Not Running

**Current State:** Using localhost Redis (may not be running)

**Impact:** Cache disabled, slower performance

**Fix:**
```bash
# Start Redis
sudo systemctl start redis
# OR
docker run -d -p 6379:6379 redis:7-alpine
```

**Estimated Time:** 2 minutes

---

### 8. S3/MinIO Not Configured for Production

**Current State:** Using localhost MinIO for development

**Impact:** Package storage won't work in production

**Fix Required:**
1. Set up AWS S3 bucket or production MinIO
2. Update `.env`:
   ```bash
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_BUCKET=prpm-packages-prod
   S3_ACCESS_KEY_ID=AKIA...
   S3_SECRET_ACCESS_KEY=...
   AWS_FORCE_PATH_STYLE=false  # For AWS S3
   ```

**Estimated Time:** 15 minutes

---

### 9. Production Seed Data

**Problem:** No production seed data plan

**Impact:** Empty registry on launch

**Options:**
1. Run existing seed scripts:
   ```bash
   npm run seed:all
   ```

2. Import curated packages from scraped data:
   - `scraped-cursor-directory-enhanced.json` (100+ packages)
   - `scraped-claude-skills-enhanced.json` (50+ packages)
   - Collections: `new-collections.json`

**Estimated Time:** 30 minutes

---

### 10. Domain & SSL Configuration

**Problem:** No domain configured in environment

**Current State:**
```bash
FRONTEND_URL=http://localhost:5173  # Development only
```

**Fix Required:**
```bash
# Production values
FRONTEND_URL=https://prpm.dev
BACKEND_URL=https://api.prpm.dev
```

**Plus:**
- Configure SSL certificates (Let's Encrypt or AWS ACM)
- Update DNS records
- Configure CORS for production domain

**Estimated Time:** 30 minutes

---

## 📊 Component Readiness Matrix

| Component | Status | Blocker? | Time to Fix |
|-----------|--------|----------|-------------|
| **Registry API** | 🟡 | ⚠️ DB Issue | 5 min |
| **Database Schema** | 🟡 | ⚠️ Migrations | 15 min |
| **Authentication** | 🟡 | ⚠️ OAuth | 10 min |
| **Quality Scoring** | 🟡 | No | 5 min |
| **File Storage** | 🟡 | No | 15 min |
| **CLI** | ✅ | No | 0 min |
| **Web App** | ✅ | No | 0 min |
| **Infrastructure** | ✅ | No | 0 min |
| **Documentation** | ✅ | No | 0 min |
| **Tests** | ✅ | No | 0 min |

---

## 🚀 Launch Checklist

### ⚠️ MUST DO (Before Launch)

- [ ] **Fix database password typo in .env** (1 min)
- [ ] **Start PostgreSQL database** (2 min)
- [ ] **Renumber migration files** (15 min)
- [ ] **Run migrations** (2 min)
- [ ] **Generate production JWT secret** (2 min)
- [ ] **Start Redis** (2 min)
- [ ] **Verify server starts successfully** (1 min)

**Total Critical Path Time:** ~25 minutes

---

### 🎯 SHOULD DO (Launch Day)

- [ ] **Configure GitHub OAuth** (10 min)
- [ ] **Add Anthropic API key** (5 min)
- [ ] **Set up production S3/storage** (15 min)
- [ ] **Seed initial packages** (30 min)
- [ ] **Configure production domain** (30 min)
- [ ] **Test end-to-end flow** (15 min)

**Total Recommended Time:** ~2 hours

---

### 📋 NICE TO HAVE (Post-Launch)

- [ ] Set up monitoring (Datadog/CloudWatch)
- [ ] Configure error tracking (Sentry)
- [ ] Set up automated backups
- [ ] Configure CDN for assets
- [ ] Set up CI/CD pipeline
- [ ] Load testing
- [ ] Performance optimization
- [ ] SEO optimization

---

## 🔧 Quick Fix Script

Save this as `quick-fixes.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Running pre-launch quick fixes..."

# 1. Fix database password
echo "1. Fixing database password..."
sed -i 's/prpm:prmp@/prpm:prpm@/' packages/registry/.env

# 2. Generate JWT secret
echo "2. Generating JWT secret..."
JWT_SECRET=$(openssl rand -hex 64)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" packages/registry/.env

# 3. Renumber migrations
echo "3. Renumbering migrations..."
cd packages/registry/migrations
mv 002_search_optimization.sql 003_search_optimization.sql.tmp
mv 003_add_collections.sql 004_add_collections.sql.tmp
mv 003_add_official_column.sql 005_add_official_column.sql.tmp
mv 004_add_author_invites.sql 006_add_author_invites.sql.tmp
mv 004_add_category_index.sql 007_add_category_index.sql.tmp
mv 005_enhanced_analytics.sql 008_enhanced_analytics.sql.tmp
mv 005_add_mcp_remote_field.sql 009_add_mcp_remote_field.sql.tmp
mv 006_add_password_auth.sql 010_add_password_auth.sql.tmp

# Remove .tmp extension
for f in *.tmp; do mv "$f" "${f%.tmp}"; done
cd ../../..

# 4. Start services (if using Docker Compose)
echo "4. Starting services..."
docker-compose up -d postgres redis

# Wait for postgres
echo "Waiting for PostgreSQL..."
sleep 5

# 5. Run migrations
echo "5. Running migrations..."
cd packages/registry
npm run migrate

echo "✅ Quick fixes complete!"
echo ""
echo "⚠️  Still need to configure manually:"
echo "   - GitHub OAuth (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)"
echo "   - Anthropic API (ANTHROPIC_API_KEY)"
echo "   - Production domain (FRONTEND_URL, BACKEND_URL)"
echo "   - S3 storage (S3_BUCKET, credentials)"
```

**Run with:**
```bash
chmod +x quick-fixes.sh
./quick-fixes.sh
```

---

## 📈 Risk Assessment

### High Risk (Must Address)
- Database connection failure → **Server won't start**
- Migration conflicts → **Data corruption possible**
- Weak JWT secret → **Security vulnerability**

### Medium Risk (Should Address)
- No GitHub OAuth → **Reduced user adoption**
- No AI scoring → **Feature incomplete**
- No production storage → **Package uploads fail**

### Low Risk (Can Defer)
- No monitoring → **Harder to debug**
- No CDN → **Slower performance**
- No seed data → **Empty on launch**

---

## 🎯 Recommended Launch Path

### Option A: Minimum Viable Launch (30 minutes)
1. Fix database password
2. Renumber migrations
3. Start services
4. Generate JWT secret
5. Run migrations
6. **LAUNCH** with basic features

**Limitations:**
- No GitHub OAuth (email/password only)
- Heuristic quality scoring (no AI)
- Local storage only

---

### Option B: Full Feature Launch (2.5 hours)
1. All steps from Option A
2. Configure GitHub OAuth
3. Add Anthropic API key
4. Set up S3 storage
5. Seed 100+ packages
6. Configure production domain
7. End-to-end testing
8. **LAUNCH** with all features

**Benefits:**
- Complete feature set
- Better user experience
- Production-ready

---

### Option C: Staged Launch (Today + Tomorrow)
**Today (30 min):**
- Fix critical issues (Option A)
- Launch to limited users
- Gather initial feedback

**Tomorrow (2 hours):**
- Add GitHub OAuth
- Enable AI scoring
- Set up production storage
- Seed packages
- Full public launch

**Benefits:**
- Fast initial launch
- Test with real users
- Iterate based on feedback

---

## 💡 Recommendations

### For Launch in Few Hours → **Choose Option A**

**Why:**
- Fastest path to launch (30 min)
- Core features working
- Can iterate post-launch

**What to do:**
1. Run `quick-fixes.sh`
2. Verify server starts
3. Test basic flows:
   - Sign up with email
   - Publish a package
   - Search packages
4. Deploy to production
5. Monitor for issues

**What to defer:**
- GitHub OAuth (add tomorrow)
- AI scoring (add tomorrow)
- Package seeding (do gradually)

---

### For Launch Tomorrow → **Choose Option B**

**Why:**
- Complete feature set
- Better first impression
- More polished experience

**Timeline:**
- Today: Fix critical issues, test locally
- Tonight: Configure OAuth + AI
- Tomorrow AM: Deploy and test staging
- Tomorrow PM: Production launch

---

## 📞 Support Checklist

**Before Launch:**
- [ ] Create support email (support@prpm.dev)
- [ ] Set up status page (status.prpm.dev)
- [ ] Prepare incident response plan
- [ ] Document known issues
- [ ] Create user onboarding guide

**After Launch:**
- [ ] Monitor logs for errors
- [ ] Watch for user signups
- [ ] Track package publications
- [ ] Respond to feedback
- [ ] Fix bugs quickly

---

## 🎉 Success Metrics (First 24 Hours)

**Minimum Success:**
- [ ] 10+ user signups
- [ ] 5+ packages published
- [ ] Zero critical errors
- [ ] <100ms average response time

**Good Success:**
- [ ] 50+ user signups
- [ ] 25+ packages published
- [ ] 100+ searches performed
- [ ] Positive user feedback

**Great Success:**
- [ ] 100+ user signups
- [ ] 50+ packages published
- [ ] 500+ searches performed
- [ ] Viral social media traction

---

## 🔥 Emergency Rollback Plan

**If launch goes wrong:**

```bash
# 1. Take server offline
docker-compose down

# 2. Restore database backup
pg_restore -U prpm -d prpm_registry backup.sql

# 3. Revert to stable version
git reset --hard <stable-commit>

# 4. Rebuild
npm run build

# 5. Restart with safe config
NODE_ENV=production npm start

# 6. Put up maintenance page
# "We're experiencing technical difficulties. Back soon!"
```

---

## Summary

**Current Status:** 🟡 **NOT READY** (Critical issues present)

**Time to Ready:** 30 minutes (minimum) or 2.5 hours (complete)

**Recommended Path:** Fix critical issues first, launch basic version, iterate

**Next Steps:**
1. Run `quick-fixes.sh`
2. Test locally
3. Choose launch option
4. Execute plan
5. Monitor closely

**Key Message:** The code is solid, but configuration issues need immediate attention. With 30 minutes of focused work, you can launch with core features working.

🚀 **You're close! Just need to fix the config issues and you're ready to go!**
