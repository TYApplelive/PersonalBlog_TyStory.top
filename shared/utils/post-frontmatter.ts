/** 新建文章 frontmatter 工具：解析、校验并重建 Markdown 元信息。 */
import YAML from "yaml";

export interface BlogFrontmatterForm {
  title: string;
  date: string;
  description: string;
  readTime: string;
  tags: string[];
}

export interface ParsedMarkdownForEditor {
  frontmatter: BlogFrontmatterForm;
  body: string;
}

const EMPTY_FRONTMATTER: BlogFrontmatterForm = {
  title: "",
  date: "",
  description: "",
  readTime: "",
  tags: [],
};

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const REQUIRED_FIELDS: Array<keyof Omit<BlogFrontmatterForm, "tags">> = [
  "title",
  "date",
  "description",
  "readTime",
];

function toEditorString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toEditorTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return parseTagsInput(value);
  }
  return [];
}

function stringifyYamlValue(value: string) {
  return YAML.stringify(value).trim();
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export function parseMarkdownForEditor(content: string): ParsedMarkdownForEditor {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return {
      frontmatter: { ...EMPTY_FRONTMATTER },
      body: content,
    };
  }

  const parsed = YAML.parse(match[1] || "") ?? {};
  const source = typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};

  return {
    frontmatter: {
      title: toEditorString(source.title),
      date: toEditorString(source.date),
      description: toEditorString(source.description),
      readTime: toEditorString(source.readTime),
      tags: toEditorTags(source.tags),
    },
    body: content.slice(match[0].length),
  };
}

export function validateRequiredFrontmatter(frontmatter: BlogFrontmatterForm): string[] {
  return REQUIRED_FIELDS.filter((field) => !frontmatter[field].trim());
}

export function buildMarkdownWithFrontmatter(frontmatter: BlogFrontmatterForm, body: string): string {
  const lines = [
    "---",
    `title: ${stringifyYamlValue(frontmatter.title.trim())}`,
    `date: ${stringifyYamlValue(frontmatter.date.trim())}`,
    `description: ${stringifyYamlValue(frontmatter.description.trim())}`,
    `readTime: ${stringifyYamlValue(frontmatter.readTime.trim())}`,
  ];

  const tags = frontmatter.tags.map((tag) => tag.trim()).filter(Boolean);
  if (tags.length) {
    lines.push("tags:");
    tags.forEach((tag) => {
      lines.push(`  - ${stringifyYamlValue(tag)}`);
    });
  }

  lines.push("---");
  return `${lines.join("\n")}\n${body}`;
}
