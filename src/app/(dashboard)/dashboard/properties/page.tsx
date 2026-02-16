import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { PropertyCard } from "@/components/dashboard/property-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tòa nhà",
    description: "Quản lý tòa nhà và phòng cho thuê",
};

export default async function PropertiesPage() {
    const session = await auth();
    if (!session?.user) return null;

    const properties = await prisma.property.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            _count: {
                select: {
                    rooms: true,
                },
            },
            rooms: {
                select: {
                    status: true,
                    baseRent: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <DashboardShell>
            <PageHeader
                title="Quản lý tòa nhà"
                description="Quản lý danh sách tòa nhà, phòng trọ và cấu hình dịch vụ."
            >
                <Button asChild>
                    <Link href="/dashboard/properties/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm tòa nhà
                    </Link>
                </Button>
            </PageHeader>

            {properties.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="Chưa có tòa nhà nào"
                    description="Bắt đầu bằng việc thêm tòa nhà đầu tiên của bạn để quản lý phòng và khách thuê."
                    actionLabel="Thêm tòa nhà ngay"
                    actionHref="/dashboard/properties/new"
                />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}
