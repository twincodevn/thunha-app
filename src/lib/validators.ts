import { z } from "zod";

// =============================================
// INPUT LENGTH LIMITS (Security: prevents abuse)
// =============================================
const MAX_NAME = 100;
const MAX_ADDRESS = 200;
const MAX_NOTES = 1000;
const MAX_EMAIL = 255;
const MAX_PHONE = 15;
const MAX_ID_NUMBER = 20;

// =============================================
// AUTH SCHEMAS
// =============================================
export const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ").max(MAX_EMAIL),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
});

export const tenantLoginSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập tên đăng nhập").max(MAX_NAME),
    password: z.string().min(1, "Vui lòng nhập mật khẩu").max(100),
});

export const incidentSchema = z.object({
    title: z.string().min(1, "Vui lòng nhập tiêu đề").max(100),
    description: z.string().min(1, "Vui lòng nhập mô tả chi tiết"),
    images: z.any().optional(), // For now, handle as array of strings or file list in component
});

export const registerSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(MAX_NAME, "Tên quá dài"),
    email: z.string().email("Email không hợp lệ").max(MAX_EMAIL),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email không hợp lệ").max(MAX_EMAIL),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

// =============================================
// PROPERTY SCHEMAS
// =============================================
export const propertySchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên tòa nhà").max(MAX_NAME, "Tên quá dài"),
    address: z.string().min(1, "Vui lòng nhập địa chỉ").max(MAX_ADDRESS, "Địa chỉ quá dài"),
    city: z.string().max(100).optional(),
    notes: z.string().max(MAX_NOTES, "Ghi chú quá dài").optional(),
    electricityRate: z.number().min(0, "Giá điện không hợp lệ").max(100000),
    waterRate: z.number().min(0, "Giá nước không hợp lệ").max(1000000),
    lat: z.number().optional(),
    lng: z.number().optional(),
});

// =============================================
// ROOM SCHEMAS
// =============================================
export const roomSchema = z.object({
    roomNumber: z.string().min(1, "Vui lòng nhập số phòng").max(20, "Số phòng quá dài"),
    floor: z.number().min(1, "Tầng phải từ 1 trở lên").max(200),
    area: z.number().min(0).max(10000).optional(),
    baseRent: z.number().min(0, "Vui lòng nhập giá thuê").max(1000000000),
    deposit: z.number().min(0).max(1000000000).optional(),
    notes: z.string().max(MAX_NOTES, "Ghi chú quá dài").optional(),
});

// =============================================
// TENANT SCHEMAS
// =============================================
// Vietnam phone regex: supports 03x, 05x, 07x, 08x, 09x (10 digits starting with 0)
const vietnamPhoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;

export const tenantSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên khách thuê").max(MAX_NAME, "Tên quá dài"),
    phone: z.string()
        .regex(vietnamPhoneRegex, "Số điện thoại không hợp lệ (VD: 0912345678)"),
    email: z.string().email("Email không hợp lệ").max(MAX_EMAIL).optional().or(z.literal("")),
    idNumber: z.string()
        .regex(/^[0-9]{9}$|^[0-9]{12}$/, "CCCD/CMND phải là 9 hoặc 12 chữ số")
        .optional()
        .or(z.literal("")),
    dateOfBirth: z.string().optional().refine((date) => {
        if (!date) return true;
        return new Date(date) < new Date();
    }, "Ngày sinh không hợp lệ"),
    notes: z.string().max(MAX_NOTES, "Ghi chú quá dài").optional(),
});

// =============================================
// ROOM TENANT ASSIGNMENT
// =============================================
export const assignTenantSchema = z.object({
    tenantId: z.string().min(1, "Vui lòng chọn khách thuê"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().optional(),
});

// =============================================
// METER READING SCHEMAS
// =============================================
export const meterReadingSchema = z.object({
    roomId: z.string().min(1),
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    electricityCurrent: z.number().min(0).max(999999999),
    waterCurrent: z.number().min(0).max(999999999),
});

// =============================================
// BILL SCHEMAS
// =============================================
export const billSchema = z.object({
    roomTenantId: z.string().min(1),
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    baseRent: z.number().min(0).max(1000000000),
    electricityUsage: z.number().min(0).max(999999999),
    electricityAmount: z.number().min(0).max(1000000000),
    waterUsage: z.number().min(0).max(999999999),
    waterAmount: z.number().min(0).max(1000000000),
    extraCharges: z.array(z.object({
        name: z.string().max(100),
        amount: z.number().min(0).max(1000000000),
    })).max(20).optional(),
    discount: z.number().min(0).max(1000000000),
    dueDate: z.string().min(1),
    notes: z.string().max(MAX_NOTES, "Ghi chú quá dài").optional(),
});

// =============================================
// PAYMENT SCHEMAS
// =============================================
export const paymentSchema = z.object({
    billId: z.string().min(1),
    amount: z.number().min(1, "Vui lòng nhập số tiền").max(1000000000),
    method: z.enum(["CASH", "BANK_TRANSFER", "VNPAY", "MOMO"]),
    note: z.string().max(500).optional(),
});

// =============================================
// TYPE EXPORTS
// =============================================
export type LoginInput = z.infer<typeof loginSchema>;
export type TenantLoginInput = z.infer<typeof tenantLoginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type AssignTenantInput = z.infer<typeof assignTenantSchema>;
export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
