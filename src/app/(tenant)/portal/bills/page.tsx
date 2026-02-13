
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Đã thanh toán</Badge>;
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Chờ thanh toán</Badge>;
            case "OVERDUE":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Quá hạn</Badge>;
            case "CANCELLED":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/portal/dashboard" className="p-2 bg-white rounded-full shadow-sm">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Danh sách hóa đơn</h1>
            </div>

            {/* Bills List */}
            <div className="space-y-3">
                {bills.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Bạn chưa có hóa đơn nào</p>
                    </div>
                ) : (
                    bills.map((bill) => (
                        <Link
                            key={bill.id}
                            href={bill.invoice?.token ? `/invoice/${bill.invoice.token}` : "#"}
                            className="block"
                        >
                            <Card className="hover:bg-blue-50/50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-500">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">Hóa đơn T{bill.month}/{bill.year}</h3>
                                            <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Hạn: {formatDate(bill.dueDate)}</span>
                                            </div>
                                        </div>
                                        {getStatusBadge(bill.status)}
                                    </div>
                                    <div className="flex justify-between items-end mt-3">
                                        <div className="text-sm text-gray-500">
                                            {bill.status === "PENDING" || bill.status === "OVERDUE" ? (
                                                <span className="flex items-center text-orange-600 gap-1 text-xs font-medium">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Cần thanh toán
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-green-600 gap-1 text-xs font-medium">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Đã hoàn thành
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-lg font-bold text-blue-600">
                                            {formatCurrency(bill.total)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
