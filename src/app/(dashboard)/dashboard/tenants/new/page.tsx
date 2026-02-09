"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { tenantSchema } from "@/lib/validators";
import { toast } from "sonner";
import { z } from "zod";
import { RoomSelect } from "@/components/tenants/room-select";

// Extended schema with room assignment
const createTenantSchema = tenantSchema.extend({
    roomId: z.string().optional(),
    startDate: z.string().optional(),
});

type CreateTenantInput = z.infer<typeof createTenantSchema>;

type Room = {
    id: string;
    roomNumber: string;
    status: string;
    property: { id: string; name: string };
};

export default function NewTenantPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedRoomId = searchParams.get("roomId");

    const [isLoading, setIsLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    const form = useForm<CreateTenantInput>({
        resolver: zodResolver(createTenantSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            idNumber: "",
            dateOfBirth: "",
            notes: "",
            roomId: preselectedRoomId || "",
            startDate: new Date().toISOString().split("T")[0],
        },
    });

    // Fetch vacant rooms
    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch("/api/rooms");
                if (res.ok) {
                    const data = await res.json();
                    // Filter to only show vacant rooms
                    setRooms(data.filter((r: Room) => r.status === "VACANT"));
                }
            } catch (error) {
                console.error("Failed to fetch rooms:", error);
            }
        }
        fetchRooms();
    }, []);

    async function onSubmit(data: CreateTenantInput) {
        setIsLoading(true);
        try {
            // Step 1: Create tenant
            const tenantResponse = await fetch("/api/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    idNumber: data.idNumber,
                    dateOfBirth: data.dateOfBirth,
                    notes: data.notes,
                }),
            });

            const tenant = await tenantResponse.json();

            if (!tenantResponse.ok) {
                toast.error(tenant.error || "Không thể thêm khách thuê");
                return;
            }

            // Step 2: Assign to room if selected
            if (data.roomId && data.startDate) {
                const assignResponse = await fetch(`/api/tenants/${tenant.id}/assign`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId: data.roomId,
                        startDate: data.startDate,
                    }),
                });

                if (!assignResponse.ok) {
                    const error = await assignResponse.json();
                    toast.warning(`Đã tạo khách thuê nhưng chưa gán phòng: ${error.error}`);
                    router.push(`/dashboard/tenants/${tenant.id}`);
                    return;
                }
            }

            toast.success(data.roomId ? "Thêm khách thuê và gán phòng thành công!" : "Thêm khách thuê thành công!");
            router.push(`/dashboard/tenants/${tenant.id}`);
            router.refresh();
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    const selectedRoomId = form.watch("roomId");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tenants">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thêm khách thuê mới</h1>
                    <p className="text-muted-foreground">Nhập thông tin khách thuê</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                            <CardDescription>
                                Thông tin liên hệ và giấy tờ của khách thuê
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ và tên *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Nguyễn Văn An" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số điện thoại *</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="VD: 0901234567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="VD: email@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="idNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số CCCD/CMND</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: 079123456789" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày sinh</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
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
                                                placeholder="Thông tin bổ sung về khách thuê..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gán phòng</CardTitle>
                            <CardDescription>
                                Chọn phòng để gán cho khách thuê ngay (không bắt buộc)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="roomId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phòng trống</FormLabel>
                                        <FormControl>
                                            <RoomSelect
                                                rooms={rooms}
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedRoomId && (
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày bắt đầu thuê *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedRoomId ? "Thêm và gán phòng" : "Thêm khách thuê"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Hủy
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
