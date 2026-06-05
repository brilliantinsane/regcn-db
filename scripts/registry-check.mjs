import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import {
  validateDirectory,
  validateNetworkedRegistries,
} from "../lib/registry-directory.mjs"

const directoryPath = resolve(process.argv[2] ?? "directory.json")
const contents = await readFile(directoryPath, "utf8")

let directory

try {
  directory = JSON.parse(contents)
} catch (error) {
  console.error(`Invalid JSON in ${directoryPath}: ${error.message}`)
  process.exit(1)
}

const result = validateDirectory(directory)

if (!result.ok) {
  console.error(`Registry Directory check failed for ${directoryPath}:`)

  for (const error of result.errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

const networkedResult = await validateNetworkedRegistries(directory)

if (!networkedResult.ok) {
  console.error(
    `Registry Directory networked check failed for ${directoryPath}:`
  )

  for (const error of networkedResult.errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

console.log(
  `Registry Directory check passed for ${directoryPath}: ` +
    `${networkedResult.items.length} Registry Items resolved.`
)

if (networkedResult.warnings.length > 0) {
  console.warn("Registry Directory check warnings:")

  for (const warning of networkedResult.warnings) {
    console.warn(`- ${warning}`)
  }
}
