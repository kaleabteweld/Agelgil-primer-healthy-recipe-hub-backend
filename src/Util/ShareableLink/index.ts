import crypto from 'crypto';
import { ValidationErrorFactory } from '../../Types/error';

export default class ShareableLink {

    private static instance: ShareableLink;

    CIPHERIV_SECRET_KEY: string;
    SHAREABLE_LINK_BASE_URL: string;
    Domain: string;

    private constructor({ key, baseUrl, domain }: { key?: string, baseUrl?: string, domain?: string }) {
        this.CIPHERIV_SECRET_KEY = key ?? process.env.CIPHERIV_SECRET_KEY ?? "koloHere";
        this.SHAREABLE_LINK_BASE_URL = baseUrl ?? process.env.SHAREABLE_LINK_BASE_URL ?? "http://localhost:3000";
        this.Domain = domain ?? "Recipe";
    }

    public static getInstance({ key, baseUrl, domain }: { key?: string, baseUrl?: string, domain?: string }): ShareableLink {
        if (!ShareableLink.instance) {
            ShareableLink.instance = new ShareableLink({
                key: key,
                baseUrl: baseUrl,
                domain: domain
            });
        }
        return ShareableLink.instance;
    }

    encryptId(id: string): string {
        const iv = crypto.createHash('sha256').update('constIV!').digest('hex').slice(0, 16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            crypto.scryptSync(process.env.CIPHERIV_SECRET_KEY ?? "koloHere", 'GfG', 32),
            iv);
        let encryptedData = cipher.update(id, 'utf8', 'base64');
        encryptedData += cipher.final('base64');
        return encodeURIComponent(encryptedData);
    }
    decryptId(id: string): string {
        const iv = crypto.createHash('sha256').update('constIV!').digest('hex').slice(0, 16);
        const decodedData = decodeURIComponent(id);
        const decipher = crypto.createDecipheriv('aes-256-cbc',
            crypto.scryptSync(process.env.CIPHERIV_SECRET_KEY ?? "koloHere", 'GfG', 32),
            iv);
        let decryptedData = decipher.update(decodedData, 'base64', 'utf8');
        decryptedData += decipher.final('utf8');
        return decryptedData;
    }
    isEncrypted(id: string): boolean {
        const iv = crypto.createHash('sha256').update('constIV!').digest('hex').slice(0, 16);
        try {
            // Attempt to decrypt the data
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                crypto.scryptSync(process.env.CIPHERIV_SECRET_KEY ?? "koloHere", 'GfG', 32),
                iv);
            let decryptedData = decipher.update(id, 'base64', 'utf8');
            decryptedData += decipher.final('utf8');
            // If decryption succeeds without errors, consider it as encrypted
            return true;
        } catch (error) {
            // If an error occurs during decryption, the data is likely not encrypted
            return false;
        }
    }
    getEncryptedIdFromUrl(url: string): String {
        const lastIndex = url.lastIndexOf('/');
        const lastSubstring = url.substring(lastIndex + 1);
        if (lastSubstring == undefined || lastSubstring.length == 0) {
            throw ValidationErrorFactory({
                msg: 'Invalid URL',
                statusCode: 404,
                type: 'Validation',
            }, "id");
        }
        return lastSubstring;
    }
    getShareableLink(id: string): string {
        return `${this.SHAREABLE_LINK_BASE_URL}/${this.Domain}/${this.encryptId(id)}`;
    }
}