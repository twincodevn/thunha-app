import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, Clock, CheckCircle2, AlertTriangle, AlertCircle, ChevronRight, ImageIcon, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
                    containerClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
                    accentClass: "bg-blue-500"
                };
            case "IN_PROGRESS":
                return {
                    label: "Đang xử lý",
                    icon: Wrench,
                    containerClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
                    accentClass: "bg-amber-500"
                };
            case "RESOLVED":
                return {
                    label: "Đã hoàn thành",
                    icon: CheckCircle2,
                    containerClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
                    accentClass: "bg-emerald-500"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: AlertTriangle,
                    containerClass: "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
                    accentClass: "bg-slate-400"
                };
            default:
                return {
                    label: status,
                    icon: AlertCircle,
                    containerClass: "bg-slate-50 dark:bg-zinc-800 text-slate-500",
                    accentClass: "bg-slate-300"
                };
        }
    };

    const activeCount = incidents.filter(i => i.status === "OPEN" || i.status === "IN_PROGRESS").length;

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section with floating action button */}
            <div className="flex items-end justify-between px-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sự cố</h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        {activeCount > 0
                            ? `Bạn đang có ${activeCount} yêu cầu đang được xử lý`
                            : 'Mọi thứ trong phòng đang hoạt động tốt'}
                    </p>
                </div>

                <Link
                    href="/portal/incidents/new"
                    className="h-12 w-12 bg-indigo-600 text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                    <Plus className="h-6 w-6" />
                </Link>
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
                {incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-24 w-24 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 border border-slate-200 dark:border-zinc-800">
                            <Wrench className="h-10 w-10 text-slate-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Không có sự cố</h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-[240px]">
                            Nếu có bất cứ thiết bị nào hỏng hóc, hãy báo cho BQL ngay nhé.
                        </p>
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
                            <Link
                                href={`/portal/incidents/${incident.id}`}
                                key={incident.id}
                                className="block group active:scale-[0.98] transition-transform"
                            >
                                <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-zinc-800 transition-all duration-300 relative overflow-hidden flex flex-col">
                                    {/* Accent Line */}
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.accentClass)}></div>

                                    <div className="p-5 pl-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 border", status.containerClass)}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(incident.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {incident.title}
                                        </h3>
                                        <p className="text-[13px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                            {incident.description}
                                        </p>
                                    </div>

                                    {/* Images Preview Strip */}
                                    {images.length > 0 && (
                                        <div className="px-5 pb-4 pl-6 flex gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                                            {images.map((img, idx) => {
                                                if (idx > 2) return null; // Only show up to 3 images inline
                                                return (
                                                    <div key={idx} className="relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={img}
                                                            alt="Evidence"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                );
                                            })}
                                            {images.length > 3 && (
                                                <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-300">
                                                    +{images.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Info */}
                                    <div className="mt-auto bg-slate-50 dark:bg-zinc-950/50 p-4 pl-6 flex justify-between items-center group-hover:bg-slate-100 dark:group-hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center gap-2">
                                            {images.length === 0 ? (
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                                    <Camera className="h-3.5 w-3.5" /> Không có hình ảnh
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                                                    <ImageIcon className="h-3.5 w-3.5" /> {images.length} hình ảnh đính kèm
                                                </span>
                                            )}
                                        </div>

                                        {incident.cost && incident.cost > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-slate-400 font-bold uppercase">Chi phí</span>
                                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(incident.cost)}
                                                </span>
                                            </div>
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
                                        )}
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
