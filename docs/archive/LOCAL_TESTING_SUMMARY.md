# Local GitHub Actions Testing - Setup Complete

**Tool**: `act` - Run GitHub Actions locally
**Status**: ✅ Documented and Ready
**Date**: October 18, 2025

---

## 🎉 What Was Set Up

Complete local testing solution for GitHub Actions workflows using **act**.

### Created Files:

1. **LOCAL_GITHUB_ACTIONS_TESTING.md** (6,000+ words)
   - Complete installation guide
   - Configuration instructions
   - Usage examples for all workflows
   - Troubleshooting guide
   - Best practices
   - Quick reference card

2. **scripts/setup-act.sh**
   - Automated act installation
   - Prerequisites checking
   - Guided setup process

3. **scripts/test-workflows-local.sh**
   - Interactive menu for testing workflows
   - Dry run support
   - All workflows accessible

---

## 🚀 Quick Start

### 1. Install act

```bash
# Run the setup script
./scripts/setup-act.sh

# Or install manually
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### 2. Verify Installation

```bash
act --version
```

### 3. Test Workflows

```bash
# Interactive menu
./scripts/test-workflows-local.sh

# Or run directly
act -l                                    # List all workflows
act -W .github/workflows/ci.yml          # Run CI workflow
act -W .github/workflows/e2e-tests.yml   # Run E2E tests
```

---

## 📋 Available Workflows to Test

| Workflow | Command | Duration |
|----------|---------|----------|
| **CI** | `act -W .github/workflows/ci.yml` | ~5 min |
| **E2E Tests** | `act -W .github/workflows/e2e-tests.yml` | ~8 min |
| **Code Quality** | `act -W .github/workflows/code-quality.yml` | ~3 min |
| **PR Checks** | `act pull_request -W .github/workflows/pr-checks.yml` | ~2 min |

---

## 🎯 Common Use Cases

### Before Pushing Code

```bash
# Quick validation
act --dryrun                              # Preview what would run
act -j typescript-check                   # Check TypeScript
act -j security-audit                     # Check vulnerabilities
```

### Testing Specific Jobs

```bash
# Registry tests only
act -j registry-tests

# CLI tests only
act -j cli-tests

# E2E tests only
act -j e2e-tests
```

### Debugging Workflows

```bash
# Verbose output
act -v

# Super verbose
act -vv

# See what would run
act --dryrun
```

---

## ⚙️ Configuration

### Recommended Setup

Create `~/.actrc`:

```bash
cat > ~/.actrc << 'EOF'
# Use medium Docker image (best balance)
-P ubuntu-latest=catthehacker/ubuntu:act-latest

# Verbose output
-v

# Bind Docker socket
--container-daemon-socket -
EOF
```

### Project Secrets

Create `.secrets` (already in .gitignore):

```bash
cat > .secrets << 'EOF'
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
GITHUB_TOKEN=your-token-here
EOF
```

---

## 🐳 Docker Images

act uses Docker to simulate GitHub runners:

| Size | Image | Use When |
|------|-------|----------|
| **Medium** (Recommended) | `catthehacker/ubuntu:act-latest` | Most workflows |
| Micro | `node:20-alpine` | Simple Node.js jobs |
| Large | `catthehacker/ubuntu:full-latest` | Full compatibility needed |

```bash
# Use specific image
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

---

## ✅ Benefits of Local Testing

### Advantages:

1. **Faster Iteration**
   - No need to push to GitHub
   - Instant feedback
   - Test while offline

2. **Save CI Minutes**
   - Don't waste GitHub Actions minutes
   - Test unlimited locally
   - Free for everything

3. **Better Debugging**
   - Verbose output available
   - Can modify on the fly
   - See Docker logs

4. **Confidence**
   - Know it works before pushing
   - Catch issues early
   - No broken builds on GitHub

### Comparison:

| Aspect | Local (act) | GitHub Actions |
|--------|-------------|----------------|
| Speed | ✅ Instant | ⏱️ 1-2 min queue |
| Cost | ✅ Free | 💰 Counted minutes |
| Iteration | ✅ Unlimited | ⚠️ Each push = new run |
| Debugging | ✅ Easy | ⚠️ Limited |
| Services | ⚠️ Limited | ✅ Full support |

---

