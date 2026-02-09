"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { propertySchema, PropertyInput } from "@/lib/validators";
import { toast } from "sonner";

export default function NewPropertyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PropertyInput>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: "",
            address: "",
            city: "",
            notes: "",
            electricityRate: 0,
            waterRate: 25000,
        },
    });

    async function onSubmit(data: PropertyInput) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/properties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Không thể tạo tòa nhà");
                return;
            }

            toast.success("Tạo tòa nhà thành công!");
            router.push(`/dashboard/properties/${result.id}`);
            router.refresh();
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/properties">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thêm tòa nhà mới</h1>
                    <p className="text-muted-foreground">Nhập thông tin tòa nhà của bạn</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                    <CardDescription>
                        Cung cấp thông tin về tòa nhà để bắt đầu quản lý
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên tòa nhà *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Nhà trọ Phú Nhuận" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: 123 Phan Xích Long, Quận Phú Nhuận" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thành phố</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: TP. Hồ Chí Minh" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="electricityRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá điện (đ/kWh)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                                            </FormControl>
                                            <FormDescription>
                                                Để 0 để dùng giá bậc thang EVN
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="waterRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá nước (đ/m³)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="25000" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ghi chú</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Thông tin bổ sung về tòa nhà..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tạo tòa nhà
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Hủy
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
