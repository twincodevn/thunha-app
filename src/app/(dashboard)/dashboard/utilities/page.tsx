
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Save, Search, AlertCircle, Zap, Droplets } from "lucide-react";
import { toast } from "sonner";
import { calculateElectricityCost, calculateWaterCost, formatCurrency } from "@/lib/billing";

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
    const [searchTerm, setSearchTerm] = useState("");

    const [roomReadings, setRoomReadings] = useState<RoomReadingData[]>([]);
    const [electricityRate, setElectricityRate] = useState(0);
    const [waterRate, setWaterRate] = useState(0);

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
                setElectricityRate(result.electricityRate || 0);
                setWaterRate(result.waterRate || 0);

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

    const filteredReadings = roomReadings.filter(r =>
        r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'electricity' | 'water') => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = index + 1;
            if (nextIndex < roomReadings.length) { // Use roomReadings.length for total rows
                const nextInput = document.querySelector(`input[name="readings.${nextIndex}.${field}Current"]`) as HTMLInputElement;
                nextInput?.focus();
                nextInput?.select();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = index - 1;
            if (prevIndex >= 0) {
                const prevInput = document.querySelector(`input[name="readings.${prevIndex}.${field}Current"]`) as HTMLInputElement;
                prevInput?.focus();
                prevInput?.select();
            }
        }
    };

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

    const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ghi chỉ số điện nước</h1>
                    <p className="text-muted-foreground">Nhập chỉ số điện nước hàng tháng cho khách thuê</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 p-1.5 rounded-lg border shadow-sm">
                    <Button
                        variant={!isSpreadsheetMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsSpreadsheetMode(false)}
                        className="text-xs"
                    >
                        Chế độ chuẩn
                    </Button>
                    <Button
                        variant={isSpreadsheetMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsSpreadsheetMode(true)}
                        className="text-xs flex items-center gap-1"
                    >
                        <Zap className="w-3 h-3 text-yellow-500" />
                        Bảng Excel (Siêu tốc)
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4 items-end">
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
                                    {Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - 1 + i)).map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tìm phòng</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Số phòng..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Readings Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Danh sách phòng đang thuê
                        {isSpreadsheetMode && (
                            <span className="text-xs font-normal px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                                Đang bật chế độ nhập nhanh
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {isSpreadsheetMode
                            ? "Sử dụng phím Tab hoặc Mũi Tên Lên/Xuống để di chuyển siêu tốc giữa các ô."
                            : 'Chỉ hiển thị các phòng có trạng thái "Đang thuê" (Occupied)'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredReadings.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Không tìm thấy dữ liệu</AlertTitle>
                            <AlertDescription>
                                {searchTerm ? "Không có phòng nào khớp với từ khóa tìm kiếm." : "Không tìm thấy phòng nào đang thuê trong tòa nhà này."}
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
                                            <TableHead className="text-center bg-blue-100/50 dark:bg-blue-900/20">
                                                <span className="flex items-center justify-center gap-1"><Zap className="h-3 w-3" />Ước tính</span>
                                            </TableHead>
                                            <TableHead className="text-center bg-cyan-50/50">Nước (Cũ)</TableHead>
                                            <TableHead className="text-center bg-cyan-50">Nước (Mới)</TableHead>
                                            <TableHead className="text-center bg-cyan-50/50">Sử dụng</TableHead>
                                            <TableHead className="text-center bg-cyan-100/50 dark:bg-cyan-900/20">
                                                <span className="flex items-center justify-center gap-1"><Droplets className="h-3 w-3" />Ước tính</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roomReadings.map((room, index) => {
                                            // Find index in original form data if filtering
                                            const originalIndex = roomReadings.findIndex(r => r.roomId === room.roomId);

                                            // Simple filtering by hiding rows (preserves form indices)
                                            if (!room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                                            // Watch values to calculate usage live
                                            const currentElec = form.watch(`readings.${originalIndex}.electricityCurrent`);
                                            const currentWater = form.watch(`readings.${originalIndex}.waterCurrent`);

                                            // Handle cases where watched value might be undefined initially or NaN
                                            const elecUsage = (currentElec ?? 0) - room.electricityOld;
                                            const waterUsage = (currentWater ?? 0) - room.waterOld;

                                            const isElecInvalid = currentElec < room.electricityOld;
                                            const isWaterInvalid = currentWater < room.waterOld;

                                            // Check for abnormal spikes (Usage > 200% of something? We don't have last month's usage easily here without fetching it. But we can estimate or flag if usage > 200 units as a generic check, OR if we had previous month's usage. Let's do a simple threshold check for "Cô Lan" -> if usage > 300 kWh or > 50m3 water, flag it.)
                                            const isElecSpike = elecUsage > 300;
                                            const isWaterSpike = waterUsage > 50;
                                            const hasSpike = isElecSpike || isWaterSpike;

                                            return (
                                                <React.Fragment key={room.roomId}>
                                                    <TableRow className={isElecInvalid || isWaterInvalid ? "bg-red-50" : (hasSpike ? "bg-yellow-50/50" : "")}>
                                                        <TableCell className="font-medium">
                                                            {room.roomNumber}
                                                            {/* Hidden field for Room ID */}
                                                            <input
                                                                type="hidden"
                                                                {...form.register(`readings.${originalIndex}.roomId`)}
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
                                                                name={`readings.${originalIndex}.electricityCurrent`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                {...field}
                                                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                                                onKeyDown={(e) => handleKeyDown(e, originalIndex, 'electricity')}
                                                                                className={`text-center h-9 ${isElecInvalid ? "border-red-500 focus-visible:ring-red-500" : ""} ${isElecSpike ? "border-yellow-500 focus-visible:ring-yellow-500" : ""} ${isSpreadsheetMode ? "border-transparent bg-transparent hover:bg-white focus:bg-white shadow-none rounded-none w-full" : ""}`}
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className={`text-center font-bold bg-blue-50/30 ${isElecInvalid ? "text-red-500" : (isElecSpike ? "text-yellow-600" : "text-blue-600")}`}>
                                                            {elecUsage} {isElecSpike && <AlertCircle className="inline-block w-3 h-3 ml-1 text-yellow-500" />}
                                                        </TableCell>
                                                        <TableCell className="text-center text-sm font-medium bg-blue-100/20 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300">
                                                            {elecUsage > 0 ? formatCurrency(calculateElectricityCost(elecUsage, electricityRate > 0 ? electricityRate : undefined)) : "-"}
                                                        </TableCell>

                                                        {/* Water */}
                                                        <TableCell className="text-center text-muted-foreground bg-cyan-50/30">
                                                            {room.waterOld}
                                                        </TableCell>
                                                        <TableCell className="bg-cyan-50/50">
                                                            <FormField
                                                                control={form.control}
                                                                name={`readings.${originalIndex}.waterCurrent`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                {...field}
                                                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                                                onKeyDown={(e) => handleKeyDown(e, originalIndex, 'water')}
                                                                                className={`text-center h-9 ${isWaterInvalid ? "border-red-500 focus-visible:ring-red-500" : ""} ${isWaterSpike ? "border-yellow-500 focus-visible:ring-yellow-500" : ""} ${isSpreadsheetMode ? "border-transparent bg-transparent hover:bg-white focus:bg-white shadow-none rounded-none w-full" : ""}`}
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className={`text-center font-bold bg-cyan-50/30 ${isWaterInvalid ? "text-red-500" : (isWaterSpike ? "text-yellow-600" : "text-cyan-600")}`}>
                                                            {waterUsage} {isWaterSpike && <AlertCircle className="inline-block w-3 h-3 ml-1 text-yellow-500" />}
                                                        </TableCell>
                                                        <TableCell className="text-center text-sm font-medium bg-cyan-100/20 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-300">
                                                            {waterUsage > 0 ? formatCurrency(calculateWaterCost(waterUsage, waterRate)) : "-"}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Warning Row for Spikes */}
                                                    {hasSpike && (
                                                        <TableRow className="bg-yellow-50/30 border-b-2 border-yellow-200">
                                                            <TableCell colSpan={9} className="py-2 px-4 shadow-inner">
                                                                <div className="flex items-center gap-2 text-yellow-800 text-xs font-semibold">
                                                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                                    Phát hiện lượng sử dụng ({isElecSpike ? "Điện" : ""}{isElecSpike && isWaterSpike ? " & " : ""}{isWaterSpike ? "Nước" : ""}) đột biến bất thường so với tháng trước. Có thể bạn đã nhập dư số 0?

                                                                    <label className="ml-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-yellow-300 cursor-pointer hover:bg-yellow-50 transition-colors">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    form.clearErrors(`readings.${originalIndex}.roomId` as any); // hacky way to register confirmation
                                                                                } else {
                                                                                    form.setError(`readings.${originalIndex}.roomId` as any, { type: "manual", message: "unconfirmed" });
                                                                                }
                                                                            }}
                                                                            defaultChecked={false}
                                                                        />
                                                                        <span>Tôi xác nhận số này đúng</span>
                                                                    </label>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Validation Summary */}
                                {Object.keys(form.formState.errors).length > 0 && (
                                    <Alert variant="destructive" className="mt-4 bg-red-50 text-red-900 border-red-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Lỗi xác nhận</AlertTitle>
                                        <AlertDescription>
                                            Vui lòng tick chọn "Tôi xác nhận số này đúng" ở các dòng có cảnh báo vàng trước khi lưu!
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSaving || roomReadings.length === 0 || Object.keys(form.formState.errors).length > 0}>
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
