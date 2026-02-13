"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePropertyServices } from "@/app/(dashboard)/dashboard/properties/actions";

const serviceSchema = z.object({
    name: z.string().min(1, "Tên dịch vụ không được để trống"),
    price: z.coerce.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
});

const formSchema = z.object({
    services: z.array(serviceSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceSettingsFormProps {
    propertyId: string;
    initialServices: { name: string; price: number }[];
}

export function ServiceSettingsForm({ propertyId, initialServices }: ServiceSettingsFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            services: initialServices.length > 0 ? initialServices : [{ name: "", price: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "services",
    });

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        try {
            await updatePropertyServices(propertyId, data.services);
            toast.success("Đã cập nhật dịch vụ thành công");
            router.refresh();
        } catch (error) {
            toast.error("Lỗi khi cập nhật dịch vụ");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình dịch vụ</CardTitle>
                <CardDescription>
                    Thiết lập các dịch vụ mặc định cho tòa nhà (Internet, rác, vệ sinh...).
                    Các dịch vụ này sẽ tự động hiển thị khi tạo hóa đơn mới.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>Tên dịch vụ</Label>
                                <Input
                                    placeholder="VD: Internet, Vệ sinh"
                                    {...form.register(`services.${index}.name`)}
                                />
                                {form.formState.errors.services?.[index]?.name && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.services[index]?.name?.message}
                                    </p>
                                )}
                            </div>
                            <div className="w-[150px] space-y-2">
                                <Label className={index !== 0 ? "sr-only" : ""}>Đơn giá (đ)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...form.register(`services.${index}.price`)}
                                />
                                {form.formState.errors.services?.[index]?.price && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.services[index]?.price?.message}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="mb-[2px]"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: "", price: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm dịch vụ
                        </Button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Lưu cấu hình
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
