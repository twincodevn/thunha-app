"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, User, Phone, Mail, Calendar, Home, Search as SearchIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { tenantSchema } from "@/lib/validators";
import { toast } from "sonner";
import { z } from "zod";
import { RoomSelect } from "@/components/tenants/room-select";
import { searchTenants, assignTenantToRoom } from "../actions";

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

    const [mode, setMode] = useState<"create" | "existing">("create");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);

    // Watch roomId for both modes (though mainly used in Create mode logic or display)
    const selectedRoomId = form.watch("roomId");

    const handleSearch = async (value: string) => {
        setSearchQuery(value);
        if (value.length >= 2) {
            const results = await searchTenants(value);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleAssignExisting = async () => {
        if (!selectedTenant) return;
        // If roomId is not selected in form, we might need to handle it.
        // In existing mode, we use form.watch('roomId') to get the value.
        const roomIdToAssign = form.getValues("roomId") || selectedRoomId;

        if (!roomIdToAssign) {
            toast.error("Vui lòng chọn phòng");
            return;
        }

        setIsLoading(true);
        try {
            await assignTenantToRoom(selectedTenant.id, roomIdToAssign, assignDate);
            toast.success("Đã thêm khách vào phòng thành công!");
            router.push(`/dashboard/tenants/${selectedTenant.id}`);
            router.refresh();
        } catch (error) {
            toast.error("Lỗi khi gán phòng");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tenants">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thêm thành viên</h1>
                    <p className="text-muted-foreground">Quản lý hồ sơ khách thuê</p>
                </div>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "create" | "existing")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="create">Tạo khách mới</TabsTrigger>
                    <TabsTrigger value="existing">Chọn khách cũ</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tìm kiếm khách thuê</CardTitle>
                            <CardDescription>Nhập tên hoặc số điện thoại để tìm khách đã có trên hệ thống</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Search Input */}
                            <div className="relative z-50">
                                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Nhập tên, SĐT hoặc email..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && !selectedTenant && (
                                    <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {searchResults.map(tenant => (
                                            <div
                                                key={tenant.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex items-center justify-between"
                                                onClick={() => {
                                                    setSelectedTenant(tenant);
                                                    setSearchQuery(tenant.name);
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <div>
                                                    <div className="font-medium">{tenant.name}</div>
                                                    <div className="text-sm text-muted-foreground">{tenant.phone}</div>
                                                </div>
                                                {tenant.currentRoom && (
                                                    <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                                        {tenant.currentRoom}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Tenant Preview */}
                            {selectedTenant && (
                                <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {selectedTenant.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="font-semibold text-lg">{selectedTenant.name}</div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedTenant.phone}</div>
                                                <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedTenant.email || "Chưa có email"}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(null)} className="h-8">Change</Button>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                <Home className="h-4 w-4" /> Phòng gán
                                            </span>
                                            <RoomSelect
                                                rooms={rooms}
                                                value={form.watch("roomId") || ""}
                                                onChange={(val) => form.setValue("roomId", val)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Ngày bắt đầu
                                            </span>
                                            <Input
                                                type="date"
                                                value={assignDate}
                                                onChange={(e) => setAssignDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-2"
                                        size="lg"
                                        disabled={isLoading || !form.watch("roomId")}
                                        onClick={handleAssignExisting}
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                        Xác nhận thêm vào phòng
                                    </Button>
                                </div>
                            )}

                            {!selectedTenant && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Tìm kiếm khách thuê để bắt đầu gán phòng
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="create" className="mt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-6">
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
                                </div>

                                <div className="space-y-6">
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

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {selectedRoomId ? "Thêm và gán phòng" : "Thêm khách thuê"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => router.back()}>
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </div>
    );
}
