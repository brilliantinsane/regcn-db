import {
  getRegistryItems as defaultGetRegistryItems,
  searchRegistries as defaultSearchRegistries,
} from "shadcn/registry"

const SOURCE_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const MAX_LOGO_LENGTH = 12000
const BLOCKED_LOGO_TAG_PATTERN =
  /<\s*\/?\s*(script|foreignObject|iframe|object|embed|link|style)\b/i
const EVENT_HANDLER_ATTRIBUTE_PATTERN = /\son[a-z]+\s*=/i
const URL_ATTRIBUTE_PATTERN =
  /\b(?:href|xlink:href|src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
const CSS_URL_PATTERN = /url\s*\(\s*['"]?\s*(?:https?:|data:|javascript:|\/\/)/i
const DIRECTORY_FIELDS = new Set(["$schema", "registries"])
const DIRECTORY_ENTRY_FIELDS = new Set([
  "source",
  "displayName",
  "description",
  "github",
  "homepage",
  "logo",
])

export function validateDirectory(input) {
  const errors = []

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["Directory must be an object."] }
  }

  if (input.$schema !== "./directory.schema.json") {
    errors.push('Directory "$schema" must be "./directory.schema.json".')
  }

  validateKnownFields(input, DIRECTORY_FIELDS, "Directory", errors)

  if (!Array.isArray(input.registries)) {
    errors.push('Directory must include a "registries" array.')
  } else {
    const seenSources = new Map()

    input.registries.forEach((entry, index) => {
      validateDirectoryEntry(entry, index, errors)

      if (!isPlainObject(entry) || typeof entry.source !== "string") {
        return
      }

      const firstIndex = seenSources.get(entry.source)

      if (firstIndex === undefined) {
        seenSources.set(entry.source, index)
      } else {
        errors.push(
          `registries[${index}].source duplicates registries[${firstIndex}].source.`
        )
      }
    })
  }

  return { ok: errors.length === 0, errors }
}

export async function validateNetworkedRegistries(input, options = {}) {
  const {
    getRegistryItems = defaultGetRegistryItems,
    searchRegistries = defaultSearchRegistries,
  } = options
  const errors = []
  const warnings = []
  const items = []

  if (!isPlainObject(input) || !Array.isArray(input.registries)) {
    return {
      ok: false,
      errors: ['Directory must include a "registries" array.'],
      warnings,
      items,
    }
  }

  for (const [index, entry] of input.registries.entries()) {
    if (!isPlainObject(entry) || typeof entry.source !== "string") {
      errors.push(`registries[${index}] must include a Registry Source.`)
      continue
    }

    const label = `registries[${index}] (${entry.source})`
    let result

    try {
      result = await searchRegistries([entry.source], {
        limit: 100,
        offset: 0,
        useCache: false,
      })
    } catch (error) {
      errors.push(`${label} could not be listed: ${errorMessage(error)}`)
      continue
    }

    if (!Array.isArray(result?.items)) {
      errors.push(`${label} did not return a listable Registry Item array.`)
      continue
    }

    if (result.items.length === 0) {
      errors.push(`${label} must expose at least one listable Registry Item.`)
      continue
    }

    const itemAddresses = []

    for (const [itemIndex, item] of result.items.entries()) {
      const itemLabel = `${label} items[${itemIndex}]`

      validateResolvedRegistryItem(item, itemLabel, entry.source, errors)

      if (isResolvedRegistryItem(item)) {
        items.push(toRegistryItemView(item))
        itemAddresses.push(item.addCommandArgument)
      }
    }

    if (itemAddresses.length === 0) {
      continue
    }

    try {
      const detailedItems = await getRegistryItems(itemAddresses, {
        useCache: false,
      })
      collectInstallRiskWarnings(detailedItems, label, warnings)
    } catch (error) {
      errors.push(
        `${label} listed items could not be resolved: ${errorMessage(error)}`
      )
    }
  }

  return { ok: errors.length === 0, errors, warnings, items }
}

export async function resolveRegistryItemGroups(input, options = {}) {
  const { searchRegistries = defaultSearchRegistries } = options

  if (!isPlainObject(input) || !Array.isArray(input.registries)) {
    return []
  }

  const groups = []

  for (const [index, entry] of input.registries.entries()) {
    if (!isPlainObject(entry) || typeof entry.source !== "string") {
      continue
    }

    try {
      const result = await searchRegistries([entry.source], {
        limit: 100,
        offset: 0,
        useCache: false,
      })

      groups.push({
        status: "available",
        entry: toDirectoryEntryView(entry),
        contributionOrder: index,
        items: Array.isArray(result?.items)
          ? result.items
              .filter((item) => isResolvedRegistryItem(item))
              .map((item) => toRegistryItemView(item))
          : [],
      })
    } catch (error) {
      groups.push({
        status: "unavailable",
        entry: toDirectoryEntryView(entry),
        contributionOrder: index,
        reason: errorMessage(error),
        items: [],
      })
    }
  }

  return groups
}

function validateDirectoryEntry(entry, index, errors) {
  const label = `registries[${index}]`

  if (!isPlainObject(entry)) {
    errors.push(`${label} must be an object.`)
    return
  }

  for (const field of ["source", "displayName", "description", "github"]) {
    if (typeof entry[field] !== "string" || entry[field].trim() === "") {
      errors.push(`${label}.${field} must be a non-empty string.`)
    }
  }

  validateKnownFields(entry, DIRECTORY_ENTRY_FIELDS, label, errors)

  for (const field of ["homepage", "logo"]) {
    if (field in entry && typeof entry[field] !== "string") {
      errors.push(`${label}.${field} must be a string when present.`)
    }
  }

  if (typeof entry.logo === "string") {
    validateLogo(entry.logo, `${label}.logo`, errors)
  }

  if (typeof entry.source === "string" && !SOURCE_PATTERN.test(entry.source)) {
    errors.push(`${label}.source must be a GitHub owner/repo address.`)
  }

  if (typeof entry.source === "string" && typeof entry.github === "string") {
    const expectedGithub = `https://github.com/${entry.source}`

    if (entry.github !== expectedGithub) {
      errors.push(`${label}.github must equal "${expectedGithub}".`)
    }
  }
}

function validateResolvedRegistryItem(item, label, source, errors) {
  if (!isPlainObject(item)) {
    errors.push(`${label} must be an object.`)
    return
  }

  for (const field of [
    "name",
    "type",
    "description",
    "registry",
    "addCommandArgument",
  ]) {
    if (typeof item[field] !== "string" || item[field].trim() === "") {
      errors.push(`${label}.${field} must be a non-empty string.`)
    }
  }

  if (typeof item.registry === "string" && item.registry !== source) {
    errors.push(`${label}.registry must equal "${source}".`)
  }

  if (
    typeof item.name === "string" &&
    typeof item.addCommandArgument === "string"
  ) {
    const expectedAddCommandArgument = `${source}/${item.name}`

    if (item.addCommandArgument !== expectedAddCommandArgument) {
      errors.push(
        `${label}.addCommandArgument must equal "${expectedAddCommandArgument}".`
      )
    }
  }
}

function isResolvedRegistryItem(item) {
  return (
    isPlainObject(item) &&
    typeof item.name === "string" &&
    item.name.trim() !== "" &&
    typeof item.type === "string" &&
    item.type.trim() !== "" &&
    typeof item.description === "string" &&
    item.description.trim() !== "" &&
    typeof item.registry === "string" &&
    item.registry.trim() !== "" &&
    typeof item.addCommandArgument === "string" &&
    item.addCommandArgument.trim() !== ""
  )
}

function toDirectoryEntryView(entry) {
  return {
    source: entry.source,
    displayName: entry.displayName,
    description: entry.description,
    github: entry.github,
    ...(typeof entry.homepage === "string" ? { homepage: entry.homepage } : {}),
    ...(typeof entry.logo === "string" ? { logo: entry.logo } : {}),
  }
}

function toRegistryItemView(item) {
  return {
    name: item.name,
    type: item.type,
    description: item.description,
    registry: item.registry,
    addCommandArgument: item.addCommandArgument,
  }
}

function collectInstallRiskWarnings(detailedItems, label, warnings) {
  if (!Array.isArray(detailedItems)) {
    warnings.push(
      `${label} item details could not be inspected for install risk.`
    )
    return
  }

  for (const item of detailedItems) {
    if (!isPlainObject(item)) {
      continue
    }

    const itemLabel =
      typeof item.name === "string" && item.name.trim() !== ""
        ? `${label} "${item.name}"`
        : label

    warnIfNonEmptyArray(
      item.dependencies,
      `${itemLabel} declares dependencies.`,
      warnings
    )
    warnIfNonEmptyArray(
      item.devDependencies,
      `${itemLabel} declares devDependencies.`,
      warnings
    )
    warnIfNonEmptyArray(
      item.registryDependencies,
      `${itemLabel} declares Registry Dependencies.`,
      warnings
    )

    if (isPlainObject(item.envVars) && Object.keys(item.envVars).length > 0) {
      warnings.push(`${itemLabel} declares environment variables.`)
    }

    if (Array.isArray(item.files)) {
      if (item.files.length > 20) {
        warnings.push(`${itemLabel} changes ${item.files.length} files.`)
      }

      for (const file of item.files) {
        if (!isPlainObject(file) || typeof file.target !== "string") {
          continue
        }

        if (isUnusualTarget(file.target)) {
          warnings.push(
            `${itemLabel} writes to unusual target "${file.target}".`
          )
        }
      }
    }
  }
}

function warnIfNonEmptyArray(value, warning, warnings) {
  if (Array.isArray(value) && value.length > 0) {
    warnings.push(warning)
  }
}

function isUnusualTarget(target) {
  return (
    target.startsWith("/") ||
    target.startsWith("~/") ||
    target.split(/[\\/]+/).includes("..")
  )
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function validateLogo(logo, label, errors) {
  const trimmedLogo = logo.trim()

  if (logo.length > MAX_LOGO_LENGTH) {
    errors.push(`${label} must be ${MAX_LOGO_LENGTH} characters or fewer.`)
  }

  if (!/^<svg[\s>]/i.test(trimmedLogo) || !/<\/svg>\s*$/i.test(trimmedLogo)) {
    errors.push(`${label} must be an inline SVG string.`)
  }

  if (BLOCKED_LOGO_TAG_PATTERN.test(logo)) {
    errors.push(`${label} must not include active or external-content tags.`)
  }

  if (EVENT_HANDLER_ATTRIBUTE_PATTERN.test(logo)) {
    errors.push(`${label} must not include event handler attributes.`)
  }

  if (CSS_URL_PATTERN.test(logo)) {
    errors.push(`${label} must not include external CSS references.`)
  }

  for (const match of logo.matchAll(URL_ATTRIBUTE_PATTERN)) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "").trim()

    if (value !== "" && !value.startsWith("#")) {
      errors.push(`${label} must not include external references.`)
      break
    }
  }
}

function validateKnownFields(input, knownFields, label, errors) {
  for (const field of Object.keys(input)) {
    if (!knownFields.has(field)) {
      errors.push(`${label}.${field} is not allowed.`)
    }
  }
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}
