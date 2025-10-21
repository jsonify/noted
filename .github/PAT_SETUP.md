# Personal Access Token Setup for Automated Releases

The automated release workflow requires a Personal Access Token (PAT) to trigger the publish workflow when creating tags.

## Why is this needed?

GitHub workflows triggered by the default `GITHUB_TOKEN` cannot trigger other workflows (security feature to prevent infinite loops). Since our release workflow creates and pushes tags that should trigger the publish workflow, we need a PAT.

## Setup Instructions

### 1. Create a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Noted Release Automation"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### 2. Add Token to Repository Secrets

1. Go to your repository: https://github.com/jsonify/noted
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `PAT_TOKEN`
5. Value: Paste the token you copied
6. Click "Add secret"

### 3. Test the Workflow

Once the PAT is added, the automated workflow will work as follows:

1. Push a commit with `feat:` or `fix:` prefix to main
2. Release workflow runs and creates a version tag using the PAT
3. Tag push triggers the publish workflow
4. Extension is automatically published to the marketplace
5. GitHub release is created

## Fallback

If `PAT_TOKEN` is not set, the workflow will fall back to `GITHUB_TOKEN`, but the publish workflow won't be triggered automatically. You would need to manually run the publish workflow or create/push tags manually.
