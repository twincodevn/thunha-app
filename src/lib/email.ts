import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email not sent.");
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const data = await resend.emails.send({
      from: "ThuNha <onboarding@resend.dev>", // Default for testing, user should update
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

interface InvoiceEmailProps {
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

export async function sendInvoiceEmail({
  to,
  tenantName,
  propertyName,
  roomNumber,
  month,
  year,
  total,
  dueDate,
  invoiceUrl,
}: InvoiceEmailProps) {
  const totalStr = total.toLocaleString("vi-VN");
  const html = `
        <h2>Thông báo hóa đơn - ${propertyName}</h2>
        <p>Xin chào ${tenantName},</p>
        <p>Đã có hóa đơn tiền nhà tháng ${month}/${year} cho phòng ${roomNumber}.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tổng cộng:</strong> ${totalStr} đ</p>
            <p style="margin: 5px 0;"><strong>Hạn thanh toán:</strong> ${dueDate}</p>
        </div>
        <p>Bạn có thể xem chi tiết hóa đơn tại đường dẫn sau:</p>
        <p><a href="${invoiceUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Xem Chi Tiết Hóa Đơn</a></p>
        <p>Hoặc truy cập: <a href="${invoiceUrl}">${invoiceUrl}</a></p>
        <p>Trân trọng,<br>Ban quản lý ${propertyName}</p>
    `;

  return sendEmail({
    to,
    subject: `[Thông báo] Hóa đơn tiền nhà T${month}/${year} - Phòng ${roomNumber}`,
    html,
  });
}

interface PaymentReminderProps {
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

export async function sendPaymentReminder({
  to,
  tenantName,
  propertyName,
  roomNumber,
  month,
  year,
  total,
  daysOverdue,
  invoiceUrl,
}: PaymentReminderProps) {
  const totalStr = total.toLocaleString("vi-VN");
  const html = `
        <h2 style="color: #ea580c;">Nhắc nhở thanh toán - ${propertyName}</h2>
        <p>Xin chào ${tenantName},</p>
        <p>Đây là thông báo nhắc nhở về hóa đơn tiền nhà tháng ${month}/${year} cho phòng ${roomNumber}.</p>
        <p>Hóa đơn đã <strong>quá hạn ${daysOverdue} ngày</strong>.</p>
        <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
            <p style="margin: 5px 0;"><strong>Tổng cộng:</strong> ${totalStr} đ</p>
        </div>
        <p>Vui lòng thanh toán ngay để tránh gián đoạn dịch vụ.</p>
        <p><a href="${invoiceUrl}" style="background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Thanh Toán Ngay</a></p>
        <p>Trân trọng,<br>Ban quản lý ${propertyName}</p>
    `;

  return sendEmail({
    to,
    subject: `[QUÁ HẠN] Nhắc nhở thanh toán hóa đơn T${month}/${year} - Phòng ${roomNumber}`,
    html,
  });
}
