---
status: accepted
---

# Item Discovery Over Curated Registries

The MVP is an item-discovery directory, not a registry-only clone of shadcn's public directory. `directory.json` remains a curated list of registries and registry-level metadata, but the public UI should show Registry Items from those registries, including item name, description, install command, and detailed file content where available. Item details should be derived from shadcn-compatible registry data rather than hand-maintained in `directory.json`, so the directory stays curated while item cards remain grounded in each source Registry.

The `directory.json` top-level shape should be an object with a `registries` array, not a bare array. The object shape keeps the contribution format stable if future directory-level metadata is needed.

`directory.json` should include a `$schema` field that points to this project's directory schema, such as `./directory.schema.json`. It should not use shadcn's registry schema because `directory.json` describes Directory Entries, not a shadcn Registry with `items` or `include`.

The directory schema should be committed as JSON Schema beside `directory.json` so contributor editors can validate the file without running a build step.

Directory Entry descriptions are contributor-supplied curated text, similar to shadcn's registry directory contribution model. The directory should require a useful description rather than deriving it automatically from GitHub repository metadata.

Each Directory Entry should require a Registry Source, Registry Display Name, Registry Description, and Registry GitHub Link. Registry Homepage is optional because some registries only have a GitHub repository while others have a separate project website. When a Directory Entry has no Registry Homepage, the field should be omitted from `directory.json` rather than included as `null`.

Directory Entries may include an optional Registry Logo. When absent, the `logo` field should be omitted. To stay close to shadcn's directory format, Registry Logo should be stored directly in `directory.json` as an inline SVG string in a `logo` field rather than as a separate asset path. Unlike shadcn's current directory validator, `registry:check` should validate this field as SVG and reject unsafe SVG content such as scripts, event handler attributes, external references, and oversized payloads. Registry Logo is website UI metadata and should not be included in any public machine payload intended for CLI registry resolution.

The MVP should not add a separate public machine payload like shadcn's generated `/r/registries.json`. The public page should consume the Registry Directory source data and derived Registry Item data directly until there is a concrete external consumer for a stripped registry-resolution payload.

For the MVP, a Registry GitHub Link must equal the canonical GitHub URL derived from its Registry Source, such as `https://github.com/{owner}/{repo}`. Keeping the field explicit makes review easy in `directory.json`, but constraining it prevents drift between the Registry Source and inspection link.

Registry Display Name is required curated presentation text. The directory should not silently default it from Registry Source, because Registry Source is an identity and resolution value rather than UI copy.

Directory Entries must have unique Registry Sources. `registry:check` should fail duplicate Registry Sources because one Registry Source represents one Directory Entry, and duplicates would make contribution order, item grouping, stale state, and install targets ambiguous.

Contribution Order is the source-file append order of Directory Entries in `directory.json`. The public UI should preserve this array order across fresh, stale, unavailable, and recovered states rather than sorting by display name, Registry Source, or popularity.

For the MVP, Registry Source accepts only GitHub `owner/repo` addresses. Registry Namespaces and arbitrary URL templates are deferred because they add configuration and validation paths that are not needed for the initial curated GitHub registry directory.

`registry:check` should validate every Directory Entry before review. Local schema checks should cover required fields, Registry Source format, canonical Registry GitHub Link, duplicate Registry Sources, and omitted optional fields. Networked registry checks should prove each Registry is shadcn-compatible and exposes listable Registry Items with canonical add command arguments. Pull request CI should run both check groups.

Install Commands shown on Registry Item cards should be derived from the shadcn-provided add command argument, such as the `addCommandArgument` returned by `list` or `search`, and then wrapped for supported package managers. The directory should not hand-write per-item install commands.
