# Issue Workflow

This repo uses GitHub Issues as both planning records and implementation tickets.

Mat Pocock's upstream skills provide the reusable workflows for PRDs, issue creation, and triage. This file records the repo-specific lifecycle policy that those generic skills do not know: when an implementation issue is considered complete, which labels it should carry, and when it may be closed.

## Before Work

1. Read the issue body, comments, labels, and linked PRD.
2. Read `CONTEXT-MAP.md`, the relevant `CONTEXT.md`, and related ADRs.
3. Prefer the current PRD's open `ready-for-agent` implementation issues over the global issue queue. If the maintainer has named or implied a current PRD, work within that PRD until its unblocked agent-ready issues are exhausted.
4. Pick the next unblocked `ready-for-agent` issue, not merely the oldest one. An issue is blocked if its `Blocked by` section references an open issue, or if its requirements depend on an unresolved decision/API shape from another open issue.
5. If multiple PRDs have unblocked `ready-for-agent` issues and no current PRD is clear, summarize the candidates and ask the maintainer which stream to prioritize.
6. Do not close or mark acceptance criteria complete before implementation is verified.

## Priority

Within the current PRD's unblocked `ready-for-agent` issues, prefer work in this order:

1. Bug fixes - broken behavior affecting users.
2. Tracer bullets - thin end-to-end slices that prove an approach works.
3. Polish - improvements to existing behavior, UX, errors, or docs.
4. Refactors - internal cleanups with no user-visible behavior change.

If two issues have the same priority and neither blocks the other, use the lower issue number as the tie-breaker.

Parallel work is only appropriate when issues are independently unblocked and unlikely to touch overlapping modules. Do not run parallel implementation in the same working tree. Use separate branches/worktrees or a sandbox orchestrator, and ask the maintainer before starting parallel agents.

## During Work

- Keep the issue open.
- Keep `ready-for-agent` only while the issue is available for an agent to pick up.
- If an agent starts work and cannot finish in the same turn, leave a progress comment and move the issue to `ready-for-human`.
- If local implementation is complete but code is not committed and pushed, move the issue to `ready-for-human`.
- Do not use issue comments as a substitute for updating acceptance criteria.

## Acceptance Criteria

When each acceptance criterion is satisfied:

1. Update the issue body checklist from `- [ ]` to `- [x]`.
2. Post a short completion comment with the verification commands and any known warnings.
3. Keep unresolved or partially satisfied criteria unchecked.

## Closing

Only close an implementation issue after all of these are true:

- All acceptance criteria are checked.
- Required verification commands pass or known failures are documented.
- The implementation is committed.
- The commit is pushed to the remote branch that contains the work.

If any of these are not true, do not close the issue. Use `ready-for-human` when a human needs to review, commit, push, or make a release decision.

When closing a completed implementation issue:

1. Post or preserve a completion comment with the commit reference and verification summary.
2. Remove open-state labels: `needs-triage`, `needs-info`, `ready-for-agent`, and `ready-for-human`.
3. Close the issue.

For `wontfix`, keep the `wontfix` label, include the rationale, and follow the out-of-scope process for rejected enhancements.

## Labels

Every open issue should have exactly one state label:

- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

Closed completed issues should not keep an open-state label. Closed rejected issues should keep `wontfix`.

This tracker does not have a `done` label. Completion is represented by checked acceptance criteria, a pushed commit, and the GitHub closed state.
