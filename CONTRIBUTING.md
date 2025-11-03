# Contributing to Embark Quoting System

## Progress Tracking for AI Agents

This project uses **GitHub Issues + GitHub Projects** for progress tracking. All progress is accessible locally via `gh` CLI.

---

## Quick Reference

### View Current Progress

```bash
# View all phase issues
gh issue list --label "phase: 1-foundation,phase: 2-quote-core,phase: 3-job-types,phase: 4-financial,phase: 5-sync,phase: 6-outputs,phase: 7-polish"

# View specific phase
gh issue view 1  # Phase 1: Foundation
gh issue view 2  # Phase 2: Quote Core
gh issue view 3  # Phase 3: Job Types
gh issue view 4  # Phase 4: Financial Calculations
gh issue view 5  # Phase 5: Sync Engine
gh issue view 6  # Phase 6: Outputs & Price Management
gh issue view 7  # Phase 7: Settings & Polish

# View project board
gh project view 1 --owner @me --web
```

### View Pending Tasks

```bash
# All pending issues
gh issue list --state open --label "status: pending"

# In-progress issues
gh issue list --state open --label "status: in-progress"

# Blocked issues
gh issue list --state open --label "status: blocked"
```

---

## Updating Progress

### Starting Work on a Phase

```bash
# Mark phase as in-progress
gh issue edit <issue-number> --remove-label "status: pending" --add-label "status: in-progress"

# Example: Starting Phase 1
gh issue edit 1 --remove-label "status: pending" --add-label "status: in-progress"
```

### Completing a Task

GitHub issue checklists must be updated via web interface or API. Use this command to open the issue in browser:

```bash
# Open issue in browser to check off task
gh issue view 1 --web

# Or edit directly (requires knowing issue body markdown)
gh issue edit 1 --body "$(gh issue view 1 --json body -q .body | sed 's/- \[ \] \*\*Phase 1.1\*\*/- [x] **Phase 1.1**/')"
```

**Recommended Approach**: Use `gh issue view <number> --web` to open in browser and check tasks manually.

### Marking a Task as Blocked

```bash
# Add blocked label and comment
gh issue edit <issue-number> --add-label "status: blocked"
gh issue comment <issue-number> --body "Blocked by: [reason]"

# Example
gh issue edit 1 --add-label "status: blocked"
gh issue comment 1 --body "Blocked by: Waiting for AWS credentials"
```

### Completing a Phase

```bash
# Mark phase as completed and close issue
gh issue close <issue-number> --comment "Phase completed. All tasks finished and tested."
gh issue edit <issue-number> --remove-label "status: in-progress" --add-label "status: completed"

# Example: Completing Phase 1
gh issue close 1 --comment "Phase 1 completed. Infrastructure deployed and authentication working."
gh issue edit 1 --add-label "status: completed"
```

---

## Helper Scripts

### Update Task Checklist (Simple Helper)

Create `.github/scripts/check-task.sh`:

```bash
#!/bin/bash
# Usage: ./check-task.sh <issue-number> <task-number>
# Example: ./check-task.sh 1 3  (checks off Phase 1.2.1)

ISSUE=$1
TASK=$2

# Fetch current body
BODY=$(gh issue view $ISSUE --json body -q .body)

# Check off the task (this is simplified - real implementation needs better parsing)
UPDATED=$(echo "$BODY" | sed "${TASK}s/- \[ \]/- [x]/")

# Update issue
gh issue edit $ISSUE --body "$UPDATED"
echo "✓ Task $TASK checked off in issue #$ISSUE"
```

### View Progress Summary

```bash
#!/bin/bash
# Show progress summary

echo "=== Embark Quoting System - Progress Summary ==="
echo ""
echo "Phase 1: Foundation"
gh issue view 1 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 2: Quote Core"
gh issue view 2 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 3: Job Types"
gh issue view 3 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 4: Financial Calculations"
gh issue view 4 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 5: Sync Engine"
gh issue view 5 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 6: Outputs & Price Management"
gh issue view 6 --json title,state,labels -q '.title + " [" + .state + "]"'
echo ""
echo "Phase 7: Settings & Polish"
gh issue view 7 --json title,state,labels -q '.title + " [" + .state + "]"'
```

