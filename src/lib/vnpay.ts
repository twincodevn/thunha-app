import crypto from "crypto";

// VNPay Configuration
const VNPAY_CONFIG = {
    tmnCode: process.env.VNPAY_TMN_CODE || "",
    hashSecret: process.env.VNPAY_HASH_SECRET || "",
    url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/api/payments/vnpay/callback",
    version: "2.1.0",
    command: "pay",
    currCode: "VND",
    locale: "vn",
};

export interface VNPayParams {
    orderId: string;
    amount: number;
    orderInfo: string;
    ipAddr: string;
    bankCode?: string;
    returnUrl?: string; // Override default return URL (e.g. for subscription callbacks)
}

/**
 * Create VNPay payment URL
 */
export function createVNPayUrl(params: VNPayParams): string {
    const date = new Date();
    const createDate = formatDate(date);
    const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

    const vnpParams: Record<string, string> = {
        vnp_Version: VNPAY_CONFIG.version,
        vnp_Command: VNPAY_CONFIG.command,
        vnp_TmnCode: VNPAY_CONFIG.tmnCode,
        vnp_Locale: VNPAY_CONFIG.locale,
        vnp_CurrCode: VNPAY_CONFIG.currCode,
        vnp_TxnRef: params.orderId,
        vnp_OrderInfo: params.orderInfo,
        vnp_OrderType: "billpayment",
        vnp_Amount: String(params.amount * 100), // VNPay uses smallest currency unit
        vnp_ReturnUrl: params.returnUrl || VNPAY_CONFIG.returnUrl,
        vnp_IpAddr: params.ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    if (params.bankCode) {
        vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sort parameters
    const sortedParams = sortObject(vnpParams);

    // Create query string
    const signData = new URLSearchParams(sortedParams).toString();

    // Create secure hash
    const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Return full URL
    return `${VNPAY_CONFIG.url}?${signData}&vnp_SecureHash=${secureHash}`;
}

/**
 * Verify VNPay callback signature
 */
export function verifyVNPayCallback(
    params: Record<string, string>
): { isValid: boolean; responseCode: string } {
    const secureHash = params.vnp_SecureHash;

    // Remove hash from params
    const verifyParams = { ...params };
    delete verifyParams.vnp_SecureHash;
    delete verifyParams.vnp_SecureHashType;

    // Sort and create sign data
    const sortedParams = sortObject(verifyParams);
    const signData = new URLSearchParams(sortedParams).toString();

    // Create hash to compare
    const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.hashSecret);
    const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return {
        isValid: secureHash === checkSum,
        responseCode: params.vnp_ResponseCode || "",
    };
}

/**
 * Get VNPay response message in Vietnamese
 */
export function getVNPayMessage(responseCode: string): string {
    const messages: Record<string, string> = {
        "00": "Giao dịch thành công",
        "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
        "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
        "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
        "11": "Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
        "12": "Thẻ/Tài khoản bị khóa.",
        "13": "Nhập sai mật khẩu xác thực giao dịch (OTP).",
        "24": "Khách hàng hủy giao dịch",
        "51": "Tài khoản không đủ số dư để thực hiện giao dịch.",
        "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
        "75": "Ngân hàng thanh toán đang bảo trì.",
        "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
        "99": "Lỗi không xác định",
    };
    return messages[responseCode] || "Lỗi không xác định";
}

// Helper functions
function formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
}

function sortObject(obj: Record<string, string>): Record<string, string> {
    return Object.keys(obj)
        .sort()
        .reduce((result: Record<string, string>, key) => {
            result[key] = obj[key];
            return result;
        }, {});
}

// Bank codes for VNPay
export const VNPAY_BANKS = [
    { code: "VNPAYQR", name: "Thanh toán QR Code" },
    { code: "VNBANK", name: "Thẻ ATM nội địa" },
    { code: "INTCARD", name: "Thẻ quốc tế (Visa, Master, JCB)" },
    { code: "NCB", name: "Ngân hàng NCB" },
    { code: "SACOMBANK", name: "Ngân hàng Sacombank" },
    { code: "EXIMBANK", name: "Ngân hàng Eximbank" },
    { code: "MSBANK", name: "Ngân hàng Maritime Bank" },
    { code: "NAMABANK", name: "Ngân hàng Nam A Bank" },
    { code: "VNMART", name: "Ví điện tử VnMart" },
    { code: "VIETINBANK", name: "Ngân hàng Vietinbank" },
    { code: "VIETCOMBANK", name: "Ngân hàng Vietcombank" },
    { code: "HDBANK", name: "Ngân hàng HDBank" },
    { code: "DONGABANK", name: "Ngân hàng Đông Á" },
    { code: "TPBANK", name: "Ngân hàng TPBank" },
    { code: "OJB", name: "Ngân hàng OceanBank" },
    { code: "BIDV", name: "Ngân hàng BIDV" },
    { code: "TECHCOMBANK", name: "Ngân hàng Techcombank" },
    { code: "VPBANK", name: "Ngân hàng VPBank" },
    { code: "AGRIBANK", name: "Ngân hàng Agribank" },
    { code: "MBBANK", name: "Ngân hàng MBBank" },
    { code: "ACB", name: "Ngân hàng ACB" },
    { code: "OCB", name: "Ngân hàng OCB" },
    { code: "SHB", name: "Ngân hàng SHB" },
    { code: "IVB", name: "Ngân hàng IVB" },
];
