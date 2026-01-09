#!/bin/bash

claude --permission-mode acceptEdits "@.ralph/prd.md @.ralph/progress.txt \
1. Read the PRD and progress file. \
2. Find the next incomplete task and implement it. \
3. Commit your changes. \
4. Update progress.txt with what you did. \
5. Change "passes" to "true" in the PRD file for the task you did.

When choosing the next task, prioritize in this order:
1. Architectural decisions and core abstractions
2. Integration points between modules
3. Unknown unknowns and spike work
4. Standard features and implementation
5. Polish, cleanup, and quick wins
Fail fast on risky work. Save easy wins for later.

Before committing, run ALL feedback loops:
1. TypeScript: pnpm tsc:check (must pass with no errors)
2. Tests: pnpm test (must pass)
3. Lint: pnpm linter:check (must pass)
4. If doing UI changes, use the Playwright MCP to verify the changes. Use birk / Solololo1! as the username and password. The app is running at http://localhost:3000.
Do NOT commit if any feedback loop fails. Fix issues first.

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.
Fight entropy. Leave the codebase better than you found it.

ONLY DO ONE TASK AT A TIME."
