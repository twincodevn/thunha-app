
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
import { Loader2, Building2 } from "lucide-react";

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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <Building2 className="h-7 w-7" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-blue-900">
                        Cổng Cư Dân
                    </CardTitle>
                    <CardDescription>
                        Đăng nhập để xem hóa đơn và dịch vụ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên đăng nhập</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Nhập tên đăng nhập được cấp"
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mật khẩu</FormLabel>
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
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Đăng nhập"
                                )}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-4 text-center text-sm text-gray-500">
                        Quên mật khẩu? Vui lòng liên hệ chủ nhà.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
