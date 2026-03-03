
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download, Loader2, Send, Copy, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getBillZaloContent, formatCurrency } from "@/lib/billing";
import { Label } from "@/components/ui/label";

import { getBill, updateBillStatus } from "../actions";

export default function BillDetailPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    const [bill, setBill] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!id) return;
        async function fetchBill() {
            try {
                const data = await getBill(id);
                setBill(data);
            } catch (error) {
                console.error("Failed to fetch bill", error);
                toast.error("Không thể tải thông tin hóa đơn");
            } finally {
                setIsLoading(false);
            }
        }
        fetchBill();
    }, [id]);

    const handleUpdateStatus = async (status: string) => {
        setIsUpdating(true);
        try {
            const result = await updateBillStatus(bill.id, status);
            if (result.success) {
                toast.success("Đã cập nhật trạng thái");
                // Refresh data
                const data = await getBill(id);
                setBill(data);
            } else {
                toast.error("Cập nhật thất bại");
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!bill?.invoice?.token) {
            toast.error("Chưa có hóa đơn để tải PDF");
            return;
        }
        window.open(`/invoice/${bill.invoice.token}/print`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <p className="text-muted-foreground">Không tìm thấy hóa đơn</p>
                <Button asChild variant="secondary">
                    <Link href="/dashboard/billing">Quay lại</Link>
                </Button>
            </div>
        );
    }

    const services = bill.extraCharges as any[] || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/billing">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chi tiết hóa đơn</h1>
                        <p className="text-muted-foreground">
                            {bill.roomTenant.room.roomNumber} - Tháng {bill.month}/{bill.year}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {bill.invoice?.token && (
                        <Button variant="outline" asChild>
                            <Link href={`/invoice/${bill.invoice.token}/print`} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                In Hóa đơn (PDF)
                            </Link>
                        </Button>
                    )}
                    {(bill.status === "PENDING" || bill.status === "OVERDUE") && (
                        <Button onClick={() => handleUpdateStatus("PAID")} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận thanh toán
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Invoice View */}
                <Card className="md:col-span-2 lg:col-span-1 border shadow-sm">
                    <CardHeader className="bg-muted/50">
                        <CardTitle>Hóa đơn tiền nhà</CardTitle>
                        <CardDescription>Mã HĐ: #{bill.id.slice(-6).toUpperCase()}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {/* Hidden element for PDF generation - styling needs to be pdf-friendly */}
                        <div id="invoice-content" className="bg-white p-4 text-sm space-y-4">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-xl font-bold uppercase">{bill.roomTenant.room.property.name}</h2>
                                <p className="text-muted-foreground">{bill.roomTenant.room.property.address}</p>
                                <h3 className="text-lg font-semibold mt-4">HÓA ĐƠN TIỀN NHÀ</h3>
                                <p>Tháng {bill.month} năm {bill.year}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-2">
                                <div>
                                    <p><span className="font-semibold">Phòng:</span> {bill.roomTenant.room.roomNumber}</p>
                                    <p><span className="font-semibold">Khách thuê:</span> {bill.roomTenant.tenant.name}</p>
                                </div>
                                <div className="text-right">
                                    <p><span className="font-semibold">Ngày tạo:</span> {format(new Date(bill.createdAt), "dd/MM/yyyy")}</p>
                                    <p><span className="font-semibold">Hạn thanh toán:</span> {format(new Date(bill.dueDate), "dd/MM/yyyy")}</p>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-2">Khoản mục</th>
                                        <th className="py-2 text-right">Chi tiết</th>
                                        <th className="py-2 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="py-2">Tiền phòng</td>
                                        <td className="py-2 text-right">-</td>
                                        <td className="py-2 text-right">{formatCurrency(bill.baseRent)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Điện</td>
                                        <td className="py-2 text-right">{bill.electricityUsage} số ({formatCurrency(bill.roomTenant.room.property.electricityRate)}/số)</td>
                                        <td className="py-2 text-right">{formatCurrency(bill.electricityAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Nước</td>
                                        <td className="py-2 text-right">{bill.waterUsage} khối ({formatCurrency(bill.roomTenant.room.property.waterRate)}/khối)</td>
                                        <td className="py-2 text-right">{formatCurrency(bill.waterAmount)}</td>
                                    </tr>
                                    {services.map((s, i) => (
                                        <tr key={i}>
                                            <td className="py-2">Dịch vụ: {s.name}</td>
                                            <td className="py-2 text-right">-</td>
                                            <td className="py-2 text-right">{formatCurrency(s.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black font-bold text-lg">
                                        <td className="py-4">Tổng cộng</td>
                                        <td className="py-4"></td>
                                        <td className="py-4 text-right">{formatCurrency(bill.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="pt-8 text-center text-xs text-muted-foreground">
                                <p>Cảm ơn quý khách đã thuê phòng!</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info / Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin thanh toán</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Trạng thái</Label>
                                <div className="mt-1">
                                    <Badge variant={bill.status === "PAID" ? "default" : "secondary"} className={bill.status === "PAID" ? "bg-green-600" : bill.status === "OVERDUE" ? "bg-red-500 text-white" : ""}>
                                        {bill.status === "PAID" ? "Đã thanh toán" : bill.status === "PENDING" ? "Chờ thanh toán" : bill.status === "OVERDUE" ? "Quá hạn" : bill.status === "CANCELLED" ? "Đã hủy" : bill.status}
                                    </Badge>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <Label>Hóa đơn công khai</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={bill.invoice?.token ? `${window.location.origin}/invoice/${bill.invoice.token}` : "Đang tạo..."}
                                        className="text-xs"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!bill.invoice?.token}
                                        onClick={() => {
                                            if (!bill.invoice?.token) return;
                                            const url = `${window.location.origin}/invoice/${bill.invoice.token}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success("Đã sao chép liên kết");
                                        }}
                                    >
                                        Chép
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Gửi link này cho khách thuê để xem hóa đơn và QR thanh toán</p>
                            </div>
                            <Separator />

                            <div>
                                <Label>Gửi thông báo</Label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full flex items-center gap-2 border-blue-200 hover:bg-blue-50 text-blue-700"
                                        onClick={() => {
                                            const content = getBillZaloContent({
                                                month: bill.month,
                                                year: bill.year,
                                                propertyName: bill.roomTenant.room.property.name,
                                                roomNumber: bill.roomTenant.room.roomNumber,
                                                tenantName: bill.roomTenant.tenant.name,
                                                total: bill.total,
                                                invoiceUrl: `${window.location.origin}/invoice/${bill.invoice?.token}`
                                            });
                                            navigator.clipboard.writeText(content);
                                            toast.success("Đã copy lời nhắn. Hãy dán vào Zalo/Messenger.");
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy lời nhắn
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full flex items-center gap-2 border-teal-200 hover:bg-teal-50 text-teal-700"
                                        onClick={() => {
                                            const phone = bill.roomTenant.tenant.phone;
                                            if (!phone) {
                                                toast.error("Khách này chưa có số điện thoại");
                                                return;
                                            }
                                            const cleanPhone = phone.replace(/\D/g, "");
                                            window.open(`https://zalo.me/${cleanPhone}`, "_blank");
                                        }}
                                    >
                                        <MessageSquareText className="h-4 w-4" />
                                        Mở Zalo
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            {/* We could add bank info here if we had it in property settings */}
                            {(() => {
                                const { bankName, bankAccountNumber, bankAccountName } = bill.roomTenant.room.property.user ?? {};
                                const hasBank = bankName && bankAccountNumber;
                                const description = encodeURIComponent(`${bill.roomTenant.room.roomNumber} T${bill.month}`);
                                const accountNameEncoded = encodeURIComponent(bankAccountName ?? "");
                                const qrUrl = hasBank
                                    ? `https://img.vietqr.io/image/${bankName}-${bankAccountNumber}-compact2.png?amount=${bill.total}&addInfo=${description}&accountName=${accountNameEncoded}`
                                    : null;
                                return (
                                    <div className="bg-muted p-4 rounded-md space-y-3">
                                        <p className="text-sm font-medium">Thông tin chuyển khoản:</p>
                                        <p className="text-sm text-muted-foreground">
                                            Ngân hàng: <span className="font-medium text-foreground">{bankName || "Chưa cập nhật"}</span><br />
                                            Số tài khoản: <span className="font-medium text-foreground">{bankAccountNumber || "Chưa cập nhật"}</span><br />
                                            Chủ tài khoản: <span className="font-medium text-foreground">{bankAccountName || "Chưa cập nhật"}</span><br />
                                            Nội dung: <span className="font-medium text-foreground">{bill.roomTenant.room.roomNumber} T{bill.month}</span>
                                        </p>
                                        {qrUrl ? (
                                            <div className="flex flex-col items-center gap-3 pt-3 border-t">
                                                {/* Auto-detect badge */}
                                                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-xs font-semibold text-green-700">SePay tự động xác nhận</span>
                                                </div>

                                                <img
                                                    src={qrUrl}
                                                    alt="Mã QR thanh toán"
                                                    className="w-52 h-auto rounded-xl border shadow-md"
                                                />
                                                <p className="text-base font-bold text-primary">{formatCurrency(bill.total)}</p>

                                                {/* Transfer code - critical for auto-matching */}
                                                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                    <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wide mb-1">⚠️ Nội dung chuyển khoản (bắt buộc)</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 text-sm font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded">
                                                            TN-{bill.id.slice(-6).toUpperCase()}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="shrink-0 h-7 px-2 text-amber-700 hover:text-amber-900"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`TN-${bill.id.slice(-6).toUpperCase()}`);
                                                                toast.success("Đã copy mã chuyển khoản!");
                                                            }}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-[10px] text-amber-600 mt-1">
                                                        Khách thuê PHẢI ghi đúng mã này. Hệ thống sẽ tự động gạch nợ khi nhận được tiền.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-600 pt-1 border-t">
                                                Chưa cấu hình thông tin ngân hàng. Vào{" "}
                                                <a href="/dashboard/settings" className="underline">Cài đặt</a>{" "}
                                                để thêm tài khoản ngân hàng.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {bill.meterReading && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Chi tiết chỉ số</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Điện cũ:</span>
                                        <span>{bill.meterReading.electricityPrev}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Điện mới:</span>
                                        <span>{bill.meterReading.electricityCurrent}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span>Nước cũ:</span>
                                        <span>{bill.meterReading.waterPrev}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Nước mới:</span>
                                        <span>{bill.meterReading.waterCurrent}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
