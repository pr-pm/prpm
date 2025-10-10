# Deployment Guide

This guide covers how to deploy `prmp` to various distribution channels.

## 🚀 **Current Status**

✅ **CLI Renamed**: `ppack` → `prmp`  
✅ **Binary Building**: Cross-platform binaries created  
✅ **Homebrew Ready**: Formula and setup guide created  
✅ **GitHub Actions**: Release workflow configured  
✅ **NPM Ready**: Package configured for global installation  

## 📦 **Distribution Channels**

### **1. NPM (Primary)**
```bash
# Install globally
npm install -g prmp

# Usage
prmp add https://raw.githubusercontent.com/user/repo/main/rules.md --as cursor
prmp list
prmp remove package-id
```

### **2. Homebrew (macOS)**
```bash
# Add tap (using the main repository)
brew tap khaliqgant/prompt-package-manager

# Install
brew install prmp
```

### **3. Direct Download**
- Download binaries from GitHub Releases
- Place in PATH or use directly

## 🛠️ **Release Process**

### **Step 1: Create Release**
```bash
# Tag the release
git tag v0.1.0
git push origin v0.1.0
```

### **Step 2: GitHub Actions**
- Automatically builds binaries for all platforms
- Creates GitHub release with binaries
- Uploads to GitHub Releases

### **Step 3: Update Homebrew Formula**
```bash
# Get SHA256 hashes
shasum -a 256 dist/prmp-macos-x64
shasum -a 256 dist/prmp-macos-arm64

# Update Formula/prmp.rb with new hashes
# Commit and push to homebrew-prmp repository
```

### **Step 4: Publish to NPM**
```bash
# Publish to NPM
npm publish
```

## 📋 **Pre-Release Checklist**

- [ ] Update version in `package.json`
- [ ] Update version in `src/index.ts`
- [ ] Run tests: `npm test`
- [ ] Build binaries: `npm run build:binary`
- [ ] Test binaries locally
- [ ] Create GitHub release
- [ ] Update Homebrew formula
- [ ] Publish to NPM

## 🔧 **Binary Information**

**Generated Binaries:**
- `prmp-macos-x64` (Intel Mac)
- `prmp-macos-arm64` (Apple Silicon Mac)
- `prmp-linux-x64` (Linux)
- `prmp-win-x64.exe` (Windows)

**Binary Sizes:**
- macOS Intel: ~50MB
- macOS ARM: ~47MB
- Linux: ~47MB
- Windows: ~38MB

## 📁 **Repository Structure**

```
prompt-package-manager/
├── src/                    # Source code
├── dist/                   # Built JavaScript + binaries
├── tests/                  # Test suite
├── Formula/                # Homebrew formula
├── .github/workflows/      # CI/CD workflows
├── package.json            # NPM package config
├── README.md              # User documentation
├── HOMEBREW_SETUP.md      # Homebrew setup guide
└── DEPLOYMENT.md          # This file
```

## 🎯 **Next Steps**

1. **Create GitHub Repository**: Set up the main repository
2. **Create Homebrew Tap**: Set up `homebrew-prmp` repository
3. **First Release**: Tag v0.1.0 and create first release
4. **Update Documentation**: Replace placeholder URLs with real ones
5. **Community**: Share with the community for feedback

## 🔗 **URLs to Update**

Replace these placeholders in documentation:
- `khaliqgant` → Your GitHub username ✅ (already updated)
- `prompt-package-manager` → Your repository name
- Update all GitHub URLs to point to your repository

## ✅ **Verification**

Test installation methods:
```bash
# NPM
npm install -g prmp
prmp --version

# Homebrew (after setup)
brew tap khaliqgant/prompt-package-manager
brew install prmp
prmp --version

# Direct binary
./prmp-macos-x64 --version
```

All should output: `0.1.0`
