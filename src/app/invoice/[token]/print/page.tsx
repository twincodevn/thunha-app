import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, formatMonthYear, formatNumber, calculateElectricityBreakdown } from "@/lib/billing";
import { getBankByCode } from "@/lib/vietqr";
import { BILL_STATUS_LABELS } from "@/lib/constants";

// Helper to get bank BIN from code
function getBankBin(bankCode: string | null): string {
    if (!bankCode) return "";
    const bank = getBankByCode(bankCode);
    return bank?.bin || "";
}

export default async function InvoicePrintPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

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

    if (!invoice) notFound();

    const bill = invoice.bill;
    const property = bill.roomTenant.room.property;
    const tenant = bill.roomTenant.tenant;
    const room = bill.roomTenant.room;

    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = bill.total - paidAmount;

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            {/* Auto Print Script */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.onload = function() { window.print(); }`
                }}
            />

            {/* Print Container A4 Size Approx */}
            <div className="max-w-[800px] mx-auto bg-white" style={{ width: '210mm', minHeight: '297mm' }}>

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">{property.name}</h1>
                        <p className="text-sm mt-1">{property.address}</p>
                        <p className="text-sm">Điện thoại: {property.user.phone || "N/A"}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase text-gray-800">Hóa Đơn Tiền Phòng</h2>
                        <p className="font-bold mt-1 text-lg">Kỳ: {formatMonthYear(bill.month, bill.year)}</p>
                        <p className="text-sm text-gray-500">Ngày lập: {formatDate(bill.createdAt)}</p>
                        <p className="text-sm text-gray-500">Hạn thanh toán: {formatDate(bill.dueDate)}</p>
                        <p className="text-sm font-bold mt-2 border inline-block px-2 py-1 bg-gray-100">
                            TRẠNG THÁI: {BILL_STATUS_LABELS[bill.status]?.toUpperCase() || bill.status}
                        </p>
                    </div>
                </div>

                {/* Info block */}
                <div className="flex justify-between mb-8">
                    <div className="w-1/2">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Thông tin khách thuê</h3>
                        <p className="font-bold text-lg">{tenant.name}</p>
                        <p>Phòng: <span className="font-bold">{room.roomNumber}</span></p>
                        <p>Điện thoại: {tenant.phone}</p>
                    </div>
                    <div className="w-1/2 text-right">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Mã Hóa Đơn</h3>
                        <p className="font-mono text-lg">{invoice.token.slice(-8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full mb-8 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="py-2 text-sm font-bold uppercase">Khoản mục</th>
                            <th className="py-2 text-sm font-bold uppercase text-center">Chỉ số / Số lượng</th>
                            <th className="py-2 text-sm font-bold uppercase text-right">Đơn giá</th>
                            <th className="py-2 text-sm font-bold uppercase text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Rent */}
                        <tr className="border-b border-gray-200">
                            <td className="py-3">Tiền thuê phòng</td>
                            <td className="py-3 text-center">-</td>
                            <td className="py-3 text-right">-</td>
                            <td className="py-3 text-right font-bold">{formatCurrency(bill.baseRent)}</td>
                        </tr>

                        {/* Electricity */}
                        <tr className="border-b border-gray-200">
                            <td className="py-3">
                                Tiền điện
                                {property.electricityRate === 0 && (
                                    <div className="text-xs text-gray-500 mt-1">Tính theo điện bậc thang Nhà nước</div>
                                )}
                            </td>
                            <td className="py-3 text-center">{bill.electricityUsage} kWh</td>
                            <td className="py-3 text-right">
                                {property.electricityRate > 0 ? formatNumber(property.electricityRate) + 'đ' : 'Bậc thang'}
                            </td>
                            <td className="py-3 text-right font-bold">{formatCurrency(bill.electricityAmount)}</td>
                        </tr>

                        {/* Electricity Breakdown if Tiered */}
                        {property.electricityRate === 0 && bill.electricityUsage > 0 && (
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                <td colSpan={4} className="py-2 px-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                        {(() => {
                                            const { breakdown } = calculateElectricityBreakdown(bill.electricityUsage);
                                            return breakdown.map((b, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span>- {b.tier} ({b.units} số × {formatNumber(b.price)}đ)</span>
                                                    <span>{formatNumber(b.amount)}đ</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Water */}
                        <tr className="border-b border-gray-200">
                            <td className="py-3">Tiền nước</td>
                            <td className="py-3 text-center">{bill.waterUsage} m³</td>
                            <td className="py-3 text-right">{formatNumber(property.waterRate)}đ</td>
                            <td className="py-3 text-right font-bold">{formatCurrency(bill.waterAmount)}</td>
                        </tr>

                        {/* Extra Services */}
                        {(bill.extraCharges as any[])?.map((service, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3">{service.name}</td>
                                <td className="py-3 text-center">1</td>
                                <td className="py-3 text-right">{formatCurrency(service.price)}</td>
                                <td className="py-3 text-right font-bold">{formatCurrency(service.price)}</td>
                            </tr>
                        ))}

                        {/* Discount */}
                        {bill.discount > 0 && (
                            <tr className="border-b border-gray-200 text-green-700">
                                <td className="py-3">Giảm trừ / Khuyến mãi</td>
                                <td className="py-3 text-center">-</td>
                                <td className="py-3 text-right">-</td>
                                <td className="py-3 text-right font-bold">-{formatCurrency(bill.discount)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2">
                        <div className="flex justify-between py-2">
                            <span className="font-bold">Tổng cộng:</span>
                            <span className="font-bold text-xl">{formatCurrency(bill.total)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-green-700">
                            <span>Đã thanh toán:</span>
                            <span>{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="flex justify-between py-3 mt-2 border-t-2 border-black">
                            <span className="font-black text-lg uppercase">Cần thanh toán:</span>
                            <span className="font-black text-2xl">{formatCurrency(remainingAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Info / Footer */}
                <div className="flex justify-between items-end border-t border-gray-300 pt-8 mt-auto">
                    <div className="w-2/3 pr-8">
                        <h4 className="font-bold mb-2">Thông tin thanh toán chuyển khoản:</h4>
                        <p>Ngân hàng: <span className="font-bold">{property.user.bankName}</span></p>
                        <p>Số tài khoản: <span className="font-bold">{property.user.bankAccountNumber}</span></p>
                        <p>Chủ tài khoản: <span className="font-bold">{property.user.bankAccountName}</span></p>
                        <p className="mt-2 text-sm italic font-bold">Nội dung CK: TN-{bill.id.slice(-6).toUpperCase()}</p>
                    </div>

                    <div className="w-1/3 text-center">
                        {property.user.bankName && property.user.bankAccountNumber && remainingAmount > 0 ? (
                            <div className="border border-gray-300 p-2 rounded-lg inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`https://img.vietqr.io/image/${getBankBin(property.user.bankName)}-${property.user.bankAccountNumber}-compact2.png?amount=${Math.round(remainingAmount)}&addInfo=${encodeURIComponent(`TN-${bill.id.slice(-6).toUpperCase()}`)}`}
                                    alt="QR Code"
                                    className="w-32 h-32 mx-auto"
                                />
                                <p className="text-[10px] mt-1 text-gray-500">Quét mã để thanh toán</p>
                            </div>
                        ) : (
                            <div className="h-32"></div> // Spacer
                        )}

                        <div className="mt-8">
                            <p className="font-bold">Người lập phiếu</p>
                            <p className="text-sm mt-16 text-gray-500">(Ký và ghi rõ họ tên)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS to hide browser UI styling when printing */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
}
