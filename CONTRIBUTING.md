# Contributing to Embark Quoting System

> **Before submitting code**: See `DEVELOPMENT.md` for pre-commit checklist, CI/CD expectations, and test organization.

## Progress Tracking with Hierarchical Sub-Issues

This project uses **GitHub Issues + GitHub Projects v2** with hierarchical sub-issues for progress tracking. All progress is accessible locally via `gh` CLI with automatic roll-up to parent issues.

---

## Issue Hierarchy

This project follows a hierarchical issue structure:

```
Milestone: v1.0 MVP Release (Feb 28, 2025)
  ↓
Epic (parent issue - large feature/initiative)
  ├─ Feature (sub-issue L1 - user-facing functionality)
  │   └─ Task (sub-issue L2 - implementation work)
  └─ Feature (sub-issue L1)
      └─ Task (sub-issue L2)
```

### Current Epics

**View Live Status**: [All Epics](https://github.com/IAMSamuelRodda/embark-quoting-system/issues?q=is%3Aissue+label%3A%22type%3A+epic%22)

The project uses 7 major epics with hierarchical sub-issues (features and tasks). Current status is tracked dynamically in GitHub Issues.

**Quick Access**:
```bash
# View all epics
gh issue list --label "type: epic" --state all

# View specific epic
gh issue view <epic-number>
```

---

## Dual Status Architecture

**IMPORTANT**: GitHub maintains TWO separate status systems that must stay synchronized:

### 1. Issue Labels (Repository-Level)
- Applied to issues: `status: pending`, `status: in-progress`, `status: completed`, `status: blocked`
- Visible on issue pages, in issue lists, and across ALL projects
- Created once, available everywhere

### 2. Project Status Field (Project-Level)
- Set in Project #2: "Todo", "In Progress", "Done"
- Only visible within [Project #2 - Roadmap](https://github.com/users/IAMSamuelRodda/projects/2)
- Must be updated separately via GraphQL or UI

### Status Mapping

| Issue Label | Project Status | When to Use |
|-------------|---------------|-------------|
| `status: pending` | Todo | Not started yet |
| `status: in-progress` | In Progress | Currently being worked on |
| `status: completed` | Done | Work complete, awaiting verification |
| `status: blocked` | Todo | Blocked, treat as pending |

**Key Rule**: Always update BOTH systems when changing status.

---

## Quick Reference

### View Current Progress

```bash
# View all epic issues
gh issue list --label "type: epic" --state open

# View specific epic with sub-issues
gh issue view 15  # Epic: Foundation
gh issue view 24  # Epic: Quote Core
gh issue view 31  # Epic: Job Types

# View project board (roadmap view)
gh project view 2 --owner IAMSamuelRodda --web

# View project in terminal
gh project view 2 --owner IAMSamuelRodda
```

### View Issues by Status

```bash
# Pending features/tasks
gh issue list --state open --label "status: pending"

# In-progress work
gh issue list --state open --label "status: in-progress"

# Blocked issues
gh issue list --state open --label "status: blocked"

# Features only
gh issue list --state open --label "type: feature"

# Tasks only
gh issue list --state open --label "type: task"
```

### View Sub-Issues

```bash
# View features under an epic
gh issue view 15  # Shows all sub-issues for Foundation epic

# Find all issues with sub-issues (parent issues)
gh issue list --search "has:sub-issues-progress"

# Find all sub-issues
gh issue list --search "has:parent-issue"
```

---

## Working on Features/Tasks

### Starting Work on a Feature

When you start work on a feature, update BOTH status systems:

```bash
# 1. Update issue label (repository-level)
gh issue edit 16 --remove-label "status: pending" --add-label "status: in-progress"

# 2. Add comment
gh issue comment 16 --body "Started feature: AWS Infrastructure Foundation"

# 3. Update project status field (project-level)
# Option A: Use UI (quick)
gh project view 2 --owner IAMSamuelRodda --web
# In UI: Click status dropdown for #16 → "In Progress"

# Option B: Delegate to github-progress-tracker agent (automated)
# The agent updates both label AND project field automatically
```

**Recommended**: Delegate to `github-progress-tracker` agent - it handles dual status automatically!

### Completing a Feature/Task (Sub-Issue)

**KEY**: When you close a sub-issue, progress automatically rolls up to the parent epic!

```bash
# 1. Close the feature/task
gh issue close 16 --comment "Feature complete: AWS infrastructure deployed and tested"

# 2. Add completed label
gh issue edit 16 --add-label "status: completed"

# 3. Update project status to "Done" (via UI or agent delegation)
gh project view 2 --owner IAMSamuelRodda --web

# 4. Verify parent epic shows updated progress (automatic!)
gh issue view 15  # Foundation epic now shows "1/5 features complete"
```

**Automatic Progress Roll-Up**: The parent epic's progress bar updates automatically - no manual updates needed!

### Completing an Epic

When all features/tasks under an epic are complete:

```bash
# 1. Verify all sub-issues are closed
gh issue view 15  # Should show "5/5 features complete"

# 2. Close the epic
gh issue close 15 --comment "Epic complete: All foundation features delivered"

# 3. Add completed label
gh issue edit 15 --add-label "status: completed"

# 4. Update project status to "Done"
gh project view 2 --owner IAMSamuelRodda --web
```

### Marking as Blocked

```bash
# Add blocked label and comment with dependency
gh issue edit 17 --add-label "status: blocked"
gh issue comment 17 --body "🚫 Blocked by #42: Waiting for sync engine design decisions"

# When unblocked
gh issue edit 17 --remove-label "status: blocked" --add-label "status: in-progress"
gh issue comment 17 --body "✅ Unblocked: Sync engine approach decided, can proceed with Docker deployment"
```

---

## Git Workflow: Feature → Dev → Main

This project uses a **three-tier branching strategy** with clean separation between development and production code.

### Branch Structure

```
feature/* → dev → main
            ↓      ↓
         staging  production
```

### Branch Policies

| Branch | Purpose | Deployments | Tests Required | Approval Required |
|--------|---------|-------------|----------------|-------------------|
| `feature/*` | Development work | None | Unit + Integration | No |
| `dev` | Integration & testing | Staging (AWS ECS) | Full suite + E2E | No (auto-merge) |
| `main` | Production-ready code | Production | Smoke tests only | **Yes** (human approval) |

### Creating a Feature Branch

```bash
# Always branch from dev, not main
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/quote-crud-api

# Work on the feature
# ... make changes ...

# Commit work (link to issue)
git add .
git commit -m "feat: implement quote CRUD API endpoints

Implements backend endpoints for quote management.

Closes #26"
```

### Feature → Dev: Pull Request

```bash
# Push feature branch
git push -u origin feature/quote-crud-api

# Create PR to dev
gh pr create \
  --base dev \
  --title "Feature: Quote CRUD API" \
  --body "Implements backend quote API endpoints (Closes #26)"
```

**CI Checks (Auto-run)**:
- ✓ Validate (lint, security, typecheck)
- ✓ Test (unit + integration)
- ✓ Build (Docker build + smoke test)

**Merge**: Auto-merge when all checks pass (no approval required for dev)
- Use `--merge` (merge commit) to preserve feature branch history
- Do NOT use `--squash` (keeps git graph clean and shows true branch flow)

### Dev → Main: Pull Request (Production Release)

```bash
# Only create dev → main PR when ready for production deployment
gh pr create \
  --base main \
  --head dev \
  --title "Release: v1.2.0" \
  --body "Production release with Quote API and Job Types features"
```

**CI Checks (Auto-run)**:
- ✓ Validate (quick sanity check)
- ✓ Build (smoke test only)
- ✓ Verify staging deployment is healthy

**Merge**: **Human approval required** (you must approve before merge)

**Post-Merge**:
- Main branch automatically deploys to production
- Smoke tests run on production
- GitHub release created (if tagged)

### Clean Production Code

**Test files** exist on all branches but are **excluded from production deployments** via `.gitattributes`:

```bash
# Tests exist in git (for traceability)
ls frontend/e2e/
# ✓ Files visible

# Tests excluded from production builds
git archive --format=tar HEAD | tar -t | grep "e2e"
# ✗ No e2e files in archive
```

This ensures:
- Full test coverage in development branches
- Clean production deployments without test infrastructure
- Git history preserved for all code

### Branch Cleanup

```bash
# After feature → dev merge, delete feature branch
git checkout dev
git pull origin dev
git branch -d feature/quote-crud-api
git push origin --delete feature/quote-crud-api
```

### Hotfix Workflow

For urgent production fixes:

```bash
# Branch from main, not dev
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug

# Fix the issue
# ... make changes ...

# Commit with issue reference
git commit -m "fix: resolve auth token expiration bug

Critical fix for production auth issue.

Fixes #89"

# Create PR directly to main
gh pr create \
  --base main \
  --title "Hotfix: Auth Token Expiration" \
  --body "Critical production fix (Fixes #89)"

# After merge, backport to dev
git checkout dev
git merge main
git push origin dev
```

### Workflow Summary

```bash
# Normal development flow
feature/my-feature → dev → staging → main → production
      ↓               ↓                ↓
  unit tests    full test suite   smoke tests
  integration   E2E tests         deployment
                staging deploy

# Approval gates
feature → dev: Auto-merge (CI passes)
dev → main:    Human approval required (you confirm staging is healthy)
```

---

## Agent Delegation

### github-progress-tracker Agent (v1.2.0)

Automates status updates with dual status architecture support.

**Usage**:
```
Delegate when starting work:
"Update progress: starting Feature #16 - AWS Infrastructure Foundation"

Delegate when completing work:
"Mark complete: Feature #16 - AWS infrastructure deployed and tested"
```

**What it does**:
- ✓ Updates issue label (`status: pending` → `status: in-progress`)
- ✓ Updates project status field (Todo → In Progress)
- ✓ Adds progress comment
- ✓ Closes issue when complete
- ✓ Verifies parent epic progress roll-up

**Benefit**: Maintains dual status architecture automatically - no manual UI clicking!

### github-project-status-synchronizer Agent (v1.0.0)

Bulk-synchronizes issue labels with project status fields.

**Usage**:
```
After bulk changes:
"sync project status for Project #2 (IAMSamuelRodda/embark-quoting-system)"

Fix blank fields:
"populate status fields for all items in Project #2, set to Todo"
```

**What it does**:
- ✓ Maps issue labels to project status (pending→Todo, in-progress→In Progress)
- ✓ Bulk updates all 45 items (30 seconds vs 5 minutes manual)
- ✓ Reports statistics and validation

**Use cases**:
- After initial project setup (set all to Todo)
- After label changes (synchronize to project)
- Manual fix for blank status fields

---

## Best Practices

### 1. Always Check Current State First

```bash
# See what's being worked on
gh issue list --state open --label "status: in-progress"

# See what's blocked
gh issue list --state open --label "status: blocked"

# View specific epic's progress
gh issue view 15  # Shows sub-issue progress bar
```

### 2. Update Status When Starting Work

```bash
# Change from pending to in-progress
gh issue edit <issue-number> --remove-label "status: pending" --add-label "status: in-progress"

# Or delegate to github-progress-tracker
```

### 3. Comment on Progress

```bash
# Add detailed progress comments
gh issue comment 16 --body "Completed AWS VPC setup:
- VPC with public/private subnets
- Security groups configured
- RDS PostgreSQL instance running
- S3 buckets created

Next: ECR repository setup"
```

### 4. Link Commits to Issues

```bash
# Reference issue in commit messages
git commit -m "feat: implement AWS VPC infrastructure

Completes Feature #16 sub-task: VPC setup

- Created VPC with CIDR 10.0.0.0/16
- Public subnets in 2 AZs
- Private subnets for RDS
- NAT gateways configured

Relates to #15 (Foundation epic)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

### 5. Use Proper Issue Lifecycle

**Correct lifecycle**:
```
Create → Todo → In Progress → Done (project status) → Close (issue state)
```

**Common mistake**:
```
❌ DON'T close issues to mark as "Done" - use project status field instead!
```

If you close an issue by mistake, reopen it:
```bash
gh issue reopen 47
```

### 6. Delegate Status Updates

**Recommended approach**:
- Use `github-progress-tracker` for individual issue updates (automatic dual status)
- Use `github-project-status-synchronizer` for bulk operations (30 seconds vs 5 minutes)

---

## Project Links

- **GitHub Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system
- **Project Board (Roadmap)**: https://github.com/users/IAMSamuelRodda/projects/2
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
- **Milestone (v1.0 MVP)**: https://github.com/IAMSamuelRodda/embark-quoting-system/milestone/8

---

## Example Workflow

### Starting a New Feature

```bash
# 1. Check current state
gh issue list --state open --label "status: pending"

# 2. View feature details
gh issue view 16  # AWS Infrastructure Foundation

# 3. Start work - delegate to agent (recommended)
# Agent updates both label AND project status automatically

# OR manual approach:
gh issue edit 16 --remove-label "status: pending" --add-label "status: in-progress"
gh issue comment 16 --body "Started AWS infrastructure setup"
# Then update project status via UI

# 4. Do the work
# ... implement AWS VPC, RDS, S3, ECR ...

# 5. Commit with issue reference
git commit -m "feat: complete AWS VPC infrastructure

Implements Feature #16: AWS Infrastructure Foundation (partial)

- VPC with CIDR 10.0.0.0/16 created
- Public/private subnets in 2 AZs
- Security groups configured
- Internet gateway and NAT gateways

Next: RDS PostgreSQL setup

Relates to #15

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# 6. Comment on progress
gh issue comment 16 --body "✅ VPC infrastructure complete:
- VPC created and tested
- Subnets verified in both AZs
- Security groups validated
- Gateway connectivity confirmed

Next: RDS instance setup"

# 7. When feature is complete - delegate to agent (recommended)
# Agent closes issue, updates labels, updates project status, verifies parent epic

# OR manual approach:
gh issue close 16 --comment "Feature complete: AWS infrastructure deployed and verified"
gh issue edit 16 --add-label "status: completed"
# Then update project status via UI

# 8. Verify parent epic shows progress
gh issue view 15  # Should show "1/5 features complete"
```

### Working on an Epic End-to-End

```bash
# 1. Start the epic
gh issue edit 15 --remove-label "status: pending" --add-label "status: in-progress"
gh issue comment 15 --body "Started Foundation epic"

# 2. Work on each feature (sub-issue) sequentially
# Feature #16: AWS Infrastructure
gh issue edit 16 --add-label "status: in-progress"
# ... do work ...
gh issue close 16 --comment "AWS infrastructure complete"

# Feature #17: Docker & ECS Deployment
gh issue edit 17 --add-label "status: in-progress"
# ... do work ...
gh issue close 17 --comment "Docker deployment complete"

# Continue for features #21, #22, #23...

# 3. Monitor epic progress
gh issue view 15  # Shows "2/5 features complete", "3/5", etc.

# 4. Complete the epic when all features done
gh issue view 15  # Shows "5/5 features complete"
gh issue close 15 --comment "Foundation epic complete: All features delivered"

# 5. Update project status to Done
gh project view 2 --owner IAMSamuelRodda --web
# In UI: Set Epic #15 status to "Done"

# 6. Verify milestone progress
# Milestone "v1.0 MVP Release" now shows "1/7 epics complete"
```

---

## Troubleshooting

### gh CLI Not Authenticated

```bash
gh auth status
gh auth refresh -h github.com -s project,read:project
```

### Project Status Fields Are Blank

```bash
# Delegate bulk synchronization
# "sync project status for Project #2, set all to Todo"

# Or use script directly
cd ~/.claude/skills/github-project-setup
./scripts/set-project-status.sh 2 IAMSamuelRodda "Todo"
```

### Can't See Sub-Issues on an Epic

```bash
# Sub-issues should appear automatically
gh issue view 15

# If not showing, verify linking
gh api repos/IAMSamuelRodda/embark-quoting-system/issues/15/sub_issues
```

### Issue Closed By Mistake

```bash
# Reopen the issue
gh issue reopen 47

# Update status back to In Progress
gh issue edit 47 --add-label "status: in-progress"

# Update project status via UI
gh project view 2 --owner IAMSamuelRodda --web
```

### Need to See Full Project Hierarchy

```bash
# View all epics with sub-issues
for epic in 15 24 31 37 42 55 58; do
  echo "=== Epic #$epic ==="
  gh issue view $epic --json title,body | jq -r '.title'
  gh api repos/IAMSamuelRodda/embark-quoting-system/issues/$epic/sub_issues --jq '.[] | "  - #\(.number): \(.title)"'
  echo ""
done
```

---

## Agent Coordination

When multiple agents or developers work on the project:

1. **Check status labels**: `gh issue list --label "status: in-progress"`
2. **Avoid duplicate work**: Check issue comments for activity
3. **Communicate**: Add comments when starting/finishing work
4. **Use branches**: Create feature branches for parallel work
5. **Delegate status updates**: Let agents handle dual status architecture

```bash
# See who's working on what
gh issue list --state open --label "status: in-progress"

# See recently updated issues
gh issue list --state open --search "sort:updated-desc"
```

---

## Technical References

- **BLUEPRINT**: `specs/BLUEPRINT.yaml` - Complete technical specifications
- **Financial Model**: `docs/financial-model.md` - Profit-First calculation details
- **GitHub Setup Skill**: `~/.claude/skills/github-project-setup/` - Project setup automation
- **CLAUDE.md**: `~/.claude/CLAUDE.md` - Global GitHub workflow patterns

---

## Need Help?

### Documentation
- Review `specs/BLUEPRINT.yaml` for feature requirements
- Check `docs/` for technical specifications
- View git history: `git log --oneline --graph`

### Progress Tracking
- View all issues: `gh issue list --state all`
- View project board: `gh project view 2 --owner IAMSamuelRodda --web`
- Check milestone progress: `gh issue list --milestone "v1.0 MVP Release"`

### Agent Delegation
- Delegate status updates to `github-progress-tracker` (automatic dual status)
- Delegate bulk operations to `github-project-status-synchronizer` (saves time)
- Both agents understand the dual status architecture and hierarchical issues

---

**Last Updated**: 2025-11-05 (Removed stale status tables, pointed to GitHub Issues as source of truth)
