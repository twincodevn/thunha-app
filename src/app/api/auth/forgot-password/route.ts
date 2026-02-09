import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = forgotPasswordSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Email không hợp lệ" },
                { status: 400 }
            );
        }

        const { email } = validated.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu",
            });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // TODO: Send email with reset link
        // For now, log the reset URL (REMOVE IN PRODUCTION)
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
        console.log("[DEV] Password reset URL:", resetUrl);

        // In production, integrate with email service:
        // await sendEmail({
        //     to: email,
        //     subject: "Đặt lại mật khẩu - ThuNhà",
        //     html: `<p>Click vào link để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p>`,
        // });

        return NextResponse.json({
            message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
