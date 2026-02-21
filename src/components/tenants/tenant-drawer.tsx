"use client";

import { TenantAccountDialog } from "@/components/tenants/tenant-account-dialog";
import { useState } from "react";
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
import { Phone, Mail, MapPin, CreditCard, FileText, User, ArrowRight, Home, MessageCircle } from "lucide-react";
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
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

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
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-xl">{tenant.name}</SheetTitle>
                                <Badge
                                    variant="secondary"
                                    className={`text-xs border ${(tenant.creditScore || 600) >= 750 ? "border-green-200 text-green-700 bg-green-50" :
                                        (tenant.creditScore || 600) < 550 ? "border-red-200 text-red-700 bg-red-50" :
                                            "border-yellow-200 text-yellow-700 bg-yellow-50"
                                        }`}
                                >
                                    Tín nhiệm: {tenant.creditScore || 600}
                                </Badge>
                            </div>
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
                        <Button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-0" asChild>
                            <Link href={`/dashboard/tenants/${tenant.id}`}>
                                <User className="mr-2 h-4 w-4" />
                                Hồ sơ chi tiết
                            </Link>
                        </Button>
                        {contract && (
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href={`/dashboard/contracts/${contract.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Xem Hợp đồng
                                </Link>
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                            <Link href={`tel:${tenant.phone}`}>
                                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs">Gọi điện</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20" asChild>
                            <Link href={`https://zalo.me/${tenant.phone}`} target="_blank">
                                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs">Zalo</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20" asChild>
                            <Link href={`/dashboard/properties/${currentRoom?.propertyId}/readings?roomId=${currentRoom?.id}`}>
                                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs">Tạo Hóa đơn</span>
                            </Link>
                        </Button>
                    </div>
                    {/* Account Status */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                <User className="h-4 w-4" /> Tài khoản Portal
                            </h4>
                            {tenant.username ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                    Đã kích hoạt
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-muted-foreground">
                                    Chưa có
                                </Badge>
                            )}
                        </div>

                        {tenant.username ? (
                            <div className="space-y-3">
                                <div className="text-sm">
                                    <span className="text-muted-foreground mr-2">Username:</span>
                                    <span className="font-mono font-medium">{tenant.username}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-white hover:bg-white/80"
                                    onClick={() => setIsAccountDialogOpen(true)}
                                >
                                    Đặt lại mật khẩu
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Cấp tài khoản để khách truy cập ứng dụng xem hóa đơn và báo cáo sự cố.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => setIsAccountDialogOpen(true)}
                                >
                                    Cấp tài khoản ngay
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

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
                            <Phone className="h-4 w-4" /> Liên hệ
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

                <TenantAccountDialog
                    tenantId={tenant.id}
                    tenantName={tenant.name}
                    currentUsername={tenant.username}
                    open={isAccountDialogOpen}
                    onOpenChange={setIsAccountDialogOpen}
                />
            </SheetContent>
        </Sheet>
    );
}
