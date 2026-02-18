
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, Clock, CheckCircle2, AlertTriangle, AlertCircle, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TenantIncidentsPage() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const incidents = await prisma.incident.findMany({
        where: {
            roomTenant: {
                tenantId: session.user.id,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "OPEN":
                return {
                    label: "Mới tiếp nhận",
                    icon: AlertCircle,
                    className: "bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10",
                    borderClass: "border-blue-500"
                };
            case "IN_PROGRESS":
                return {
                    label: "Đang xử lý",
                    icon: Wrench,
                    className: "bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10",
                    borderClass: "border-amber-500"
                };
            case "RESOLVED":
                return {
                    label: "Đã hoàn thành",
                    icon: CheckCircle2,
                    className: "bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10",
                    borderClass: "border-emerald-500"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: AlertTriangle,
                    className: "bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10",
                    borderClass: "border-slate-500"
                };
            default:
                return {
                    label: status,
                    icon: AlertCircle,
                    className: "bg-slate-50 text-slate-700",
                    borderClass: "border-slate-300"
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* Incidents List */}
            <div className="p-4 space-y-4">
                {incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Wrench className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-semibold mb-1">Chưa có sự cố nào</h3>
                        <p className="text-slate-500 text-sm max-w-[200px] mb-6">
                            Nếu gặp vấn đề trong phòng, hãy báo ngay cho chúng tôi biết.
                        </p>
                        <Link href="/portal/incidents/new">
                            <Button className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm font-medium">
                                <Plus className="h-4 w-4 mr-2" />
                                Báo sự cố mới
                            </Button>
                        </Link>
                    </div>
                ) : (
                    incidents.map((incident) => {
                        const status = getStatusConfig(incident.status);
                        const StatusIcon = status.icon;

                        let images: string[] = [];
                        try {
                            images = incident.images ? JSON.parse(incident.images) : [];
                        } catch (e) {
                            images = [];
                        }

                        return (
                            <Card key={incident.id} className="group bg-white overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl relative">
                                <Link href="#" className="absolute inset-0 z-10"></Link>

                                {/* Status Strip */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.borderClass)}></div>

                                <CardContent className="p-0">
                                    <div className="p-5 pb-3 pl-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className={cn("pl-1.5 pr-2 py-0.5 gap-1 font-semibold border ring-1 text-[10px] uppercase tracking-wide", status.className)}>
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(incident.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {incident.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                            {incident.description}
                                        </p>
                                    </div>

                                    {/* Images Preview */}
                                    {images.length > 0 && (
                                        <div className="px-5 pb-4 pl-6 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img}
                                                        alt="Evidence"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                            {images.length > 3 && (
                                                <div className="h-16 w-16 flex-shrink-0 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-500">
                                                    +{images.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Info */}
                                    {(incident.cost || images.length === 0) && (
                                        <div className="mx-5 mb-4 pl-1 pt-3 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {images.length === 0 && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                        <ImageIcon className="h-3 w-3" /> Không có ảnh
                                                    </span>
                                                )}
                                            </div>
                                            {incident.cost ? (
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-2">Chi phí</span>
                                                    <span className="font-bold text-indigo-600 text-sm">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(incident.cost)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Chưa có chi phí</span>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
