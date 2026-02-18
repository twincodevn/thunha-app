"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { roomSchema } from "@/lib/validators";
import { toast } from "sonner";
import { updateRoomAction } from "@/app/(dashboard)/dashboard/properties/[id]/rooms/room-actions";
import { Card, CardContent } from "@/components/ui/card";

interface EditRoomFormProps {
    propertyId: string;
    room: any; // Prisma type
}

// Extend schema for form usage if needed, though roomSchema should be enough
const formSchema = roomSchema.extend({
    id: z.string(),
    images: z.array(z.object({ value: z.string().url("Link ảnh không hợp lệ") })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditRoomForm({ propertyId, room }: EditRoomFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Transform initial images array to object array for useFieldArray
    const initialImages = room.images?.map((img: string) => ({ value: img })) || [];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: room.id,
            roomNumber: room.roomNumber,
            floor: room.floor,
            area: room.area || undefined,
            baseRent: room.baseRent,
            deposit: room.deposit || undefined,
            notes: room.notes || "",
            images: initialImages,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "images" as any, // Cast because zod schema inference with simple array vs object array
    });

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("id", room.id);
            formData.append("propertyId", propertyId);
            formData.append("roomNumber", data.roomNumber);
            formData.append("floor", data.floor.toString());
            if (data.area) formData.append("area", data.area.toString());
            formData.append("baseRent", data.baseRent.toString());
            if (data.deposit) formData.append("deposit", data.deposit.toString());
            if (data.notes) formData.append("notes", data.notes);

            // Extract image URLs from object array
            if (data.images && data.images.length > 0) {
                data.images.forEach((img: any) => {
                    if (img.value) formData.append("images", img.value);
                });
            }

            const result = await updateRoomAction(formData);

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Cập nhật phòng thành công");
                router.push(`/dashboard/properties/${propertyId}/rooms/${room.id}`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi cập nhật");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="roomNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số phòng *</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                <FormLabel>Tầng *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Diện tích (m²)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                    />
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
                                <FormLabel>Giá thuê (đ/tháng) *</FormLabel>
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

                <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tiền cọc (đ)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <FormLabel>Hình ảnh (Link URL)</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ value: "" })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm ảnh
                        </Button>
                    </div>

                    {fields.length === 0 && (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                            Chưa có hình ảnh. Thêm link ảnh để hiển thị trên Listing.
                        </div>
                    )}

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2">
                                <FormField
                                    control={form.control}
                                    name={`images.${index}.value` as any}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input {...field} placeholder="https://example.com/image.jpg" />
                                                    {field.value && (
                                                        <div className="h-10 w-10 relative shrink-0 overflow-hidden rounded-md border">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={field.value}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                                <Textarea {...field} rows={3} />
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
                        <Link href={`/dashboard/properties/${propertyId}/rooms/${room.id}`}>Hủy</Link>
                    </Button>
                </div>
            </form>
        </Form>
    );
}
