/** Matches `{{ name }}` placeholders; the name may not start with whitespace or braces. */
const PROMPT_VAR_RE = /\{\{\s*([^{}\s][^{}]*?)\s*\}\}/g;

/** Distinct `{{variable}}` names in first-appearance order. */
export function extractPromptVariables(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(PROMPT_VAR_RE)) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

/**
 * Replaces each `{{variable}}` with its value. Placeholders whose value is
 * empty or missing are left as-is, so a live preview shows what's unfilled.
 */
export function substitutePromptVariables(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(PROMPT_VAR_RE, (placeholder, name: string) => {
    const value = values[name];
    return value ? value : placeholder;
  });
}
