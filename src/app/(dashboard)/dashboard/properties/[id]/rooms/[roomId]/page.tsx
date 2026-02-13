import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Users, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/billing";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import { AssetManager } from "@/components/assets/asset-manager";

async function getRoom(propertyId: string, roomId: string, userId: string) {
    return prisma.room.findFirst({
        where: {
            id: roomId,
            propertyId,
            property: { userId },
        },
        include: {
            property: true,
            roomTenants: {
                where: { isActive: true },
                include: { tenant: true },
            },
            assets: {
                orderBy: { name: "asc" },
            },
        } as any,
    });
}

export default async function RoomDetailPage({
    params,
}: {
    params: Promise<{ id: string; roomId: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id, roomId } = await params;
    const room = await getRoom(id, roomId, session.user.id);

    if (!room) notFound();

    const currentTenant = (room as any).roomTenants?.[0];

    const statusColors: Record<string, string> = {
        VACANT: "bg-gray-100 text-gray-800",
        OCCUPIED: "bg-green-100 text-green-800",
        MAINTENANCE: "bg-orange-100 text-orange-800",
    };

    const statusLabels: Record<string, string> = {
        VACANT: "Trống",
        OCCUPIED: "Đang thuê",
        MAINTENANCE: "Bảo trì",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/properties/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Phòng {room.roomNumber}
                    </h1>
                    <p className="text-muted-foreground">{(room as any).property?.name}</p>
                </div>
                <Badge className={statusColors[room.status]}>{statusLabels[room.status]}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin phòng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Tầng</p>
                                <p className="font-medium">{room.floor}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Diện tích</p>
                                <p className="font-medium">{room.area ? `${room.area} m²` : "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Giá thuê</p>
                                <p className="font-medium text-blue-600">{formatCurrency(room.baseRent)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tiền cọc</p>
                                <p className="font-medium">{room.deposit ? formatCurrency(room.deposit) : "—"}</p>
                            </div>
                        </div>
                        {room.notes && (
                            <div>
                                <p className="text-sm text-muted-foreground">Ghi chú</p>
                                <p className="text-sm">{room.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Khách thuê hiện tại</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentTenant ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium">
                                        {currentTenant.tenant.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{currentTenant.tenant.name}</p>
                                        <p className="text-sm text-muted-foreground">{currentTenant.tenant.phone}</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        Ngày vào: {new Date(currentTenant.startDate).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/dashboard/tenants/${currentTenant.tenant.id}`}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Xem chi tiết
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground mb-4">Phòng đang trống</p>
                                <Button asChild>
                                    <Link href={`/dashboard/tenants/new?roomId=${roomId}`}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Thêm khách thuê
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thao tác</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/properties/${id}/rooms/${roomId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/billing?roomId=${roomId}`}>
                            <Receipt className="mr-2 h-4 w-4" />
                            Xem hóa đơn
                        </Link>
                    </Button>
                    <DeleteRoomButton
                        roomId={roomId}
                        roomNumber={room.roomNumber}
                        propertyId={id}
                    />
                </CardContent>
            </Card>

            <AssetManager
                roomId={roomId}
                initialAssets={room.assets.map((asset: any) => ({
                    ...asset,
                    images: asset.images ? JSON.parse(asset.images) : []
                }))}
            />
        </div>
    );
}
