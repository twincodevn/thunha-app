/**
 * VietQR - Generate QR codes for Vietnamese bank transfers
 * Follows VietQR API standard: https://vietqr.io
 */

export const BANK_BINS: Record<string, { bin: string; name: string; shortName: string }> = {
    "Vietcombank": { bin: "970436", name: "Ngân hàng TMCP Ngoại Thương Việt Nam", shortName: "VCB" },
    "BIDV": { bin: "970418", name: "Ngân hàng TMCP Đầu Tư và Phát Triển Việt Nam", shortName: "BIDV" },
    "VietinBank": { bin: "970415", name: "Ngân hàng TMCP Công Thương Việt Nam", shortName: "CTG" },
    "Agribank": { bin: "970405", name: "Ngân hàng Nông Nghiệp", shortName: "AGR" },
    "Techcombank": { bin: "970407", name: "Ngân hàng TMCP Kỹ Thương Việt Nam", shortName: "TCB" },
    "MBBank": { bin: "970422", name: "Ngân hàng TMCP Quân Đội", shortName: "MB" },
    "ACB": { bin: "970416", name: "Ngân hàng TMCP Á Châu", shortName: "ACB" },
    "TPBank": { bin: "970423", name: "Ngân hàng TMCP Tiên Phong", shortName: "TPB" },
    "Sacombank": { bin: "970403", name: "Ngân hàng TMCP Sài Gòn Thương Tín", shortName: "STB" },
    "VPBank": { bin: "970432", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", shortName: "VPB" },
    "HDBank": { bin: "970437", name: "Ngân hàng TMCP Phát Triển TP.HCM", shortName: "HDB" },
    "SHB": { bin: "970443", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", shortName: "SHB" },
    "MSB": { bin: "970426", name: "Ngân hàng TMCP Hàng Hải", shortName: "MSB" },
    "LienVietPostBank": { bin: "970449", name: "Ngân hàng Bưu Điện Liên Việt", shortName: "LPB" },
    "VIB": { bin: "970441", name: "Ngân hàng TMCP Quốc Tế", shortName: "VIB" },
};

export function getBankBin(bankName: string): string | null {
    if (BANK_BINS[bankName]) return BANK_BINS[bankName].bin;
    const normalized = bankName.toLowerCase().replace(/\s+/g, "");
    for (const [key, value] of Object.entries(BANK_BINS)) {
        if (normalized.includes(key.toLowerCase().replace(/\s+/g, "")) || normalized.includes(value.shortName.toLowerCase())) {
            return value.bin;
        }
    }
    return null;
}

export function generateVietQRUrl(params: {
    bankBin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
}): string {
    const { bankBin, accountNumber, amount, description, accountName } = params;
    return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
}

export function generatePaymentDescription(params: {
    billId: string;
    roomNumber: string;
    month: number;
    year: number;
}): string {
    const shortId = params.billId.slice(-6).toUpperCase();
    return `TN ${shortId} P${params.roomNumber} T${params.month}/${params.year}`;
}

export function getBankList() {
    return Object.entries(BANK_BINS).map(([name, data]) => ({
        label: `${name} (${data.shortName})`,
        value: name,
        bin: data.bin,
    }));
}
