import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Building2, Download, CreditCard, Calendar, User, MapPin, QrCode } from "lucide-react";
import { getBankByCode } from "@/lib/vietqr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/billing";
import { BILL_STATUS_LABELS } from "@/lib/constants";

// Helper to get bank BIN from code
function getBankBin(bankCode: string | null): string {
    if (!bankCode) return "";
    const bank = getBankByCode(bankCode);
    return bank?.bin || "";
}

async function getInvoiceByToken(token: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { token },
        include: {
            bill: {
                include: {
                    roomTenant: {
                        include: {
                            room: { include: { property: { include: { user: true } } } },
                            tenant: true,
                        },
                    },
                    payments: true,
                    meterReading: true,
                },
            },
        },
    });

    if (invoice && !invoice.viewedAt) {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { viewedAt: new Date() },
        });
    }

    return invoice;
}

export default async function PublicInvoicePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const invoice = await getInvoiceByToken(token);

    if (!invoice) notFound();

    const bill = invoice.bill;
    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = bill.total - paidAmount;

    const statusColors: Record<string, string> = {
        DRAFT: "bg-gray-100 text-gray-800",
        PENDING: "bg-orange-100 text-orange-800",
        PAID: "bg-green-100 text-green-800",
        OVERDUE: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-500",
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">ThuNhà</h1>
                                <p className="text-sm text-blue-100">Hóa đơn tiền phòng</p>
                            </div>
                        </div>
                        <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {formatMonthYear(bill.month, bill.year)}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Status Banner */}
                {bill.status === "PAID" && (
                    <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <span className="text-xl">✅</span>
                        </div>
                        <div>
                            <p className="font-semibold text-green-800">Đã thanh toán</p>
                            <p className="text-sm text-green-700">Cảm ơn bạn đã thanh toán đúng hạn!</p>
                        </div>
                    </div>
                )}

                {bill.status === "OVERDUE" && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div>
                            <p className="font-semibold text-red-800">Quá hạn thanh toán</p>
                            <p className="text-sm text-red-700">Vui lòng thanh toán sớm nhất có thể.</p>
                        </div>
                    </div>
                )}

                {/* Invoice Card */}
                <Card className="shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Chi tiết hóa đơn</CardTitle>
                            <Badge className={statusColors[bill.status]}>
                                {BILL_STATUS_LABELS[bill.status]}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Property & Tenant Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{bill.roomTenant.room.property.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Phòng {bill.roomTenant.room.roomNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{bill.roomTenant.tenant.name}</p>
                                    <p className="text-sm text-muted-foreground">{bill.roomTenant.tenant.phone}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Line Items */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tiền phòng</span>
                                <span className="font-medium">{formatCurrency(bill.baseRent)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tiền điện ({bill.electricityUsage} kWh)
                                </span>
                                <span className="font-medium">{formatCurrency(bill.electricityAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Tiền nước ({bill.waterUsage} m³)
                                </span>
                                <span className="font-medium">{formatCurrency(bill.waterAmount)}</span>
                            </div>
                            {bill.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Giảm giá</span>
                                    <span className="font-medium">-{formatCurrency(bill.discount)}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Total */}
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold">Tổng cộng</span>
                            <span className="font-bold text-blue-600">{formatCurrency(bill.total)}</span>
                        </div>

                        {paidAmount > 0 && bill.status !== "PAID" && (
                            <>
                                <div className="flex justify-between text-green-600">
                                    <span>Đã thanh toán</span>
                                    <span>{formatCurrency(paidAmount)}</span>
                                </div>
                                <div className="flex justify-between text-lg text-orange-600">
                                    <span className="font-medium">Còn lại</span>
                                    <span className="font-bold">{formatCurrency(remainingAmount)}</span>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Due Date */}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Hạn thanh toán:</span>
                            <span className={bill.status === "OVERDUE" ? "font-medium text-red-600" : "font-medium"}>
                                {formatDate(bill.dueDate)}
                            </span>
                        </div>

                        {/* Payment Options */}
                        {bill.status !== "PAID" && remainingAmount > 0 && (
                            <div className="pt-4 space-y-4">
                                {/* QR Code Payment (if landlord has bank account) */}
                                {bill.roomTenant.room.property.user.bankName &&
                                    bill.roomTenant.room.property.user.bankAccountNumber && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-blue-700 font-medium">
                                                <QrCode className="h-5 w-5" />
                                                Quét mã QR để thanh toán
                                            </div>
                                            <div className="flex justify-center">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`https://img.vietqr.io/image/${getBankBin(bill.roomTenant.room.property.user.bankName)}-${bill.roomTenant.room.property.user.bankAccountNumber}-compact2.png?amount=${Math.round(remainingAmount)}&addInfo=${encodeURIComponent(`Tien phong T${bill.month}/${bill.year} - ${bill.roomTenant.room.roomNumber}`)}`}
                                                        alt="VietQR Payment"
                                                        width={180}
                                                        height={180}
                                                        className="rounded"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-sm space-y-1 bg-white/80 rounded p-2">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">STK:</span>
                                                    <span className="font-mono font-medium">{bill.roomTenant.room.property.user.bankAccountNumber}</span>
                                                </div>
                                                {bill.roomTenant.room.property.user.bankAccountName && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Chủ TK:</span>
                                                        <span className="font-medium uppercase">{bill.roomTenant.room.property.user.bankAccountName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        <Button variant="outline" className="w-full" asChild>
                            <a href={`/api/invoices/${bill.id}/pdf`} download>
                                <Download className="mr-2 h-4 w-4" />
                                Tải hóa đơn PDF
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Hóa đơn được tạo bởi ThuNhà</p>
                    <p className="mt-1">Liên hệ: {bill.roomTenant.room.property.user.email || bill.roomTenant.room.property.user.phone}</p>
                </div>
            </main>
        </div>
    );
}
