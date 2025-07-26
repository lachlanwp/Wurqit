# Coverage Badge Setup Guide

## Steps to Enable GitHub Pages

1. **Go to your repository settings:**
   - Navigate to your GitHub repository
   - Click on "Settings" tab
   - Scroll down to "Pages" in the left sidebar

2. **Configure GitHub Pages:**
   - Under "Source", select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Select "/ (root)" folder
   - Click "Save"

3. **Wait for the first deployment:**
   - After pushing to main branch, the GitHub Actions workflow will run
   - It will create the `gh-pages` branch automatically
   - The coverage badge should appear after the first successful deployment

## How it works

1. **GitHub Actions workflow** (`tests.yml`):
   - Runs tests with coverage
   - Generates a JSON badge file
   - Deploys to GitHub Pages

2. **Badge URL**: `https://img.shields.io/endpoint?url=https://lachlanwp.github.io/wurqit/badges/coverage.json`

3. **Badge file location**: `https://lachlanwp.github.io/wurqit/badges/coverage.json`

## Troubleshooting

- If the badge shows "resource not available", check that GitHub Pages is enabled
- The badge will only update when you push to the main branch
- Make sure the `gh-pages` branch exists (created automatically by the workflow)

## Alternative: Direct Badge URL

If you prefer a simpler approach, you can also use a direct badge URL that doesn't require GitHub Pages:

```markdown
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)](https://github.com/lachlanwp/wurqit/actions/workflows/tests.yml)
```

But the dynamic coverage percentage won't be shown. 