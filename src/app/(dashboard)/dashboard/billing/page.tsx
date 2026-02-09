import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Receipt, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatMonthYear, getCurrentMonthYear } from "@/lib/billing";
import { BILL_STATUS_LABELS } from "@/lib/constants";
import { BulkBillingButton } from "@/components/billing/bulk-billing-button";

async function getBills(userId: string) {
    getCurrentMonthYear(); // For future month filtering

    return prisma.bill.findMany({
        where: {
            roomTenant: { room: { property: { userId } } },
        },
        include: {
            roomTenant: {
                include: {
                    room: { include: { property: true } },
                    tenant: true,
                },
            },
            payments: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });
}

async function getBillStats(userId: string) {
    const stats = await prisma.bill.groupBy({
        by: ["status"],
        where: { roomTenant: { room: { property: { userId } } } },
        _count: { id: true },
        _sum: { total: true },
    });

    return {
        pending: stats.find((s) => s.status === "PENDING"),
        overdue: stats.find((s) => s.status === "OVERDUE"),
        paid: stats.find((s) => s.status === "PAID"),
    };
}

export default async function BillingPage() {
    const session = await auth();
    if (!session?.user) return null;

    const [bills, stats] = await Promise.all([
        getBills(session.user.id),
        getBillStats(session.user.id),
    ]);

    // Future: filter by current month

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
                    <p className="text-muted-foreground">
                        Quản lý hóa đơn và thanh toán hàng tháng
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href="/api/bills/export" download>
                            <Download className="mr-2 h-4 w-4" />
                            Xuất Excel
                        </a>
                    </Button>
                    <BulkBillingButton />
                    <Button asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo hóa đơn
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Chờ thanh toán
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.pending?._count.id || 0} hóa đơn
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatCurrency(stats.pending?._sum.total || 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Quá hạn
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.overdue?._count.id || 0} hóa đơn
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatCurrency(stats.overdue?._sum.total || 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Đã thanh toán
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.paid?._count.id || 0} hóa đơn
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatCurrency(stats.paid?._sum.total || 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Bills List */}
            {bills.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Chưa có hóa đơn nào</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Tạo hóa đơn để bắt đầu thu tiền phòng hàng tháng.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/billing/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo hóa đơn đầu tiên
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách hóa đơn</CardTitle>
                        <CardDescription>
                            Tất cả hóa đơn của bạn, sắp xếp theo thời gian mới nhất
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {bills.map((bill) => {
                                const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                                return (
                                    <Link
                                        key={bill.id}
                                        href={`/dashboard/billing/${bill.id}`}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <Receipt className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {bill.roomTenant.room.property.name} - Phòng {bill.roomTenant.room.roomNumber}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {bill.roomTenant.tenant.name} · {formatMonthYear(bill.month, bill.year)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(bill.total)}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant={
                                                        bill.status === "PAID"
                                                            ? "default"
                                                            : bill.status === "OVERDUE"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                >
                                                    {BILL_STATUS_LABELS[bill.status]}
                                                </Badge>
                                                {paidAmount > 0 && bill.status !== "PAID" && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Đã nhận {formatCurrency(paidAmount)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
