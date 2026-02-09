import QRCode from "qrcode";

// VietQR Bank BIN codes (Bank Identification Number)
// Full list: https://www.vietqr.io/portal-service/banks
export const VIETQR_BANKS = [
    { code: "VIETCOMBANK", name: "Vietcombank", bin: "970436" },
    { code: "VIETINBANK", name: "VietinBank", bin: "970415" },
    { code: "BIDV", name: "BIDV", bin: "970418" },
    { code: "AGRIBANK", name: "Agribank", bin: "970405" },
    { code: "TECHCOMBANK", name: "Techcombank", bin: "970407" },
    { code: "MBBANK", name: "MB Bank", bin: "970422" },
    { code: "ACB", name: "ACB", bin: "970416" },
    { code: "VPBANK", name: "VPBank", bin: "970432" },
    { code: "TPBANK", name: "TPBank", bin: "970423" },
    { code: "SACOMBANK", name: "Sacombank", bin: "970403" },
    { code: "HDBANK", name: "HDBank", bin: "970437" },
    { code: "OCB", name: "OCB", bin: "970448" },
    { code: "SHB", name: "SHB", bin: "970443" },
    { code: "MSBANK", name: "Maritime Bank", bin: "970426" },
    { code: "EXIMBANK", name: "Eximbank", bin: "970431" },
    { code: "SCB", name: "SCB", bin: "970429" },
    { code: "VIETBANK", name: "VietBank", bin: "970433" },
    { code: "NAMABANK", name: "Nam A Bank", bin: "970428" },
    { code: "BAOVIETBANK", name: "Bao Viet Bank", bin: "970438" },
    { code: "SEABANK", name: "SeABank", bin: "970440" },
    { code: "ABBANK", name: "ABBank", bin: "970425" },
    { code: "PVCOMBANK", name: "PVcomBank", bin: "970412" },
    { code: "VIETABANK", name: "VietABank", bin: "970427" },
    { code: "LPBANK", name: "LPBank (LienVietPostBank)", bin: "970449" },
    { code: "CBB", name: "CBBank", bin: "970444" },
    { code: "GPB", name: "GPBank", bin: "970408" },
    { code: "NCB", name: "NCB", bin: "970419" },
    { code: "KIENLONGBANK", name: "Kienlongbank", bin: "970452" },
    { code: "VIB", name: "VIB", bin: "970441" },
    { code: "OJB", name: "OceanBank", bin: "970414" },
    { code: "BACA", name: "Bac A Bank", bin: "970409" },
    { code: "DONGABANK", name: "DongA Bank", bin: "970406" },
    { code: "WOORI", name: "Woori Bank VN", bin: "970457" },
    { code: "SHBVN", name: "Shinhan Bank VN", bin: "970424" },
    { code: "CIMB", name: "CIMB VN", bin: "422589" },
    { code: "PUBLICBANK", name: "Public Bank VN", bin: "970439" },
    { code: "UBANK", name: "UBank by VPBank", bin: "546034" },
] as const;

export type VietQRBank = (typeof VIETQR_BANKS)[number];

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
 * Get bank by code
 */
export function getBankByCode(code: string): VietQRBank | undefined {
    return VIETQR_BANKS.find((bank) => bank.code === code);
}

/**
 * Get bank by BIN
 */
export function getBankByBin(bin: string): VietQRBank | undefined {
    return VIETQR_BANKS.find((bank) => bank.bin === bin);
}
