export interface FrontmatterParseResult {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(markdown: string): FrontmatterParseResult {
  const normalized = markdown.replace(/^\uFEFF/, "");

  if (!normalized.startsWith("---")) {
    return { data: {}, body: normalized };
  }

  const lines = normalized.split(/\r?\n/);
  if (lines[0] !== "---") {
    return { data: {}, body: normalized };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingIndex === -1) {
    return { data: {}, body: normalized };
  }

  const data: Record<string, string> = {};
  for (const line of lines.slice(1, closingIndex)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    data[key] = unquoteScalar(line.slice(separatorIndex + 1).trim());
  }

  return {
    data,
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

function unquoteScalar(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

export function firstHeading(markdownBody: string): string | null {
  for (const line of markdownBody.split(/\r?\n/)) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
