
"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Camera, User, Mail, Shield, Phone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { updateProfile } from "../actions";

const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: "Tên phải có ít nhất 2 ký tự.",
    }),
    phone: z.string().optional(),
    image: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    initialData: {
        name: string;
        phone: string;
        image: string;
        email: string;
        plan: string;
    };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: initialData.name || "",
            phone: initialData.phone || "",
            image: initialData.image || "",
        },
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast.error("Ảnh không được quá 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                form.setValue("image", base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const result = await updateProfile(data);
            if (result.error) {
                toast.error(result.error);
            } else {
                await update(); // Update client-side session
                toast.success("Cập nhật hồ sơ thành công");
                router.refresh();
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Ảnh đại diện</CardTitle>
                            <CardDescription>Nhấn vào ảnh để thay đổi avatar của bạn.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Avatar className="h-32 w-32 border-4 border-muted transition-all group-hover:border-primary">
                                                <AvatarImage src={field.value} className="object-cover" />
                                                <AvatarFallback className="text-4xl">
                                                    {initialData.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                        <FormControl>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Thay đổi ảnh
                                        </Button>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                            <CardDescription>Cập nhật tên hiển thị và số điện thoại liên hệ.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <User className="h-4 w-4" /> Tên hiển thị
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên của bạn" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> Số điện thoại
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập số điện thoại" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin tài khoản</CardTitle>
                            <CardDescription>Thông tin đăng nhập và gói dịch vụ (Không thể chỉnh sửa).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" /> Email đăng nhập
                                </FormLabel>
                                <Input value={initialData.email} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <FormLabel className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="h-4 w-4" /> Gói dịch vụ hiện tại
                                </FormLabel>
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <span className="font-medium">{initialData.plan}</span>
                                    <Badge variant={initialData.plan === "BUSINESS" ? "default" : "secondary"}>
                                        {initialData.plan === "FREE" ? "Miễn phí" : "Premium"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </Form>
    );
}
