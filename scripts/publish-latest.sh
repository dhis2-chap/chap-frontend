#!/usr/bin/env bash
set -euo pipefail

export GH_REPO="${GITHUB_REPOSITORY:?}"

# An old workflow retry must not replace the current main build.
main_sha=$(gh api "repos/$GH_REPO/commits/main" --jq .sha)
if [[ "$main_sha" != "$GITHUB_SHA" ]]; then
    echo "Skipping latest build: $GITHUB_SHA is no longer the head of main."
    exit 0
fi

asset="$RUNNER_TEMP/modeling-app-latest.zip"
cp apps/modeling-app/build/bundle/*.zip "$asset"

notes="$RUNNER_TEMP/modeling-app-latest-notes.md"
cat > "$notes" <<EOF
Unstable Modeling App build for testing. Automatically updated from main after CI checks pass.

Commit: https://github.com/$GH_REPO/commit/$GITHUB_SHA

For stable builds, use a versioned release.
EOF

title='Latest main build (unstable)'
if gh release view latest > /dev/null 2>&1; then
    gh release upload latest "$asset" --clobber
    gh api --method PATCH "repos/$GH_REPO/git/refs/tags/latest" \
        -f sha="$GITHUB_SHA" -F force=true
    gh release edit latest --title "$title" --notes-file "$notes" \
        --prerelease --latest=false
else
    gh release create latest "$asset" --target "$GITHUB_SHA" \
        --title "$title" --notes-file "$notes" --prerelease --latest=false
fi
