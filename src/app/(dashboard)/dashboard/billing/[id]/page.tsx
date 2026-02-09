import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/billing";
import { BILL_STATUS_LABELS } from "@/lib/constants";
import { VNPayButton } from "@/components/payment/vnpay-button";
import { PaymentResultHandler } from "@/components/payment/payment-result-handler";
import { ShareActions } from "@/components/billing/share-actions";
import { SendEmailButton } from "@/components/billing/send-email-button";
import { ReminderActions } from "@/components/billing/reminder-actions";
import { Suspense } from "react";

async function getBill(id: string, userId: string) {
    return prisma.bill.findFirst({
        where: {
            id,
            roomTenant: { room: { property: { userId } } },
        },
        include: {
            roomTenant: {
                include: {
                    room: { include: { property: true } },
                    tenant: true,
                },
            },
            payments: { orderBy: { paidAt: "desc" } },
            invoice: true,
            meterReading: true,
        },
    });
}

export default async function BillDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const bill = await getBill(id, session.user.id);

    if (!bill) notFound();

    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = bill.total - paidAmount;

    // Compute display status based on actual payments
    const displayStatus = paidAmount >= bill.total ? "PAID" : bill.status;

    const statusColors: Record<string, string> = {
        DRAFT: "bg-gray-100 text-gray-800",
        PENDING: "bg-orange-100 text-orange-800",
        PAID: "bg-green-100 text-green-800",
        OVERDUE: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-500",
    };

    return (
        <div className="space-y-6">
            <Suspense fallback={null}>
                <PaymentResultHandler />
            </Suspense>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/billing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Hóa đơn {formatMonthYear(bill.month, bill.year)}
                    </h1>
                    <p className="text-muted-foreground">
                        {bill.roomTenant.room.property.name} - Phòng {bill.roomTenant.room.roomNumber}
                    </p>
                </div>
                <Badge className={statusColors[displayStatus]}>
                    {BILL_STATUS_LABELS[displayStatus]}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left column - Bill details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chi tiết hóa đơn</CardTitle>
                            <CardDescription>
                                Khách thuê: {bill.roomTenant.tenant.name} · {bill.roomTenant.tenant.phone}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Tiền phòng</span>
                                <span className="font-medium">{formatCurrency(bill.baseRent)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">
                                    Tiền điện ({bill.electricityUsage} kWh)
                                </span>
                                <span className="font-medium">{formatCurrency(bill.electricityAmount)}</span>
                            </div>
                            {bill.meterReading && (
                                <p className="text-xs text-muted-foreground -mt-2">
                                    Chỉ số: {bill.meterReading.electricityPrev} → {bill.meterReading.electricityCurrent}
                                </p>
                            )}
                            <Separator />
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">
                                    Tiền nước ({bill.waterUsage} m³)
                                </span>
                                <span className="font-medium">{formatCurrency(bill.waterAmount)}</span>
                            </div>
                            {bill.meterReading && (
                                <p className="text-xs text-muted-foreground -mt-2">
                                    Chỉ số: {bill.meterReading.waterPrev} → {bill.meterReading.waterCurrent}
                                </p>
                            )}
                            {bill.discount > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between py-2 text-green-600">
                                        <span>Giảm giá</span>
                                        <span className="font-medium">-{formatCurrency(bill.discount)}</span>
                                    </div>
                                </>
                            )}
                            <Separator />
                            <div className="flex justify-between py-3 text-lg">
                                <span className="font-semibold">Tổng cộng</span>
                                <span className="font-bold text-blue-600">{formatCurrency(bill.total)}</span>
                            </div>
                            {paidAmount > 0 && bill.status !== "PAID" && (
                                <div className="flex justify-between py-2 text-green-600">
                                    <span>Đã thanh toán</span>
                                    <span className="font-medium">{formatCurrency(paidAmount)}</span>
                                </div>
                            )}
                            {remainingAmount > 0 && bill.status !== "PAID" && (
                                <div className="flex justify-between py-2 text-orange-600">
                                    <span className="font-medium">Còn lại</span>
                                    <span className="font-bold">{formatCurrency(remainingAmount)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payments history */}
                    {bill.payments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Lịch sử thanh toán</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {bill.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div>
                                                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payment.method} · {formatDate(payment.paidAt)}
                                                </p>
                                            </div>
                                            <Check className="h-5 w-5 text-green-600" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column - Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Thao tác</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {bill.status !== "PAID" && remainingAmount > 0 && (
                                <VNPayButton billId={bill.id} amount={remainingAmount} />
                            )}
                            <Button variant="outline" className="w-full" asChild>
                                <a href={`/api/invoices/${bill.id}/pdf`} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Tải PDF
                                </a>
                            </Button>
                            <SendEmailButton
                                billId={bill.id}
                                tenantEmail={bill.roomTenant.tenant.email}
                            />
                            <Button variant="outline" className="w-full" asChild>
                                <a
                                    href={`/api/invoices/${bill.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    In hóa đơn
                                </a>
                            </Button>
                            <Separator />
                            <ShareActions
                                invoiceToken={bill.invoice?.token}
                                invoiceUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${bill.invoice?.token || bill.id}`}
                                billInfo={{
                                    tenantName: bill.roomTenant.tenant.name,
                                    propertyName: bill.roomTenant.room.property.name,
                                    roomNumber: bill.roomTenant.room.roomNumber,
                                    month: bill.month,
                                    year: bill.year,
                                    total: bill.total,
                                }}
                            />
                            <Separator />
                            <ReminderActions
                                billId={bill.id}
                                tenantEmail={bill.roomTenant.tenant.email}
                                tenantPhone={bill.roomTenant.tenant.phone}
                                isPaid={displayStatus === "PAID"}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Thông tin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngày tạo</span>
                                <span>{formatDate(bill.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Hạn thanh toán</span>
                                <span className={bill.status === "OVERDUE" ? "text-red-600 font-medium" : ""}>
                                    {formatDate(bill.dueDate)}
                                </span>
                            </div>
                            {bill.invoice?.sentAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Đã gửi</span>
                                    <span>{formatDate(bill.invoice.sentAt)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {bill.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ghi chú</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{bill.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
