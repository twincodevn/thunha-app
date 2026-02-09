// Vietnam Electricity Tiers (2024 rates in VND per kWh)
export const ELECTRICITY_TIERS = [
    { min: 0, max: 50, price: 1893 },
    { min: 51, max: 100, price: 1956 },
    { min: 101, max: 200, price: 2271 },
    { min: 201, max: 300, price: 2860 },
    { min: 301, max: 400, price: 3197 },
    { min: 401, max: Infinity, price: 3302 },
] as const;

// Default water rate (VND per m³)
export const DEFAULT_WATER_RATE = 25000;

// Plan limits
export const PLAN_LIMITS = {
    FREE: 3,
    BASIC: 10,
    PRO: 30,
    BUSINESS: Infinity,
} as const;

// Pricing in VND
export const PLAN_PRICING = {
    FREE: 0,
    BASIC: 99000,
    PRO: 199000,
    BUSINESS: 299000,
} as const;

// Plan features
export const PLAN_FEATURES = {
    FREE: {
        autoReminders: false,
        pdfInvoices: false,
        vnpayPayment: false,
        reports: false,
        multiUser: false,
    },
    BASIC: {
        autoReminders: true,
        pdfInvoices: true,
        vnpayPayment: false,
        reports: false,
        multiUser: false,
    },
    PRO: {
        autoReminders: true,
        pdfInvoices: true,
        vnpayPayment: true,
        reports: true,
        multiUser: false,
    },
    BUSINESS: {
        autoReminders: true,
        pdfInvoices: true,
        vnpayPayment: true,
        reports: true,
        multiUser: true,
    },
} as const;

// App constants
export const APP_NAME = "ThuNhà";
export const APP_DESCRIPTION = "Quản lý nhà trọ thông minh";

// Status labels in Vietnamese
export const ROOM_STATUS_LABELS = {
    VACANT: "Trống",
    OCCUPIED: "Đang thuê",
    MAINTENANCE: "Bảo trì",
} as const;

export const BILL_STATUS_LABELS = {
    DRAFT: "Nháp",
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    OVERDUE: "Quá hạn",
    CANCELLED: "Đã hủy",
} as const;

export const PAYMENT_METHOD_LABELS = {
    CASH: "Tiền mặt",
    BANK_TRANSFER: "Chuyển khoản",
    VNPAY: "VNPay",
    MOMO: "MoMo",
} as const;
