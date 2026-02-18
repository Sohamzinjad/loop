const dangerousPattern = /(<|>|javascript:|on\S+=)/gi;

export function sanitizeRichText(input: string) {
  return input.replace(dangerousPattern, "").trim();
}
