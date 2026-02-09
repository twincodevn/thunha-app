import { ELECTRICITY_TIERS } from "./constants";

/**
 * Calculate electricity cost using Vietnam's tiered pricing
 * @param usage - kWh used
 * @param customRate - Optional custom rate per kWh (if 0 or undefined, use tiers)
 * @returns Total electricity cost in VND
 */
export function calculateElectricityCost(usage: number, customRate?: number): number {
    // If custom rate is provided and > 0, use it
    if (customRate && customRate > 0) {
        return Math.round(usage * customRate);
    }

    // Otherwise, use Vietnam tiered pricing
    let remaining = usage;
    let totalCost = 0;

    for (const tier of ELECTRICITY_TIERS) {
        if (remaining <= 0) break;

        const tierRange = tier.max === Infinity ? remaining : tier.max - tier.min + 1;
        const unitsInTier = Math.min(remaining, tierRange);

        totalCost += unitsInTier * tier.price;
        remaining -= unitsInTier;
    }

    return Math.round(totalCost);
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
