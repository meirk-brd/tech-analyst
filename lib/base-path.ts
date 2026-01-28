// Returns the basePath configured in next.config.ts
// This is needed for client-side fetch calls which don't automatically include basePath
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/market-analyst";

export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
