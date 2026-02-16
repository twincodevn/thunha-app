"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, Clock, AlertTriangle, Building2, CreditCard, QrCode, ExternalLink } from "lucide-react";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    PAID: { label: "Đã thanh toán", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
    PENDING: { label: "Chờ thanh toán", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock },
    OVERDUE: { label: "Quá hạn", color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
};

import { Suspense } from "react";

function BillContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("Link không hợp lệ. Vui lòng liên hệ chủ nhà.");
            setLoading(false);
            return;
        }

        fetch(`/api/tenant/bill?token=${token}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.error) {
                    setError("Không tìm thấy hóa đơn. Link có thể đã hết hạn.");
                } else {
                    setData(result);
                }
            })
            .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
                    <p className="text-gray-600">Đang tải hóa đơn...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Không thể hiển thị</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    const { bill, tenant, room, landlord, meterReading, payments, totalPaid, remaining, qrUrl } = data;
    const statusInfo = statusMap[bill.status] || statusMap.PENDING;
    const StatusIcon = statusInfo.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-teal-100 sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        <span className="font-bold text-teal-700">ThuNhà</span>
                    </div>
                    <span className="text-xs text-gray-500">Portal khách thuê</span>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* Status Banner */}
                <div className={`rounded-xl border p-4 flex items-center gap-3 ${statusInfo.color}`}>
                    <StatusIcon className="h-6 w-6 shrink-0" />
                    <div>
                        <p className="font-bold">{statusInfo.label}</p>
                        <p className="text-sm opacity-80">
                            Hóa đơn tháng {bill.month}/{bill.year}
                        </p>
                    </div>
                </div>

                {/* Tenant & Room Info */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-sm text-gray-500">Khách thuê</p>
                            <p className="font-semibold text-gray-800">{tenant.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Phòng</p>
                            <p className="font-semibold text-gray-800">{room.number}</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        <p>{room.property} — {room.address}</p>
                    </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-teal-600" />
                        Chi tiết hóa đơn
                    </h3>
                    <div className="space-y-2.5">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tiền phòng</span>
                            <span className="font-medium">{formatCurrency(bill.baseRent)}</span>
                        </div>

                        {bill.electricityUsage > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Điện ({bill.electricityUsage} kWh)
                                    {meterReading && (
                                        <span className="text-xs text-gray-400 block">
                                            {meterReading.electricityPrev} → {meterReading.electricityCurrent}
                                        </span>
                                    )}
                                </span>
                                <span className="font-medium">{formatCurrency(bill.electricityAmount)}</span>
                            </div>
                        )}

                        {bill.waterUsage > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Nước ({bill.waterUsage} m³)
                                    {meterReading && (
                                        <span className="text-xs text-gray-400 block">
                                            {meterReading.waterPrev} → {meterReading.waterCurrent}
                                        </span>
                                    )}
                                </span>
                                <span className="font-medium">{formatCurrency(bill.waterAmount)}</span>
                            </div>
                        )}

                        {bill.extraCharges && Array.isArray(bill.extraCharges) && bill.extraCharges.map((charge: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                                <span className="text-gray-600">{charge.name || "Phụ phí"}</span>
                                <span className="font-medium">{formatCurrency(charge.amount || 0)}</span>
                            </div>
                        ))}

                        {bill.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Giảm giá</span>
                                <span className="font-medium">-{formatCurrency(bill.discount)}</span>
                            </div>
                        )}

                        <hr className="border-gray-200" />

                        <div className="flex justify-between text-lg">
                            <span className="font-bold text-gray-800">Tổng cộng</span>
                            <span className="font-bold text-teal-600">{formatCurrency(bill.total)}</span>
                        </div>

                        {totalPaid > 0 && (
                            <>
                                <div className="flex justify-between text-emerald-600">
                                    <span>Đã thanh toán</span>
                                    <span className="font-medium">-{formatCurrency(totalPaid)}</span>
                                </div>
                                {remaining > 0 && (
                                    <div className="flex justify-between text-red-600 text-lg">
                                        <span className="font-bold">Còn lại</span>
                                        <span className="font-bold">{formatCurrency(remaining)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                        Hạn thanh toán: {formatDate(bill.dueDate)}
                    </p>
                </div>

                {/* VietQR Payment */}
                {qrUrl && remaining > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-teal-600" />
                            Thanh toán qua QR
                        </h3>
                        <div className="text-center">
                            <img
                                src={qrUrl}
                                alt="VietQR Payment"
                                className="mx-auto rounded-lg border border-gray-200 max-w-[280px]"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Quét mã QR bằng ứng dụng ngân hàng để thanh toán
                            </p>
                        </div>

                        {landlord.bankName && (
                            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngân hàng:</span>
                                    <span className="font-medium">{landlord.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số TK:</span>
                                    <span className="font-mono font-medium">{landlord.bankAccountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Chủ TK:</span>
                                    <span className="font-medium">{landlord.bankAccountName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số tiền:</span>
                                    <span className="font-bold text-teal-600">{formatCurrency(remaining)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment History */}
                {payments && payments.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Lịch sử thanh toán</h3>
                        <div className="space-y-2">
                            {payments.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                                    <div>
                                        <span className="text-sm font-medium text-emerald-600">{formatCurrency(p.amount)}</span>
                                        <span className="text-xs text-gray-400 block">{p.method}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{formatDate(p.paidAt)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact Landlord */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Liên hệ chủ nhà</h3>
                    <div className="flex gap-2">
                        {landlord.phone && (
                            <a
                                href={`tel:${landlord.phone}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-50 text-teal-700 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-100 transition"
                            >
                                📞 Gọi điện
                            </a>
                        )}
                        {landlord.phone && (
                            <a
                                href={`https://zalo.me/${landlord.phone.startsWith("0") ? "84" + landlord.phone.slice(1) : landlord.phone}`}
                                target="_blank"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                            >
                                💬 Zalo
                            </a>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center text-xs text-gray-400 pb-6">
                    <p>Powered by ThuNhà — Quản lý nhà cho thuê thông minh</p>
                </footer>
            </main>
        </div>
    );
}

export default function TenantBillPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <BillContent />
        </Suspense>
    );
}

function Spinner() {
    return (
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-gray-600">Đang tải...</p>
        </div>
    );
}
