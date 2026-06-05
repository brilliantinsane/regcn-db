import assert from "node:assert/strict"
import test from "node:test"

import {
  resolveRegistryItemGroups,
  validateDirectory,
  validateNetworkedRegistries,
} from "../lib/registry-directory.mjs"

const validDirectory = {
  $schema: "./directory.schema.json",
  registries: [
    {
      source: "TheOrcDev/skills",
      displayName: "TheOrcDev Skills",
      description: "Agent skills for Claude and Codex workflows.",
      github: "https://github.com/TheOrcDev/skills",
    },
  ],
}

test("valid Directory Entry passes local validation", () => {
  const result = validateDirectory(validDirectory)

  assert.deepEqual(result, { ok: true, errors: [] })
})

test("valid Directory Entry passes networked Registry Item validation", async () => {
  const result = await validateNetworkedRegistries(validDirectory, {
    searchRegistries: async () => ({
      items: [
        {
          name: "orc-me",
          type: "registry:item",
          description: "Orc voice mode.",
          registry: "TheOrcDev/skills",
          addCommandArgument: "TheOrcDev/skills/orc-me",
        },
      ],
      pagination: {
        total: 1,
        offset: 0,
        limit: 100,
        hasMore: false,
      },
    }),
    getRegistryItems: async () => [
      {
        name: "orc-me",
        type: "registry:item",
        files: [
          {
            path: "skills/orc-me/SKILL.md",
            type: "registry:file",
            target: ".claude/skills/orc-me/SKILL.md",
          },
        ],
      },
    ],
  })

  assert.deepEqual(result, {
    ok: true,
    errors: [],
    warnings: [],
    items: [
      {
        name: "orc-me",
        type: "registry:item",
        description: "Orc voice mode.",
        registry: "TheOrcDev/skills",
        addCommandArgument: "TheOrcDev/skills/orc-me",
      },
    ],
  })
})

