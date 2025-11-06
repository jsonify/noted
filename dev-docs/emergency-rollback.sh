#!/bin/bash

# Emergency Rollback to v1.31.7
# Use this if v1.31.8 is confirmed broken and affecting users

set -e

echo "⚠️  EMERGENCY ROLLBACK TO v1.31.7"
echo "======================================"
echo ""
echo "This will:"
echo "1. Checkout v1.31.7 code"
echo "2. Rebuild and package"
echo "3. Install locally"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# 1. Checkout v1.31.7
echo "📦 Step 1: Checking out v1.31.7..."
git checkout v1.31.7
echo "✅ Checked out v1.31.7"
echo ""

# 2. Clean and rebuild
echo "🔨 Step 2: Rebuilding..."
rm -rf out/
rm -f *.vsix
pnpm install
pnpm run compile
pnpm run package
echo "✅ Rebuilt"
echo ""

# 3. Install locally
VSIX_FILE=$(ls -t noted-*.vsix 2>/dev/null | head -1)
if [ -z "$VSIX_FILE" ]; then
    echo "❌ Error: No .vsix file found!"
    exit 1
fi

echo "📦 Step 3: Installing $VSIX_FILE..."
code --uninstall-extension jsonify.noted 2>/dev/null || true
code --install-extension "$VSIX_FILE" --force
echo "✅ Installed v1.31.7"
echo ""

echo "🎉 Rollback Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Reload VS Code window"
echo "2. Verify everything works"
echo "3. If confirmed, publish v1.31.7 again to marketplace"
echo "   OR"
echo "4. Fix the bug in v1.31.8 and release v1.31.9"
echo ""
