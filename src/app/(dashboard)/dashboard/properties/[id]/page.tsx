import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Zap, Droplets, Settings, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/billing";
import { RoomGrid } from "@/components/properties/room-grid";

async function getProperty(id: string, userId: string) {
    return prisma.property.findFirst({
        where: { id, userId },
        include: {
            rooms: {
                include: {
                    roomTenants: {
                        where: { isActive: true },
                        include: { tenant: true },
                    },
                },
                orderBy: { roomNumber: "asc" },
            },
        },
    });
}

export default async function PropertyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const property = await getProperty(id, session.user.id);

    if (!property) {
        notFound();
    }

    const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
    const vacantRooms = property.rooms.filter((r) => r.status === "VACANT").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/properties">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
                        <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {property.address}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/properties/${id}/readings`}>
                            <Zap className="mr-2 h-4 w-4" />
                            Ghi điện nước
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/properties/${id}/edit`}>
                            <Settings className="mr-2 h-4 w-4" />
                            Cài đặt
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href={`/dashboard/properties/${id}/rooms/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm phòng
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng phòng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{property.rooms.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Đang thuê</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{occupiedRooms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Còn trống</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{vacantRooms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Giá điện/nước</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {property.electricityRate > 0 ? `${property.electricityRate.toLocaleString()}đ/kWh` : "Bậc thang EVN"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Droplets className="h-3 w-3" />
                                {property.waterRate.toLocaleString()}đ/m³
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Rooms List */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Danh sách phòng</h2>

                {property.rooms.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/50">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Home className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chưa có phòng nào</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Thêm phòng để bắt đầu quản lý khách thuê và hóa đơn
                            </p>
                            <Button asChild>
                                <Link href={`/dashboard/properties/${id}/rooms/new`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm phòng đầu tiên
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <RoomGrid propertyId={property.id} rooms={property.rooms as any} />
                )}
            </div>
        </div>
    );
}
