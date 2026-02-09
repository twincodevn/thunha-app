"use server";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validated = loginSchema.safeParse({ email, password });
    if (!validated.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Email hoặc mật khẩu không đúng" };
                default:
                    return { error: "Đã xảy ra lỗi xác thực" };
            }
        }
        throw error; // Re-throw for NEXT_REDIRECT
    }

    return { success: true };
}
