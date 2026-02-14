import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Plus, MapPin, Home, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/billing";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

async function getProperties(userId: string) {
    return prisma.property.findMany({
        where: { userId },
        include: {
            rooms: {
                select: { id: true, status: true, baseRent: true },
            },
            _count: { select: { rooms: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tòa nhà",
    description: "Quản lý tòa nhà và phòng cho thuê",
};

export default async function PropertiesPage() {
    const session = await auth();
    if (!session?.user) return null;

    const properties = await getProperties(session.user.id);

    return (
        <DashboardShell>
            <PageHeader
                title="Tòa nhà"
                description="Quản lý các tòa nhà và phòng cho thuê của bạn"
            >
                <Button asChild>
                    <Link href="/dashboard/properties/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm tòa nhà
                    </Link>
                </Button>
            </PageHeader>

            {properties.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="Chưa có tòa nhà nào"
                    description="Bắt đầu bằng cách thêm tòa nhà đầu tiên của bạn để quản lý phòng và khách thuê."
                    actionLabel="Thêm tòa nhà đầu tiên"
                    actionHref="/dashboard/properties/new"
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => {
                        const totalRooms = property.rooms.length;
                        const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
                        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
                        const totalRent = property.rooms
                            .filter((r) => r.status === "OCCUPIED")
                            .reduce((sum, r) => sum + r.baseRent, 0);

                        return (
                            <Card key={property.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                                <CardHeader className="pb-3 bg-muted/30">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold leading-none">
                                                    {property.name}
                                                </CardTitle>
                                                <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="line-clamp-1">{property.address}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pt-4 pb-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Tổng số phòng</span>
                                            <div className="flex items-center gap-1 font-medium">
                                                <Home className="h-4 w-4 text-muted-foreground" />
                                                {totalRooms}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Tỷ lệ lấp đầy</span>
                                                <span className={occupancyRate >= 80 ? 'text-green-600 font-medium' : ''}>
                                                    {Math.round(occupancyRate)}% ({occupiedRooms}/{totalRooms})
                                                </span>
                                            </div>
                                            <Progress value={occupancyRate} className="h-2" />
                                        </div>

                                        <div className="pt-2 border-t flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">Doanh thu tháng</div>
                                            <div className="font-bold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(totalRent)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 bg-muted/10 border-t flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link href={`/dashboard/properties/${property.id}`}>
                                            Chi tiết
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                        <Link href={`/dashboard/properties/${property.id}/rooms/new`}>
                                            <Plus className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </DashboardShell>
    );
}
