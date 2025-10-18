# Local GitHub Actions Testing Guide

This guide shows you how to test GitHub Actions workflows locally before pushing to GitHub.

---

## 🎯 Recommended Tool: `act`

**act** runs your GitHub Actions locally using Docker. It's the industry-standard tool for local CI/CD testing.

### Why act?

- ✅ Runs workflows exactly as GitHub would
- ✅ Uses the same Docker containers
- ✅ Fast iteration without pushing to GitHub
- ✅ Free and open source
- ✅ Works with all GitHub Actions features

---

## 📦 Installation

### Option 1: Using the installer (Recommended)

```bash
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Option 2: Manual installation

#### On Ubuntu/Debian:
```bash
# Download latest release
wget https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz

# Extract
tar xzf act_Linux_x86_64.tar.gz

# Move to PATH
sudo mv act /usr/local/bin/

# Verify
act --version
```

#### On macOS:
```bash
brew install act
```

#### On Windows:
```bash
choco install act-cli
# or
scoop install act
```

### Option 3: Using Go

```bash
go install github.com/nektos/act@latest
```

---

## 🚀 Quick Start

### 1. List available workflows

```bash
cd /path/to/prompt-package-manager
act -l
```

**Expected output:**
```
Stage  Job ID           Job name         Workflow name  Workflow file  Events
0      registry-tests   Registry Tests   CI             ci.yml         push,pull_request
0      cli-tests        CLI Tests        CI             ci.yml         push,pull_request
0      security         Security Checks  CI             ci.yml         push,pull_request
0      e2e-tests        E2E Tests        E2E Tests      e2e-tests.yml  push,pull_request,workflow_dispatch
...
```

### 2. Run a specific workflow

```bash
# Run CI workflow
act -W .github/workflows/ci.yml

# Run E2E tests workflow
act -W .github/workflows/e2e-tests.yml

# Run code quality checks
act -W .github/workflows/code-quality.yml
```

### 3. Run a specific job

```bash
# Run just registry tests
act -j registry-tests

# Run just E2E tests
act -j e2e-tests

# Run just TypeScript checks
act -j typescript-check
```

### 4. Simulate a pull request event

```bash
act pull_request -W .github/workflows/ci.yml
```

---

## ⚙️ Configuration

### Create `.actrc` file

Create a file in your home directory or project root:

```bash
cat > ~/.actrc << 'EOF'
# Use medium-sized Docker image (recommended)
-P ubuntu-latest=catthehacker/ubuntu:act-latest

# Bind Docker socket for Docker-in-Docker
--container-daemon-socket -

# Set secrets file
-s GITHUB_TOKEN=your-token-here

# Verbose output
-v
EOF
```

### Project-specific `.secrets` file

```bash
cat > .secrets << 'EOF'
GITHUB_TOKEN=ghp_your_token_here
NPM_TOKEN=npm_your_token_here
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
EOF
```

**Important**: Add `.secrets` to `.gitignore`!

```bash
echo ".secrets" >> .gitignore
```

---

## 🐳 Docker Images

act uses Docker images to simulate GitHub Actions runners:

### Available Images:

| Image Size | Docker Image | Use Case |
|------------|--------------|----------|
| Micro (~200MB) | `node:20-alpine` | Fast, basic Node.js jobs |
| Medium (~500MB) | `catthehacker/ubuntu:act-latest` | **Recommended** - Most compatible |
| Large (~18GB) | `catthehacker/ubuntu:full-latest` | Full GitHub runner compatibility |

### Specify image size:

```bash
# Micro (fast, may have compatibility issues)
act -P ubuntu-latest=node:20-alpine

# Medium (recommended)
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Large (slowest, most compatible)
act -P ubuntu-latest=catthehacker/ubuntu:full-latest
```

---

## 📝 Testing Our Workflows

### Test CI Workflow

```bash
# Full CI workflow
act push -W .github/workflows/ci.yml

# Just registry tests
act -j registry-tests -W .github/workflows/ci.yml

# Just CLI tests
act -j cli-tests -W .github/workflows/ci.yml

# Just security checks
act -j security -W .github/workflows/ci.yml
```

### Test E2E Workflow

```bash
# Full E2E suite
act push -W .github/workflows/e2e-tests.yml

# With verbose output
act push -W .github/workflows/e2e-tests.yml -v

# Dry run (see what would happen)
act push -W .github/workflows/e2e-tests.yml --dryrun
```

### Test Code Quality Workflow

```bash
# Full code quality checks
act push -W .github/workflows/code-quality.yml

# Just TypeScript check
act -j typescript-check -W .github/workflows/code-quality.yml

# Just security audit
act -j security-audit -W .github/workflows/code-quality.yml
```

### Test PR Checks

```bash
# Simulate PR event
act pull_request -W .github/workflows/pr-checks.yml

# Specific job
act -j pr-info -W .github/workflows/pr-checks.yml
```

---

## 🛠️ Common Commands

### Debugging

```bash
# Verbose output
act -v

# Super verbose (shows all Docker commands)
act -vv

# Dry run (don't actually run, just show what would run)
act --dryrun

# List workflows and jobs
act -l

# Show graph of job dependencies
act --graph
```

### Environment Variables

```bash
# Pass environment variable
act -e MY_VAR=value

# Use environment file
act --env-file .env.test

# Set secret
act -s MY_SECRET=secret-value

# Use secrets file
act --secret-file .secrets
```

### Container Management

```bash
# Reuse containers (faster subsequent runs)
act --reuse

# Clean up containers after run
act --rm

# Bind workspace
act --bind

