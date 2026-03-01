/**
 * Zalo ZNS (Zalo Notification Service) Utility
 * 
 * ZNS cho phép gửi thông báo đến số điện thoại của khách thuê 
 * mà không cần họ follow OA (Zalo Official Account).
 * 
 * Docs: https://developers.zalo.me/docs/zalo-notification-service
 */

import { prisma } from "@/lib/prisma";

// ─── Constants ───────────────────────────────────────────────────────────────

const ZALO_API_BASE = "https://business.openapi.zalo.me";
const ZALO_OAUTH_URL = "https://oauth.zaloapp.com/v4/oa/permission";
const ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";

/** ZNS Template IDs — phải được Zalo duyệt trước ở portal OA */
export const ZNS_TEMPLATES = {
    BILL_CREATED: process.env.ZALO_TEMPLATE_BILL_CREATED || "",
    BILL_OVERDUE: process.env.ZALO_TEMPLATE_BILL_OVERDUE || "",
    CONTRACT_EXPIRY: process.env.ZALO_TEMPLATE_CONTRACT_EXPIRY || "",
    PAYMENT_CONFIRMED: process.env.ZALO_TEMPLATE_PAYMENT_CONFIRM || "",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZNSResult {
    success: boolean;
    msgId?: string;
    error?: string;
    sentTime?: number;
}

export interface ZNSBillCreatedData {
    tenant_name: string;
    room_number: string;
    property_name: string;
    month: string;        // "Tháng 2/2026"
    amount: string;       // "2.500.000 đ"
    due_date: string;     // "15/03/2026"
    invoice_url: string;
}

export interface ZNSBillOverdueData {
    tenant_name: string;
    room_number: string;
    property_name: string;
    amount: string;
    days_overdue: string;
    invoice_url: string;
}

export interface ZNSContractExpiryData {
    tenant_name: string;
    room_number: string;
    property_name: string;
    end_date: string;
    days_left: string;
}

export interface ZNSPaymentConfirmedData {
    tenant_name: string;
    room_number: string;
    amount: string;
    month: string;
    payment_method: string;
}

// ─── Phone Normalization ──────────────────────────────────────────────────────

/**
 * Chuẩn hóa số điện thoại VN sang format Zalo (84xxxxxxxxx)
 * VD: "0912345678" → "84912345678"
 *     "+84912345678" → "84912345678"
 */
export function formatVietnamesePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, ""); // bỏ ký tự đặc biệt

    if (cleaned.startsWith("84") && cleaned.length === 11) {
        return cleaned;
    }
    if (cleaned.startsWith("0") && cleaned.length === 10) {
        return "84" + cleaned.slice(1);
    }
    if (cleaned.startsWith("84") && cleaned.length === 11) {
        return cleaned;
    }
    // Fallback: trả nguyên
    return cleaned;
}

// ─── Token Management ─────────────────────────────────────────────────────────

/**
 * Lấy access token hợp lệ của user (auto-refresh nếu hết hạn)
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            zaloOaAccessToken: true,
            zaloOaRefreshToken: true,
            zaloOaTokenExpiry: true,
        },
    });

    if (!user?.zaloOaAccessToken) return null;

    // Token còn hạn (và còn > 5 phút)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (user.zaloOaTokenExpiry && user.zaloOaTokenExpiry > fiveMinutesFromNow) {
        return user.zaloOaAccessToken;
    }

    // Token hết hạn → refresh
    if (user.zaloOaRefreshToken) {
        return await refreshAccessToken(userId, user.zaloOaRefreshToken);
    }

    return null;
}

/**
 * Refresh access_token dùng refresh_token
 */
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
    try {
        const res = await fetch(ZALO_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                app_id: process.env.ZALO_APP_ID || "",
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        const data = await res.json();

        if (!data.access_token) {
            console.error("[Zalo] Token refresh failed:", data);
            return null;
        }

        // Lưu token mới (expires_in tính bằng giây)
        const expiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                zaloOaAccessToken: data.access_token,
                zaloOaRefreshToken: data.refresh_token || refreshToken,
                zaloOaTokenExpiry: expiry,
            },
        });

        return data.access_token;
    } catch (err) {
        console.error("[Zalo] refreshAccessToken error:", err);
        return null;
    }
}

// ─── Core ZNS Sender ──────────────────────────────────────────────────────────

/**
 * Gửi ZNS message.
 * @param accessToken  OA access token
 * @param phone        Số điện thoại (sẽ tự normalize)
 * @param templateId   Template ID đã được Zalo duyệt
 * @param templateData Key-value tương ứng template parameters
 * @param trackingId   ID để tracking (vd: bill-{id})
 */
