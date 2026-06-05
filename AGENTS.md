<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

Before closing or changing state on an implementation issue, follow `docs/agents/issue-workflow.md`. Do not close implementation issues until the code is committed and pushed.

### Triage labels

Triage uses the default five-label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a multi-context layout with `CONTEXT-MAP.md` at the repo root and context-specific `CONTEXT.md` files. See `docs/agents/domain.md`.

### Commit Convention

Follow conventional commits: `category(scope): message`

Categories:

- `feat` - New features
- `fix` - Bug fixes (reference issue if applicable)
- `refactor` - Code changes that aren't fixes or features
- `docs` - Documentation changes
- `build` - Build/dependency changes
- `test` - Test changes
- `ci` - CI/CD configuration
- `chore` - Other changes

Example: `feat(components): add new prop to avatar component`