# Use specific Docker network
act --network my-network
```

---

## 📋 Example: Testing CI End-to-End

Create a test script:

```bash
cat > scripts/test-ci-local.sh << 'EOF'
#!/bin/bash
# Test GitHub Actions CI workflow locally

set -e

echo "🧪 Testing GitHub Actions CI Locally"
echo "===================================="
echo ""

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "❌ act is not installed"
    echo "Install it with: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "Start Docker and try again"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Test registry build
echo "📦 Testing Registry Build..."
act -j registry-tests -W .github/workflows/ci.yml --dryrun
echo ""

# Test CLI build
echo "📦 Testing CLI Build..."
act -j cli-tests -W .github/workflows/ci.yml --dryrun
echo ""

# Test security checks
echo "🔒 Testing Security Checks..."
act -j security -W .github/workflows/ci.yml --dryrun
echo ""

echo "✅ All workflow tests passed!"
echo ""
echo "To run for real (without --dryrun):"
echo "  act push -W .github/workflows/ci.yml"
EOF

chmod +x scripts/test-ci-local.sh
```

Run it:
```bash
./scripts/test-ci-local.sh
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER
```

### Issue: "Image not found"

**Solution:**
```bash
# Pull the image manually
docker pull catthehacker/ubuntu:act-latest

# Or use a different image
act -P ubuntu-latest=node:20-alpine
```

### Issue: "Service containers not working"

**Solution:**
```bash
# act doesn't fully support service containers yet
# Use --container-architecture linux/amd64
act --container-architecture linux/amd64

# Or skip service-dependent jobs
act -j registry-tests --skip-if service
```

### Issue: "Workflow takes too long"

**Solution:**
```bash
# Use smaller Docker image
act -P ubuntu-latest=node:20-alpine

# Skip slow jobs
act --skip-job e2e-tests

# Reuse containers
act --reuse
```

### Issue: "Permission denied"

**Solution:**
```bash
# Run with sudo (not recommended)
sudo act

# Or fix Docker permissions
sudo chmod 666 /var/run/docker.sock
```

---

## 🎯 Best Practices

### 1. **Use `.actrc` for consistent configuration**

```bash
# ~/.actrc
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--container-daemon-socket -
-v
```

### 2. **Create test scripts for common workflows**

```bash
# scripts/test-workflows.sh
#!/bin/bash
act -j registry-tests -W .github/workflows/ci.yml
act -j cli-tests -W .github/workflows/ci.yml
act -j typescript-check -W .github/workflows/code-quality.yml
```

### 3. **Use dry run first**

```bash
# See what would run without actually running
act --dryrun
```

### 4. **Test on PR events**

```bash
# Simulate the exact PR workflow
act pull_request -W .github/workflows/pr-checks.yml
```

### 5. **Keep secrets in `.secrets` file**

Never commit secrets! Use `.secrets` file and add to `.gitignore`.

---

## 📊 Comparison: act vs GitHub Actions

| Feature | act (local) | GitHub Actions |
|---------|-------------|----------------|
| Speed | ✅ Faster (no upload/download) | Slower (network) |
| Cost | ✅ Free | Free (with limits) |
| Services | ⚠️ Limited support | ✅ Full support |
| Secrets | Manual setup | Automatic |
| Artifacts | ⚠️ Limited | ✅ Full support |
| Matrix builds | ✅ Supported | ✅ Supported |
| Caching | ⚠️ Different | ✅ Native |

---

## 🚀 Advanced Usage

### Custom Event Payloads

```bash
# Create event payload
cat > event.json << 'EOF'
{
  "pull_request": {
    "number": 123,
    "head": {
      "ref": "feature-branch"
    },
    "base": {
      "ref": "main"
    }
  }
}
EOF

# Run with custom event
act pull_request -e event.json
```

### Matrix Builds

```bash
# Run specific matrix combination
act -j build -m node-version=20
```

### Debugging with Shell

```bash
# Drop into shell in container
act -j registry-tests --shell

# Or add to workflow temporarily:
# - name: Debug
#   run: sleep 3600  # Gives you time to docker exec in
```

---

## 📚 Resources

- **act GitHub**: https://github.com/nektos/act
- **act Documentation**: https://nektosact.com/
- **Docker Images**: https://github.com/catthehacker/docker_images
- **GitHub Actions Docs**: https://docs.github.com/en/actions

---

## 🎓 Quick Reference Card

```bash
# Essential Commands
act -l                          # List all workflows
act -W <workflow-file>          # Run specific workflow
act -j <job-name>               # Run specific job
act push                        # Simulate push event
act pull_request                # Simulate PR event
act --dryrun                    # Preview without running
act -v                          # Verbose output
act --reuse                     # Reuse containers
act --secret-file .secrets      # Load secrets

# Our Common Workflows
act -W .github/workflows/ci.yml
act -W .github/workflows/e2e-tests.yml
act -W .github/workflows/code-quality.yml
act -W .github/workflows/pr-checks.yml
```

---

## ✅ Setup Checklist

- [ ] Install act (`curl -s ... | sudo bash`)
- [ ] Install Docker
- [ ] Pull Docker image (`docker pull catthehacker/ubuntu:act-latest`)
- [ ] Create `.actrc` configuration
- [ ] Create `.secrets` file (add to `.gitignore`)
- [ ] Test with `act -l` to list workflows
- [ ] Run dry run: `act --dryrun`
- [ ] Run actual workflow: `act -W .github/workflows/ci.yml`

---

**Status**: Ready to use with `act` installation
**Recommended**: Use medium Docker image for best balance
**Documentation**: Complete with examples and troubleshooting
