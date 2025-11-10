# Debug Workflows

This directory contains disabled workflow files used for debugging specific CI/CD issues. These workflows are kept for reference but not actively running.

## Purpose

Debug workflows allow isolating and testing specific parts of the CI/CD pipeline without affecting the main workflows. They are useful for:

- Debugging deployment issues in isolation
- Testing new workflow features before integrating into main workflows
- Reproducing bugs reported in production workflows
- Quick iteration on workflow changes without breaking active pipelines

## Usage Pattern

### Creating a Debug Workflow

1. **Copy existing workflow** to this directory with `.disabled` extension:
   ```bash
   cp .github/workflows/deploy-staging.yml .github/workflows-debug/deploy-staging-debug.yml.disabled
   ```

2. **Rename the workflow** to avoid confusion:
   ```yaml
   name: [DEBUG] Deploy to Staging  # Add [DEBUG] prefix
   ```

3. **Change trigger to manual** to prevent automatic runs:
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         debug:
           description: 'Enable debug logging'
           required: false
           default: 'true'
   ```

4. **Add debug logging**:
   ```yaml
   - name: Debug environment
     if: github.event.inputs.debug == 'true'
     run: |
       echo "🔍 Debug Mode Active"
       env | sort
       echo "GitHub Context: ${{ toJson(github) }}"
   ```

5. **Remove `.disabled` extension** when ready to use:
   ```bash
   mv deploy-staging-debug.yml.disabled deploy-staging-debug.yml
   ```

### Running a Debug Workflow

1. Go to **Actions** tab in GitHub
2. Select the debug workflow from the left sidebar
3. Click **Run workflow** button
4. Set debug inputs as needed
5. Monitor the run for detailed output

### Cleaning Up Debug Workflows

After fixing the issue:

1. **Translate learnings** to the main workflow:
   - Copy successful fixes from debug workflow to production workflow
   - Document what was changed and why in commit message

2. **Disable the debug workflow again**:
   ```bash
   mv deploy-staging-debug.yml deploy-staging-debug.yml.disabled
   ```

3. **Add note in this README** about what was debugged and the solution

## Active Debug Workflows

### test-e2e-staging.yml.disabled

**Created**: 2025-11-07
**Purpose**: Debug E2E test failures on staging environment
**Issue**: E2E tests were failing due to dynamic backend IP not being passed correctly
**Solution**: Fixed environment variable passing in deploy-staging.yml workflow
**Status**: ✅ Resolved - Workflow disabled, fix merged to main workflow
**Lessons Learned**:
- Backend URL must be dynamically retrieved from ECS task public IP (no ALB yet)
- Environment variables need explicit export before npm subprocess calls
- Playwright config must use process.env with fallback values

## Hybrid Debugging Approach

Instead of creating separate workflow files, you can add debug modes to existing workflows:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [dev]
  workflow_dispatch:
    inputs:
      debug:
        description: 'Enable debug mode'
        required: false
        default: 'false'
      skip_tests:
        description: 'Skip E2E tests (for quick deployment)'
        required: false
        default: 'false'

jobs:
  deploy-backend:
    # ... existing job ...

    - name: Debug deployment
      if: github.event.inputs.debug == 'true'
      run: |
        echo "🔍 ECS Task Details:"
        aws ecs describe-tasks --cluster ${{ env.ECS_CLUSTER }} --tasks $TASK_ARN

  e2e-tests:
    if: github.event.inputs.skip_tests != 'true'
    # ... existing job ...
```

This approach keeps debug capability in production workflows without separate files.

## Best Practices

1. **Always prefix debug workflows** with `[DEBUG]` in the name
2. **Use `.disabled` extension** when not actively debugging
3. **Document findings** in this README when you solve an issue
4. **Clean up** after debugging is complete - don't let debug workflows accumulate
5. **Use `workflow_dispatch`** for manual triggers instead of automatic runs
6. **Add context dumps** for debugging: `echo "${{ toJson(github) }}"`
7. **Keep debug workflows on dev branch** - don't merge to main unless adding permanent debug hooks

## Folder Structure

```
.github/
├── workflows/              # Active production workflows
│   ├── validate.yml
│   ├── test.yml
│   ├── build.yml
│   ├── deploy-staging.yml
│   └── deploy-prod.yml
└── workflows-debug/        # Disabled debug workflows (export-ignored from main)
    ├── README.md          # This file
    └── *.yml.disabled     # Debug workflow templates
```

## Export-Ignore

This directory is excluded from production deployments via `.gitattributes`:

```
.github/workflows-debug/ export-ignore
```

Debug workflows exist in git history but are not included in release artifacts or production deployments.
