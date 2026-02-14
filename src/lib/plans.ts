export type UserPlan = "FREE" | "BASIC" | "PRO" | "BUSINESS";

export interface PlanConfig {
    name: string;
    price: number;
    description: string;
    maxRooms: number;
    features: string[];
    // Feature flags
    canExportPdf: boolean;
    canSendReminders: boolean;
    canUseVnpay: boolean;
    hasAdvancedReports: boolean;
    hasPrioritySupport: boolean;
}

export const PLANS: Record<UserPlan, PlanConfig> = {
    FREE: {
        name: "Miễn phí",
        price: 0,
        description: "Dành cho chủ trọ mới bắt đầu",
        maxRooms: 3,
        features: [
            "Quản lý tòa nhà & phòng",
            "Quản lý khách thuê",
            "Tính tiền điện nước tự động",
            "Tạo hóa đơn thủ công"
        ],
        canExportPdf: false,
        canSendReminders: false,
        canUseVnpay: false,
        hasAdvancedReports: false,
        hasPrioritySupport: false,
    },
    BASIC: {
        name: "Basic",
        price: 99000,
        description: "Cho chủ trọ có 5-10 phòng",
        maxRooms: 10,
        features: [
            "Tất cả tính năng Free",
            "Nhắc nợ tự động (Email)",
            "Xuất PDF hóa đơn",
            "Chia sẻ Zalo/SMS"
        ],
        canExportPdf: true,
        canSendReminders: true,
        canUseVnpay: false,
        hasAdvancedReports: false,
        hasPrioritySupport: false,
    },
    PRO: {
        name: "Pro",
        price: 199000,
        description: "Cho chủ trọ chuyên nghiệp",
        maxRooms: 30,
        features: [
            "Tất cả tính năng Basic",
            "Thu tiền qua VNPay",
            "Báo cáo nâng cao",
            "Hỗ trợ ưu tiên"
        ],
        canExportPdf: true,
        canSendReminders: true,
        canUseVnpay: true,
        hasAdvancedReports: true,
        hasPrioritySupport: true,
    },
    BUSINESS: {
        name: "Business",
        price: 299000,
        description: "Cho doanh nghiệp & chuỗi nhà trọ",
        maxRooms: 9999, // Effectively unlimited
        features: [
            "Tất cả tính năng Pro",
            "Nhiều tài khoản quản lý",
            "API tích hợp",
            "Hỗ trợ 1-1"
        ],
        canExportPdf: true,
        canSendReminders: true,
        canUseVnpay: true,
        hasAdvancedReports: true,
        hasPrioritySupport: true,
    }
};

export function getPlanConfig(plan: UserPlan): PlanConfig {
    return PLANS[plan] || PLANS.FREE;
}

export function checkRoomLimit(plan: UserPlan, currentRoomCount: number): boolean {
    const config = getPlanConfig(plan);
    return currentRoomCount < config.maxRooms;
}
