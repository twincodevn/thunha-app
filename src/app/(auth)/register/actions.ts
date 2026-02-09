"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function registerAction(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const validated = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!validated.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email đã được sử dụng" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Auto sign in
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại." };
        }
        throw error; // Re-throw for NEXT_REDIRECT
    }

    return { success: true };
}
