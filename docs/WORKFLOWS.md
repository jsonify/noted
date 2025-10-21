# GitHub Workflows and Git Sync Documentation

This document explains how the GitHub Actions workflows are configured and how to verify that git updates are being properly synchronized with the remote repository.

## Workflow Overview

The repository uses three GitHub Actions workflows that form an automated CI/CD pipeline:

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
- **Unit Tests**: Runs tests on multiple OS (Ubuntu, macOS, Windows) and Node versions (18.x, 20.x)
- **Lint & Type Check**: Verifies code quality and TypeScript compilation
- **Build Extension**: Packages the extension as `.vsix` file and uploads as artifact

**Purpose:** Ensures code quality and that the extension builds successfully on all platforms.

---

### 2. Automated Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push to `main` branch (excluding release commits to prevent loops)
- Manual trigger via workflow_dispatch

**Jobs:**
- Runs `standard-version` to:
  - Analyze conventional commits (`feat:`, `fix:`, etc.)
  - Bump version in `package.json`
  - Generate/update `CHANGELOG.md`
  - Create git commit with message `chore(release): X.Y.Z`
  - Create git tag `vX.Y.Z`
- Push the commit and tag back to `origin/main`

**Important:** Uses `PAT_TOKEN` secret (Personal Access Token) to push changes. This is **critical** because:
- The default `GITHUB_TOKEN` cannot trigger new workflow runs (GitHub security feature)
- Using a PAT allows the pushed tag to trigger the Publish workflow
- Falls back to `GITHUB_TOKEN` if `PAT_TOKEN` is not configured (but won't trigger subsequent workflows)

**Configuration:**
```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}
```

---

### 3. Publish Workflow (`.github/workflows/publish.yml`)

**Triggers:**
- New tags matching `v*.*.*` pattern (e.g., `v1.9.2`)
- Manual trigger via workflow_dispatch

**Jobs:**
- **Test**: Runs unit tests before publishing
- **Publish**: (only if tests pass)
  - Packages extension as `.vsix`
  - Publishes to VS Code Marketplace using `VSCE_PAT` secret
  - Creates GitHub release with release notes
  - Uploads `.vsix` file to release

**Purpose:** Automatically publishes new versions to the VS Code Marketplace when a release tag is created.

---

## Workflow Chain

Here's how the workflows interact when you push code:

```
┌─────────────────────────────────────────────────────────────┐
│ Developer pushes commit to main                             │
│ (e.g., "feat: add new feature")                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──────────────────┐
                 │                  │
                 ▼                  ▼
┌────────────────────────┐  ┌──────────────────────────┐
│ CI Workflow            │  │ Automated Release        │
│ - Run tests            │  │ - Run standard-version   │
│ - Lint & type check    │  │ - Create release commit  │
│ - Build .vsix          │  │ - Create tag (v1.9.2)    │
└────────────────────────┘  │ - Push to remote         │
                            └──────────┬───────────────┘
                                       │
                                       │ Tag pushed triggers...
                                       │
                                       ▼
                            ┌──────────────────────────┐
                            │ Publish Workflow         │
                            │ - Run tests              │
                            │ - Publish to Marketplace │
                            │ - Create GitHub release  │
                            └──────────────────────────┘
```

---

## Verifying Git Sync

### Using the Verification Script

Run the automated verification script:

```bash
./scripts/verify-workflows.sh
```

This script checks:
1. ✅ Local and remote sync status
2. ✅ Recent commits and tags
3. ✅ That release commits have matching tags
4. ✅ Recent workflow runs (if `gh` CLI is authenticated)
5. ✅ Workflow chain is functioning

### Manual Verification

#### Check if local is in sync with remote:
```bash
git fetch origin --tags
git status
```

Expected output:
```
On branch main
Your branch is up to date with 'origin/main'.
```

#### Verify release commits have matching tags:
```bash
# List recent release commits
git log --oneline --grep="^chore(release):" -5

# List recent tags
git tag --sort=-creatordate | head -5
```

Each release commit should have a corresponding tag:
- Commit: `444159f chore(release): 1.9.2` → Tag: `v1.9.2`
- Commit: `ea28a46 chore(release): 1.9.1` → Tag: `v1.9.1`

#### Check workflow runs on GitHub:
```bash
# If you have gh CLI installed and authenticated
gh run list --limit 10

# Or visit in browser
open https://github.com/jsonify/noted/actions
```

---

## Common Issues and Solutions

### Issue: Release commits are not triggering the Publish workflow

**Symptom:** You see release commits and tags locally, but the Publish workflow doesn't run.

**Solution:**
1. Check if `PAT_TOKEN` is configured in repository secrets:
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Ensure `PAT_TOKEN` exists and is valid
   - The token needs `repo` and `workflow` scopes

2. If `PAT_TOKEN` is missing:
   - Create a Personal Access Token at https://github.com/settings/tokens
   - Select scopes: `repo`, `workflow`
   - Add as repository secret named `PAT_TOKEN`

### Issue: Local is behind remote

**Symptom:** `git status` shows "Your branch is behind 'origin/main'"

**Solution:**
```bash
git pull --tags
```

This happens when the Automated Release workflow creates commits/tags on the remote.

### Issue: Tags exist locally but not on remote

**Symptom:** `git tag` shows tags that don't exist on GitHub.

**Solution:**
```bash
# Push all tags to remote
git push origin --tags

# Or push specific tag
git push origin v1.9.2
```

### Issue: Workflow runs are failing

**Symptom:** Workflows show red X on GitHub Actions page.

**Solution:**
```bash
# View recent runs
gh run list --limit 5

# View logs for failed run
gh run view <run-id> --log-failed

# Or check on GitHub
open https://github.com/jsonify/noted/actions
```

---

## Monitoring Workflow Health

### Quick Status Check

Run this one-liner to verify everything is synced:

```bash
git fetch origin --tags && \
  echo "Local: $(git rev-parse HEAD)" && \
  echo "Remote: $(git rev-parse origin/main)" && \
  git tag --sort=-creatordate | head -3
```

### Continuous Monitoring

If you want to monitor workflow runs in real-time:

```bash
# Watch workflow runs (requires gh CLI)
watch -n 10 'gh run list --limit 5'
```

---

## Best Practices

1. **Always pull before pushing:**
   ```bash
   git pull --tags && git push
   ```

2. **Use conventional commits:**
   - `feat:` for new features (minor version bump)
   - `fix:` for bug fixes (patch version bump)
   - `BREAKING CHANGE:` for breaking changes (major version bump)

3. **Verify workflows after pushing:**
   - Check GitHub Actions tab after pushing
   - Ensure CI passes before release workflow runs
   - Confirm Publish workflow triggers after tag creation

4. **Don't manually create release commits:**
   - Let the Automated Release workflow handle versioning
   - It automatically creates commits and tags based on conventional commits

5. **Monitor secrets expiration:**
   - PAT tokens expire after set duration
   - Check and refresh `VSCE_PAT` and `PAT_TOKEN` regularly

---

## Testing the Workflow Chain

To test that everything is working:

1. **Make a small change:**
   ```bash
   echo "# Test" >> test.txt
   git add test.txt
   git commit -m "fix: test workflow chain"
   git push
   ```

2. **Verify CI runs:**
   - Go to https://github.com/jsonify/noted/actions
   - Verify CI workflow is running

3. **Verify Release workflow runs:**
   - After CI completes, Release workflow should start
   - It will create a new commit and tag

4. **Pull the release commit:**
   ```bash
   git pull --tags
   ```

5. **Verify Publish workflow runs:**
   - The new tag should trigger the Publish workflow
   - Check that it publishes to Marketplace (if tests pass)

6. **Clean up:**
   ```bash
   git rm test.txt
   git commit -m "chore: remove test file"
   git push
   ```

---

## Repository Secrets Required

| Secret Name | Purpose | Scope | Where to get |
|-------------|---------|-------|--------------|
| `PAT_TOKEN` | Push commits/tags from Release workflow | `repo`, `workflow` | https://github.com/settings/tokens |
| `VSCE_PAT` | Publish to VS Code Marketplace | N/A | https://marketplace.visualstudio.com/manage/publishers/ |
| `GITHUB_TOKEN` | Automatically provided by GitHub | N/A | Auto-generated |

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
