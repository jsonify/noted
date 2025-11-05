#!/bin/bash

# Noted Extension - Rebuild and Install Script
# This script compiles, packages, and installs the extension

set -e  # Exit on any error

echo "🔨 Noted Extension - Rebuild & Install"
echo "======================================"
echo ""

# Step 1: Clean previous build
echo "📦 Step 1: Cleaning previous build..."
rm -rf out/
rm -f *.vsix
echo "✅ Cleaned"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Compile TypeScript
echo "🔨 Step 3: Compiling TypeScript..."
pnpm run compile
echo "✅ Compiled successfully"
echo ""

# Step 4: Package extension
echo "📦 Step 4: Packaging extension..."
pnpm run package
echo "✅ Packaged successfully"
echo ""

# Step 5: Find the .vsix file
VSIX_FILE=$(ls -t noted-*.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ Error: No .vsix file found!"
    exit 1
fi

echo "📦 Found package: $VSIX_FILE"
echo ""

# Step 6: Uninstall old version
echo "🗑️  Step 6: Uninstalling old version..."
code --uninstall-extension jsonify.noted 2>/dev/null || echo "No previous version installed"
echo "✅ Old version uninstalled"
echo ""

# Step 7: Install new version
echo "⬇️  Step 7: Installing new version..."
code --install-extension "$VSIX_FILE" --force
echo "✅ New version installed"
echo ""

# Step 8: Instructions
echo "🎉 Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Press Cmd+Shift+P in VS Code"
echo "2. Type 'Developer: Reload Window'"
echo "3. Press Enter"
echo ""
echo "Or simply restart VS Code."
echo ""
echo "✅ Your Noted extension v1.31.8 is ready!"
