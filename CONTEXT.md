# Registry Directory

This context defines the language for a public directory of shadcn-compatible registries.

## Language

**Registry Directory**:
A curated index of public shadcn-compatible registries that also displays Registry Items derived from those registries. It is not the authoritative source for Registry Item details.
_Avoid_: Registry cache, item database, item crawler

**Contribution Order**:
The append-only order in which Directory Entries are added to the Registry Directory. It is chronology, not ranking.
_Avoid_: Alphabetical source order, popularity ranking

**Registry**:
A public shadcn-compatible source of Registry Items. It may be hosted anywhere compatible with its Registry URL Template.
_Avoid_: Package, plugin repo, GitHub repo

**Directory Entry**:
A curated record for one Registry in the Registry Directory. It describes the Registry itself, not each Registry Item inside it.
_Avoid_: Registry Group, item list, Registry Snapshot

**Registry Source**:
The GitHub `owner/repo` address used to resolve Registry Items for a Directory Entry.
_Avoid_: Homepage, GitHub link, display name, Registry Namespace

**Registry GitHub Link**:
The public GitHub repository link for inspecting and reviewing a Directory Entry's source Registry.
_Avoid_: Homepage, Registry Source

**Registry Description**:
A contributor-supplied summary for a Directory Entry. It explains why the Registry belongs in the Registry Directory and is not fetched automatically from the source repository.
_Avoid_: GitHub repo description, generated summary

**Registry Homepage**:
An optional project or product website for a Directory Entry.
_Avoid_: Registry GitHub Link, Registry Source

**Registry Logo**:
An optional visual mark displayed for a Directory Entry. It represents the Registry in the Registry Directory and is not Registry Item data.
_Avoid_: Registry Item icon, generated logo

**Registry Display Name**:
A human-readable label shown for a Directory Entry. It is presentation text and does not identify the Registry.
_Avoid_: Registry name, Registry Namespace, Registry Ref

**Registry Namespace**:
The `@name` identifier used by the shadcn CLI to refer to a Registry, such as `@acme`.
_Avoid_: owner/repo, Registry Ref, GitHub ref

**Registry URL Template**:
A public URL pattern that resolves Registry Item names for a Registry and contains a `{name}` placeholder.
_Avoid_: Homepage, GitHub URL, item address

**Registry Item**:
An installable entry exposed by a Registry, such as a skill or component. A Registry Item name identifies the item within its Registry, not across the Registry Directory.
_Avoid_: Card, listing

**Registry Item Address**:
A namespaced install target that points to a Registry Item, such as `@acme/button`. It is not a Directory Entry.
_Avoid_: Directory Entry, item path

**Install Command**:
A package-manager-specific command that installs a Registry Item into a user's project. It is derived from the Registry Item's canonical install target, not hand-written per item.
_Avoid_: Add argument, CLI string

**Registry Dependency**:
An install-time relationship from one Registry Item to another Registry Item. It may point inside or outside the Registry Directory, but it is not a Directory Entry by itself.
_Avoid_: Directory item, duplicate item
