import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FileSignature, CheckCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ContractsListPage() {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const contracts = await prisma.contract.findMany({
        where: {
            roomTenant: { tenantId: session.user.id },
        },
        include: {
            roomTenant: {
                include: {
                    room: { include: { property: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-2 pt-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Hợp đồng <span className="text-3xl">📋</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                    Danh sách hợp đồng thuê phòng
                </p>
            </div>

            {contracts.length === 0 ? (
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm p-12 text-center">
                    <FileSignature className="h-12 w-12 text-slate-300 dark:text-zinc-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Chưa có hợp đồng nào</p>
                    <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Hợp đồng sẽ hiển thị khi chủ nhà tạo cho bạn</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contracts.map((contract) => {
                        const isSigned = contract.status === "SIGNED";
                        const room = contract.roomTenant?.room;
                        const property = room?.property;

                        return (
                            <Link
                                key={contract.id}
                                href={`/portal/contracts/${contract.id}`}
                                className="block"
                            >
                                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                                isSigned
                                                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                                                    : "bg-amber-50 dark:bg-amber-500/10"
                                            )}>
                                                <FileSignature className={cn(
                                                    "h-5 w-5",
                                                    isSigned
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-amber-600 dark:text-amber-400"
                                                )} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                    {property?.name || "Nhà trọ"} — Phòng {room?.roomNumber || "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                                    {format(contract.createdAt, "dd/MM/yyyy", { locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isSigned ? (
                                                <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                                    <CheckCircle className="h-3 w-3" /> Đã ký
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                                    <Clock className="h-3 w-3" /> Chờ ký
                                                </div>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
