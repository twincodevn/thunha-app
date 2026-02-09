import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoomTenantSelect } from "@/components/billing/room-tenant-select";
import { revalidatePath } from "next/cache";
import { calculateElectricityCost, calculateWaterCost } from "@/lib/billing";

// Type for room tenant with includes
type RoomTenantWithDetails = {
    id: string;
    roomId: string;
    room: {
        id: string;
        roomNumber: string;
        baseRent: number;
        property: {
            id: string;
            name: string;
            userId: string;
            electricityRate: number;
            waterRate: number;
        };
    };
    tenant: {
        id: string;
        name: string;
    };
};

async function getActiveRoomTenants(userId: string): Promise<RoomTenantWithDetails[]> {
    return prisma.roomTenant.findMany({
        where: {
            isActive: true,
            room: { property: { userId } },
        },
        include: {
            room: { include: { property: true } },
            tenant: true,
        },
    });
}

async function createBill(formData: FormData) {
    "use server";

    // FIX #1: Wrap everything in try/catch for proper error handling
    try {
        const session = await auth();
        if (!session?.user) {
            redirect("/auth/login");
        }

        const roomTenantId = formData.get("roomTenantId") as string;
        const month = parseInt(formData.get("month") as string);
        const year = parseInt(formData.get("year") as string);
        const electricityPrev = parseFloat(formData.get("electricityPrev") as string) || 0;
        const electricityCurrent = parseFloat(formData.get("electricityCurrent") as string) || 0;
        const waterPrev = parseFloat(formData.get("waterPrev") as string) || 0;
        const waterCurrent = parseFloat(formData.get("waterCurrent") as string) || 0;
        const discount = parseFloat(formData.get("discount") as string) || 0;
        const dueDate = formData.get("dueDate") as string;
        const notes = formData.get("notes") as string;

        // Basic validation
        if (!roomTenantId || !month || !year || !dueDate) {
            redirect("/dashboard/billing/new?error=missing_fields");
        }

        // FIX #2: Verify ownership - join through room -> property -> user
        const roomTenant = await prisma.roomTenant.findFirst({
            where: {
                id: roomTenantId,
                room: { property: { userId: session.user.id } }, // SECURITY: ownership check
            },
            include: { room: { include: { property: true } } },
        });

        if (!roomTenant) {
            redirect("/dashboard/billing/new?error=unauthorized");
        }

        // FIX #3: Check if bill already exists for this roomTenant + month + year
        const existingBill = await prisma.bill.findFirst({
            where: { roomTenantId, month, year },
        });

        if (existingBill) {
            // Bill already exists - redirect with error
            redirect(`/dashboard/billing/new?error=duplicate&billId=${existingBill.id}`);
        }

        const electricityUsage = electricityCurrent - electricityPrev;
        const waterUsage = waterCurrent - waterPrev;

        // Validate meter readings
        if (electricityUsage < 0 || waterUsage < 0) {
            redirect("/dashboard/billing/new?error=invalid_meter");
        }

        const electricityRate = roomTenant.room.property.electricityRate;
        const waterRate = roomTenant.room.property.waterRate;

        const electricityAmount = electricityRate > 0
            ? electricityUsage * electricityRate
            : calculateElectricityCost(electricityUsage);
        const waterAmount = calculateWaterCost(waterUsage, waterRate || 25000);

        const baseRent = roomTenant.room.baseRent;
        const total = baseRent + electricityAmount + waterAmount - discount;

        // Create meter reading (upsert handles duplicate)
        const meterReading = await prisma.meterReading.upsert({
            where: {
                roomId_month_year: {
                    roomId: roomTenant.roomId,
                    month,
                    year,
                },
            },
            update: {
                electricityPrev,
                electricityCurrent,
                electricityUsage,
                waterPrev,
                waterCurrent,
                waterUsage,
            },
            create: {
                roomId: roomTenant.roomId,
                month,
                year,
                electricityPrev,
                electricityCurrent,
                electricityUsage,
                waterPrev,
                waterCurrent,
                waterUsage,
            },
        });

        // Create bill (now safe - we checked for duplicates above)
        await prisma.bill.create({
            data: {
                roomTenantId,
                meterReadingId: meterReading.id,
                month,
                year,
                baseRent,
                electricityUsage,
                electricityAmount,
                waterUsage,
                waterAmount,
                discount,
                total,
                dueDate: new Date(dueDate),
                status: "PENDING",
                notes: notes || null,
            },
        });

        revalidatePath("/dashboard/billing");
        redirect("/dashboard/billing?success=bill_created");
    } catch (error) {
        // Re-throw redirect errors (they're not actual errors)
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }
        console.error("Error creating bill:", error);
        redirect("/dashboard/billing/new?error=server_error");
    }
}

export default async function NewBillPage() {
    const session = await auth();
    if (!session?.user) return null;

    const roomTenants = await getActiveRoomTenants(session.user.id);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Default due date: 10th of next month
    const defaultDueDate = new Date(currentYear, currentMonth, 10);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/billing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tạo hóa đơn mới</h1>
                    <p className="text-muted-foreground">Nhập chỉ số điện nước để tạo hóa đơn</p>
                </div>
            </div>

            {roomTenants.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-muted-foreground mb-4">
                            Chưa có phòng nào đang cho thuê
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/properties">Quản lý phòng</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin hóa đơn</CardTitle>
                        <CardDescription>Chọn phòng và nhập chỉ số công tơ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createBill} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Phòng *</Label>
                                    <RoomTenantSelect roomTenants={roomTenants} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="month">Tháng *</Label>
                                        <Input
                                            id="month"
                                            name="month"
                                            type="number"
                                            min={1}
                                            max={12}
                                            defaultValue={currentMonth}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Năm *</Label>
                                        <Input
                                            id="year"
                                            name="year"
                                            type="number"
                                            min={2020}
                                            defaultValue={currentYear}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                    <h3 className="font-medium text-yellow-800">⚡ Chỉ số điện</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="electricityPrev">Chỉ số cũ</Label>
                                            <Input
                                                id="electricityPrev"
                                                name="electricityPrev"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="electricityCurrent">Chỉ số mới</Label>
                                            <Input
                                                id="electricityCurrent"
                                                name="electricityCurrent"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                    <h3 className="font-medium text-blue-800">💧 Chỉ số nước</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="waterPrev">Chỉ số cũ</Label>
                                            <Input
                                                id="waterPrev"
                                                name="waterPrev"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="waterCurrent">Chỉ số mới</Label>
                                            <Input
                                                id="waterCurrent"
                                                name="waterCurrent"
                                                type="number"
                                                min={0}
                                                defaultValue={0}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Giảm giá (đ)</Label>
                                    <Input
                                        id="discount"
                                        name="discount"
                                        type="number"
                                        min={0}
                                        defaultValue={0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Hạn thanh toán *</Label>
                                    <Input
                                        id="dueDate"
                                        name="dueDate"
                                        type="date"
                                        defaultValue={defaultDueDate.toISOString().split("T")[0]}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú</Label>
                                <Textarea id="notes" name="notes" rows={3} />
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit">Tạo hóa đơn</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/dashboard/billing">Hủy</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
