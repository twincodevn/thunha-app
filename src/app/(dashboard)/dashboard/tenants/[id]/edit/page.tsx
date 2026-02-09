import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditTenantForm } from "@/components/tenants/edit-tenant-form";

async function getTenant(id: string, userId: string) {
    return prisma.tenant.findFirst({
        where: { id, userId },
    });
}

export default async function EditTenantPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const tenant = await getTenant(id, session.user.id);

    if (!tenant) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/tenants/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa khách thuê</h1>
                    <p className="text-muted-foreground">{tenant.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin khách thuê</CardTitle>
                    <CardDescription>Cập nhật thông tin khách thuê</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditTenantForm tenant={tenant} />
                </CardContent>
            </Card>
        </div>
    );
}
