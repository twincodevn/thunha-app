import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, FileSignature, Edit3 } from "lucide-react";
import Link from "next/link";
import { SignaturePad } from "@/components/contracts/signature-pad";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Client component wrapper for signature logic
import { SignContractClient } from "./sign-client";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const { id } = await params;
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
            roomTenant: {
                include: {
                    room: { include: { property: true } },
                    tenant: true,
                },
            },
        },
    });

    if (!contract || contract.roomTenant.tenantId !== session.user.id) {
        notFound();
    }

    const isSigned = contract.status === "SIGNED";

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex items-end justify-between px-2 pt-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Hợp đồng <span className="text-3xl">📝</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                        Chi tiết hợp đồng thuê phòng của bạn
                    </p>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-[28px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Trạng thái</p>
                    {isSigned ? (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide shadow-sm">
                            <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} /> ĐÃ KÝ KẾT
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide shadow-sm">
                            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} /> CHỜ KÝ TÊN
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Ngày ký</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {contract.signedAt ? format(contract.signedAt, "dd/MM/yyyy", { locale: vi }) : "--/--/----"}
                    </p>
                </div>
            </div>

            {/* Contract Content */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] overflow-hidden border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
                <div className="bg-slate-50/80 dark:bg-zinc-950/50 border-b border-slate-200/50 dark:border-zinc-800/50 p-4 text-center">
                    <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 flex items-center justify-center gap-2">
                        <FileSignature className="h-4 w-4" /> Nội dung hợp đồng
                    </h2>
                </div>
                <div className="p-6 text-[14px] text-slate-700 dark:text-zinc-300 leading-relaxed font-serif whitespace-pre-wrap max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {contract.content || "Nội dung hợp đồng đang được cập nhật..."}
                </div>
            </div>

            {/* Signature Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] p-6 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm space-y-5">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 text-base">
                    <span className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[13px] font-black shadow-inner">1</span>
                    Chữ ký Bên B (Khách thuê)
                </h3>

                {isSigned ? (
                    <div className="border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <CheckCircle className="h-24 w-24 text-emerald-500" />
                        </div>
                        {contract.signatureImage ? (
                            <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-700 z-10 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={contract.signatureImage}
                                    alt="Chữ ký khách thuê"
                                    className="max-h-24 w-auto object-contain dark:invert"
                                />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-800 px-6 py-4 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-700 z-10 relative">
                                <p className="text-2xl font-script text-slate-900 dark:text-white transform -rotate-2">{contract.tenantSignature}</p>
                            </div>
                        )}
                        <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 z-10 relative mt-2 shadow-sm border border-emerald-200/50 dark:border-emerald-500/30">
                            <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} /> Đã ký xác nhận
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-1 border border-slate-200 dark:border-zinc-800 shadow-inner">
                        <SignContractClient contractId={contract.id} />
                    </div>
                )}
            </div>

            {/* Landlord Signature Placeholder */}
            {isSigned && (
                <div className="bg-slate-100/50 dark:bg-zinc-900/30 backdrop-blur-sm rounded-[28px] p-6 border border-slate-200/30 dark:border-zinc-800/30 space-y-4 opacity-70 grayscale">
                    <h3 className="font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-2.5 text-base">
                        <span className="h-7 w-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 flex items-center justify-center text-[13px] font-black">2</span>
                        Chữ ký Bên A (Chủ nhà)
                    </h3>
                    <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl flex flex-col items-center justify-center h-32 gap-2">
                        <Edit3 className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Đại diện chủ nhà</p>
                    </div>
                </div>
            )}

            <div className="h-8"></div> {/* Bottom Padding */}
        </div>
    );
}
