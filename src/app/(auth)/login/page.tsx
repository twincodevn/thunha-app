"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, LoginInput } from "@/lib/validators";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { loginAction } from "./actions";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    function onSubmit(data: LoginInput) {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("email", data.email);
            formData.append("password", data.password);

            const result = await loginAction(formData);

            if (result?.error) {
                setError(result.error);
                toast.error(result.error);
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-lg shadow-blue-500/25">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        ThuNhà
                    </h1>
                    <p className="text-muted-foreground mt-1">Quản lý nhà trọ thông minh</p>
                </div>

                <Card className="border-0 shadow-xl shadow-gray-200/50">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
                        <CardDescription className="text-center">
                            Nhập email và mật khẩu để tiếp tục
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Google OAuth Button */}
                        <GoogleLoginButton className="w-full mb-4" />

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Hoặc
                                </span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="ten@email.com"
                                                    autoComplete="email"
                                                    disabled={isPending}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                    disabled={isPending}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                                    disabled={isPending}
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Đăng nhập
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Chưa có tài khoản? </span>
                            <Link
                                href="/register"
                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Đăng ký ngay
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    Bằng việc đăng nhập, bạn đồng ý với{" "}
                    <Link href="/terms" className="underline hover:text-foreground">
                        Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                        Chính sách bảo mật
                    </Link>
                </p>
            </div>
        </div>
    );
}
