import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users, Phone, Mail, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TenantFilters } from "@/components/tenants/tenant-filters";
import { formatCurrency } from "@/lib/billing";

async function getTenants(userId: string, propertyId?: string) {
    const where: any = { userId };

    if (propertyId && propertyId !== "all") {
        where.roomTenants = {
            some: {
                isActive: true,
                room: { propertyId },
            },
        };
    }

    return prisma.tenant.findMany({
        where,
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } },
                    bills: {
                        where: {
                            status: { in: ["PENDING", "OVERDUE"] },
                        },
                        include: {
                            payments: true,
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });
}

async function getProperties(userId: string) {
    return prisma.property.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Khách thuê",
    description: "Quản lý khách thuê và hợp đồng",
};

export default async function TenantsPage({
    searchParams,
}: {
    searchParams: Promise<{ propertyId?: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { propertyId } = await searchParams;
    const [tenants, properties] = await Promise.all([
        getTenants(session.user.id, propertyId),
        getProperties(session.user.id),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Khách thuê</h1>
                    <p className="text-muted-foreground">
                        Quản lý thông tin khách thuê của bạn
                    </p>
                </div>
                <div className="flex gap-2">
                    <TenantFilters properties={properties} />
                    <Button asChild>
                        <Link href="/dashboard/tenants/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm khách thuê
                        </Link>
                    </Button>
                </div>
            </div>

            {tenants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Chưa có khách thuê nào"
                    description={propertyId ? "Không tìm thấy khách thuê trong tòa nhà này." : "Thêm khách thuê để bắt đầu quản lý và tạo hóa đơn hàng tháng."}
                    actionLabel={propertyId ? undefined : "Thêm khách thuê đầu tiên"}
                    actionHref={propertyId ? undefined : "/dashboard/tenants/new"}
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => {
                        const currentRoom = tenant.roomTenants[0]?.room;

                        // Calculate total debt across all active room rentals
                        const totalDebt = tenant.roomTenants.reduce((sum, rt) => {
                            const roomDebt = rt.bills.reduce((billSum, bill) => {
                                const paidAmount = bill.payments.reduce((pSum, p) => pSum + p.amount, 0);
                                return billSum + (bill.total - paidAmount);
                            }, 0);
                            return sum + roomDebt;
                        }, 0);

                        return (
                            <Link key={tenant.id} href={`/dashboard/tenants/${tenant.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold shrink-0">
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                                    {currentRoom ? (
                                                        <CardDescription className="flex items-center gap-1 mt-1">
                                                            <Home className="h-3 w-3" />
                                                            {currentRoom.property.name} - P.{currentRoom.roomNumber}
                                                        </CardDescription>
                                                    ) : (
                                                        <Badge variant="secondary" className="mt-1">Chưa thuê phòng</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {totalDebt > 0 && (
                                                <Badge variant="destructive" className="ml-2 whitespace-nowrap">
                                                    Nợ: {formatCurrency(totalDebt)}
                                                </Badge>
                                            )}
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
