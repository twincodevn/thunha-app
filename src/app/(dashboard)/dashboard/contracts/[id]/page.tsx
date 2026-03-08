
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Home } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractToolbar } from "@/components/contracts/contract-toolbar";
import { ContractSigningSection } from "@/components/contracts/contract-signing-section";

export default async function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
            roomTenant: {
                include: {
                    tenant: true,
                    room: { include: { property: { include: { user: true } } } },
                },
            },
        },
    });

    if (!contract) {
        return (
            <div className="p-8 text-center">
                <h2>Lỗi: Không tìm thấy hợp đồng</h2>
                <p>ID: {id}</p>
            </div>
        );
    }

    const isLandlord = contract.roomTenant.room.property.userId === session.user.id;
    // const isTenant = contract.roomTenant.userId === session.user.id; 
    // Allowing landlord to access is enough for MVP. 
    // Ideally we verify if user is tenant too.

    if (!isLandlord) {
        // Simple security check. 
        // If we implement tenant login, update this to allow tenant too.
        return (
            <div className="p-8 text-center">
                <h2>Lỗi: Không có quyền truy cập</h2>
                <p>Contract Owner ID: {contract.roomTenant.room.property.userId}</p>
                <p>Your User ID: {session.user.id}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/tenants/${contract.roomTenant.tenantId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chi tiết Hợp đồng</h1>
                        <p className="text-muted-foreground text-sm">
                            {contract.roomTenant.tenant.name} - {contract.roomTenant.room.property.name} (Phòng {contract.roomTenant.room.roomNumber})
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ContractToolbar
                        contractId={contract.id}
                        fileName={`HopDong-${contract.roomTenant.tenant.name}-${contract.roomTenant.room.roomNumber}`}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Contract Content Preview */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <CardTitle>Nội dung hợp đồng</CardTitle>
                            <Badge variant={contract.status === "SIGNED" ? "default" : "secondary"}>
                                {contract.status === "SIGNED" ? "Đã ký" : "Dự thảo"}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-8 bg-white min-h-[600px]">
                            <div id="contract-content" className="font-serif">
                                <div
                                    className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-justify"
                                    dangerouslySetInnerHTML={{ __html: contract.content }}
                                />

                                <div className="grid grid-cols-2 mt-16 gap-8 pt-8">
                                    <div className="text-center">
                                        <p className="font-bold uppercase mb-4">ĐẠI DIỆN BÊN A (CHỦ NHÀ)</p>
                                        {contract.landlordSignature ? (
                                            <div className="flex justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={contract.landlordSignature}
                                                    alt="Chữ ký chủ nhà"
                                                    className="contract-signature-img h-20 object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-20 flex items-center justify-center text-muted-foreground italic">
                                                (Ký, ghi rõ họ tên)
                                            </div>
                                        )}
                                        <p className="font-bold mt-2">{contract.roomTenant.room.property.user?.name || "Chủ nhà"}</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="font-bold uppercase mb-4">ĐẠI DIỆN BÊN B (KHÁCH THUÊ)</p>
                                        {contract.tenantSignature ? (
                                            <div className="flex justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={contract.tenantSignature}
                                                    alt="Chữ ký khách thuê"
                                                    className="contract-signature-img h-20 object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-20 flex items-center justify-center text-muted-foreground italic">
                                                (Ký, ghi rõ họ tên)
                                            </div>
                                        )}
                                        <p className="font-bold mt-2">{contract.roomTenant.tenant.name}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Thời hạn</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(contract.startDate, "dd/MM/yyyy", { locale: vi })}
                                        {contract.endDate ? ` - ${format(contract.endDate, "dd/MM/yyyy", { locale: vi })}` : " (Không thời hạn)"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Khách thuê</p>
                                    <p className="text-sm text-muted-foreground">{contract.roomTenant.tenant.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Phòng</p>
                                    <p className="text-sm text-muted-foreground">
                                        P.{contract.roomTenant.room.roomNumber} - {contract.roomTenant.room.property.name}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signatures */}
                    <ContractSigningSection contract={contract} isLandlord={isLandlord} />
                </div>
            </div>
        </div>
    );
}
