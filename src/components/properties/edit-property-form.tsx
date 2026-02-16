"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { propertySchema, PropertyInput } from "@/lib/validators";
import { toast } from "sonner";
import { updatePropertyAction } from "@/app/(dashboard)/dashboard/properties/actions";

interface EditPropertyFormProps {
    property: any; // Using any for simplicity with Prisma types, should be typed properly
}

export function EditPropertyForm({ property }: EditPropertyFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PropertyInput & { id: string }>({
        resolver: zodResolver(propertySchema.extend({ id: z.string().min(1) })),
        defaultValues: {
            id: property.id,
            name: property.name,
            address: property.address,
            city: property.city || "",
            notes: property.notes || "",
            electricityRate: property.electricityRate,
            waterRate: property.waterRate,
            lat: property.lat,
            lng: property.lng,
        },
    });

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

    async function onSubmit(data: PropertyInput & { id?: string }) {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("id", property.id); // Use id from props to be safe
            formData.append("name", data.name);
            formData.append("address", data.address);
            if (data.city) formData.append("city", data.city);
            if (data.notes) formData.append("notes", data.notes);
            formData.append("electricityRate", data.electricityRate.toString());
            formData.append("waterRate", data.waterRate.toString());
            if (data.lat) formData.append("lat", data.lat.toString());
            if (data.lng) formData.append("lng", data.lng.toString());

            const result = await updatePropertyAction(formData);

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Cập nhật tòa nhà thành công");
                // The server action handles redirect, but we can also refresh
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi cập nhật");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("id")} />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên tòa nhà *</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                    <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Địa chỉ *</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="electricityRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giá điện (đ/kWh)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormDescription>Để 0 để dùng giá bậc thang EVN</FormDescription>
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
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">Tọa độ bản đồ</FormLabel>
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
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="lat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vĩ độ (Latitude)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            {...field}
                                            value={field.value || ""}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            placeholder="10.762622"
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
                                            step="any"
                                            {...field}
                                            value={field.value || ""}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            placeholder="106.660172"
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
                                    {...field}
                                    value={field.value || ""}
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href={`/dashboard/properties/${property.id}`}>Hủy</Link>
                    </Button>
                </div>
            </form>
        </Form>
    );
}
