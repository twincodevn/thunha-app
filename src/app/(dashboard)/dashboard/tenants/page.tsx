import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users, Phone, Mail, Home, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TenantFilters } from "@/components/tenants/tenant-filters";
import { formatCurrency } from "@/lib/billing";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        <DashboardShell>
            <PageHeader
                title="Khách thuê"
                description="Quản lý thông tin khách thuê của bạn"
            >
                <div className="flex gap-2">
                    <TenantFilters properties={properties} />
                    <Button asChild>
                        <Link href="/dashboard/tenants/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm khách thuê
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {tenants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Chưa có khách thuê nào"
                    description={propertyId ? "Không tìm thấy khách thuê trong tòa nhà này." : "Thêm khách thuê để bắt đầu quản lý và tạo hóa đơn hàng tháng."}
                    actionLabel={propertyId ? undefined : "Thêm khách thuê đầu tiên"}
                    actionHref={propertyId ? undefined : "/dashboard/tenants/new"}
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => {
                        const currentRoom = tenant.roomTenants[0]?.room;
                        const contract = tenant.roomTenants[0];

                        // Contract status logic
                        let contractStatus = "ACTIVE";
                        if (contract?.endDate) {
                            const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (daysLeft < 0) contractStatus = "EXPIRED";
                            else if (daysLeft <= 30) contractStatus = "EXPIRING_SOON";
                        }

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
                                <Card className="flex flex-col h-full hover:shadow-md transition-shadow group relative overflow-hidden">
                                    {/* Status Bar */}
                                    {totalDebt > 0 && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
                                    )}

                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12 border-2 border-background">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300">
                                                        {tenant.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-base font-semibold group-hover:text-blue-600 transition-colors">
                                                        {tenant.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {contractStatus === "EXPIRING_SOON" && (
                                                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400 px-1.5 py-0">
                                                                Sắp hết hạn
                                                            </Badge>
                                                        )}
                                                        {contractStatus === "EXPIRED" && (
                                                            <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50 px-1.5 py-0">
                                                                Hết hạn
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {totalDebt > 0 ? (
                                                <Badge variant="destructive" className="ml-2 whitespace-nowrap">
                                                    Nợ: {formatCurrency(totalDebt)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                    Đã thanh toán
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-4 space-y-4">
                                        {/* Contact Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                                <Phone className="h-4 w-4 shrink-0" />
                                                {tenant.phone}
                                            </div>
                                            {tenant.email && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                                                    <Mail className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{tenant.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Room Info */}
                                        {currentRoom ? (
                                            <div className="pt-3 border-t">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Home className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm font-medium">Thông tin phòng</span>
                                                </div>
                                                <div className="text-sm grid grid-cols-2 gap-2">
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-xs text-muted-foreground block">Tòa nhà</span>
                                                        <span className="font-medium truncate block">{currentRoom.property.name}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-xs text-muted-foreground block">Phòng</span>
                                                        <span className="font-medium block">{currentRoom.roomNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-4 border-t text-center">
                                                <Badge variant="secondary">Chưa thuê phòng</Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="bg-muted/10 p-4 border-t">
                                        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                                            <span>
                                                Đã tham gia: {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="flex items-center gap-1 text-blue-600 font-medium group-hover:underline">
                                                Chi tiết <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </DashboardShell>
    );
}
