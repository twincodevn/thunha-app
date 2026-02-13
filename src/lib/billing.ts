import { ELECTRICITY_TIERS } from "./constants";

export interface ElectricityTierBreakdown {
    tier: string;
    range: string;
    units: number;
    price: number;
    amount: number;
}

export function calculateElectricityBreakdown(usage: number, customRate?: number): { total: number; breakdown: ElectricityTierBreakdown[] } {
    if (customRate && customRate > 0) {
        return {
            total: Math.round(usage * customRate),
            breakdown: [{
                tier: "Giá cố định",
                range: "Toàn bộ",
                units: usage,
                price: customRate,
                amount: Math.round(usage * customRate)
            }]
        };
    }

    let remaining = usage;
    let totalCost = 0;
    const breakdown: ElectricityTierBreakdown[] = [];

    for (let i = 0; i < ELECTRICITY_TIERS.length; i++) {
        const tier = ELECTRICITY_TIERS[i];
        if (remaining <= 0) break;

        const tierRange = tier.max === Infinity ? remaining : tier.max - tier.min + 1;
        const unitsInTier = Math.min(remaining, tierRange);
        const amount = unitsInTier * tier.price;

        breakdown.push({
            tier: `Bậc ${i + 1}`,
            range: tier.max === Infinity ? `>${tier.min}` : `${tier.min}-${tier.max}`,
            units: unitsInTier,
            price: tier.price,
            amount: Math.round(amount)
        });

        totalCost += amount;
        remaining -= unitsInTier;
    }

    return { total: Math.round(totalCost), breakdown };
}

export function calculateElectricityCost(usage: number, customRate?: number): number {
    return calculateElectricityBreakdown(usage, customRate).total;
}

/**
 * Calculate water cost
 * @param usage - m³ used
 * @param rate - Price per m³ in VND
 * @returns Total water cost in VND
 */
export function calculateWaterCost(usage: number, rate: number): number {
    return Math.round(usage * rate);
}

/**
 * Format currency in Vietnamese format
 * @param amount - Amount in VND
 * @returns Formatted string
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("vi-VN").format(num);
}

/**
 * Format date in Vietnamese format
 * @param date - Date to format
 * @returns Formatted string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
}

/**
 * Format month/year
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Formatted string like "Tháng 2/2026"
 */
export function formatMonthYear(month: number, year: number): string {
    return `Tháng ${month}/${year}`;
}

/**
 * Get current month and year
 * @returns Object with month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    };
}

/**
 * Calculate total bill amount
 */
export function calculateBillTotal(params: {
    baseRent: number;
    electricityAmount: number;
    waterAmount: number;
    extraCharges?: Array<{ name: string; amount: number }>;
    discount?: number;
}): number {
    const { baseRent, electricityAmount, waterAmount, extraCharges = [], discount = 0 } = params;

    const extraTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const subtotal = baseRent + electricityAmount + waterAmount + extraTotal;

    return Math.max(0, subtotal - discount);
}

/**
 * Generate a random token for invoice URLs
 */
export function generateToken(): string {
    return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Slugify a string for URLs
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/**
 * Generate SMS content for bill
 */
export function getBillSMSContent(billInfo: {
    month: number;
    year: number;
    propertyName: string;
    roomNumber: string;
    total: number;
    invoiceUrl: string;
}): string {
    return `[ThuNhà] Thông báo tiền phòng T${billInfo.month}/${billInfo.year}

${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
Tổng cộng: ${formatCurrency(billInfo.total)}

Xem chi tiết: ${billInfo.invoiceUrl}

Vui lòng thanh toán trước ngày 10. Cảm ơn!`;
}

/**
 * Generate Zalo message content
 */
export function getBillZaloContent(billInfo: {
    month: number;
    year: number;
    propertyName: string;
    roomNumber: string;
    tenantName: string;
    total: number;
    invoiceUrl: string;
}): string {
    return `📝 HÓA ĐƠN TIỀN PHÒNG - T${billInfo.month}/${billInfo.year}

🏠 ${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
👤 Khách: ${billInfo.tenantName}
💰 Tổng cộng: ${formatCurrency(billInfo.total)}

🔗 Xem chi tiết: ${billInfo.invoiceUrl}

Hạn đóng: Trước ngày 10.
---
Gửi từ ThuNhà`;
}

/**
 * Get Zalo direct chat URL
 */
export function getZaloChatUrl(phone: string): string {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://zalo.me/${cleanPhone}`;
}
