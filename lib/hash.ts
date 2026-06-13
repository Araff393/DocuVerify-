/**
 * Client-side SHA-256 hashing utility.
 * Uses the Web Crypto API (native, no dependencies).
 */

/**
 * Compute SHA-256 hash of a File object.
 * @param file - The file to hash
 * @returns Hex-encoded SHA-256 hash string (64 characters)
 */
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
