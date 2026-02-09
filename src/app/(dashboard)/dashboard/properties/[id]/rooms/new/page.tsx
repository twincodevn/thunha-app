"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { roomSchema, RoomInput } from "@/lib/validators";
import { toast } from "sonner";

export default function NewRoomPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RoomInput>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            roomNumber: "",
            floor: 1,
            area: undefined,
            baseRent: 0,
            deposit: undefined,
            notes: "",
        },
    });

    async function onSubmit(data: RoomInput) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, propertyId }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Không thể tạo phòng");
                return;
            }

            toast.success("Tạo phòng thành công!");
            router.push(`/dashboard/properties/${propertyId}`);
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
                    <Link href={`/dashboard/properties/${propertyId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thêm phòng mới</h1>
                    <p className="text-muted-foreground">Nhập thông tin phòng cho thuê</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Thông tin phòng</CardTitle>
                    <CardDescription>
                        Cung cấp thông tin cơ bản về phòng để bắt đầu quản lý
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="roomNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số phòng *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: 101, A1, P.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="floor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tầng</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 1)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="area"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Diện tích (m²)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} step={0.1} placeholder="VD: 20" {...field} onChange={(e) => field.onChange(e.target.value ? e.target.valueAsNumber : undefined)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="baseRent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá thuê/tháng (VNĐ) *</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} step={100000} placeholder="VD: 3000000" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="deposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} step={100000} placeholder="VD: 3000000" {...field} onChange={(e) => field.onChange(e.target.value ? e.target.valueAsNumber : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ghi chú</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Thông tin bổ sung về phòng (có máy lạnh, ban công, v.v.)"
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
                                    Tạo phòng
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
