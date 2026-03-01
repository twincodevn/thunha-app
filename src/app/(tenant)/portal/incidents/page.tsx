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
                    containerClass: "bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/30",
                    accentClass: "bg-blue-500 shadow-blue-500/50"
                };
            case "IN_PROGRESS":
                return {
                    label: "Đang xử lý",
                    icon: Wrench,
                    containerClass: "bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/30",
                    accentClass: "bg-amber-500 shadow-amber-500/50"
                };
            case "RESOLVED":
                return {
                    label: "Đã xong",
                    icon: CheckCircle2,
                    containerClass: "bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/30",
                    accentClass: "bg-emerald-500 shadow-emerald-500/50"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: AlertTriangle,
                    containerClass: "bg-slate-50/50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-500 border-slate-200/50 dark:border-zinc-700/50",
                    accentClass: "bg-slate-400 shadow-slate-400/50"
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
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header section with floating action button */}
            <div className="flex items-end justify-between px-2 pt-2 relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Sự cố <span className="text-3xl">🛠️</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-[240px]">
                        {activeCount > 0
                            ? <span className="text-indigo-600 dark:text-indigo-400">Bạn đang có <strong>{activeCount}</strong> yêu cầu đang được xử lý.</span>
                            : 'Mọi thứ trong phòng đang hoạt động tốt.'}
                    </p>
                </div>

                <Link
                    href="/portal/incidents/new"
                    className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(79,70,229,0.5)] hover:shadow-[0_16px_24px_-8px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:scale-90 transition-all duration-300 border border-indigo-400/20"
                >
                    <Plus className="h-7 w-7" strokeWidth={2.5} />
                </Link>
            </div>

            {/* Incidents List */}
            <div className="space-y-4 relative z-10">
                {incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-[32px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm mt-6">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                            <div className="relative h-20 w-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-zinc-700 shadow-md">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">Không có sự cố nào</h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-[240px] font-medium leading-relaxed">
                            Thật tuyệt vời! Nếu có bất cứ thiết bị nào hỏng hóc, hãy báo cho BQL ngay nhé.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3.5">
                        {incidents.map((incident) => {
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
                                    className="block group active:scale-[0.98] transition-transform outline-none"
                                >
                                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] shadow-sm border border-slate-200/50 dark:border-zinc-800/50 transition-all duration-300 relative overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300/50 dark:hover:border-zinc-700/50">
                                        {/* Accent Glowing Line */}
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 opacity-80", status.accentClass)}></div>

                                        <div className="p-5 pl-7 pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 border shadow-sm", status.containerClass)}>
                                                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                    {status.label}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-100/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 px-2.5 py-1.5 rounded-full shadow-sm">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(incident.createdAt)}
                                                </div>
                                            </div>

                                            <h3 className="font-black text-slate-900 dark:text-white text-[17px] mb-2 tracking-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {incident.title}
                                            </h3>
                                            <p className="text-[14px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                                                {incident.description}
                                            </p>
                                        </div>

                                        {/* Images Preview Strip */}
                                        {images.length > 0 && (
                                            <div className="px-5 pb-5 pl-7 flex gap-2.5 overflow-x-auto no-scrollbar mask-gradient-right relative z-10">
                                                {images.map((img, idx) => {
                                                    if (idx > 2) return null; // Only show up to 3 images inline
                                                    return (
                                                        <div key={idx} className="relative h-[68px] w-[68px] flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-zinc-700/50 shadow-sm bg-slate-100 dark:bg-zinc-800">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={img}
                                                                alt="Evidence"
                                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                {images.length > 3 && (
                                                    <div className="h-[68px] w-[68px] flex-shrink-0 rounded-2xl border border-slate-200/50 dark:border-zinc-700/50 bg-slate-50/80 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                                        <span className="text-[15px] font-black text-slate-500 dark:text-zinc-400">
                                                            +{images.length - 3}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer Info */}
                                        <div className="mt-auto bg-slate-50/80 dark:bg-zinc-950/50 backdrop-blur-md px-5 py-4 pl-7 flex justify-between items-center group-hover:bg-slate-100/90 dark:group-hover:bg-zinc-800/60 transition-colors border-t border-slate-100/50 dark:border-zinc-800/50 relative z-10">
                                            <div className="flex items-center gap-2">
                                                {images.length === 0 ? (
                                                    <span className="text-[12px] text-slate-400 flex items-center gap-1.5 font-bold">
                                                        <Camera className="h-4 w-4" /> Không có hình ảnh
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
                                                        <ImageIcon className="h-4 w-4 text-indigo-500" /> {images.length} hình đính kèm
                                                    </span>
                                                )}
                                            </div>

                                            {incident.cost && incident.cost > 0 ? (
                                                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                                    <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-black uppercase tracking-wider">Chi phí</span>
                                                    <span className="font-black text-indigo-700 dark:text-indigo-300 text-[13px]">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(incident.cost)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
                                            )}
                                        </div>

                                        {/* Subtle highlight effect on hover */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-zinc-800/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