---

## Best Practices for Agents

### 1. Check Current Progress Before Starting

```bash
# Always check what's already done
gh issue list --state open
```

### 2. Update Status When Starting Work

```bash
# Mark phase as in-progress when you start
gh issue edit <issue-number> --remove-label "status: pending" --add-label "status: in-progress"
```

### 3. Comment on Progress

```bash
# Add progress comments
gh issue comment <issue-number> --body "Completed Phase X.Y: [description]"
```

### 4. Link Related Commits

```bash
# Reference issue in commit messages
git commit -m "Implement Phase 1.2.1: Docker container

Closes #1 (partial - task 1.2.1 complete)

- Created Dockerfile for Node.js 20
- Basic Express server with /health endpoint
- Tested locally

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

### 5. Update Blueprint if Requirements Change

If requirements change during implementation:

1. Document change in issue comment
2. Update `specs/BLUEPRINT.yaml` if needed
3. Create follow-up issue if scope changes significantly

```bash
# Document requirements change
gh issue comment <issue-number> --body "Requirements update: [description]

Original: [what was planned]
Updated: [what changed]
Reason: [why it changed]"
```

---

## Issue-Phase Mapping

| Issue # | Phase | Milestone |
|---------|-------|-----------|
| #1 | Phase 1: Foundation (Weeks 1-2) | Authentication working, deployed to AWS |
| #2 | Phase 2: Quote Core (Weeks 3-4) | Can create quotes offline, sync when online |
| #3 | Phase 3: Job Types (Weeks 5-6) | All 5 job types functional |
| #4 | Phase 4: Financial Calculations (Week 7) | Accurate quote totals with configurable model |
| #5 | Phase 5: Sync Engine (Weeks 8-10) | Conflict resolution working, sync robust |
| #6 | Phase 6: Outputs & Price Management (Week 11) | Price management and PDF/email outputs working |
| #7 | Phase 7: Settings & Polish (Week 11) | Production-ready application |

---

## Project Links

- **GitHub Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system
- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/1
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues

---

## Troubleshooting

### gh CLI Not Authenticated

```bash
gh auth status
gh auth refresh -h github.com -s project,read:project
```

### Can't Update Issue Checklist

Use web interface for now:
```bash
gh issue view <issue-number> --web
```

### Need to See Detailed BLUEPRINT

```bash
cat specs/BLUEPRINT.yaml | less
# Or open in editor
code specs/BLUEPRINT.yaml
```

---

## Example Workflow

```bash
# 1. Check current state
gh issue list --state open

# 2. Start working on Phase 1
gh issue edit 1 --remove-label "status: pending" --add-label "status: in-progress"

# 3. View tasks for Phase 1
gh issue view 1

# 4. Complete Phase 1.1 (AWS Infrastructure)
# ... do the work ...

# 5. Update checklist (via web or script)
gh issue view 1 --web
# Check off "Phase 1.1: AWS Infrastructure Foundation"

# 6. Commit with issue reference
git commit -m "Complete Phase 1.1: AWS Infrastructure Foundation

Infrastructure deployed and tested:
- VPC with subnets
- RDS PostgreSQL running
- S3 buckets created
- ECR repository ready

Relates to #1"

# 7. Comment on progress
gh issue comment 1 --body "✅ Phase 1.1 complete: AWS infrastructure deployed and verified"

# 8. Continue with next task...
```

---

## Agent Coordination

When multiple agents work on the project:

1. **Check issue status first**: `gh issue view <number>`
2. **Avoid duplicate work**: Check labels and comments
3. **Communicate**: Add comments when starting/finishing tasks
4. **Use branches**: Create feature branches for parallel work

```bash
# Check who's working on what
gh issue list --state open --label "status: in-progress"
```

---

## Need Help?

- Review `specs/BLUEPRINT.yaml` for detailed technical specifications
- Review `docs/financial-model.md` for Profit-First calculation details
- Check git history: `git log --oneline`
- View all issues: `gh issue list --state all`
