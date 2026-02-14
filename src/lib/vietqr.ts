import QRCode from "qrcode";

// VietQR Bank BIN codes (Bank Identification Number)
// Full list: https://www.vietqr.io/portal-service/banks
export const VIETQR_BANKS = [
    { code: "VIETCOMBANK", name: "Vietcombank", bin: "970436", shortName: "VCB" },
    { code: "VIETINBANK", name: "VietinBank", bin: "970415", shortName: "CTG" },
    { code: "BIDV", name: "BIDV", bin: "970418", shortName: "BIDV" },
    { code: "AGRIBANK", name: "Agribank", bin: "970405", shortName: "VBA" },
    { code: "TECHCOMBANK", name: "Techcombank", bin: "970407", shortName: "TCB" },
    { code: "MBBANK", name: "MB Bank", bin: "970422", shortName: "MB" },
    { code: "ACB", name: "ACB", bin: "970416", shortName: "ACB" },
    { code: "VPBANK", name: "VPBank", bin: "970432", shortName: "VPB" },
    { code: "TPBANK", name: "TPBank", bin: "970423", shortName: "TPB" },
    { code: "SACOMBANK", name: "Sacombank", bin: "970403", shortName: "STB" },
    { code: "HDBANK", name: "HDBank", bin: "970437", shortName: "HDB" },
    { code: "OCB", name: "OCB", bin: "970448", shortName: "OCB" },
    { code: "SHB", name: "SHB", bin: "970443", shortName: "SHB" },
    { code: "MSBANK", name: "Maritime Bank", bin: "970426", shortName: "MSB" },
    { code: "VIB", name: "VIB", bin: "970441", shortName: "VIB" },
    // Simplified for the most common ones
] as const;

export type VietQRBank = { code: string; name: string; bin: string; shortName?: string };

interface VietQRParams {
    bankBin: string;          // Bank BIN code
    accountNumber: string;    // Account number
    accountName?: string;     // Account holder name (optional, for display)
    amount?: number;          // Amount in VND
    description?: string;     // Transfer description
}

/**
 * Generate VietQR data string following VietQR standard
 * Format: https://vietqr.io/portal-service/document
 */
export function generateVietQRData(params: VietQRParams): string {
    const { bankBin, accountNumber, amount, description } = params;

    // VietQR uses EMVCo QR code format
    // Simple format for bank account transfer
    // Using VietQR URL format which is more compatible
    const baseUrl = "https://img.vietqr.io/image";

    // Format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png?amount={AMOUNT}&addInfo={DESCRIPTION}
    let qrData = `${baseUrl}/${bankBin}-${accountNumber}-compact2.png`;

    const queryParams: string[] = [];
    if (amount && amount > 0) {
        queryParams.push(`amount=${amount}`);
    }
    if (description) {
        queryParams.push(`addInfo=${encodeURIComponent(description)}`);
    }

    if (queryParams.length > 0) {
        qrData += `?${queryParams.join("&")}`;
    }

    return qrData;
}

/**
 * Generate QR code as base64 data URL for display
 */
export async function generateQRCodeDataURL(data: string): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            width: 256,
            margin: 2,
            color: {
                dark: "#000",
                light: "#fff",
            },
        });
    } catch (error) {
        console.error("QR code generation error:", error);
        throw new Error("Failed to generate QR code");
    }
}

/**
 * Generate VietQR image URL (uses VietQR.io service)
 * This returns an image URL that can be used directly
 */
export function getVietQRImageURL(params: VietQRParams): string {
    const { bankBin, accountNumber, accountName, amount, description } = params;

    // VietQR.io provides a free QR generation API
    // Format: https://img.vietqr.io/image/{BankBin}-{AccountNo}-{template}.png
    const baseUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png`;

    const queryParams: string[] = [];
    if (amount && amount > 0) {
        queryParams.push(`amount=${Math.round(amount)}`);
    }
    if (description) {
        queryParams.push(`addInfo=${encodeURIComponent(description)}`);
    }
    if (accountName) {
        queryParams.push(`accountName=${encodeURIComponent(accountName)}`);
    }

    return queryParams.length > 0 ? `${baseUrl}?${queryParams.join("&")}` : baseUrl;
}

/**
 * Get bank by code, name or bin
 */
export function getBankByCode(query: string): VietQRBank | undefined {
    if (!query) return undefined;
    const search = query.toLowerCase().trim();
    return VIETQR_BANKS.find(
        (bank) =>
            bank.code.toLowerCase() === search ||
            bank.name.toLowerCase() === search ||
            bank.bin === search ||
            bank.shortName?.toLowerCase() === search
    );
}

/**
 * Get bank by BIN
 */
export function getBankByBin(bin: string): VietQRBank | undefined {
    return VIETQR_BANKS.find((bank) => bank.bin === bin);
}
