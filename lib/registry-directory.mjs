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
