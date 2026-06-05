---
name: do-work
description: Pick up implementation issues from the current PRD, build them with a TDD-first loop, verify, commit, push, and update GitHub issue state. Use when the user says to do work, pick up the next issue, continue the current PRD, implement ready-for-agent work, or finish and close issues.
---

# Do Work

Implement GitHub issues end-to-end for this repo.

This skill is the bridge between Mat Pocock's planning/triage skills and actual shipping work. It does not replace `tdd`, `diagnose`, `prototype`, or `shadcn`; invoke those when the issue calls for them.

## Source Of Truth

Before changing issue state, read:

- `docs/agents/issue-workflow.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `CONTEXT-MAP.md`, relevant `CONTEXT.md`, and relevant ADRs

Use `pnpm` for project commands. Do not use `npm`.

## Pick Work

1. If the maintainer named an issue, use that issue.
2. Otherwise, work within the current PRD if one is implied by the conversation or recent issues.
3. Pick the next unblocked `ready-for-agent` issue from that PRD.
4. If multiple PRDs have unblocked ready work and no current PRD is clear, summarize candidates and ask which stream to prioritize.
5. Do not pick parent PRD issues as implementation work unless the maintainer explicitly asks.

An issue is blocked if its `Blocked by` section references an open issue, or it depends on an unresolved decision/API shape from another open issue.

Priority within unblocked ready work:

1. Bugs
2. Tracer bullets
3. Polish
4. Refactors

Use lower issue number as a tie-breaker only inside the same priority class.

## Implement

1. Read the full issue body, comments, labels, and linked PRD.
2. Identify the public behavior and acceptance criteria.
3. Use TDD by default:
   - Write one behavior-focused test first when there is a reasonable seam.
   - Make it fail for the right reason.
   - Implement the smallest change that makes it pass.
   - Repeat one vertical slice at a time.
4. If no good test seam exists, state why before implementation and use the closest reliable feedback loop.
5. For bugs, use `diagnose` first.
6. For uncertain UI direction, use `prototype` first and do not ship prototype code directly.
7. For shadcn/UI work, use `shadcn` and check local Next docs before editing App Router code.

Do not batch a pile of speculative tests before implementation. Red-green-refactor one behavior at a time.

## Verify

Run the commands relevant to the change, normally:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm registry:check` when Registry Directory data or validation is touched

Report warnings separately from failures. Do not hide known warnings.

## Commit And Push

1. Check `git status --short`.
2. Split unrelated work into separate conventional commits.
3. Commit only after verification.
4. Push the commit before closing the issue.
5. Never close an implementation issue for unpushed local work.

Commit format follows `AGENTS.md`, e.g. `feat(registry): render item discovery page`.

## Update Issue

After the pushed commit:

1. Check satisfied acceptance criteria in the issue body.
2. Post a completion comment with commit hash and verification summary.
3. Remove open-state labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`.
4. Close the issue.

If implementation is locally complete but not pushed, keep the issue open and move it to `ready-for-human`.

If work cannot finish in the current turn, leave a progress comment and move the issue to `ready-for-human`.
