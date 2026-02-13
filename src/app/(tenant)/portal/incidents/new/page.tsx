
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { incidentSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Send, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createIncident } from "../actions";

export default function NewIncidentPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof incidentSchema>>({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            title: "",
            description: "",
            images: [],
        },
    });

    function onSubmit(data: z.infer<typeof incidentSchema>) {
        startTransition(async () => {
            const result = await createIncident(data);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã gửi yêu cầu thành công");
                // Redirect is handled in server action
            }
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/portal/incidents" className="p-2 bg-white rounded-full shadow-sm">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Báo sự cố mới</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin sự cố</CardTitle>
                    <CardDescription>
                        Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tiêu đề</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Hỏng bóng đèn, Rò rỉ nước..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả chi tiết</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Mô tả vị trí, tình trạng..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Image upload placeholder */}
                            <FormField
                                control={form.control}
                                name="images"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hình ảnh đính kèm</FormLabel>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-4">
                                                {field.value?.map((image: string, index: number) => (
                                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={image} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newImages = [...field.value];
                                                                newImages.splice(index, 1);
                                                                field.onChange(newImages);
                                                            }}
                                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                    <ImagePlus className="h-6 w-6 text-gray-400 mb-1" />
                                                    <span className="text-xs text-gray-400">Thêm ảnh</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const files = e.target.files;
                                                            if (files) {
                                                                Array.from(files).forEach((file) => {
                                                                    // Compress image before adding
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        const img = new Image();
                                                                        img.onload = () => {
                                                                            const canvas = document.createElement('canvas');
                                                                            const MAX_WIDTH = 800;
                                                                            const MAX_HEIGHT = 800;
                                                                            let width = img.width;
                                                                            let height = img.height;

                                                                            if (width > height) {
                                                                                if (width > MAX_WIDTH) {
                                                                                    height *= MAX_WIDTH / width;
                                                                                    width = MAX_WIDTH;
                                                                                }
                                                                            } else {
                                                                                if (height > MAX_HEIGHT) {
                                                                                    width *= MAX_HEIGHT / height;
                                                                                    height = MAX_HEIGHT;
                                                                                }
                                                                            }
                                                                            canvas.width = width;
                                                                            canvas.height = height;
                                                                            const ctx = canvas.getContext('2d');
                                                                            ctx?.drawImage(img, 0, 0, width, height);
                                                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                                                                            const currentImages = field.value || [];
                                                                            if (currentImages.length < 3) {
                                                                                field.onChange([...currentImages, dataUrl]);
                                                                            } else {
                                                                                toast.error("Tối đa 3 ảnh");
                                                                            }
                                                                        };
                                                                        img.src = event.target?.result as string;
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <FormDescription>
                                                Tải lên tối đa 3 ảnh mô tả sự cố (JPG, PNG).
                                            </FormDescription>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Gửi yêu cầu
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
