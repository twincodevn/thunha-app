"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, CalendarDays, AlertCircle } from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { vi } from "date-fns/locale";

interface ExpiringContractsProps {
    contracts: any[];
}

export function ExpiringContracts({ contracts }: ExpiringContractsProps) {
    if (!contracts || contracts.length === 0) return null;

    return (
        <Card className="border-orange-100 dark:border-orange-950 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <CardHeader className="pb-3 border-b bg-orange-50/30 dark:bg-orange-950/20">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Hợp đồng sắp hết hạn
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Khách thuê có hợp đồng kết thúc trong 30 ngày tới
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {contracts.map((contract) => {
                        const daysLeft = differenceInDays(new Date(contract.endDate), new Date());
                        const isExpired = daysLeft < 0;

                        return (
                            <div key={contract.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {isExpired ? <AlertCircle className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-slate-900 leading-tight">
                                                Phòng {contract.room.roomNumber}
                                            </h4>
                                            <Badge variant="outline" className={`${isExpired ? 'border-red-200 text-red-700 bg-red-50' : 'border-orange-200 text-orange-700 bg-orange-50'} text-[10px] px-1.5 py-0`}>
                                                {isExpired ? 'Đã hết hạn' : `Còn ${daysLeft} ngày`}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm font-medium text-slate-700">{contract.tenant.name}</p>
                                            <p className="text-xs text-slate-500">{contract.room.property.name}</p>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                            Hạn: {format(new Date(contract.endDate), "dd/MM/yyyy")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    <Button variant="default" size="sm" className="w-full sm:w-auto text-xs" asChild>
                                        <Link href={`/dashboard/tenants/${contract.tenantId}/renew`}>
                                            Gia hạn ngay
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-900" asChild>
                                        <Link href={`/dashboard/tenants/${contract.tenantId}`}>
                                            Chi tiết khách
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
