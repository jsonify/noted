# About pnpm-lock.yaml

This file **MUST be committed** to the repository for:

1. **Reproducible builds** - Ensures everyone gets the same dependency versions
2. **CI/CD** - GitHub Actions needs this file to install dependencies with `--frozen-lockfile`
3. **Security** - Prevents dependency drift and supply chain attacks

## Common Issues

### "Cannot install with frozen-lockfile because pnpm-lock.yaml is absent"

**Cause**: The lockfile is in `.gitignore` or wasn't committed

**Solution**:
1. Remove `pnpm-lock.yaml` from `.gitignore`
2. Run `git add pnpm-lock.yaml`
3. Commit and push

### When to regenerate the lockfile

Only regenerate when you:
- Add/remove dependencies
- Update dependency versions
- Run `pnpm update`

**Command**: `pnpm install` will update the lockfile automatically
