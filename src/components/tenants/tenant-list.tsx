"use client";

import { useState } from "react";
import { TenantDrawer } from "@/components/tenants/tenant-drawer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Home, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/billing";

import { useMemo } from "react";

interface TenantListProps {
    tenants: any[];
    searchQuery: string;
    statusFilter: string;
}

export function TenantList({ tenants, searchQuery, statusFilter }: TenantListProps) {
    const [selectedTenant, setSelectedTenant] = useState<any>(null);

    const filteredTenants = useMemo(() => {
        return tenants.filter((tenant) => {
            // 1. Search Logic
            const normalizedSearch = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !normalizedSearch ||
                tenant.name.toLowerCase().includes(normalizedSearch) ||
                tenant.phone.includes(normalizedSearch);

            if (!matchesSearch) return false;

            // 2. Status Logic
            const contract = tenant.roomTenants[0];

            // Calculate total debt for this specific tenant (similar to card logic)
            const totalDebt = tenant.roomTenants.reduce((sum: number, rt: any) => {
                const roomDebt = rt.bills.reduce((billSum: number, bill: any) => {
                    const paidAmount = bill.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0);
                    return billSum + (bill.total - paidAmount);
                }, 0);
                return sum + roomDebt;
            }, 0);

            // Contract status logic for filtering
            let contractStatus = "ACTIVE";
            if (contract?.endDate) {
                const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) contractStatus = "EXPIRED";
                else if (daysLeft <= 30) contractStatus = "EXPIRING_SOON";
            }

            switch (statusFilter) {
                case "in_debt":
                    return totalDebt > 0;
                case "paid":
                    return totalDebt <= 0 && tenant.roomTenants.length > 0;
                case "expiring":
                    return contractStatus === "EXPIRING_SOON";
                case "expired":
                    return contractStatus === "EXPIRED";
                case "all":
                default:
                    return true;
            }
        });
    }, [tenants, searchQuery, statusFilter]);

    if (filteredTenants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed">
                <p className="text-muted-foreground">Không tìm thấy khách thuê phù hợp với bộ lọc.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTenants.map((tenant) => {
                    const currentRoom = tenant.roomTenants[0]?.room;
                    const contract = tenant.roomTenants[0];

                    // Contract status logic
                    let contractStatus = "ACTIVE";
                    if (contract?.endDate) {
                        const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (daysLeft < 0) contractStatus = "EXPIRED";
                        else if (daysLeft <= 30) contractStatus = "EXPIRING_SOON";
                    }

                    // Calculate total debt
                    const totalDebt = tenant.roomTenants.reduce((sum: number, rt: any) => {
                        const roomDebt = rt.bills.reduce((billSum: number, bill: any) => {
                            const paidAmount = bill.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0);
                            return billSum + (bill.total - paidAmount);
                        }, 0);
                        return sum + roomDebt;
                    }, 0);

                    return (
                        <Card
                            key={tenant.id}
                            className="flex flex-col h-full hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer border-l-4 hover:scale-[1.02]"
                            style={{ borderLeftColor: totalDebt > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}
                            onClick={() => setSelectedTenant(tenant)}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-background">
                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                                                    {tenant.name}
                                                </CardTitle>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] px-1.5 py-0 border ${(tenant.creditScore || 600) >= 750 ? "border-green-200 text-green-700 bg-green-50" :
                                                        (tenant.creditScore || 600) < 550 ? "border-red-200 text-red-700 bg-red-50" :
                                                            "border-yellow-200 text-yellow-700 bg-yellow-50"
                                                        }`}
                                                >
                                                    Tín nhiệm: {tenant.creditScore || 600}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {contractStatus === "EXPIRING_SOON" && (
                                                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 px-1.5 py-0">
                                                        Sắp hết hạn
                                                    </Badge>
                                                )}
                                                {contractStatus === "EXPIRED" && (
                                                    <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50 px-1.5 py-0">
                                                        Hết hạn
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {totalDebt > 0 ? (
                                        <Badge variant="destructive" className="ml-2 whitespace-nowrap">
                                            Nợ: {formatCurrency(totalDebt)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                            Đã thanh toán
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4 space-y-4">
                                {/* Contact Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        {tenant.phone}
                                    </div>
                                    {tenant.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                                            <Mail className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{tenant.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Room Info */}
                                {currentRoom ? (
                                    <div className="pt-3 border-t">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Home className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">Thông tin phòng</span>
                                        </div>
                                        <div className="text-sm grid grid-cols-2 gap-2">
                                            <div className="bg-muted/30 p-2 rounded">
                                                <span className="text-xs text-muted-foreground block">Tòa nhà</span>
                                                <span className="font-medium truncate block">{currentRoom.property.name}</span>
                                            </div>
                                            <div className="bg-muted/30 p-2 rounded">
                                                <span className="text-xs text-muted-foreground block">Phòng</span>
                                                <span className="font-medium block">{currentRoom.roomNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t text-center">
                                        <Badge variant="secondary">Chưa thuê phòng</Badge>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-muted/10 p-4 border-t">
                                <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                                    <span>
                                        Đã tham gia: {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className="flex items-center gap-1 text-primary font-medium group-hover:underline">
                                        Xem nhanh <ArrowRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <TenantDrawer
                tenant={selectedTenant}
                isOpen={!!selectedTenant}
                onClose={() => setSelectedTenant(null)}
            />
        </>
    );
}
