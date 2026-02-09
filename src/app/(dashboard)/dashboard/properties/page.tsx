import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Plus, MapPin, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/billing";

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

export default async function PropertiesPage() {
    const session = await auth();
    if (!session?.user) return null;

    const properties = await getProperties(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tòa nhà</h1>
                    <p className="text-muted-foreground">
                        Quản lý các tòa nhà và phòng cho thuê của bạn
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/properties/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm tòa nhà
                    </Link>
                </Button>
            </div>

            {properties.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Chưa có tòa nhà nào</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Bắt đầu bằng cách thêm tòa nhà đầu tiên của bạn để quản lý phòng và khách thuê.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/properties/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm tòa nhà đầu tiên
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => {
                        const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
                        const totalRent = property.rooms
                            .filter((r) => r.status === "OCCUPIED")
                            .reduce((sum, r) => sum + r.baseRent, 0);

                        return (
                            <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{property.name}</CardTitle>
                                                    <CardDescription className="flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {property.address}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Home className="h-4 w-4 text-muted-foreground" />
                                                    <span>{property._count.rooms} phòng</span>
                                                </div>
                                                <Badge variant={occupiedRooms > 0 ? "default" : "secondary"}>
                                                    {occupiedRooms} đang thuê
                                                </Badge>
                                            </div>
                                        </div>
                                        {totalRent > 0 && (
                                            <p className="text-sm text-muted-foreground mt-3">
                                                Doanh thu: <span className="font-medium text-foreground">{formatCurrency(totalRent)}</span>/tháng
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
