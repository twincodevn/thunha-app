
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Save, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { getUtilityReadings, saveUtilityReadings } from "./actions";

// Schema for a single room's reading
const roomReadingSchema = z.object({
    roomId: z.string(),
    electricityCurrent: z.number().min(0, "Chỉ số điện không hợp lệ"),
    waterCurrent: z.number().min(0, "Chỉ số nước không hợp lệ"),
});

// Schema for the entire form
const formSchema = z.object({
    readings: z.array(roomReadingSchema),
});

type FormData = z.infer<typeof formSchema>;

interface RoomReadingData {
    roomId: string;
    roomNumber: string;
    electricityOld: number;
    waterOld: number;
    electricityNew?: number;
    waterNew?: number;
    electricityUsage?: number;
    waterUsage?: number;
}

export default function UtilityPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Filters
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));

    const [roomReadings, setRoomReadings] = useState<RoomReadingData[]>([]);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            readings: [],
        },
    });

    // Fetch properties on mount
    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/properties");
                if (res.ok) {
                    const data = await res.json();
                    setProperties(data);
                    if (data.length > 0) {
                        setSelectedPropertyId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
                toast.error("Không thể tải danh sách tòa nhà");
            }
        }
        fetchProperties();
    }, []);

    // Fetch readings when filters change
    useEffect(() => {
        if (!selectedPropertyId) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                const result = await getUtilityReadings(
                    selectedPropertyId,
                    parseInt(month),
                    parseInt(year)
                );

                setRoomReadings(result.roomReadings);

                // Reset form with fetched values
                form.reset({
                    readings: result.roomReadings.map(r => ({
                        roomId: r.roomId,
                        electricityCurrent: r.electricityNew ?? r.electricityOld, // Default to old if new not set? Or 0? Let's default to old for convenience or 0
                        waterCurrent: r.waterNew ?? r.waterOld,
                    }))
                });
            } catch (error) {
                console.error("Failed to fetch readings", error);
                toast.error("Không thể tải chỉ số điện nước");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedPropertyId, month, year, form]);

    async function onSubmit(data: FormData) {
        setIsSaving(true);
        try {
            const result = await saveUtilityReadings({
                propertyId: selectedPropertyId,
                month: parseInt(month),
                year: parseInt(year),
                readings: data.readings,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã lưu chỉ số điện nước thành công");
                // Refresh data to update "Previous" values if we moved to next month? 
                // Or just keep current state.
                // Re-fetching might be good to confirm saved state.
                const refreshResult = await getUtilityReadings(
                    selectedPropertyId,
                    parseInt(month),
                    parseInt(year)
                );
                setRoomReadings(refreshResult.roomReadings);
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi lưu");
        } finally {
            setIsSaving(false);
        }
    }

    // Helper to calculate usage live
    const getUsage = (index: number, currentVal: number, oldVal: number) => {
        // const oldVal = roomReadings[index]?.electricityOld || 0;
        return currentVal - oldVal;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ghi chỉ số điện nước</h1>
                <p className="text-muted-foreground">Nhập chỉ số điện nước hàng tháng cho khách thuê</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tòa nhà</label>
                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tòa nhà" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tháng</label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={String(m)}>
                                            Tháng {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Năm</label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["2024", "2025", "2026"].map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Readings Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách phòng đang thuê</CardTitle>
                    <CardDescription>
                        Chỉ hiển thị các phòng có trạng thái "Đang thuê" (Occupied)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : roomReadings.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Không có dữ liệu</AlertTitle>
                            <AlertDescription>
                                Không tìm thấy phòng nào đang thuê trong tòa nhà này.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Phòng</TableHead>
                                            <TableHead className="text-center bg-blue-50/50">Điện (Cũ)</TableHead>
                                            <TableHead className="text-center bg-blue-50">Điện (Mới)</TableHead>
                                            <TableHead className="text-center bg-blue-50/50">Sử dụng</TableHead>
                                            <TableHead className="text-center bg-cyan-50/50">Nước (Cũ)</TableHead>
                                            <TableHead className="text-center bg-cyan-50">Nước (Mới)</TableHead>
                                            <TableHead className="text-center bg-cyan-50/50">Sử dụng</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roomReadings.map((room, index) => {
                                            // Watch values to calculate usage live
                                            const currentElec = form.watch(`readings.${index}.electricityCurrent`);
                                            const currentWater = form.watch(`readings.${index}.waterCurrent`);

                                            // Handle cases where watched value might be undefined initially or NaN
                                            const elecUsage = (currentElec ?? 0) - room.electricityOld;
                                            const waterUsage = (currentWater ?? 0) - room.waterOld;

                                            return (
                                                <TableRow key={room.roomId}>
                                                    <TableCell className="font-medium">
                                                        {room.roomNumber}
                                                        {/* Hidden field for Room ID */}
                                                        <input
                                                            type="hidden"
                                                            {...form.register(`readings.${index}.roomId`)}
                                                            value={room.roomId}
                                                        />
                                                    </TableCell>

                                                    {/* Electricity */}
                                                    <TableCell className="text-center text-muted-foreground bg-blue-50/30">
                                                        {room.electricityOld}
                                                    </TableCell>
                                                    <TableCell className="bg-blue-50/50">
                                                        <FormField
                                                            control={form.control}
                                                            name={`readings.${index}.electricityCurrent`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            {...field}
                                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                                            className="text-center h-9"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-blue-600 bg-blue-50/30">
                                                        {elecUsage > 0 ? elecUsage : 0}
                                                    </TableCell>

                                                    {/* Water */}
                                                    <TableCell className="text-center text-muted-foreground bg-cyan-50/30">
                                                        {room.waterOld}
                                                    </TableCell>
                                                    <TableCell className="bg-cyan-50/50">
                                                        <FormField
                                                            control={form.control}
                                                            name={`readings.${index}.waterCurrent`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            {...field}
                                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                                            className="text-center h-9"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-cyan-600 bg-cyan-50/30">
                                                        {waterUsage > 0 ? waterUsage : 0}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSaving || roomReadings.length === 0}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" />
                                        Lưu chỉ số
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
