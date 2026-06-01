import crypto from 'crypto';

/**
 * Decodes a Base32 encoded string into a Buffer.
 * Google Authenticator and other TOTP apps use Base32 for seeds.
 */
function decodeBase32(charSequence: string): Buffer {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = '';

    for (let i = 0; i < charSequence.length; i++) {
        const val = base32chars.indexOf(charSequence.charAt(i).toUpperCase());
        if (val === -1) continue; // Skip padding or invalid characters
        bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
        const chunk = bits.slice(i, i + 8);
        hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
    }

    return Buffer.from(hex, 'hex');
}

/**
 * Generates a cryptographically secure, random 16-character Base32 secret key.
 */
export function generateSecret(length = 16): string {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        secret += base32chars[randomBytes[i]! % 32];
    }
    return secret;
}

/**
 * Calculates a 6-digit TOTP code for a given Base32 secret at a specific epoch timestamp.
 */
export function generateTOTP(secret: string, timeStep = 30): string {
    const key = decodeBase32(secret);
    
    // Calculate the number of 30-second steps since Epoch
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStep);

    // Write the 64-bit counter to a Big-Endian buffer
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(counter, 4);

    // Compute standard HMAC-SHA1
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(timeBuffer);
    const hmacResult = hmac.digest();

    // Dynamically truncate the hash to extract a 4-byte segment
    const offset = hmacResult[hmacResult.length - 1]! & 0xf;
    const binary = ((hmacResult[offset]! & 0x7f) << 24) |
                   ((hmacResult[offset + 1]! & 0xff) << 16) |
                   ((hmacResult[offset + 2]! & 0xff) << 8) |
                   (hmacResult[offset + 3]! & 0xff);

    // Generate 6-digit code
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a Base32 secret.
 * Supports a customizable clock-skew window (default 1 step = +/- 30s) to handle network and client-device latency.
 */
export function verifyTOTP(token: string, secret: string, window = 1, timeStep = 30): boolean {
    if (!token || !secret) return false;
    
    // Clean token string (remove whitespace/dashes)
    const cleanToken = token.replace(/\s+/g, '');
    if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) return false;

    const key = decodeBase32(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counterNow = Math.floor(epoch / timeStep);

    // Check current step as well as past/future steps within the window
    for (let i = -window; i <= window; i++) {
        const counter = counterNow + i;
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeUInt32BE(0, 0);
        timeBuffer.writeUInt32BE(counter, 4);

        const hmac = crypto.createHmac('sha1', key);
        hmac.update(timeBuffer);
        const hmacResult = hmac.digest();

        const offset = hmacResult[hmacResult.length - 1]! & 0xf;
        const binary = ((hmacResult[offset]! & 0x7f) << 24) |
                       ((hmacResult[offset + 1]! & 0xff) << 16) |
                       ((hmacResult[offset + 2]! & 0xff) << 8) |
                       (hmacResult[offset + 3]! & 0xff);

        const otp = (binary % 1000000).toString().padStart(6, '0');
        if (otp === cleanToken) return true;
    }

    return false;
}
