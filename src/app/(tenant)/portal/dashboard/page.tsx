
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Home, User, FileText, Wrench } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/billing";

export default async function TenantDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    // Fetch tenant's pending bills
    const pendingBills = await prisma.bill.findMany({
        where: {
            roomTenant: {
                tenantId: session.user.id,
            },
            status: {
                in: ["PENDING", "OVERDUE"],
            },
        },
        orderBy: {
            dueDate: "asc",
        },
        include: {
            payments: true,
        },
    });

    const totalBalance = pendingBills.reduce((sum, bill) => {
        const paid = bill.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
        return sum + (bill.total - paid);
    }, 0);

    const nextDueDate = pendingBills.length > 0 ? pendingBills[0].dueDate : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header */}
            <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Home className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">Cổng Cư Dân</h1>
                        <p className="text-xs text-gray-500">Xin chào, {session.user.name}</p>
                    </div>
                </div>
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/portal/login" });
                    }}
                >
                    <Button variant="ghost" size="icon" className="text-gray-500">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </form>
            </header>

            <main className="p-4 space-y-4">
                {/* Stats Card */}
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-none text-white shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100 opacity-90">
                            Dư nợ hiện tại
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {formatCurrency(totalBalance)}
                        </div>
                        <p className="text-blue-100 text-sm mt-1">
                            {nextDueDate
                                ? `Hạn thanh toán: ${formatDate(nextDueDate)}`
                                : "Bạn không có khoản nợ nào"}
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/portal/bills">
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center text-gray-500">
                                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-1">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium">Hóa đơn</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/portal/incidents">
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center text-gray-500">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-1">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium">Báo sự cố</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>

            {/* Bottom Nav Placeholder */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around text-xs text-gray-500">
                <div className="flex flex-col items-center p-2 text-blue-600">
                    <Home className="h-6 w-6 mb-1" />
                    <span>Trang chủ</span>
                </div>
                <div className="flex flex-col items-center p-2">
                    <User className="h-6 w-6 mb-1" />
                    <span>Tài khoản</span>
                </div>
            </div>
        </div>
    );
}