test("networked validation fails when a Registry cannot be listed", async () => {
  const result = await validateNetworkedRegistries(validDirectory, {
    searchRegistries: async () => {
      throw new Error("not found")
    },
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join("\n"), /could not be listed: not found/)
})

test("networked validation fails when no Registry Items are listable", async () => {
  const result = await validateNetworkedRegistries(validDirectory, {
    searchRegistries: async () => ({
      items: [],
      pagination: {
        total: 0,
        offset: 0,
        limit: 100,
        hasMore: false,
      },
    }),
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join("\n"), /at least one listable Registry Item/)
})

test("networked validation fails malformed resolved Registry Items", async () => {
  const result = await validateNetworkedRegistries(validDirectory, {
    searchRegistries: async () => ({
      items: [
        {
          name: "orc-me",
          type: "registry:item",
          registry: "other/registry",
          addCommandArgument: "TheOrcDev/skills/not-orc-me",
        },
      ],
      pagination: {
        total: 1,
        offset: 0,
        limit: 100,
        hasMore: false,
      },
    }),
  })

  assert.equal(result.ok, false)
  assert.match(
    result.errors.join("\n"),
    /description must be a non-empty string/
  )
  assert.match(
    result.errors.join("\n"),
    /registry must equal "TheOrcDev\/skills"/
  )
  assert.match(
    result.errors.join("\n"),
    /addCommandArgument must equal "TheOrcDev\/skills\/orc-me"/
  )
})

test("networked validation warns for human-judgment install risks", async () => {
  const result = await validateNetworkedRegistries(validDirectory, {
    searchRegistries: async () => ({
      items: [
        {
          name: "orc-me",
          type: "registry:item",
          description: "Orc voice mode.",
          registry: "TheOrcDev/skills",
          addCommandArgument: "TheOrcDev/skills/orc-me",
        },
      ],
      pagination: {
        total: 1,
        offset: 0,
        limit: 100,
        hasMore: false,
      },
    }),
    getRegistryItems: async () => [
      {
        name: "orc-me",
        type: "registry:item",
        dependencies: ["left-pad"],
        registryDependencies: ["TheOrcDev/skills/cut-it"],
        envVars: {
          API_KEY: "",
        },
        files: [
          {
            path: "skills/orc-me/SKILL.md",
            type: "registry:file",
            target: "~/.claude/skills/orc-me/SKILL.md",
          },
        ],
      },
    ],
  })

  assert.equal(result.ok, true)
  assert.match(result.warnings.join("\n"), /declares dependencies/)
  assert.match(result.warnings.join("\n"), /declares Registry Dependencies/)
  assert.match(result.warnings.join("\n"), /declares environment variables/)
  assert.match(result.warnings.join("\n"), /writes to unusual target/)
})

test("resolver returns Registry groups in Contribution Order with derived items", async () => {
  const directory = {
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "first/registry",
        displayName: "First Registry",
        description: "First registry in Contribution Order.",
        github: "https://github.com/first/registry",
      },
      {
        source: "second/registry",
        displayName: "Second Registry",
        description: "Second registry in Contribution Order.",
        github: "https://github.com/second/registry",
      },
    ],
  }

  const groups = await resolveRegistryItemGroups(directory, {
    searchRegistries: async ([source]) => ({
      items: [
        {
          name: source === "first/registry" ? "alpha" : "beta",
          type: "registry:item",
          description: `${source} item.`,
          registry: source,
          addCommandArgument: `${source}/${
            source === "first/registry" ? "alpha" : "beta"
          }`,
        },
      ],
      pagination: {
        total: 1,
        offset: 0,
        limit: 100,
        hasMore: false,
      },
    }),
  })

  assert.deepEqual(
    groups.map((group) => group.entry.source),
    ["first/registry", "second/registry"]
  )
  assert.deepEqual(
    groups.map((group) => group.contributionOrder),
    [0, 1]
  )
  assert.equal(groups[0].status, "available")
  assert.equal(groups[0].items[0].addCommandArgument, "first/registry/alpha")
  assert.equal(groups[1].status, "available")
  assert.equal(groups[1].items[0].addCommandArgument, "second/registry/beta")
})

test("resolver keeps unavailable Registry context without blocking reachable Registries", async () => {
  const directory = {
    $schema: "./directory.schema.json",
    registries: [
      {
        source: "available/registry",
        displayName: "Available Registry",
        description: "A reachable Registry.",
        github: "https://github.com/available/registry",
      },
      {
        source: "missing/registry",
        displayName: "Missing Registry",
        description: "An unreachable Registry.",
        github: "https://github.com/missing/registry",
        homepage: "https://example.com/missing",
      },
      {
        source: "recovered/registry",
        displayName: "Recovered Registry",
        description: "A later reachable Registry.",
        github: "https://github.com/recovered/registry",
      },
    ],
  }

  const groups = await resolveRegistryItemGroups(directory, {
    searchRegistries: async ([source]) => {
      if (source === "missing/registry") {
        throw new Error("network unavailable")
      }

      return {
        items: [
          {
            name: "item",
            type: "registry:item",
            description: `${source} item.`,
            registry: source,
            addCommandArgument: `${source}/item`,
          },
        ],
        pagination: {
          total: 1,
          offset: 0,
          limit: 100,
          hasMore: false,
        },
      }
    },
  })

  assert.deepEqual(
    groups.map((group) => group.status),
    ["available", "unavailable", "available"]
  )
  assert.deepEqual(
    groups.map((group) => group.entry.source),
    ["available/registry", "missing/registry", "recovered/registry"]
  )
  assert.equal(groups[1].entry.displayName, "Missing Registry")
  assert.equal(groups[1].entry.homepage, "https://example.com/missing")
  assert.equal(groups[1].reason, "network unavailable")
  assert.deepEqual(groups[1].items, [])
  assert.equal(groups[2].items[0].addCommandArgument, "recovered/registry/item")
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
