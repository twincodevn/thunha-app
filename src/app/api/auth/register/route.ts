import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = registerSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { name, email, password } = validated.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email đã được sử dụng" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                plan: "FREE",
                maxRooms: 3,
            },
            select: {
                id: true,
                name: true,
                email: true,
                plan: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            { message: "Đăng ký thành công", user },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
