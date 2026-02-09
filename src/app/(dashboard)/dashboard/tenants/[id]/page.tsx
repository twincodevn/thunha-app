import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Home, Receipt, Phone, Mail, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/billing";
import { CheckoutButton } from "@/components/tenants/checkout-button";

async function getTenant(id: string, userId: string) {
    return prisma.tenant.findFirst({
        where: { id, userId },
        include: {
            roomTenants: {
                include: {
                    room: { include: { property: true } },
                    bills: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                },
                orderBy: { startDate: "desc" },
            },
        },
    });
}

export default async function TenantDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const tenant = await getTenant(id, session.user.id);

    if (!tenant) notFound();

    // Type from Prisma query result
    type RoomTenantWithBills = typeof tenant.roomTenants[number];

    const activeRoomTenant = tenant.roomTenants.find((rt: RoomTenantWithBills) => rt.isActive);
    const totalBills = tenant.roomTenants.reduce((sum: number, rt: RoomTenantWithBills) => sum + rt.bills.length, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tenants">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                    <p className="text-muted-foreground">Thông tin khách thuê</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/tenants/${id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin liên hệ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                        <p className="font-medium">{tenant.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{tenant.email || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">CCCD/CMND</p>
                                        <p className="font-medium">{tenant.idNumber || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày sinh</p>
                                        <p className="font-medium">
                                            {tenant.dateOfBirth
                                                ? new Date(tenant.dateOfBirth).toLocaleDateString("vi-VN")
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {tenant.notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Ghi chú</p>
                                        <p className="text-sm">{tenant.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Room History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch sử thuê phòng</CardTitle>
                            <CardDescription>Các phòng đã và đang thuê</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tenant.roomTenants.length > 0 ? (
                                <div className="space-y-4">
                                    {tenant.roomTenants.map((rt: RoomTenantWithBills) => (
                                        <div
                                            key={rt.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${rt.isActive ? "bg-green-50 border-green-200" : "bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Home className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">
                                                        {rt.room.property.name} - Phòng {rt.room.roomNumber}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(rt.startDate).toLocaleDateString("vi-VN")}
                                                        {rt.endDate && ` → ${new Date(rt.endDate).toLocaleDateString("vi-VN")}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={rt.isActive ? "default" : "secondary"}>
                                                    {rt.isActive ? "Đang thuê" : "Đã trả"}
                                                </Badge>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/properties/${rt.room.propertyId}/rooms/${rt.roomId}`}>
                                                        Xem phòng
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    Chưa có lịch sử thuê phòng
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Current Room */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Phòng hiện tại</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeRoomTenant ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                            <Home className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{activeRoomTenant.room.property.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Phòng {activeRoomTenant.room.roomNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 text-sm">
                                        <p className="text-muted-foreground">Giá thuê:</p>
                                        <p className="font-medium text-blue-600">
                                            {formatCurrency(activeRoomTenant.room.baseRent)}/tháng
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    Không đang thuê phòng nào
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống kê</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tổng hóa đơn</span>
                                <span className="font-medium">{totalBills}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngày tạo</span>
                                <span>{new Date(tenant.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thao tác</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/billing?tenantId=${id}`}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Xem hóa đơn
                                </Link>
                            </Button>
                            {activeRoomTenant && (
                                <CheckoutButton
                                    tenantId={id}
                                    tenantName={tenant.name}
                                    roomInfo={`${activeRoomTenant.room.property.name} - Phòng ${activeRoomTenant.room.roomNumber}`}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
