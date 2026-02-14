import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Building2, Download, CreditCard, Calendar, User, MapPin, QrCode } from "lucide-react";
import { getBankByCode } from "@/lib/vietqr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatMonthYear, calculateElectricityBreakdown, formatNumber } from "@/lib/billing";
import { BILL_STATUS_LABELS } from "@/lib/constants";
import { ChatWidget } from "@/components/ai/chat-widget";

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
        <div className="min-h-screen bg-slate-50">
            {/* Header Section */}
            <div className="bg-indigo-600 pb-32 pt-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                                <Building2 className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">ThuNhà</h1>
                                <p className="text-indigo-100 text-sm font-medium">Hệ thống quản lý phòng trọ thông minh</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-md">
                                {formatMonthYear(bill.month, bill.year)}
                            </Badge>
                            <Badge className={`${statusColors[bill.status]} border-none px-3 py-1 text-sm font-bold shadow-sm`}>
                                {BILL_STATUS_LABELS[bill.status]}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 -mt-24 pb-12 max-w-3xl">
                <div className="grid gap-6">
                    {/* Main Invoice Card */}
                    <Card className="border-none shadow-2xl overflow-hidden rounded-2xl">
                        <div className="bg-white px-6 py-8 md:p-10">
                            {/* Summary Header */}
                            <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Thông tin tòa nhà</h2>
                                        <div className="flex items-start gap-2 text-slate-900">
                                            <MapPin className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-lg leading-tight">{bill.roomTenant.room.property.name}</p>
                                                <p className="text-slate-500 font-medium">Phòng {bill.roomTenant.room.roomNumber}</p>
                                                <p className="text-slate-400 text-sm mt-1 italic">{bill.roomTenant.room.property.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 md:text-right">
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Khách thuê</h2>
                                        <div className="flex items-start md:justify-end gap-2 text-slate-900">
                                            <div className="md:order-2">
                                                <User className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                            </div>
                                            <div className="md:order-1">
                                                <p className="font-bold text-lg leading-tight">{bill.roomTenant.tenant.name}</p>
                                                <p className="text-slate-500 font-medium">{bill.roomTenant.tenant.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 mb-8" />

                            {/* Line Items Table */}
                            <div className="space-y-6">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                    Chi tiết các khoản mục
                                </h3>

                                <div className="grid gap-4">
                                    {/* Rent */}
                                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <span className="font-medium text-slate-700">Tiền thuê phòng</span>
                                        </div>
                                        <span className="font-bold text-slate-900">{formatCurrency(bill.baseRent)}</span>
                                    </div>

                                    {/* Electricity */}
                                    <div className="flex flex-col p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                                    <QrCode className="h-5 w-5 rotate-45" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700">Tiền điện</span>
                                                    <span className="text-xs text-slate-500 font-medium italic">Sử dụng: {bill.electricityUsage} kWh</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900">{formatCurrency(bill.electricityAmount)}</span>
                                        </div>
                                        {bill.roomTenant.room.property.electricityRate === 0 && bill.electricityUsage > 0 && (
                                            <div className="mt-4 ml-13 p-3 bg-white/60 rounded-lg border border-indigo-50 space-y-2">
                                                {(() => {
                                                    const { breakdown } = calculateElectricityBreakdown(bill.electricityUsage);
                                                    return breakdown.map((b, i) => (
                                                        <div key={i} className="flex justify-between text-xs text-slate-500">
                                                            <span className="font-medium">{b.tier} ({b.units} số × {formatNumber(b.price)}đ)</span>
                                                            <span className="font-bold text-slate-600">{formatNumber(b.amount)}đ</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Water */}
                                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                                                <div className="relative">
                                                    <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full absolute -top-1 -right-0.5 animate-bounce"></div>
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">Tiền nước</span>
                                                <span className="text-xs text-slate-500 font-medium italic">Sử dụng: {bill.waterUsage} m³</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-900">{formatCurrency(bill.waterAmount)}</span>
                                    </div>

                                    {/* Discount */}
                                    {bill.discount > 0 && (
                                        <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">%</div>
                                                <span className="font-medium text-emerald-700">Giảm trừ / Hỗ trợ</span>
                                            </div>
                                            <span className="font-bold text-emerald-600">-{formatCurrency(bill.discount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Total Calculation */}
                            <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Building2 className="h-32 w-32" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-indigo-100 text-base font-medium">Tổng số tiền cần thanh toán</span>
                                        <h3 className="text-4xl font-extrabold tracking-tight">{formatCurrency(bill.total)}</h3>
                                    </div>
                                    <div className="pt-4 border-t border-white/20 flex flex-wrap gap-x-8 gap-y-2 text-sm text-indigo-100 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Hạn thanh toán: {formatDate(bill.dueDate)}
                                        </div>
                                        {paidAmount > 0 && (
                                            <div className="flex items-center gap-2 text-emerald-300">
                                                <span>•</span>
                                                Đã trả: {formatCurrency(paidAmount)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col md:flex-row gap-4 items-center">
                            <Button variant="default" className="w-full md:w-auto px-10 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold" asChild>
                                <a href={`/api/invoices/${bill.id}/pdf?token=${invoice.token}`} download>
                                    <Download className="mr-2 h-5 w-5" />
                                    Tải hóa đơn (PDF)
                                </a>
                            </Button>
                            <p className="text-xs text-slate-400 font-medium italic">Bằng việc thanh toán, bạn đồng ý với các điều khoản của hộ kinh doanh.</p>
                        </div>
                    </Card>

                    {/* Payment Instructions Card */}
                    {bill.status !== "PAID" && remainingAmount > 0 && (
                        <Card className="border-none shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                            <CardHeader className="bg-indigo-50/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Hướng dẫn thanh toán</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {bill.roomTenant.room.property.user.bankName &&
                                    bill.roomTenant.room.property.user.bankAccountNumber ? (
                                    <div className="grid md:grid-cols-2 gap-8 items-center">
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin chuyển khoản</p>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-slate-500 font-medium">Ngân hàng:</span>
                                                            <span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors uppercase">{bill.roomTenant.room.property.user.bankName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-slate-500 font-medium">Số tài khoản:</span>
                                                            <span className="text-indigo-600 font-black font-mono text-lg">{bill.roomTenant.room.property.user.bankAccountNumber}</span>
                                                        </div>
                                                        {bill.roomTenant.room.property.user.bankAccountName && (
                                                            <div className="flex justify-between items-center group border-t border-slate-100 pt-3 mt-1">
                                                                <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                                                                <span className="text-slate-800 font-bold uppercase">{bill.roomTenant.room.property.user.bankAccountName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                        <span className="text-amber-600 font-bold">!</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-amber-800 font-bold text-sm">Nội dung chuyển khoản</p>
                                                        <p className="text-amber-700/80 text-sm font-medium">
                                                            Tien phong T{bill.month}/{bill.year} - P.{bill.roomTenant.room.roomNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-6 shadow-inner border-2 border-slate-50 relative group">
                                            <div className="absolute inset-0 bg-indigo-500/5 scale-95 blur-2xl group-hover:scale-105 transition-transform duration-500"></div>
                                            <div className="relative z-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`https://img.vietqr.io/image/${getBankBin(bill.roomTenant.room.property.user.bankName)}-${bill.roomTenant.room.property.user.bankAccountNumber}-compact2.png?amount=${Math.round(remainingAmount)}&addInfo=${encodeURIComponent(`Tien phong T${bill.month}/${bill.year} - ${bill.roomTenant.room.roomNumber}`)}`}
                                                    alt="VietQR Payment"
                                                    width={220}
                                                    height={220}
                                                    className="rounded-lg"
                                                />
                                            </div>
                                            <p className="mt-6 text-sm font-bold text-indigo-600 flex items-center gap-2">
                                                <QrCode className="h-4 w-4" />
                                                Quét mã QR để tự động điền
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                            <CreditCard className="h-8 w-8" />
                                        </div>
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <p className="text-slate-800 font-bold">Hình thức thanh toán khác</p>
                                            <p className="text-slate-500 text-sm">Vui lòng liên hệ trực tiếp chủ trọ để nhận thông tin thanh toán tiền mặt hoặc chuyển khoản.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Status Banners (Conditional) */}
                    {(bill.status === "PAID" || bill.status === "OVERDUE") && (
                        <div className={`p-6 rounded-2xl border flex items-center gap-6 shadow-md ${bill.status === "PAID"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                            : "bg-rose-50 border-rose-100 text-rose-800"
                            }`}>
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 text-3xl shadow-sm ${bill.status === "PAID" ? "bg-emerald-100" : "bg-rose-100"
                                }`}>
                                {bill.status === "PAID" ? "🏆" : "🚨"}
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase tracking-tight">
                                    {bill.status === "PAID" ? "Thanh toán thành công" : "Quá hạn thanh toán"}
                                </p>
                                <p className="text-sm font-medium opacity-80">
                                    {bill.status === "PAID"
                                        ? "Dữ liệu đã được lưu vào hệ thống. Cảm ơn bạn!"
                                        : "Vui lòng hoàn tất nghĩa vụ thanh toán để tránh phát sinh chi phí."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Credits */}
                <div className="mt-12 text-center space-y-4">
                    <Separator className="max-w-[100px] mx-auto bg-slate-200" />
                    <div className="space-y-1">
                        <p className="text-slate-400 text-sm font-medium">Ứng dụng quản lý ThuNhà v2.5</p>
                        <p className="text-slate-400 text-xs">Phát hành bởi Digital House Team</p>
                    </div>
                </div>
            </main>

            <ChatWidget
                title="Hỗ trợ thanh toán"
                context={`
                    Thông tin hóa đơn:
                    - Mã hóa đơn: ${invoice.token}
                    - Phòng: ${bill.roomTenant.room.property.name} - ${bill.roomTenant.room.roomNumber}
                    - Địa chỉ: ${bill.roomTenant.room.property.address}
                    - Khách thuê: ${bill.roomTenant.tenant.name}
                    - Kỳ thanh toán: Tháng ${bill.month}/${bill.year}
                    - Tiền thuê: ${formatCurrency(bill.baseRent)}
                    - Tiền điện: ${formatCurrency(bill.electricityAmount)} (${bill.electricityUsage} kWh)
                    - Tiền nước: ${formatCurrency(bill.waterAmount)} (${bill.waterUsage} m3)
                    - Tổng tiền: ${formatCurrency(bill.total)}
                    - Đã thanh toán: ${formatCurrency(paidAmount)}
                    - Còn lại: ${formatCurrency(remainingAmount)}
                    - Hạn thanh toán: ${formatDate(bill.dueDate)}
                    - Chủ tài khoản: ${bill.roomTenant.room.property.user.bankAccountName || "N/A"}
                    - Số tài khoản: ${bill.roomTenant.room.property.user.bankAccountNumber || "N/A"} (${bill.roomTenant.room.property.user.bankName || "N/A"})
                    
                    Hãy hỗ trợ khách thuê giải đáp thắc mắc về hóa đơn này. Giải thích rõ ràng các khoản mục nếu được hỏi.
                `}
            />
        </div>
    );
}
