"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/validators";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: token || "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: ResetPasswordInput) {
        if (!token) {
            toast.error("Link đặt lại mật khẩu không hợp lệ");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, token }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Không thể đặt lại mật khẩu");
                return;
            }

            setIsSuccess(true);
            toast.success("Đặt lại mật khẩu thành công!");
            setTimeout(() => router.push("/login"), 2000);
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <Card className="border-0 shadow-xl shadow-gray-200/50">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <p className="text-red-600">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
                        <Button asChild>
                            <Link href="/forgot-password">Yêu cầu link mới</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl shadow-gray-200/50">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
                <CardDescription className="text-center">
                    {isSuccess ? "Mật khẩu đã được đặt lại" : "Nhập mật khẩu mới của bạn"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <p className="text-muted-foreground">Đang chuyển hướng đến trang đăng nhập...</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mật khẩu mới</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Xác nhận mật khẩu</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Đặt lại mật khẩu
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
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
                </div>

                <Suspense fallback={<div className="text-center">Đang tải...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
