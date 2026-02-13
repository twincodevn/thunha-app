
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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

import { updateProfile } from "../actions";

const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: "Tên phải có ít nhất 2 ký tự.",
    }),
    phone: z.string().optional(),
    image: z.string().url({ message: "URL ảnh không hợp lệ" }).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    initialData: {
        name: string;
        phone: string;
        image: string;
    };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: initialData.name || "",
            phone: initialData.phone || "",
            image: initialData.image || "",
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const result = await updateProfile(data);
            if (result.error) {
                toast.error(result.error);
            } else {
                await update(); // Update client-side session just in case
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
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Avatar URL</FormLabel>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={field.value} />
                                    <AvatarFallback>{initialData.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <FormControl>
                                    <Input placeholder="https://example.com/avatar.jpg" {...field} />
                                </FormControl>
                            </div>
                            <FormDescription>
                                Nhập URL ảnh đại diện của bạn.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên hiển thị</FormLabel>
                            <FormControl>
                                <Input placeholder="Tên của bạn" {...field} />
                            </FormControl>
                            <FormDescription>
                                Tên này sẽ hiển thị trên hóa đơn và trang quản lý.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                                <Input placeholder="0912345678" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật hồ sơ
                </Button>
            </form>
        </Form>
    );
}
