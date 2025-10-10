# 🍺 Homebrew Push Guide

This guide will walk you through pushing your PPM project to Homebrew.

## 📋 **Prerequisites**

- GitHub account with your project repository
- Git configured with your credentials
- Homebrew installed (for testing)

## 🚀 **Step-by-Step Process**

### **Step 1: Push to GitHub**

```bash
# Add your GitHub repository as remote (replace with your actual repo URL)
git remote add origin https://github.com/khaliqgant/prompt-package-manager.git

# Push to GitHub
git push -u origin main
```

### **Step 2: Create Your First Release**

1. **Go to GitHub**: Navigate to your repository
2. **Create Release**: Click "Releases" → "Create a new release"
3. **Tag Version**: Use tag `v0.1.0`
4. **Release Title**: `v0.1.0 - Initial Release`
5. **Description**: 
   ```
   Initial release of PPM (Prompt Package Manager)
   
   Features:
   - Add prompt packages from GitHub URLs
   - List installed packages
   - Remove packages
   - Index existing files
   - Cross-platform binary support
   ```
6. **Publish Release**: Click "Publish release"

### **Step 3: Create Homebrew Tap Repository**

1. **Create New Repository**: Go to GitHub and create a new repository
2. **Repository Name**: `homebrew-prmp` (must start with `homebrew-`)
3. **Description**: `Homebrew tap for PPM (Prompt Package Manager)`
4. **Visibility**: Public
5. **Initialize**: Don't initialize with README (we'll add our own)

### **Step 4: Set Up Homebrew Tap**

```bash
# Clone your new tap repository
git clone https://github.com/khaliqgant/homebrew-prmp.git
cd homebrew-prmp

# Copy the formula from your main project
cp ../prompt-package-manager/Formula/prmp.rb Formula/

# Get SHA256 hashes for your binaries (you'll need to download them first)
# Go to your GitHub release and download the binaries, then:
shasum -a 256 prmp-macos-x64
shasum -a 256 prmp-macos-arm64

# Update the formula with the correct SHA256 hashes
# Edit Formula/prmp.rb and replace the placeholder hashes
```

### **Step 5: Update Formula with Real SHA256 Hashes**

After creating your release, you need to:

1. **Download binaries** from your GitHub release
2. **Calculate SHA256 hashes**:
   ```bash
   shasum -a 256 prmp-macos-x64
   shasum -a 256 prmp-macos-arm64
   ```
3. **Update Formula/prmp.rb** with the real hashes

### **Step 6: Test the Formula Locally**

```bash
# Test the formula syntax
brew audit --strict ./Formula/prmp.rb

# Test installation
brew install --build-from-source ./Formula/prmp.rb

# Test the installed binary
prmp --version
```

### **Step 7: Push to Homebrew Tap**

```bash
# Add and commit the formula
git add Formula/prmp.rb
git commit -m "Add prmp formula v0.1.0"

# Push to your tap repository
git push origin main
```

### **Step 8: Test Installation**

```bash
# Add your tap
brew tap khaliqgant/homebrew-prmp

# Install prmp
brew install prmp

# Test it works
prmp --version
prmp --help
```

## 🔄 **Updating Your Formula**

When you release a new version:

1. **Create new GitHub release** with updated binaries
2. **Get new SHA256 hashes** for the new binaries
3. **Update Formula/prmp.rb**:
   - Update version number
   - Update URLs to new release
   - Update SHA256 hashes
4. **Commit and push** changes to your tap repository

## 🎯 **Alternative: Submit to Homebrew Core**

For wider distribution, you can submit to the official Homebrew core repository:

1. **Fork homebrew-core**: https://github.com/Homebrew/homebrew-core
2. **Create formula**: Add `Formula/prmp.rb` to your fork
3. **Submit PR**: Create a pull request to homebrew-core
4. **Follow guidelines**: https://docs.brew.sh/Formula-Cookbook

## ✅ **Verification Checklist**

- [ ] Main repository pushed to GitHub
- [ ] First release created with binaries
- [ ] Homebrew tap repository created
- [ ] Formula updated with correct SHA256 hashes
- [ ] Formula tested locally
- [ ] Tap pushed to GitHub
- [ ] Installation tested from tap

## 🆘 **Troubleshooting**

### **SHA256 Hash Issues**
```bash
# If you get hash mismatch errors, recalculate:
shasum -a 256 your-binary-file
```

### **Formula Syntax Errors**
```bash
# Check formula syntax:
brew audit --strict ./Formula/prmp.rb
```

### **Installation Issues**
```bash
# Uninstall and reinstall:
brew uninstall prmp
brew install prmp
```

## 📞 **Need Help?**

- Homebrew Formula Cookbook: https://docs.brew.sh/Formula-Cookbook
- Homebrew Core Guidelines: https://docs.brew.sh/Acceptable-Formulae
- Your tap will be available at: `https://github.com/khaliqgant/homebrew-prmp`
