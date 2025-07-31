/**
 * Encryption and Security Utilities for Aviation Cleaning Forms
 * Implements AES-256-GCM encryption and secure ID generation
 */

interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  timestamp: string;
}

interface FormSecurityMetadata {
  id: string;
  hash: string;
  encryptionVersion: string;
  createdAt: string;
  lastModified: string;
}

/**
 * Generate unique form ID in format: AP-PS-SNR01-DDMMAAHHMMSS
 * AP = Aviation Portugal, PS = Pátio de Serviços, SNR01 = Serial Number
 */
export function generateSecureFormId(): string {
  const now = new Date();

  // Format: DDMMAAHHMMSS
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Generate unique serial number (4 digits)
  const serialNumber = String(Math.floor(Math.random() * 9999) + 1).padStart(
    4,
    "0",
  );

  const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;

  return `AP-PS-SNR${serialNumber}-${timestamp}`;
}

/**
 * Generate encryption key from environment or create temporary one
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // In production, this should come from Supabase Edge Functions
  const keyData =
    import.meta.env.VITE_ENCRYPTION_KEY ||
    "default-key-for-development-only-not-secure";

  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(keyData.padEnd(32, "0").slice(0, 32));

  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt form data using AES-256-GCM
 */
export async function encryptFormData(data: any): Promise<EncryptedData> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: encoder.encode("aviation-cleaning-form"),
      },
      key,
      dataBuffer,
    );

    // Extract encrypted data and auth tag
    const encryptedData = new Uint8Array(encryptedBuffer.slice(0, -16));
    const authTag = new Uint8Array(encryptedBuffer.slice(-16));

    return {
      encryptedData: arrayBufferToBase64(encryptedData),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Falha na criptografia dos dados");
  }
}

/**
 * Decrypt form data
 */
export async function decryptFormData(
  encryptedData: EncryptedData,
): Promise<any> {
  try {
    const key = await getEncryptionKey();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Convert base64 to ArrayBuffer
    const dataBuffer = base64ToArrayBuffer(encryptedData.encryptedData);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const authTag = base64ToArrayBuffer(encryptedData.authTag);

    // Combine encrypted data and auth tag
    const combinedBuffer = new Uint8Array(
      dataBuffer.byteLength + authTag.byteLength,
    );
    combinedBuffer.set(new Uint8Array(dataBuffer), 0);
    combinedBuffer.set(new Uint8Array(authTag), dataBuffer.byteLength);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: encoder.encode("aviation-cleaning-form"),
      },
      key,
      combinedBuffer,
    );

    const decryptedString = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Falha na descriptografia dos dados");
  }
}

/**
 * Generate secure hash for data integrity verification
 */
export async function generateDataHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verify data integrity using hash
 */
export async function verifyDataIntegrity(
  data: any,
  expectedHash: string,
): Promise<boolean> {
  try {
    const actualHash = await generateDataHash(data);
    return actualHash === expectedHash;
  } catch {
    return false;
  }
}

/**
 * Create secure metadata for form
 */
export async function createFormSecurityMetadata(
  formData: any,
): Promise<FormSecurityMetadata> {
  const id = generateSecureFormId();
  const hash = await generateDataHash(formData);
  const timestamp = new Date().toISOString();

  return {
    id,
    hash,
    encryptionVersion: "1.0",
    createdAt: timestamp,
    lastModified: timestamp,
  };
}

/**
 * Secure form package for storage
 */
export interface SecureFormPackage {
  metadata: FormSecurityMetadata;
  encryptedData: EncryptedData;
  syncStatus: "pending" | "synced" | "error";
  retryCount: number;
  lastSyncAttempt?: string;
}

/**
 * Create complete secure package for form
 */
export async function createSecureFormPackage(
  formData: any,
): Promise<SecureFormPackage> {
  const metadata = await createFormSecurityMetadata(formData);
  const encryptedData = await encryptFormData({
    ...formData,
    securityMetadata: metadata,
  });

  return {
    metadata,
    encryptedData,
    syncStatus: "pending",
    retryCount: 0,
  };
}

/**
 * Generate secure download link for form
 */
export function generateSecureDownloadLink(formId: string): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || window.location.origin;
  const token = btoa(`${formId}:${Date.now()}`);
  return `${baseUrl}/storage/v1/object/sign/cleaning-forms/${formId}.pdf?token=${token}`;
}

/**
 * Utility functions for base64 conversion
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if running in secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === "https:";
}

/**
 * Initialize secure context warning
 */
export function checkSecureContext(): void {
  if (!isSecureContext()) {
    console.warn(
      "Aplicação não está executando em contexto seguro (HTTPS). Algumas funcionalidades de criptografia podem não funcionar corretamente.",
    );
  }
}

/**
 * Generate QR Code data with security token
 */
export async function generateSecureQRData(formId: string): Promise<string> {
  const timestamp = Date.now();
  const token = await generateDataHash({ formId, timestamp });
  const shortToken = token.slice(0, 16); // Short token for QR code

  const secureUrl = generateSecureDownloadLink(formId);
  return `${secureUrl}&qr=${shortToken}&t=${timestamp}`;
}
