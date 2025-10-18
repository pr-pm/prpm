#!/bin/bash
# Setup act for local GitHub Actions testing

set -e

echo "🚀 Setting up act for local GitHub Actions testing"
echo "=================================================="
echo ""

# Check if already installed
if command -v act &> /dev/null; then
    echo "✅ act is already installed"
    act --version
    exit 0
fi

echo "📦 Installing act to ~/.local/bin..."
echo ""

# Create local bin directory
mkdir -p ~/.local/bin

# Download and install
cd /tmp
echo "Downloading act..."
wget -q https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz

echo "Extracting..."
tar xzf act_Linux_x86_64.tar.gz

echo "Installing..."
mv act ~/.local/bin/

# Clean up
rm act_Linux_x86_64.tar.gz

# Add to PATH if not already there
if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo "Added ~/.local/bin to PATH in ~/.bashrc"
fi

# Create act config
mkdir -p ~/.config/act
cat > ~/.config/act/actrc << 'EOF'
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--container-daemon-socket -
EOF

echo ""
echo "✅ act installed successfully!"
export PATH="$HOME/.local/bin:$PATH"
act --version

echo ""
echo "📝 Configuration created at ~/.config/act/actrc"
echo ""
echo "🎉 Setup complete! You can now use 'act' to run GitHub Actions locally."
echo ""
echo "Try: act -l  # List all workflows"
