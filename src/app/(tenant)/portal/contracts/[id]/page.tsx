
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { SignaturePad } from "@/components/contracts/signature-pad";
import Image from "next/image";

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
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="fixed top-0 left-0 right-0 bg-white border-b z-20 px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/portal/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-sm font-bold text-slate-900">Chi tiết Hợp đồng</h1>
                    <p className="text-xs text-slate-500">{contract.roomTenant.room.property.name}</p>
                </div>
            </header>

            <main className="pt-16 px-4 max-w-2xl mx-auto space-y-6">

                {/* Status Card */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                        {isSigned ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1 pl-1 pr-2">
                                <CheckCircle className="h-3 w-3" /> Đã ký kết
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 pl-1 pr-2">
                                <Clock className="h-3 w-3" /> Chờ ký tên
                            </Badge>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Ngày ký</p>
                        <p className="text-sm font-medium">
                            {contract.signedAt ? format(contract.signedAt, "HH:mm dd/MM/yyyy", { locale: vi }) : "--/--/----"}
                        </p>
                    </div>
                </div>

                {/* Contract Content */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-base text-center uppercase text-slate-700">
                            Hợp đồng thuê phòng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">
                        {contract.content || "Nội dung hợp đồng đang được cập nhật..."}
                    </CardContent>
                </Card>

                {/* Signature Section */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                        Chữ ký bên B (Khách thuê)
                    </h3>

                    {isSigned ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                            {contract.signatureImage ? (
                                <img
                                    src={contract.signatureImage}
                                    alt="Chữ ký khách thuê"
                                    className="max-h-24 mix-blend-multiply"
                                />
                            ) : (
                                <p className="text-lg font-script text-slate-900">{contract.tenantSignature}</p>
                            )}
                            <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Đã ký xác nhận
                            </p>
                        </div>
                    ) : (
                        <SignContractClient contractId={contract.id} />
                    )}
                </div>

                {/* Landlord Signature Placeholder */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 opacity-70">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</span>
                        Chữ ký bên A (Chủ nhà)
                    </h3>
                    <div className="border border-slate-100 bg-slate-50 rounded-lg p-6 flex items-center justify-center h-32">
                        <p className="text-slate-400 text-sm italic">Đại diện chủ nhà</p>
                    </div>
                </div>

            </main>
        </div>
    );
}
