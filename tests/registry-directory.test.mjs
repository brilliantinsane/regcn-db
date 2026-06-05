import assert from "node:assert/strict"
import test from "node:test"

import { validateDirectory } from "../lib/registry-directory.mjs"

test("valid Directory Entry passes local validation", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/TheOrcDev/skills",
      },
    ],
  })

  assert.deepEqual(result, { ok: true, errors: [] })
})

test("Directory Entry with mismatched Registry GitHub Link fails local validation", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/other/skills",
      },
    ],
  })

  assert.equal(result.ok, false)
  assert.match(
    result.errors.join("\n"),
    /registries\[0\]\.github must equal "https:\/\/github\.com\/TheOrcDev\/skills"\./
  )
})

test("duplicate Registry Sources fail local validation", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/TheOrcDev/skills",
      },
      {
        source: "TheOrcDev/skills",
        displayName: "Duplicate Skills",
        description: "Duplicate Directory Entry for the same Registry Source.",
        github: "https://github.com/TheOrcDev/skills",
      },
    ],
  })

  assert.equal(result.ok, false)
  assert.match(
    result.errors.join("\n"),
    /registries\[1\]\.source duplicates registries\[0\]\.source/
  )
})

test("Directory Entry optional fields fail local validation when present as null", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/TheOrcDev/skills",
        homepage: null,
        logo: null,
      },
    ],
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join("\n"), /registries\[0\]\.homepage/)
  assert.match(result.errors.join("\n"), /registries\[0\]\.logo/)
})

test("unknown Directory and Directory Entry fields fail local validation", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    generatedAt: "2026-06-04",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/TheOrcDev/skills",
        items: [],
      },
    ],
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join("\n"), /generatedAt/)
  assert.match(result.errors.join("\n"), /registries\[0\]\.items/)
})

test("safe inline Registry Logo passes local validation", () => {
  const result = validateDirectory({
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "TheOrcDev/skills",
        displayName: "TheOrcDev Skills",
        description: "Agent skills for Claude and Codex workflows.",
        github: "https://github.com/TheOrcDev/skills",
        logo: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M1 1h14v14H1z" fill="currentColor"/></svg>',
      },
    ],
  })

  assert.deepEqual(result, { ok: true, errors: [] })
})

test("unsafe inline Registry Logo fails local validation", () => {
  for (const logo of [
    '<svg><script>alert("x")</script></svg>',
    '<svg onclick="alert(1)"></svg>',
    '<svg><image href="https://example.com/logo.png"/></svg>',
  ]) {
    const result = validateDirectory({
      $schema: "./directory.schema.json",
      registries: [
        {
          source: "TheOrcDev/skills",
          displayName: "TheOrcDev Skills",
          description: "Agent skills for Claude and Codex workflows.",
          github: "https://github.com/TheOrcDev/skills",
          logo,
        },
      ],
    })

    assert.equal(result.ok, false, logo)
    assert.match(result.errors.join("\n"), /registries\[0\]\.logo/)
  }
})
