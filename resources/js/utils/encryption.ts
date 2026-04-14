import CryptoJS from 'crypto-js';

/**
 * Encryption Utilities for End-to-End Encryption
 * 
 * Provides simple encryption/decryption using AES-256.
 * The encryption key should be derived from user authentication or stored securely.
 */

/**
 * Generate a consistent encryption key from user credentials.
 * In a production system, this should use a more secure key derivation function.
 * 
 * For now, we use a combination of user ID and email for demonstration.
 * This is client-side only - the key never leaves the client.
 * 
 * @param userId - The user's ID
 * @param userEmail - The user's email
 * @returns A consistent encryption key
 */
export function generateEncryptionKey(userId: number, userEmail: string): string {
    // Combine userId and email to create a key
    // This is deterministic so the same user always gets the same key
    const combined = `${userId}:${userEmail}`;
    
    // Hash it with SHA-256 to get a proper encryption key length
    const hashedKey = CryptoJS.SHA256(combined).toString();
    
    return hashedKey;
}

/**
 * Encrypt a message body using AES-256-CBC encryption.
 * 
 * @param plaintext - The message to encrypt
 * @param encryptionKey - The encryption key
 * @returns The encrypted message as a string
 */
export function encryptMessage(plaintext: string, encryptionKey: string): string {
    try {
        // Generate a random IV (Initialization Vector) for each encryption
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // Encrypt the plaintext
        const encrypted = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Hex.parse(encryptionKey), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        
        // Combine IV and ciphertext
        // Format: IV (hex) + ':' + ciphertext (base64)
        const ivHex = iv.toString(CryptoJS.enc.Hex);
        const ciphertextBase64 = encrypted.toString();
        
        return `${ivHex}:${ciphertextBase64}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
}

/**
 * Decrypt a message body using AES-256-CBC decryption.
 * 
 * @param encryptedData - The encrypted message (format: IV:ciphertext)
 * @param encryptionKey - The encryption key
 * @returns The decrypted plaintext
 */
export function decryptMessage(encryptedData: string, encryptionKey: string): string {
    try {
        // Parse the encrypted data
        const [ivHex, ciphertextBase64] = encryptedData.split(':');
        
        if (!ivHex || !ciphertextBase64) {
            throw new Error('Invalid encrypted data format');
        }
        
        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, CryptoJS.enc.Hex.parse(encryptionKey), {
            iv: CryptoJS.enc.Hex.parse(ivHex),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        
        // Convert to UTF-8 string
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!plaintext) {
            throw new Error('Decryption resulted in empty string - key may be invalid');
        }
        
        return plaintext;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message');
    }
}

/**
 * Check if a string is encrypted (contains IV:ciphertext format).
 * 
 * @param data - The data to check
 * @returns True if the data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') {
        return false;
    }
    
    // Check if it matches the IV:ciphertext format
    const parts = data.split(':');
    if (parts.length !== 2) {
        return false;
    }
    
    // Check if first part is valid hex (IV)
    const [ivHex, ciphertext] = parts;
    return /^[a-f0-9]{32}$/i.test(ivHex) && ciphertext.length > 0;
}

/**
 * Create a cipher context that can be passed around.
 * Contains everything needed to encrypt/decrypt messages in a conversation.
 */
export interface CipherContext {
    encryptionKey: string;
    userId: number;
    userEmail: string;
}

/**
 * Create a cipher context from user data.
 * 
 * @param userId - The user's ID
 * @param userEmail - The user's email
 * @returns A cipher context
 */
export function createCipherContext(userId: number, userEmail: string): CipherContext {
    return {
        userId,
        userEmail,
        encryptionKey: generateEncryptionKey(userId, userEmail),
    };
}

/**
 * Encrypt a message using a cipher context.
 * 
 * @param plaintext - The message to encrypt
 * @param context - The cipher context
 * @returns The encrypted message
 */
export function encryptWithContext(plaintext: string, context: CipherContext): string {
    return encryptMessage(plaintext, context.encryptionKey);
}

/**
 * Decrypt a message using a cipher context.
 * 
 * @param encryptedData - The encrypted message
 * @param context - The cipher context
 * @returns The decrypted message
 */
export function decryptWithContext(encryptedData: string, context: CipherContext): string {
    return decryptMessage(encryptedData, context.encryptionKey);
}
