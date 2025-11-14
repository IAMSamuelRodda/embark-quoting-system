#!/bin/bash
# Install git hooks from scripts/hooks/ to .git/hooks/
# Run this script after cloning the repository

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SOURCE_HOOKS_DIR="$REPO_ROOT/scripts/hooks"

echo "Installing git hooks..."

# Check if .git directory exists
if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "❌ Error: .git directory not found. Are you in a git repository?"
  exit 1
fi

# Copy pre-push hook
if [ -f "$SOURCE_HOOKS_DIR/pre-push" ]; then
  cp "$SOURCE_HOOKS_DIR/pre-push" "$HOOKS_DIR/pre-push"
  chmod +x "$HOOKS_DIR/pre-push"
  echo "✅ Installed pre-push hook (branch protection)"
else
  echo "⚠️  Warning: pre-push hook not found in scripts/hooks/"
fi

echo ""
echo "Git hooks installed successfully!"
echo "Branch protection is now active - direct pushes to dev/main are blocked."
