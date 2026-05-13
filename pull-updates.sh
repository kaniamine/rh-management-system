#!/bin/bash
# Pull latest changes from GitHub and update the frontend

set -e

echo "=== Fetching from origin ==="
git fetch origin

BEHIND=$(git rev-list HEAD..origin/main --count)

if [ "$BEHIND" -eq 0 ]; then
  echo "Already up to date with origin/main. Nothing to pull."
  exit 0
fi

echo "=== $BEHIND new commit(s) found on origin/main ==="
git log --oneline HEAD..origin/main

# If there are uncommitted changes, commit them first so pull doesn't fail
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo ""
  echo "=== You have uncommitted local changes — committing them before pull ==="
  git add -A
  git commit -m "WIP: save local changes before pulling from origin/main"
fi

echo ""
echo "=== Pulling origin/main ==="
git pull origin main --no-rebase

echo ""
echo "=== Pull done. Checking if frontend dependencies changed ==="
cd frontend/rh-management-frontend

if git diff HEAD~1 HEAD -- package.json | grep -q .; then
  echo "package.json changed — running npm install..."
  npm install
else
  echo "package.json unchanged — skipping npm install."
fi

echo ""
echo "=== Done! Your frontend is up to date with origin/main ==="
echo "If there were merge conflicts, fix them then run: git add . && git commit"
