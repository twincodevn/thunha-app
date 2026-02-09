import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = resetPasswordSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { token, password } = validated.data;

        // Find user by reset token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({
            message: "Đặt lại mật khẩu thành công",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
