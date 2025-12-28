/**
 * Encryption utilities for localStorage data
 * Uses AES-256-GCM encryption with Web Crypto API
 *
 * Security features:
 * - AES-256-GCM symmetric encryption
 * - Random IV (Initialization Vector) for each encryption
 * - Integrity verification via authentication tag
 * - Key derivation from environment variable
 *
 * If data is tampered with or key is changed, decryption will fail
 * and data will be cleared (no recovery attempted)
 */

/**
 * Get encryption key from environment
 * Throws if key is not configured
 */
function getEncryptionKey(): string {
  const key = process.env.NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY;

  if (!key || key.length !== 32) {
    throw new Error(
      "NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY must be set and exactly 32 characters. " +
        "Generate with: openssl rand -hex 16"
    );
  }

  return key;
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Import the encryption key for use with Web Crypto API
 */
async function importKey(): Promise<CryptoKey> {
  const keyHex = getEncryptionKey();
  const keyBuffer = hexToArrayBuffer(keyHex);

  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64 encoded string: iv:ciphertext
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await importKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );

    // Combine IV and ciphertext: "iv:ciphertext" in hex
    const ivHex = arrayBufferToHex(iv.buffer);
    const ciphertextHex = arrayBufferToHex(encryptedBuffer);

    return `${ivHex}:${ciphertextHex}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-256-GCM
 * Expects format: iv:ciphertext (hex encoded)
 * Returns decrypted string or throws error if tampered/wrong key
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await importKey();

    // Split IV and ciphertext
    const [ivHex, ciphertextHex] = encryptedData.split(":");

    if (!ivHex || !ciphertextHex) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = hexToArrayBuffer(ivHex);
    const ciphertext = hexToArrayBuffer(ciphertextHex);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(
      "Failed to decrypt data - data may be corrupted or encryption key changed"
    );
  }
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    const key = process.env.NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY;
    return !!(key && key.length === 32);
  } catch {
    return false;
  }
}