## 🛠️ Troubleshooting

### Issue: act not found

```bash
# Check installation
which act

# Reinstall
./scripts/setup-act.sh
```

### Issue: Docker not running

```bash
# Start Docker
sudo systemctl start docker

# Check status
docker info
```

### Issue: Permission denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
```

### Issue: Service containers not working

```bash
# act has limited service container support
# Use Docker Compose for services instead:
docker compose up -d postgres redis minio

# Then run workflow
act -j registry-tests
```

---

## 📚 Documentation

### Main Guides:

1. **LOCAL_GITHUB_ACTIONS_TESTING.md**
   - Complete installation guide
   - All commands explained
   - Troubleshooting
   - Best practices

2. **GITHUB_ACTIONS.md**
   - Workflow documentation
   - Job descriptions
   - Pass criteria

3. **GITHUB_ACTIONS_SUMMARY.md**
   - Quick reference
   - Workflow overview

### Helper Scripts:

- `scripts/setup-act.sh` - Install act
- `scripts/test-workflows-local.sh` - Test workflows interactively

---

## 🎓 Quick Reference

```bash
# SETUP
./scripts/setup-act.sh              # Install act
act --version                       # Verify installation

# LIST
act -l                              # List all workflows
act --graph                         # Show dependency graph

# RUN
act                                 # Run default workflow
act -W <file>                       # Run specific workflow
act -j <job>                        # Run specific job

# EVENTS
act push                            # Simulate push
act pull_request                    # Simulate PR
act workflow_dispatch               # Manual trigger

# DEBUG
act --dryrun                        # Preview only
act -v                              # Verbose
act -vv                             # Very verbose

# CLEANUP
act --rm                            # Remove containers after
docker system prune                 # Clean up Docker
```

---

## 📊 Workflow Test Matrix

Test before pushing:

```bash
# Quick checks (< 1 min)
act -j typescript-check --dryrun
act -j security-audit --dryrun

# Medium checks (2-5 min)
act -j registry-tests
act -j cli-tests

# Full suite (10-15 min)
act -W .github/workflows/ci.yml
act -W .github/workflows/e2e-tests.yml
act -W .github/workflows/code-quality.yml
```

---

## 🚦 Recommended Workflow

### Before Every Push:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Dry run workflows
act --dryrun

# 3. Run critical jobs
act -j typescript-check
act -j security-audit

# 4. Push
git push
```

### Before Every PR:

```bash
# 1. Full CI
act -W .github/workflows/ci.yml

# 2. E2E tests
act -W .github/workflows/e2e-tests.yml

# 3. Create PR
gh pr create
```

---

## 🎯 Success Criteria

### Installation Complete When:

- [x] `act --version` shows version number
- [x] `act -l` lists all workflows
- [x] Docker is running
- [x] Can run `act --dryrun` successfully

### Testing Complete When:

- [x] CI workflow runs locally
- [x] E2E tests can be executed
- [x] Code quality checks pass
- [x] No errors in dry run

---

## 💡 Pro Tips

1. **Use Dry Run First**
   ```bash
   act --dryrun  # See what would run
   ```

2. **Reuse Containers**
   ```bash
   act --reuse  # Faster subsequent runs
   ```

3. **Target Specific Jobs**
   ```bash
   act -j typescript-check  # Just what you need
   ```

4. **Create Aliases**
   ```bash
   alias act-ci='act -W .github/workflows/ci.yml'
   alias act-e2e='act -W .github/workflows/e2e-tests.yml'
   ```

5. **Use .actrc**
   - Set default options
   - Consistent behavior
   - No repeated flags

---

## 🎉 Summary

**Setup Complete!**

You can now:
- ✅ Run GitHub Actions workflows locally
- ✅ Test before pushing to GitHub
- ✅ Debug workflow issues easily
- ✅ Save CI minutes
- ✅ Iterate faster

**Next Steps:**
1. Install act: `./scripts/setup-act.sh`
2. Test a workflow: `./scripts/test-workflows-local.sh`
3. Read full guide: `LOCAL_GITHUB_ACTIONS_TESTING.md`

**Status**: ✅ Ready for local GitHub Actions testing!

---

*Generated*: October 18, 2025
*Tool*: act (GitHub Actions locally)
*Status*: Complete
