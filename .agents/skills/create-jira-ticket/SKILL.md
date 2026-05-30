---
name: create-jira-ticket
description: Create a CLIM Jira ticket for work that's already done (usually an existing PR) and wire it into the board — set the component, assign it, add it to the active sprint, and tag the PR title. Use whenever the user wants to file, raise, log, or "create a Jira ticket / issue" for a PR or branch, retroactively document finished work in Jira, or get a PR's ticket onto the board. Trigger even if they only say "make a ticket for PR 190" or "log this in Jira" without naming the project, since CLIM is the default.
---

# Create Jira ticket for finished work

This skill captures a recurring workflow: the work is **already done** (there's a PR, or at least a branch), and now it needs a Jira ticket in the **CLIM** (Climate) project, slotted into the board so it doesn't look orphaned.

This is deliberately written as guidance, not a script. The workflow varies run-to-run — sometimes one PR, sometimes several; sometimes a status change is wanted, sometimes not; occasionally a custom field or a non-default sprint. You're better at adapting to that than a rigid wrapper would be. So: use the reference facts and example calls below, and reason about the rest. The value here is the fixed IDs and the gotchas, not boilerplate.

## Auth

Basic auth against `https://dhis2.atlassian.net`, using two values from `.env.local` at the repo root:

- `JIRA_API_TOKEN` — already present in this repo's `.env.local`.
- `JIRA_EMAIL` — the user's **dhis2.org Jira login email** (e.g. `eirik@dhis2.org`).

Load both, then auth as `-u "$JIRA_EMAIL:$JIRA_API_TOKEN"`:

```bash
set -a && source .env.local && set +a
```

Gotchas:
- **Don't** fall back to `git config user.email` — it's often a personal address (gmail), not the Jira login, and auth 401s.
- If `JIRA_EMAIL` is missing, ask the user once, then offer to save it. When appending, **lead with a newline** (`printf '\nJIRA_EMAIL=...\n' >> .env.local`) — the file may lack a trailing newline, and gluing the line onto the token silently breaks auth.
- Never print the token. Sanity-check auth with `curl -s -o /dev/null -w "%{http_code}" -u "$JIRA_EMAIL:$JIRA_API_TOKEN" https://dhis2.atlassian.net/rest/api/3/myself` → expect `200`.

## Fixed facts (CLIM board)

These are stable — use them directly instead of rediscovering. If one ever stops working, re-query the API (`/rest/api/3/project/CLIM`, `/rest/agile/1.0/board?projectKeyOrId=CLIM`) and update this file.

| Thing | Value |
|-------|-------|
| Site | `https://dhis2.atlassian.net` |
| Project | `CLIM` (Climate) |
| Component | `Modeling App` → id `10917` |
| Scrum board (active sprint lives here) | id `686` (C&H scrum) |
| Sprint field | `customfield_10020` |

Issue type ids (display names are Norwegian — aliases given):

| Type | id |
|------|----|
| Feature | `10117` |
| Bug (Feil) | `10024` |
| Task (Oppgave) | `10002` |
| Epic | `10000` |
| User Story | `10120` |
| Design | `10118` |

## Defaults vs. judgement vs. overrides

**Apply these defaults unless the user says otherwise:**
- Component `Modeling App` (always — it's fixed).
- Assign the ticket to the person running the skill (their own `accountId`, from `/rest/api/3/myself`).
- Add it to the **current active sprint**.
- Append `[CLIM-xxx]` to the PR title.

**You decide each run:**
- **Issue type** — reason from the actual change. Bug-fix-shaped work → `Bug`; new capability, docs, or improvement → `Feature`. Default to one of those two; never use `Task`, `Epic`, or `Story` unless the user explicitly asks.
- **Summary** — short and plain, a few words. The user wants tickets that are simple and not text-heavy, so resist padding.
- **Description** — unless the user says otherwise, write the ticket as planned work, not completed work. Use wording like "we should..." and describe the user need, expected behavior, and acceptance-level outcomes as if implementation has not happened yet. Do not mention implementation details, files, tests, refactors, libraries, or other technical solution details unless the user explicitly asks for them or they are essential to define the work. Do not add the PR title or PR link to the Jira description; Atlassian will connect the PR automatically after the PR title is tagged with `[CLIM-xxx]`.

**Only when the user asks:**
- A status transition (e.g. "move it to In Review"). Not a default — fresh tickets stay where they land.
- A specific sprint, a different assignee, skipping the PR-title tag, an extra custom field, etc.

## Workflow

1. **Identify the PR(s).** Usually a PR number. If they reference a branch with no PR, find it with `gh pr list --head <branch>` or ask. One ticket per PR.
2. **Read the PR** to choose type, summary, and the planned-work description: `gh pr view <num> --json title,body,url`.
3. **Auth** (load `.env.local`, confirm `JIRA_EMAIL` present, sanity-check `myself` → 200).
4. **Create + wire up** each ticket using the calls below.
5. **Report** the ticket keys and links back.

For multiple PRs, just repeat — each is independent.

## Example calls

Create the issue (component included up front):

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -X POST \
  -H "Content-Type: application/json" \
  https://dhis2.atlassian.net/rest/api/3/issue --data @- <<'EOF'
{ "fields": {
  "project":   { "key": "CLIM" },
  "issuetype": { "id": "10117" },
  "summary":   "Conceptual guides for covariates and prediction intervals",
  "components":[ { "id": "10917" } ],
  "description": { "type": "doc", "version": 1, "content": [
    { "type": "paragraph", "content": [
      { "type": "text", "text": "We should add clearer conceptual guidance for covariates and prediction intervals so users can understand when to use these concepts and how they affect prediction setup decisions." }
    ] }
  ] }
} }
EOF
# → returns {"key":"CLIM-749", ...}
```

Assign to self:

```bash
ACCOUNT_ID=$(curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" https://dhis2.atlassian.net/rest/api/3/myself | python3 -c "import sys,json;print(json.load(sys.stdin)['accountId'])")
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -X PUT https://dhis2.atlassian.net/rest/api/3/issue/CLIM-749/assignee \
  -H "Content-Type: application/json" --data "{\"accountId\":\"$ACCOUNT_ID\"}"
```

Add to the current active sprint (look it up off board 686):

```bash
SPRINT_ID=$(curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" "https://dhis2.atlassian.net/rest/agile/1.0/board/686/sprint?state=active" | python3 -c "import sys,json;print(json.load(sys.stdin)['values'][0]['id'])")
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -X POST "https://dhis2.atlassian.net/rest/agile/1.0/sprint/$SPRINT_ID/issue" \
  -H "Content-Type: application/json" --data '{"issues":["CLIM-749"]}'
```

Tag the PR title (skip if it already contains the key):

```bash
gh pr edit 190 --title "$(gh pr view 190 --json title --jq .title) [CLIM-749]"
```

Status transition (only when asked) — look the id up by name, since available transitions depend on the current status:

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" https://dhis2.atlassian.net/rest/api/3/issue/CLIM-749/transitions \
  | python3 -c "import sys,json;[print(t['id'],t['name']) for t in json.load(sys.stdin)['transitions']]"
# then POST the matching id:
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -X POST https://dhis2.atlassian.net/rest/api/3/issue/CLIM-749/transitions \
  -H "Content-Type: application/json" --data '{"transition":{"id":"2"}}'
```

## One caution

These are real, externally-visible actions — real tickets, real PR edits. If the request is ambiguous about which PRs or how many, confirm before firing.
