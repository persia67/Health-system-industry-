
// Simple XOR Cipher + Base64 for obfuscation (Lightweight, no external deps required for basic protection)

const SECRET_SALT = "OHS_SECURE_SALT_2025_#$*";

export const SecurityService = {
  // Encrypt data before saving to localStorage
  encrypt: (data: any): string => {
    try {
      const json = JSON.stringify(data);
      
      // Fix for Unicode/Persian characters: Encode to Base64 first
      // This ensures all characters are 1 byte (ASCII) before we apply XOR and Hex conversion
      // unescape(encodeURIComponent(str)) is a common pattern to treat string as UTF-8 bytes for btoa
      const encoded = btoa(unescape(encodeURIComponent(json)));

      const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
      const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
      const applySaltToChar = (code: number) => textToChars(SECRET_SALT).reduce((a, b) => a ^ b, code);

      return encoded
        .split("")
        .map(c => c.charCodeAt(0))
        .map(applySaltToChar)
        .map(byteHex)
        .join("");
    } catch (e) {
      console.error("Encryption failed", e);
      return "";
    }
  },

  // Decrypt data after loading from localStorage
  decrypt: <T>(encoded: string | null): T | null => {
    if (!encoded) return null;
    try {
      const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
      const applySaltToChar = (code: number) => textToChars(SECRET_SALT).reduce((a, b) => a ^ b, code);
      
      const res = encoded
        .match(/.{1,2}/g)!
        .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join("");
      
      // Decode Base64 back to UTF-8 JSON string
      const json = decodeURIComponent(escape(atob(res)));
        
      return JSON.parse(json) as T;
    } catch (e) {
      console.error("Decryption failed (Data might be tampered or legacy format)", e);
      return null;
    }
  },

  // Generate a verifying hash for license keys to prevent random string entry
  verifyLicenseSignature: (serial: string): boolean => {
    try {
        // Format: OHS-[RANDOM]-[SIGNATURE]-[RANDOM]
        const parts = serial.split('-');
        if (parts.length !== 4 || parts[0] !== 'OHS') return false;

        const dataPart = parts[1];
        const signaturePart = parts[2];
        
        // Create a simple hash of the data part + Secret
        // In real world, use SHA-256
        let hash = 0;
        const str = dataPart + SECRET_SALT;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const expectedSignature = Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
        
        // Check if the signature in the key matches our calculation
        return signaturePart === expectedSignature || signaturePart === 'GOLD'; // GOLD is a master bypass for dev if needed
    } catch (e) {
        return false;
    }
  },

  // Generate a valid license key based on the same salt logic
  generateLicenseKey: (): string => {
      // 1. Generate Random Data Part (4 chars alphanumeric)
      const dataPart = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '0');
      
      // 2. Calculate Signature (Must match verify logic)
      let hash = 0;
      const str = dataPart + SECRET_SALT;
      for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
      }
      const signaturePart = Math.abs(hash).toString(16).substring(0, 4).toUpperCase();

      // 3. Generate Random Suffix
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'X');

      // 4. Construct Key: OHS-DATA-SIGN-RAND
      return `OHS-${dataPart}-${signaturePart}-${randomSuffix}`;
  }
};
