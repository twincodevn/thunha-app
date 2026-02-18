
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TenantLoginInput, tenantLoginSchema } from "@/lib/validators";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, KeyRound, User } from "lucide-react";
import { PortalLogo } from "@/components/tenant/portal-logo";

export default function TenantLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TenantLoginInput>({
        resolver: zodResolver(tenantLoginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(data: TenantLoginInput) {
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Đăng nhập thất bại", {
                    description: "Sai tên đăng nhập hoặc mật khẩu",
                });
            } else {
                toast.success("Đăng nhập thành công!");
                router.push("/portal/dashboard");
                router.refresh();
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra", {
                description: "Vui lòng thử lại sau",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-slate-900/80 to-purple-900/90"></div>

            {/* Decorative Blobs */}
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl animate-pulse delay-1000"></div>

            <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/10 backdrop-blur-xl relative z-10 mx-4">
                <CardHeader className="space-y-3 text-center pb-8 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-white/10 rounded-2xl ring-1 ring-white/20 shadow-xl backdrop-blur-md">
                            <PortalLogo className="scale-125" showText={false} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-bold text-white tracking-tight">
                            ThuNhà Portal
                        </CardTitle>
                        <CardDescription className="text-slate-300 text-base">
                            Cổng thông tin cư dân thông minh
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-slate-200 font-medium">Tên đăng nhập</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                                                <Input
                                                    placeholder="Nhập tên đăng nhập..."
                                                    disabled={isLoading}
                                                    className="pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400/50 focus:ring-blue-400/20 h-11 transition-all"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <FormLabel className="text-slate-200 font-medium">Mật khẩu</FormLabel>
                                            <button type="button" className="text-xs text-blue-300 hover:text-blue-200 transition-colors">
                                                Quên mật khẩu?
                                            </button>
                                        </div>
                                        <FormControl>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    disabled={isLoading}
                                                    className="pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400/50 focus:ring-blue-400/20 h-11 transition-all"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Đang xác thực...
                                    </>
                                ) : (
                                    "Đăng nhập ngay"
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            Chưa có tài khoản? <span className="text-slate-300">Vui lòng liên hệ chủ nhà để được cấp quyền truy cập.</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="absolute bottom-6 text-center w-full z-10">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold opacity-60">
                    Powered by ThuNha Platform
                </p>
            </div>
        </div>
    );
}
