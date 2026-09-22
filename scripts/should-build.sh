#!/usr/bin/env bash
# Build-skip hook for Netlify (`ignore`) and Vercel (`ignoreCommand`):
# exit 0 to skip the build, 1 to run it. Skips commits that cannot affect the
# deployed bundle.
set -euo pipefail

# Netlify passes the last built commit; on Vercel compare against the parent.
base="${CACHED_COMMIT_REF:-}"
head="${COMMIT_REF:-${VERCEL_GIT_COMMIT_SHA:-HEAD}}"
if [ -z "$base" ] && git cat-file -e "${head}^{commit}" 2>/dev/null; then
  base="${head}^"
fi

# No cached build to compare against: always build.
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "No cached commit; building."
  exit 1
fi

changed="$(git diff --name-only "$base" "$head")"
[ -z "$changed" ] && { echo "No changes; skipping."; exit 0; }

# Anything outside these paths means the site could change.
relevant="$(printf '%s\n' "$changed" | grep -vE '^(plan\.md|README\.md|\.github/|e2e/|supabase/|scripts/|\.claude/|\.agents/)' | grep -vE '\.spec\.(ts|sql)$' || true)"

if [ -z "$relevant" ]; then
  echo "Only non-deployable files changed; skipping build:"
  printf '%s\n' "$changed"
  exit 0
fi

echo "Deployable changes detected; building:"
printf '%s\n' "$relevant"
exit 1
