
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
import { ArrowLeft, Loader2, Send } from "lucide-react";
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
                            <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-400 text-sm bg-gray-50">
                                Tính năng tải ảnh đang được phát triển
                            </div>

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