export async function sendZNS(
    accessToken: string,
    phone: string,
    templateId: string,
    templateData: Record<string, string>,
    trackingId?: string
): Promise<ZNSResult> {
    const normalizedPhone = formatVietnamesePhone(phone);

    // Sandbox mode: nếu không có template, log và return success
    if (!templateId) {
        console.log(`[Zalo ZNS SANDBOX] Would send to ${normalizedPhone}:`, templateData);
        return { success: true, msgId: "sandbox-" + Date.now() };
    }

    try {
        const body: Record<string, unknown> = {
            phone: normalizedPhone,
            template_id: templateId,
            template_data: templateData,
        };
        if (trackingId) body.tracking_id = trackingId;

        const res = await fetch(`${ZALO_API_BASE}/message/template`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "access_token": accessToken,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.error === 0) {
            return {
                success: true,
                msgId: data.data?.msg_id,
                sentTime: data.data?.sent_time,
            };
        } else {
            return {
                success: false,
                error: `ZNS Error ${data.error}: ${data.message}`,
            };
        }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
}

// ─── Notification Helpers ─────────────────────────────────────────────────────

/** Gửi ZNS hóa đơn mới cho khách thuê */
export async function sendBillCreatedZNS(
    userId: string,
    tenantPhone: string,
    data: ZNSBillCreatedData
): Promise<ZNSResult> {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return { success: false, error: "Zalo OA chưa kết nối" };

    return sendZNS(
        accessToken,
        tenantPhone,
        ZNS_TEMPLATES.BILL_CREATED,
        {
            tenant_name: data.tenant_name,
            room_number: data.room_number,
            property_name: data.property_name,
            month: data.month,
            amount: data.amount,
            due_date: data.due_date,
            invoice_url: data.invoice_url,
        },
        `bill-created-${Date.now()}`
    );
}

/** Gửi ZNS nhắc hóa đơn quá hạn */
export async function sendBillOverdueZNS(
    userId: string,
    tenantPhone: string,
    data: ZNSBillOverdueData
): Promise<ZNSResult> {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return { success: false, error: "Zalo OA chưa kết nối" };

    return sendZNS(
        accessToken,
        tenantPhone,
        ZNS_TEMPLATES.BILL_OVERDUE,
        {
            tenant_name: data.tenant_name,
            room_number: data.room_number,
            property_name: data.property_name,
            amount: data.amount,
            days_overdue: data.days_overdue,
            invoice_url: data.invoice_url,
        },
        `bill-overdue-${Date.now()}`
    );
}

/** Gửi ZNS hợp đồng sắp hết hạn */
export async function sendContractExpiryZNS(
    userId: string,
    tenantPhone: string,
    data: ZNSContractExpiryData
): Promise<ZNSResult> {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return { success: false, error: "Zalo OA chưa kết nối" };

    return sendZNS(
        accessToken,
        tenantPhone,
        ZNS_TEMPLATES.CONTRACT_EXPIRY,
        {
            tenant_name: data.tenant_name,
            room_number: data.room_number,
            property_name: data.property_name,
            end_date: data.end_date,
            days_left: data.days_left,
        },
        `contract-expiry-${Date.now()}`
    );
}

/** Gửi ZNS xác nhận thanh toán */
export async function sendPaymentConfirmedZNS(
    userId: string,
    tenantPhone: string,
    data: ZNSPaymentConfirmedData
): Promise<ZNSResult> {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return { success: false, error: "Zalo OA chưa kết nối" };

    return sendZNS(
        accessToken,
        tenantPhone,
        ZNS_TEMPLATES.PAYMENT_CONFIRMED,
        {
            tenant_name: data.tenant_name,
            room_number: data.room_number,
            amount: data.amount,
            month: data.month,
            payment_method: data.payment_method,
        },
        `payment-confirmed-${Date.now()}`
    );
}

// ─── OAuth Helpers ────────────────────────────────────────────────────────────

/** Tạo URL để redirect user đến Zalo OAuth */
export function getZaloOAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
        app_id: process.env.ZALO_APP_ID || "",
        redirect_uri: redirectUri,
        state,
    });
    return `${ZALO_OAUTH_URL}?${params.toString()}`;
}

/** Đổi code lấy access_token sau OAuth callback */
export async function exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
} | null> {
    try {
        const res = await fetch(ZALO_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                app_id: process.env.ZALO_APP_ID || "",
                app_secret: process.env.ZALO_APP_SECRET || "",
                code,
                grant_type: "authorization_code",
            }),
        });

        const data = await res.json();
        if (!data.access_token) return null;
        return data;
    } catch {
        return null;
    }
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/** Format số tiền VND cho template ZNS */
export function formatCurrencyVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Format ngày cho template ZNS (dd/MM/yyyy) */
export function formatDateVN(date: Date): string {
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
