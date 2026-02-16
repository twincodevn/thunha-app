"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMeterReadings, upsertMeterReadings } from "@/app/(dashboard)/dashboard/properties/actions";

const meterReadingSchema = z.object({
    roomId: z.string(),
    roomNumber: z.string(),
    electricityPrev: z.coerce.number().min(0),
    electricityCurrent: z.coerce.number().min(0),
    waterPrev: z.coerce.number().min(0),
    waterCurrent: z.coerce.number().min(0),
}).refine((data) => data.electricityCurrent >= data.electricityPrev, {
    message: "Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ",
    path: ["electricityCurrent"],
}).refine((data) => data.waterCurrent >= data.waterPrev, {
    message: "Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ",
    path: ["waterCurrent"],
});

const formSchema = z.object({
    month: z.coerce.number(),
    year: z.coerce.number(),
    readings: z.array(meterReadingSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface MeterBatchFormProps {
    propertyId: string;
    rooms: {
        id: string;
        roomNumber: string;
    }[];
}

export function MeterBatchForm({ propertyId, rooms }: MeterBatchFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            month: currentMonth,
            year: currentYear,
            readings: rooms.map(room => ({
                roomId: room.id,
                roomNumber: room.roomNumber,
                electricityPrev: 0,
                electricityCurrent: 0,
                waterPrev: 0,
                waterCurrent: 0,
            })),
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "readings",
    });

    const selectedMonth = form.watch("month");
    const selectedYear = form.watch("year");

    // Fetch readings when month/year changes
    useEffect(() => {
        async function fetchReadings() {
            setIsFetching(true);
            try {
                const result = await getMeterReadings(propertyId, selectedMonth, selectedYear);

                if (result.error || !result.rooms) {
                    toast.error(result.error || "Không thể tải dữ liệu");
                    return;
                }

                // Map existing data or defaults to form fields
                const newReadings = rooms.map(room => {
                    const roomData = result.rooms.find((r: any) => r.id === room.id);
                    const existing = roomData?.meterReadings?.[0];

                    // If no existing reading for this month, try to find prev month's closing
                    // For now, we'll just rely on what the server returns (which should handle the "prev" logic -- actually we need to implement that in actions if needed, but for now just show 0 or existing)

                    return {
                        roomId: room.id,
                        roomNumber: room.roomNumber,
                        electricityPrev: existing?.electricityPrev ?? 0,
                        electricityCurrent: existing?.electricityCurrent ?? existing?.electricityPrev ?? 0,
                        waterPrev: existing?.waterPrev ?? 0,
                        waterCurrent: existing?.waterCurrent ?? existing?.waterPrev ?? 0,
                    };
                });

                replace(newReadings);
            } catch (error) {
                toast.error("Không thể tải dữ liệu chỉ số điện nước");
            } finally {
                setIsFetching(false);
            }
        }

        fetchReadings();
    }, [selectedMonth, selectedYear, propertyId, rooms, replace]);

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        try {
            await upsertMeterReadings({
                propertyId,
                month: data.month,
                year: data.year,
                readings: data.readings.map(r => ({
                    roomId: r.roomId,
                    electricityNew: r.electricityCurrent,
                    waterNew: r.waterCurrent
                }))
            });
            toast.success("Đã lưu chỉ số điện nước thành công");
            router.refresh();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu dữ liệu");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Tháng</label>
                    <Select
                        value={selectedMonth.toString()}
                        onValueChange={(v) => form.setValue("month", parseInt(v))}
                    >
                        <SelectTrigger className="w-[120px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                    Tháng {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Năm</label>
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => form.setValue("year", parseInt(v))}
                    >
                        <SelectTrigger className="w-[100px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {isFetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-6" />}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Nhập chỉ số</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Phòng</TableHead>
                                    <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">Điện cũ</TableHead>
                                    <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">Điện mới</TableHead>
                                    <TableHead className="text-center bg-blue-50/50 dark:bg-blue-950/10">Nước cũ</TableHead>
                                    <TableHead className="text-center bg-blue-50/50 dark:bg-blue-950/10">Nước mới</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const errorElectric = form.formState.errors.readings?.[index]?.electricityCurrent;
                                    const errorWater = form.formState.errors.readings?.[index]?.waterCurrent;

                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">
                                                {field.roomNumber}
                                            </TableCell>
                                            <TableCell className="bg-yellow-50/50 dark:bg-yellow-950/10 p-2">
                                                <Input
                                                    type="number"
                                                    {...form.register(`readings.${index}.electricityPrev`)}
                                                    className="text-right h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="bg-yellow-50/50 dark:bg-yellow-950/10 p-2">
                                                <Input
                                                    type="number"
                                                    {...form.register(`readings.${index}.electricityCurrent`)}
                                                    className={`text-right h-8 ${errorElectric ? "border-destructive bg-destructive/10" : ""}`}
                                                />
                                            </TableCell>
                                            <TableCell className="bg-blue-50/50 dark:bg-blue-950/10 p-2">
                                                <Input
                                                    type="number"
                                                    {...form.register(`readings.${index}.waterPrev`)}
                                                    className="text-right h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="bg-blue-50/50 dark:bg-blue-950/10 p-2">
                                                <Input
                                                    type="number"
                                                    {...form.register(`readings.${index}.waterCurrent`)}
                                                    className={`text-right h-8 ${errorWater ? "border-destructive bg-destructive/10" : ""}`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isLoading || isFetching}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Lưu chỉ số
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
