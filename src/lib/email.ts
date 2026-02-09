/**
 * Email Service using Resend
 * 
 * To use this service, add RESEND_API_KEY to your .env file.
 * Get your API key from https://resend.com
 * 
 * For development without Resend, emails are logged to console.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// For production, set FROM_EMAIL in .env after verifying domain on Resend
// For testing, use Resend's free domain: onboarding@resend.dev
const FROM_EMAIL = process.env.FROM_EMAIL || "ThuNhà <onboarding@resend.dev>";
const IS_DEV = process.env.NODE_ENV === "development";

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = FROM_EMAIL } = options;

  // Development mode - log to console
  if (!RESEND_API_KEY || IS_DEV) {
    console.log("\n📧 [DEV EMAIL] ================================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${from}`);
    console.log("HTML Content:");
    console.log(html);
    console.log("================================================\n");

    return { success: true, messageId: "dev-mode" };
  }

  // Production mode - use Resend API
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// =============================================
// EMAIL TEMPLATES
// =============================================

export function passwordResetEmail(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">🏠 ThuNhà</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; text-align: center;">Quản lý nhà trọ thông minh</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="margin-top: 0;">Xin chào ${userName},</h2>
        
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản ThuNhà của mình.</p>
        
        <p>Nhấp vào nút bên dưới để đặt mật khẩu mới:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Đặt lại mật khẩu
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            © 2026 ThuNhà. Tất cả quyền được bảo lưu.
        </p>
    </div>
</body>
</html>
    `.trim();
}

export function billReminderEmail(tenantName: string, amount: number, dueDate: string, paymentUrl: string): string {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">🏠 ThuNhà</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="margin-top: 0;">Xin chào ${tenantName},</h2>
        
        <p>Đây là thông báo nhắc nhở về hóa đơn tiền phòng của bạn.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Số tiền:</strong> <span style="color: #3B82F6; font-size: 1.2em;">${formattedAmount}</span></p>
            <p style="margin: 10px 0 0;"><strong>Hạn thanh toán:</strong> ${dueDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" style="background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Xem hóa đơn
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            Nếu bạn đã thanh toán, vui lòng bỏ qua email này.
        </p>
    </div>
</body>
</html>
    `.trim();
}

// =============================================
// INVOICE EMAIL FUNCTIONS (used by API)
// =============================================

interface InvoiceEmailOptions {
  to: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  month: number;
  year: number;
  total: number;
  dueDate: string;
  invoiceUrl: string;
}

interface PaymentReminderOptions {
  to: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  month: number;
  year: number;
  total: number;
  daysOverdue: number;
  invoiceUrl: string;
}

export async function sendInvoiceEmail(options: InvoiceEmailOptions): Promise<EmailResult> {
  const { to, tenantName, propertyName, roomNumber, month, year, total, dueDate, invoiceUrl } = options;

  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(total);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">🏠 ThuNhà</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="margin-top: 0;">Xin chào ${tenantName},</h2>
        
        <p>Hóa đơn tiền phòng tháng ${month}/${year} của bạn đã sẵn sàng.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Bất động sản:</strong> ${propertyName}</p>
            <p style="margin: 5px 0;"><strong>Phòng:</strong> ${roomNumber}</p>
            <p style="margin: 5px 0;"><strong>Số tiền:</strong> <span style="color: #3B82F6; font-size: 1.2em;">${formattedAmount}</span></p>
            <p style="margin: 5px 0 0;"><strong>Hạn thanh toán:</strong> ${dueDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Xem hóa đơn
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject: `Hóa đơn tiền phòng T${month}/${year} - ${propertyName}`,
    html,
  });
}

export async function sendPaymentReminder(options: PaymentReminderOptions): Promise<EmailResult> {
  const { to, tenantName, propertyName, roomNumber, month, year, total, daysOverdue, invoiceUrl } = options;

  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(total);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">⚠️ Nhắc nhở thanh toán</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="margin-top: 0;">Xin chào ${tenantName},</h2>
        
        <p style="color: #EF4444; font-weight: bold;">Hóa đơn tiền phòng T${month}/${year} đã quá hạn ${daysOverdue} ngày.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p style="margin: 0;"><strong>Bất động sản:</strong> ${propertyName}</p>
            <p style="margin: 5px 0;"><strong>Phòng:</strong> ${roomNumber}</p>
            <p style="margin: 5px 0;"><strong>Số tiền còn nợ:</strong> <span style="color: #EF4444; font-size: 1.2em;">${formattedAmount}</span></p>
        </div>
        
        <p>Vui lòng thanh toán sớm để tránh phát sinh thêm các khoản phí.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Thanh toán ngay
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject: `⚠️ Nhắc nhở: Hóa đơn T${month}/${year} quá hạn - ${propertyName}`,
    html,
  });
}

