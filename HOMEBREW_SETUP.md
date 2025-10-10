# Homebrew Distribution Setup

This guide explains how to set up Homebrew distribution for `prmp`.

## Prerequisites

1. **GitHub Repository**: Your project must be hosted on GitHub
2. **Releases**: You need to create releases with binary files
3. **SHA256 Hashes**: You need the SHA256 hashes of your binary files

## Setup Steps

### 1. Create a Homebrew Tap Repository

Create a new repository on GitHub called `homebrew-prmp` (or `homebrew-prompt-package-manager`).

### 2. Add the Formula

Copy the `Formula/prmp.rb` file to your Homebrew tap repository.

### 3. Update SHA256 Hashes

After creating a release, update the SHA256 hashes in the formula:

```bash
# Get SHA256 hash for Intel Mac binary
shasum -a 256 prmp-macos-x64

# Get SHA256 hash for Apple Silicon Mac binary  
shasum -a 256 prmp-macos-arm64
```

Update the `sha256` values in `Formula/prmp.rb`.

### 4. Test the Formula Locally

```bash
# Test the formula
brew install --build-from-source ./Formula/prmp.rb

# Test the installation
prmp --version
```

### 5. Publish the Tap

```bash
# Add your tap to Homebrew
brew tap khaliqgant/homebrew-prmp

# Install prmp
brew install prmp
```

## User Installation

Users can install `prmp` with:

```bash
# Add the tap
brew tap khaliqgant/homebrew-prmp

# Install prmp
brew install prmp
```

## Updating the Formula

When you release a new version:

1. Update the `version` in `Formula/prmp.rb`
2. Update the `url` to point to the new release
3. Update the `sha256` hashes for both binaries
4. Commit and push the changes

## Alternative: Submit to Homebrew Core

For wider distribution, you can submit to the official Homebrew core repository:

1. Fork [homebrew-core](https://github.com/Homebrew/homebrew-core)
2. Create a new formula in `Formula/prmp.rb`
3. Submit a pull request
4. Follow their [formula guidelines](https://docs.brew.sh/Formula-Cookbook)

## Troubleshooting

### Common Issues

1. **SHA256 Mismatch**: Ensure the SHA256 hashes match your actual binary files
2. **URL Not Found**: Verify the release URLs are correct and accessible
3. **Binary Not Executable**: Ensure binaries have execute permissions

### Testing Commands

```bash
# Test formula syntax
brew audit --strict ./Formula/prmp.rb

# Test installation
brew install --build-from-source ./Formula/prmp.rb

# Test functionality
prmp --help
prmp --version
```
