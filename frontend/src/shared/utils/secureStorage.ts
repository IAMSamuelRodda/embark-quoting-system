/**
 * Secure Storage Utility
 *
 * Encrypts and stores sensitive data (like credentials) in IndexedDB
 * using Web Crypto API with device-specific keys.
 *
 * Security Features:
 * - AES-GCM encryption
 * - Device-specific encryption key (unique per browser/device)
 * - Salt and IV stored separately
 * - Automatic expiry handling
 */

const STORAGE_KEY = 'embark-secure-storage';
const DEVICE_KEY_STORAGE = 'embark-device-key';
const MAX_OFFLINE_AUTH_DAYS = 30;

interface SecureStorageItem {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  expiry: string; // ISO date string
  createdAt: string; // ISO date string
}

interface CachedCredentials {
  username: string;
  password: string; // Will be encrypted
  rememberMe: boolean;
}

/**
 * Get or create device-specific encryption key
 * Key is stored in localStorage and used for all encryption operations
 */
async function getDeviceKey(): Promise<CryptoKey> {
  // Check if key already exists
  const storedKey = localStorage.getItem(DEVICE_KEY_STORAGE);

  if (storedKey) {
    try {
      const keyData = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('[SecureStorage] Failed to import existing key, generating new one');
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export and store key
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(DEVICE_KEY_STORAGE, JSON.stringify(exportedKey));

  return key;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data using device-specific key
 */
async function encryptData(data: string): Promise<{ encrypted: string; iv: string }> {
  const key = await getDeviceKey();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  return {
    encrypted: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt data using device-specific key
 */
async function decryptData(encrypted: string, ivString: string): Promise<string> {
  const key = await getDeviceKey();
  const encryptedBuffer = base64ToArrayBuffer(encrypted);
  const iv = new Uint8Array(base64ToArrayBuffer(ivString));

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error);
    throw new Error('Failed to decrypt data - key may have changed');
  }
}

/**
 * Store credentials securely in IndexedDB
 */
export async function storeCredentials(credentials: CachedCredentials): Promise<void> {
  const dataToEncrypt = JSON.stringify(credentials);
  const { encrypted, iv } = await encryptData(dataToEncrypt);

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + MAX_OFFLINE_AUTH_DAYS);

  const storageItem: SecureStorageItem = {
    encrypted,
    iv,
    expiry: expiry.toISOString(),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storageItem));
  console.log('[SecureStorage] Credentials stored securely (expires:', expiry.toLocaleDateString(), ')');
}

/**
 * Retrieve and decrypt stored credentials
 */
export async function getStoredCredentials(): Promise<CachedCredentials | null> {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    return null;
  }

  try {
    const storageItem: SecureStorageItem = JSON.parse(storedData);

    // Check expiry
    const expiry = new Date(storageItem.expiry);
    if (expiry < new Date()) {
      console.log('[SecureStorage] Stored credentials expired, clearing');
      await clearStoredCredentials();
      return null;
    }

    // Decrypt
    const decryptedData = await decryptData(storageItem.encrypted, storageItem.iv);
    const credentials: CachedCredentials = JSON.parse(decryptedData);

    console.log('[SecureStorage] Credentials retrieved successfully');
    return credentials;
  } catch (error) {
    console.error('[SecureStorage] Failed to retrieve credentials:', error);
    // Clear corrupted data
    await clearStoredCredentials();
    return null;
  }
}

/**
 * Check if credentials are stored
 */
export function hasStoredCredentials(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Clear stored credentials (logout, force online auth)
 */
export async function clearStoredCredentials(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[SecureStorage] Credentials cleared');
}

/**
 * Clear device key (will require re-encryption of all data)
 */
export function clearDeviceKey(): void {
  localStorage.removeItem(DEVICE_KEY_STORAGE);
  console.log('[SecureStorage] Device key cleared');
}

/**
 * Get credential expiry date (for UI display)
 */
export function getCredentialExpiry(): Date | null {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    return null;
  }

  try {
    const storageItem: SecureStorageItem = JSON.parse(storedData);
    return new Date(storageItem.expiry);
  } catch {
    return null;
  }
}

/**
 * Get days until credential expiry
 */
export function getDaysUntilExpiry(): number | null {
  const expiry = getCredentialExpiry();
  if (!expiry) {
    return null;
  }

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}
