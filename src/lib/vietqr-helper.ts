/**
 * VietQR Helper Functions
 * @see https://vietqr.io/
 */

interface VietQRParams {
    bankId: string;
    accountNo: string;
    template?: string;
    amount: number;
    description: string;
    accountName?: string;
}

// Map common bank names to BIN/ID
export const BANK_LIST = [
    { code: "MB", name: "MBBank", bin: "970422" },
    { code: "VCB", name: "Vietcombank", bin: "970436" },
    { code: "TCB", name: "Techcombank", bin: "970407" },
    { code: "ACB", name: "ACB", bin: "970416" },
    { code: "VPB", name: "VPBank", bin: "970432" },
    { code: "TPB", name: "TPBank", bin: "970423" },
    { code: "BIDV", name: "BIDV", bin: "970418" },
    { code: "VTB", name: "VietinBank", bin: "970415" },
];

export function generateVietQRUrl({
    bankId,
    accountNo,
    template = "compact2",
    amount,
    description,
    accountName,
}: VietQRParams): string {
    // VietQR Format: https://img.vietqr.io/image/[BANK]-[ACCOUNT]-[TEMPLATE].png?amount=[AMOUNT]&addInfo=[CONTENT]&accountName=[NAME]

    // Clean description: Remove special chars, max length
    const cleanDesc = encodeURIComponent(
        description
            .replace(/[^a-zA-Z0-9 ]/g, " ")
            .trim()
            .substring(0, 50)
    );

    const cleanName = accountName ? `&accountName=${encodeURIComponent(accountName)}` : "";

    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${cleanDesc}${cleanName}`;
}

export const USER_BANK_CONFIG = {
    // Default config - should be loaded from env or database in production
    bankId: process.env.NEXT_PUBLIC_BANK_ID || "MB",
    accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "",
};
