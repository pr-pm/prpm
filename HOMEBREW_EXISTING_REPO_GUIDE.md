# 🍺 Homebrew Setup with Existing Repository

This guide shows how to set up Homebrew distribution using your existing repository at [https://github.com/khaliqgant/prompt-package-manager](https://github.com/khaliqgant/prompt-package-manager).

## 🎯 **Why Use Existing Repository?**

- ✅ **Simpler setup** - No need for separate tap repository
- ✅ **Single source of truth** - Everything in one place
- ✅ **Easier maintenance** - Update formula alongside code
- ✅ **Better organization** - Formula lives with the project

## 📋 **Current Status**

Based on your repository at [https://github.com/khaliqgant/prompt-package-manager](https://github.com/khaliqgant/prompt-package-manager):

- ✅ **Code pushed** to GitHub
- ✅ **Tag created** (v0.1.0)
- ✅ **Formula ready** in `Formula/prmp.rb`
- ⏳ **GitHub release** needed (to get binaries)
- ⏳ **Formula update** needed (with real SHA256 hashes)

## 🚀 **Next Steps**

### **Step 1: Create GitHub Release**

1. **Go to your repository**: [https://github.com/khaliqgant/prompt-package-manager](https://github.com/khaliqgant/prompt-package-manager)
2. **Click "Releases"** → **"Create a new release"**
3. **Tag version**: `v0.1.0` (already exists)
4. **Release title**: `v0.1.0 - Initial Release`
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
6. **Publish release** (this triggers GitHub Actions to build binaries)

### **Step 2: Wait for GitHub Actions**

The GitHub Actions workflow will automatically:
- Build binaries for macOS (Intel + Apple Silicon), Linux, and Windows
- Upload them to the GitHub release

### **Step 3: Get SHA256 Hashes**

After the release is created with binaries:

1. **Download the binaries** from your release page
2. **Calculate SHA256 hashes**:
   ```bash
   shasum -a 256 prmp-macos-x64
   shasum -a 256 prmp-macos-arm64
   ```

### **Step 4: Update Formula**

Update `Formula/prmp.rb` with the real SHA256 hashes:

```ruby
class Prmp < Formula
  desc "Prompt Package Manager - Install and manage prompt-based files like Cursor rules and Claude sub-agents"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-x64"
  sha256 "REAL_SHA256_HASH_HERE"  # Replace with actual hash
  version "0.1.0"
  license "MIT"
  
  # Support both Intel and Apple Silicon Macs
  if Hardware::CPU.arm?
    url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-arm64"
    sha256 "REAL_ARM64_SHA256_HASH_HERE"  # Replace with actual hash
  end
  
  def install
    if Hardware::CPU.arm?
      bin.install "prmp-macos-arm64" => "prmp"
    else
      bin.install "prmp-macos-x64" => "prmp"
    end
  end
  
  test do
    system "#{bin}/prmp", "--version"
  end
end
```

### **Step 5: Commit and Push Formula Update**

```bash
git add Formula/prmp.rb
git commit -m "Update formula with correct SHA256 hashes for v0.1.0"
git push origin main
```

### **Step 6: Test Installation**

```bash
# Add your tap (using the main repository)
brew tap khaliqgant/prompt-package-manager

# Install prmp
brew install prmp

# Test it works
prmp --version
prmp --help
```

## 🔄 **Updating for New Versions**

When you release a new version:

1. **Create new GitHub release** with updated binaries
2. **Get new SHA256 hashes** for the new binaries
3. **Update Formula/prmp.rb**:
   - Update version number
   - Update URLs to new release
   - Update SHA256 hashes
4. **Commit and push** changes

## 🧪 **Testing the Formula**

```bash
# Test formula syntax
brew audit --strict ./Formula/prmp.rb

# Test installation locally
brew install --build-from-source ./Formula/prmp.rb

# Test the installed binary
prmp --version
```

## 📚 **User Installation**

Users can install with:

```bash
# Add the tap
brew tap khaliqgant/prompt-package-manager

# Install prmp
brew install prmp
```

## 🎯 **Advantages of This Approach**

- **Single repository** - Everything in one place
- **Automatic updates** - Formula updates with code
- **Simpler maintenance** - No separate tap to manage
- **Better discoverability** - Formula is in the main project

## ✅ **Verification Checklist**

- [ ] GitHub release created with binaries
- [ ] SHA256 hashes calculated and updated in formula
- [ ] Formula committed and pushed
- [ ] Installation tested: `brew tap khaliqgant/prompt-package-manager && brew install prmp`
- [ ] Binary tested: `prmp --version`

## 🆘 **Troubleshooting**

### **Formula Not Found**
```bash
# Make sure you're using the correct tap name
brew tap khaliqgant/prompt-package-manager
```

### **SHA256 Hash Mismatch**
```bash
# Recalculate the hash
shasum -a 256 your-binary-file
```

### **Installation Issues**
```bash
# Uninstall and reinstall
brew uninstall prmp
brew install prmp
```

Your existing repository is perfect for this approach! 🎉
