
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, Circle } from "lucide-react";

export default async function TenantIncidentsPage() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const incidents = await prisma.incident.findMany({
        where: {
            // Link to tenant via roomTenant if possible, otherwise we might need to query by roomTenantId
            roomTenant: {
                tenantId: session.user.id,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Mới tiếp nhận</Badge>;
            case "IN_PROGRESS":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Đang xử lý</Badge>;
            case "RESOLVED":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Đã hoàn thành</Badge>;
            case "CANCELLED":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/portal/dashboard" className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Sự cố / Sửa chữa</h1>
                </div>
                <Link href="/portal/incidents/new">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1 rounded-full px-4">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Báo mới</span>
                    </Button>
                </Link>
            </div>

            {/* Incidents List */}
            <div className="space-y-3">
                {incidents.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Bạn chưa có yêu cầu sửa chữa nào</p>
                        <Link href="/portal/incidents/new" className="mt-4 inline-block">
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Báo sự cố mới
                            </Button>
                        </Link>
                    </div>
                ) : (
                    incidents.map((incident) => {
                        let images: string[] = [];
                        try {
                            images = incident.images ? JSON.parse(incident.images) : [];
                        } catch (e) {
                            images = [];
                        }

                        return (
                            <Card key={incident.id} className="hover:bg-gray-50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{incident.title}</h3>
                                        {getStatusBadge(incident.status)}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                        {incident.description}
                                    </p>

                                    {images.length > 0 && (
                                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                            {images.map((img, idx) => (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt="Evidence"
                                                    className="h-16 w-16 object-cover rounded-md border bg-gray-100"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{formatDate(incident.createdAt)}</span>
                                        {incident.cost ? (
                                            <span className="font-medium text-gray-600">
                                                Chi phí: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(incident.cost)}
                                            </span>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
