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
import { ImportWizard } from "@/components/dashboard/import-wizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementManager } from "@/components/properties/announcement-manager";

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
            announcements: {
                orderBy: { createdAt: "desc" }
            }
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/dashboard/properties">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{property.name}</h1>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{property.address}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:self-auto self-end">
                    <Button variant="secondary" size="sm" asChild className="flex-1 sm:flex-none">
                        <Link href={`/dashboard/properties/${id}/readings`}>
                            <Zap className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Ghi điện nước</span>
                            <span className="sm:hidden">Điện nước</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                        <Link href={`/dashboard/properties/${id}/edit`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Cài đặt</span>
                            <span className="sm:hidden">Sửa</span>
                        </Link>
                    </Button>
                    <ImportWizard propertyId={property.id} />
                    <Button size="sm" asChild className="flex-1 sm:flex-none">
                        <Link href={`/dashboard/properties/${id}/rooms/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm phòng
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Tổng phòng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold">{property.rooms.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Đang thuê</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{occupiedRooms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Còn trống</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">{vacantRooms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Giá điện/nước</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="text-xs sm:text-sm space-y-1">
                            <span className="flex items-center gap-1 truncate">
                                <Zap className="h-3 w-3 shrink-0" />
                                <span className="truncate">{property.electricityRate > 0 ? `${property.electricityRate.toLocaleString()}đ` : "Bậc thang"}</span>
                            </span>
                            <span className="flex items-center gap-1 truncate">
                                <Droplets className="h-3 w-3 shrink-0" />
                                <span className="truncate">{property.waterRate.toLocaleString()}đ</span>
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan Phòng</TabsTrigger>
                    <TabsTrigger value="announcements">
                        Bảng tin Tòa nhà
                        {property.announcements.length > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">{property.announcements.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Danh sách phòng</h2>
                    </div>

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
                </TabsContent>

                <TabsContent value="announcements" className="pt-2">
                    <AnnouncementManager
                        propertyId={property.id}
                        announcements={property.announcements}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
