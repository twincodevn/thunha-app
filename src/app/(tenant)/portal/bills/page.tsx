
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, AlertCircle, CheckCircle2, Clock, ChevronRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TenantBillsPage() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const bills = await prisma.bill.findMany({
        where: {
            roomTenant: {
                tenantId: session.user.id,
            },
        },
        include: {
            invoice: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "PAID":
                return {
                    label: "Đã thanh toán",
                    icon: CheckCircle2,
                    className: "bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10",
                    amountClass: "text-slate-900"
                };
            case "PENDING":
                return {
                    label: "Chờ thanh toán",
                    icon: Clock,
                    className: "bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10",
                    amountClass: "text-amber-600"
                };
            case "OVERDUE":
                return {
                    label: "Quá hạn",
                    icon: AlertCircle,
                    className: "bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/10",
                    amountClass: "text-rose-600"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: FileText,
                    className: "bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10",
                    amountClass: "text-slate-500 line-through"
                };
            default:
                return {
                    label: status,
                    icon: FileText,
                    className: "bg-slate-50 text-slate-700",
                    amountClass: "text-slate-900"
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* Bills List */}
            <div className="p-4 space-y-4">
                {bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Receipt className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-semibold mb-1">Chưa có hóa đơn nào</h3>
                        <p className="text-slate-500 text-sm max-w-[200px]">
                            Các hóa đơn mới sẽ xuất hiện tại đây khi đến kỳ thanh toán.
                        </p>
                    </div>
                ) : (
                    bills.map((bill) => {
                        const status = getStatusConfig(bill.status);
                        const StatusIcon = status.icon;

                        return (
                            <Link
                                key={bill.id}
                                href={bill.invoice?.token ? `/invoice/${bill.invoice.token}` : "#"}
                                className="block group"
                            >
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md hover:border-indigo-100 hover:translate-y-[-2px] relative overflow-hidden">
                                    {/* Accent Line */}
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                                        bill.status === "PAID" ? "bg-emerald-500" :
                                            bill.status === "OVERDUE" ? "bg-rose-500" :
                                                "bg-amber-500"
                                    )}></div>

                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">Tháng {bill.month}/{bill.year}</h3>
                                                {bill.status === "PENDING" && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md w-fit">
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                Hạn: {formatDate(bill.dueDate)}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("pl-1.5 pr-2 py-1 gap-1 font-semibold border ring-1 transition-colors", status.className)}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-end pl-2 pt-2 border-t border-slate-50">
                                        <div className="flex items-center text-xs text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">
                                            Xem chi tiết <ChevronRight className="h-3 w-3 ml-0.5" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Tổng tiền</p>
                                            <span className={cn("text-xl font-bold tracking-tight", status.amountClass)}>
                                                {formatCurrency(bill.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
