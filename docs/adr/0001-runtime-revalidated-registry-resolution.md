---
status: superseded by ADR-0002
---

# Runtime-Revalidated Registry Resolution

This decision was superseded when the MVP moved from an item-level `owner/repo` crawl to a shadcn-style namespace directory. The earlier runtime/revalidation plan applied to resolving Registry Items from GitHub Registry Refs; the accepted MVP now stores registry-level metadata directly in the Registry Directory and does not need runtime Registry Snapshot refresh behavior.

The production serving path should resolve registries programmatically rather than spawning the `shadcn` CLI. CLI validation remains appropriate for contributor checks and local tooling, but page rendering needs bounded network, parsing, validation, and cache behavior.

For the MVP, contributor trust checks are deterministic and live in `registry:check`. AI-assisted PR review or deeper semantic install-risk review can be added later, but it is not required for the first release.

`registry:check` should fail objective broken or unsafe cases, including invalid Registry Refs, duplicate Registry Refs, failed shadcn registry validation, malformed resolved item data, target path escapes, and oversized payloads. It should warn on install-risk fields that need human judgment, including package dependencies, registry dependencies, environment variables, unusual targets, and unusually broad file changes.

Pull request CI should require each Registry Ref to be reachable and valid at review time. This is intentionally stricter than production runtime behavior, which may serve stale data or unavailable states during transient external failures.

When a Registry Ref is unreachable and no previous successful Registry Snapshot exists, the public page should show a soft unavailable Registry Group in Contribution Order rather than hiding it.

When stale Registry Snapshot data exists and the latest refresh fails, the public page should keep the Registry Group in Contribution Order with its existing Registry Items visible. The stale state should be shown quietly, such as noting that the page is using the last successful snapshot and the latest refresh failed. This state is distinct from a no-data unavailable Registry Group because stale data remains useful.
