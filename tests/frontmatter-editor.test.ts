import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMarkdownWithFrontmatter,
  formatTagsInput,
  parseMarkdownForEditor,
  parseTagsInput,
  validateRequiredFrontmatter,
} from "../shared/utils/post-frontmatter.ts";

test("parses known frontmatter fields and preserves body", () => {
  const result = parseMarkdownForEditor(`---
title: Demo
date: 2026-04-25
description: Demo desc
readTime: 5 min
tags: [Nuxt, Vue]
---

# Demo

Body text`);

  assert.deepEqual(result.frontmatter, {
    title: "Demo",
    date: "2026-04-25",
    description: "Demo desc",
    readTime: "5 min",
    tags: ["Nuxt", "Vue"],
  });
  assert.equal(result.body, "\n# Demo\n\nBody text");
});

test("missing frontmatter fields become empty editor values", () => {
  const result = parseMarkdownForEditor("# Plain body");

  assert.deepEqual(result.frontmatter, {
    title: "",
    date: "",
    description: "",
    readTime: "",
    tags: [],
  });
  assert.equal(result.body, "# Plain body");
});

test("validates only required frontmatter fields", () => {
  const errors = validateRequiredFrontmatter({
    title: "",
    date: "2026-04-25",
    description: "",
    readTime: "5 min",
    tags: [],
  });

  assert.deepEqual(errors, ["title", "description"]);
});

test("formats and parses comma-separated tags", () => {
  assert.equal(formatTagsInput(["Nuxt", "Vue"]), "Nuxt, Vue");
  assert.deepEqual(parseTagsInput("Nuxt, Vue, "), ["Nuxt", "Vue"]);
});

test("builds ordered frontmatter and omits empty tags", () => {
  const markdown = buildMarkdownWithFrontmatter(
    {
      title: "Demo",
      date: "2026-04-25",
      description: "Demo desc",
      readTime: "5 min",
      tags: [],
    },
    "\n# Demo",
  );

  assert.equal(markdown, `---
title: Demo
date: 2026-04-25
description: Demo desc
readTime: 5 min
---

# Demo`);
});
