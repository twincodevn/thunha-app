"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            electricityRate: 3500, // Common default
            waterRate: 15000,     // Common default
            lateFee: 0,
            lateFeeType: "FIXED" as any,
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

    async function handleGeocode() {
        const address = form.getValues("address");
        const city = form.getValues("city");

        if (!address) {
            toast.error("Vui lòng nhập địa chỉ trước");
            return;
        }

        const query = `${address}, ${city || ""}`;
        const toastId = toast.loading("Đang lấy tọa độ...");

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                form.setValue("lat", lat);
                form.setValue("lng", lon);
                toast.success("Đã cập nhật tọa độ thành công", { id: toastId });
            } else {
                toast.error("Không tìm thấy tọa độ cho địa chỉ này", { id: toastId });
            }
        } catch (error) {
            toast.error("Lỗi khi lấy tọa độ", { id: toastId });
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

                            <div className="grid gap-4 sm:grid-cols-2 items-start">
                                <FormField
                                    control={form.control}
                                    name="electricityRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá điện (đ/kWh)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                />
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
                                                <Input
                                                    type="number"
                                                    placeholder="25000"
                                                    {...field}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 items-start">
                                <FormField
                                    control={form.control}
                                    name="lateFee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phí phạt trễ hạn</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                />
                                            </FormControl>
                                            <FormDescription>Bỏ trống hoặc 0 để không áp dụng</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lateFeeType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại phí phạt</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại phí" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FIXED">Số tiền cố định (VNĐ/ngày)</SelectItem>
                                                    <SelectItem value="PERCENTAGE">Phần trăm (% trên Tổng HĐ/ngày)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-base">Tọa độ bản đồ</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGeocode}
                                        className="h-8"
                                    >
                                        <MapPin className="mr-2 h-3 w-3" />
                                        Lấy tọa độ từ địa chỉ
                                    </Button>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 items-start">
                                    <FormField
                                        control={form.control}
                                        name="lat"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vĩ độ (Latitude)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="10.762622"
                                                        {...field}
                                                        step="any"
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="lng"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kinh độ (Longitude)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="106.660172"
                                                        {...field}
                                                        step="any"
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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
