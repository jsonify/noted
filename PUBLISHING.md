# Publishing Guide

This document explains how to publish new versions of the Noted extension to the VS Code Marketplace using the automated CI/CD workflow.

## Prerequisites

### 1. Create a Visual Studio Marketplace Publisher Account
If you haven't already:
1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with your Microsoft account
3. Create a publisher (should match `"publisher": "jsonify"` in package.json)

### 2. Generate a Personal Access Token (PAT)
1. Go to https://dev.azure.com/
2. Click on your profile icon → Personal Access Tokens
3. Click "New Token"
4. Configure the token:
   - **Name**: `vscode-marketplace-publish`
   - **Organization**: All accessible organizations
   - **Expiration**: 1 year (or custom)
   - **Scopes**: Select "Marketplace" → Check "Acquire" and "Manage"
5. Click "Create" and **copy the token immediately** (you won't see it again)

### 3. Add PAT to GitHub Secrets
1. Go to your GitHub repository: https://github.com/jsonify/noted
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Set:
   - **Name**: `VSCE_PAT`
   - **Secret**: Paste your Personal Access Token
5. Click "Add secret"

## Publishing Workflow

### Quick Release (Recommended)
```bash
# 1. Create a release (choose one)
pnpm run release:patch    # For bug fixes (1.6.0 → 1.6.1)
pnpm run release:minor    # For new features (1.6.0 → 1.7.0)
pnpm run release:major    # For breaking changes (1.6.0 → 2.0.0)

# 2. Push the release to GitHub (triggers automatic publishing)
pnpm run publish:release

# That's it! The extension will be published automatically.
```

### What Happens Automatically

When you run `pnpm run publish:release`, it:
1. Pushes the commit and tag to GitHub
2. Triggers the GitHub Actions workflow (`.github/workflows/publish.yml`)
3. The workflow:
   - ✅ Runs all unit tests
   - ✅ Compiles TypeScript
   - ✅ Packages the extension (.vsix)
   - ✅ Publishes to VS Code Marketplace
   - ✅ Creates a GitHub Release with the .vsix file attached

### Manual Publishing (Not Recommended)

If you need to publish manually without the CI/CD:
```bash
# Install vsce globally
pnpm add -g @vscode/vsce

# Publish (requires VSCE_PAT environment variable)
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

## Monitoring Releases

### Check Workflow Status
1. Go to https://github.com/jsonify/noted/actions
2. Look for the "Publish to Marketplace" workflow
3. Click on the running/completed workflow to see logs

### Verify Marketplace Publication
1. Go to https://marketplace.visualstudio.com/items?itemName=jsonify.noted
2. Check that the new version is live (may take 5-10 minutes)

### Check GitHub Release
1. Go to https://github.com/jsonify/noted/releases
2. The latest release should have the .vsix file attached

## Troubleshooting

### Workflow Fails on "Publish to VS Code Marketplace"
**Possible causes**:
- Invalid or expired PAT → Regenerate and update GitHub secret
- PAT missing "Marketplace Manage" scope → Create new PAT with correct scopes
- Version already exists on marketplace → Bump version and try again

### Tag Already Exists
If you need to re-create a tag:
```bash
# Delete local tag
git tag -d v1.6.1

# Delete remote tag
git push origin :refs/tags/v1.6.1

# Re-run release command
pnpm run release:patch
pnpm run publish:release
```

### Testing the Workflow Locally
You can test the packaging step locally:
```bash
pnpm run package
# Check that a .vsix file is created
ls -lh *.vsix
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **Patch** (1.6.0 → 1.6.1): Bug fixes, minor changes
- **Minor** (1.6.0 → 1.7.0): New features, backward compatible
- **Major** (1.6.0 → 2.0.0): Breaking changes

## Rollback a Release

If you need to unpublish a version:
```bash
# Unpublish a specific version (cannot republish the same version)
vsce unpublish jsonify.noted@1.6.1

# Or unpublish the entire extension (use with caution!)
vsce unpublish jsonify.noted
```

## Files Involved in Publishing

- **`.github/workflows/publish.yml`**: GitHub Actions workflow for automated publishing
- **`.versionrc.json`**: Configuration for `standard-version` (changelog generation)
- **`package.json`**: Extension metadata and scripts
- **`CHANGELOG.md`**: Auto-generated changelog (updated by `standard-version`)
- **`.vscodeignore`**: Files excluded from the published extension

## Additional Resources

- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [standard-version](https://github.com/conventional-changelog/standard-version)
