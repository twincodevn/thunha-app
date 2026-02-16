"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, CreditCard, FileText, User, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/billing";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TenantDrawerProps {
    tenant: any; // Using detailed type would be better, but 'any' facilitates rapid prototyping with complex Prisma includes
    isOpen: boolean;
    onClose: () => void;
}

export function TenantDrawer({ tenant, isOpen, onClose }: TenantDrawerProps) {
    if (!tenant) return null;

    const currentRoom = tenant.roomTenants[0]?.room;
    const contract = tenant.roomTenants[0];

    // Calculate stats
    const totalDebt = tenant.roomTenants.reduce((sum: number, rt: any) => {
        const roomDebt = rt.bills.reduce((billSum: number, bill: any) => {
            const paidAmount = bill.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0);
            return billSum + (bill.total - paidAmount);
        }, 0);
        return sum + roomDebt;
    }, 0);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
                <SheetHeader className="text-left space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                            <AvatarImage src={tenant.avatar || ""} />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                {tenant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-xl">{tenant.name}</SheetTitle>
                            <SheetDescription>
                                {currentRoom ? (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                        <Home className="h-3 w-3" /> P.{currentRoom.roomNumber} - {currentRoom.property.name}
                                    </span>
                                ) : (
                                    "Chưa thuê phòng"
                                )}
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="flex-1" asChild>
                            <Link href={`/dashboard/tenants/${tenant.id}`}>
                                Xem chi tiết
                            </Link>
                        </Button>
                        {contract && (
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href={`/dashboard/contracts/${contract.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Hợp đồng
                                </Link>
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    {/* Status Overview */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/40 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Trạng thái nợ</p>
                            {totalDebt > 0 ? (
                                <p className="text-lg font-bold text-destructive">{formatCurrency(totalDebt)}</p>
                            ) : (
                                <p className="text-lg font-bold text-green-600">Đã thanh toán</p>
                            )}
                        </div>
                        <div className="bg-muted/40 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Ngày bắt đầu</p>
                            <p className="text-sm font-medium">
                                {contract ? format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi }) : "N/A"}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" /> Thông tin cá nhân
                        </h4>
                        <div className="grid gap-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Điện thoại
                                </span>
                                <span className="font-medium">{tenant.phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Email
                                </span>
                                <span className="font-medium truncate max-w-[200px]">{tenant.email || "Chưa cập nhật"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" /> CCCD/CMND
                                </span>
                                <span className="font-medium">{tenant.idNumber || "Chưa cập nhật"}</span>
                            </div>
                            {tenant.address && (
                                <div className="flex items-start justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <MapPin className="h-3 w-3" /> Địa chỉ
                                    </span>
                                    <span className="font-medium text-right max-w-[200px]">{tenant.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Room Details */}
                    {currentRoom && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Home className="h-4 w-4" /> Thông tin thuê
                            </h4>
                            <div className="grid gap-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Giá thuê cơ bản</span>
                                    <span className="font-medium">{formatCurrency(currentRoom.baseRent)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tiền cọc</span>
                                    <span className="font-medium">{formatCurrency(currentRoom.deposit || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Hạn hợp đồng</span>
                                    <span className="font-medium">
                                        {contract?.endDate
                                            ? format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })
                                            : "Không thời hạn"
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
