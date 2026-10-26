#!/usr/bin/env bash

# Boot the e2e stack against a chosen chap-core version, then run the suite.
#
#   pnpm e2e:chap-core            latest chap-core release
#   pnpm e2e:chap-core latest     chap-core master
#   pnpm e2e:chap-core v2.1.0     a specific chap-core release
#
# The frontend side is whatever is checked out, so check out a release tag first to test
# a released frontend against a released backend.

set -euo pipefail

tag="${1:-}"

if [ -z "$tag" ]; then
    # chap-core publishes images only for master, dev and v1.*/v2.* tags, so its Helm
    # chart releases (chap-x.y.z) have to be filtered out here.
    tag="$(gh release list --repo dhis2-chap/chap-core --limit 50 \
        --json tagName,isDraft,isPrerelease,publishedAt \
        --jq '[.[]
                | select(.isDraft == false and .isPrerelease == false)
                | select(.tagName | test("^v[0-9]"))]
              | sort_by(.publishedAt) | reverse | .[0].tagName')"
fi

echo "chap-core: $tag"

CHAP_CORE_TAG="$tag" CHAP_WORKER_TAG="$tag" pnpm docker:e2e up --wait --pull always
pnpm e2e:ci
