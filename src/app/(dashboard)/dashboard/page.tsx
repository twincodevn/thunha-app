import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Receipt, AlertCircle, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCurrentMonthYear } from "@/lib/billing";
import { ROOM_STATUS_LABELS, BILL_STATUS_LABELS } from "@/lib/constants";

async function getDashboardData(userId: string) {
    // getCurrentMonthYear(); // Available for future month filtering

    const [properties, rooms, tenants, pendingBills, recentBills] = await Promise.all([
        prisma.property.count({ where: { userId } }),
        prisma.room.findMany({
            where: { property: { userId } },
            include: { property: true },
        }),
        prisma.tenant.count({ where: { userId } }),
        prisma.bill.count({
            where: {
                roomTenant: { room: { property: { userId } } },
                status: { in: ["PENDING", "OVERDUE"] },
            },
        }),
        prisma.bill.findMany({
            where: { roomTenant: { room: { property: { userId } } } },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
    ]);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
    const vacantRooms = rooms.filter((r) => r.status === "VACANT").length;
    const expectedIncome = rooms
        .filter((r) => r.status === "OCCUPIED")
        .reduce((sum, r) => sum + r.baseRent, 0);

    return {
        properties,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        tenants,
        pendingBills,
        expectedIncome,
        recentBills,
        rooms,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const data = await getDashboardData(session.user.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Xin chào, {session.user.name || "Bạn"}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Đây là tổng quan về hoạt động cho thuê của bạn.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo hóa đơn
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tổng phòng
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalRooms}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.occupiedRooms} đang thuê · {data.vacantRooms} trống
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Khách thuê
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.tenants}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số khách thuê hiện tại
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Doanh thu dự kiến
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.expectedIncome)}</div>
                        <p className="text-xs text-muted-foreground">
                            Tiền thuê tháng này (chưa tính điện nước)
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Chờ thanh toán
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{data.pendingBills}</div>
                        <p className="text-xs text-muted-foreground">
                            Hóa đơn chưa thanh toán
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            {data.properties === 0 && (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Bắt đầu với tòa nhà đầu tiên</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Thêm tòa nhà và phòng để bắt đầu quản lý việc cho thuê của bạn. Bạn có thể thêm tối đa 3 phòng miễn phí!
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/properties/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm tòa nhà đầu tiên
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Bills */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Hóa đơn gần đây</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/billing">
                                Xem tất cả
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data.recentBills.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Chưa có hóa đơn nào
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {data.recentBills.map((bill) => (
                                    <div key={bill.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium">
                                                {bill.roomTenant.room.property.name} - Phòng {bill.roomTenant.room.roomNumber}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {bill.roomTenant.tenant.name} · Tháng {bill.month}/{bill.year}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(bill.total)}</p>
                                            <Badge
                                                variant={
                                                    bill.status === "PAID"
                                                        ? "default"
                                                        : bill.status === "OVERDUE"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className="mt-1"
                                            >
                                                {BILL_STATUS_LABELS[bill.status]}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Room Status */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tình trạng phòng</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/properties">
                                Xem tất cả
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data.rooms.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Chưa có phòng nào
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.rooms.slice(0, 6).map((room) => (
                                    <div key={room.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium">
                                                {room.property.name} - Phòng {room.roomNumber}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(room.baseRent)}/tháng
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                room.status === "OCCUPIED"
                                                    ? "default"
                                                    : room.status === "VACANT"
                                                        ? "outline"
                                                        : "secondary"
                                            }
                                        >
                                            {ROOM_STATUS_LABELS[room.status]}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
