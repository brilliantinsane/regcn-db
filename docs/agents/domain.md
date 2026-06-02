# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This repo is configured as a multi-context project. Use `CONTEXT-MAP.md` at the repo root as the entry point. It should point to one `CONTEXT.md` per context as the project grows.

System-wide decisions belong in root-level `docs/adr/`. Context-specific decisions belong beside the relevant context, usually under `src/<context>/docs/adr/`.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root. Read each context file relevant to the topic.
- **Context-specific `CONTEXT.md` files** listed by `CONTEXT-MAP.md`.
- **`docs/adr/`** for system-wide decisions.
- **Context-specific ADRs**, usually `src/<context>/docs/adr/`, for decisions scoped to the area you're about to work in.

If any of these files don't exist yet, proceed silently. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## Expected structure

```text
/
├── CONTEXT-MAP.md
├── docs/adr/
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept in an issue title, refactor proposal, hypothesis, or test name, use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use, or there's a real gap to note for `/grill-with-docs`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) - but worth reopening because..._
