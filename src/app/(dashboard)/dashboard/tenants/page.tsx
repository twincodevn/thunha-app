import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users, Phone, Mail, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function getTenants(userId: string) {
    return prisma.tenant.findMany({
        where: { userId },
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } },
                },
            },
        },
        orderBy: { name: "asc" },
    });
}

export default async function TenantsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const tenants = await getTenants(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Khách thuê</h1>
                    <p className="text-muted-foreground">
                        Quản lý thông tin khách thuê của bạn
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/tenants/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm khách thuê
                    </Link>
                </Button>
            </div>

            {tenants.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Chưa có khách thuê nào</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Thêm khách thuê để bắt đầu quản lý và tạo hóa đơn hàng tháng.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/tenants/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm khách thuê đầu tiên
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => {
                        const currentRoom = tenant.roomTenants[0]?.room;
                        return (
                            <Link key={tenant.id} href={`/dashboard/tenants/${tenant.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                                {currentRoom ? (
                                                    <CardDescription className="flex items-center gap-1 mt-1">
                                                        <Home className="h-3 w-3" />
                                                        {currentRoom.property.name} - Phòng {currentRoom.roomNumber}
                                                    </CardDescription>
                                                ) : (
                                                    <Badge variant="secondary" className="mt-1">Chưa thuê phòng</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            {tenant.phone}
                                        </div>
                                        {tenant.email && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                {tenant.email}
                                            </div>
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
