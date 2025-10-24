# Quick Reference - Git & Workflows

Quick commands for monitoring git sync and workflow status.

## 🔍 Check Everything at Once

```bash
./scripts/verify-workflows.sh
```

## 📊 Git Sync

### Check if local is in sync with remote
```bash
git fetch origin --tags
git status
```

### Pull latest changes from workflows
```bash
git pull --tags
```

### View recent commits
```bash
git log --oneline --graph -10
```

### View recent releases
```bash
git log --oneline --grep="^chore(release):" -5
```

### View recent tags
```bash
git tag --sort=-creatordate | head -10
```

## 🔄 Workflow Status

### View recent workflow runs
```bash
gh run list --limit 10
```

### Watch a running workflow
```bash
gh run watch
```

### View specific workflow runs
```bash
# CI workflow
gh run list --workflow=ci.yml --limit 5

# Release workflow
gh run list --workflow=release.yml --limit 5

# Publish workflow
gh run list --workflow=publish.yml --limit 5
```

### View failed runs (if any)
```bash
gh run list --status failure --limit 10
```

### View logs for a specific run
```bash
gh run view <run-id>
gh run view <run-id> --log
gh run view <run-id> --log-failed
```

## 🚀 Common Workflows

### After pushing code
```bash
# 1. Check that workflows started
gh run list --limit 3

# 2. Wait for release workflow to complete (if triggered)
#    It usually takes 1-2 minutes

# 3. Pull the release commit and tag
git pull --tags

# 4. Verify latest tag
git tag --sort=-creatordate | head -1
```

### Before starting work
```bash
# Make sure you have latest changes
git pull --tags

# Verify you're on main and up to date
git status
```

### Quick health check
```bash
# Run full verification
./scripts/verify-workflows.sh

# Or manual check
git fetch origin --tags && \
  git status && \
  gh run list --limit 5
```

## 📝 Commit Message Format

Use conventional commits for automatic versioning:

```bash
# New feature (minor version bump: 1.9.0 -> 1.10.0)
git commit -m "feat: add new feature"

# Bug fix (patch version bump: 1.9.0 -> 1.9.1)
git commit -m "fix: resolve bug"

# Breaking change (major version bump: 1.9.0 -> 2.0.0)
git commit -m "feat!: breaking change"
# or
git commit -m "feat: new feature

BREAKING CHANGE: description of breaking change"

# Other types (no version bump)
git commit -m "chore: update dependencies"
git commit -m "docs: update README"
git commit -m "test: add tests"
```

## 🏥 Troubleshooting

### Local is behind remote
```bash
git pull --tags
```

### Want to see what changed
```bash
git log HEAD..origin/main --oneline
```

### Workflow failed
```bash
# View recent runs
gh run list --limit 10

# View logs
gh run view <failing-run-id> --log-failed

# Re-run if needed
gh run rerun <run-id>
```

### Check if tag was created
```bash
# Local tags
git tag | grep v1.9

# Remote tags
git ls-remote --tags origin | grep v1.9
```

### Verify Marketplace publish
```bash
# Check publish workflow status
gh run list --workflow=publish.yml --limit 3

# Visit marketplace
open https://marketplace.visualstudio.com/items?itemName=jsonify.noted
```

## 📚 Full Documentation

- **Complete guide:** `docs/WORKFLOWS.md`
- **Health check results:** `docs/WORKFLOW_HEALTH_CHECK.md`
- **Verification results:** `docs/VERIFICATION_RESULTS.md`

## 🔗 Useful Links

- **GitHub Actions:** https://github.com/jsonify/noted/actions
- **Marketplace:** https://marketplace.visualstudio.com/items?itemName=jsonify.noted
- **Repository:** https://github.com/jsonify/noted
