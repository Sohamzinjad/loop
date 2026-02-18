import { ValidationError } from "@/server/infrastructure/errors";

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.",
  "10.",
  "172.16.",
  "192.168.",
  "metadata.google.internal",
];

export function ensureSafeEndpoint(urlString: string) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") {
      throw new ValidationError("IoT endpoint must use HTTPS");
    }

    const isBlocked = BLOCKED_HOSTS.some(
      (blocked) =>
        url.hostname === blocked ||
        url.hostname.startsWith(blocked) ||
        url.hostname.endsWith(`.${blocked}`)
    );

    if (isBlocked) {
      throw new ValidationError("IoT endpoint cannot target internal networks");
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("IoT endpoint URL is invalid");
  }
}
