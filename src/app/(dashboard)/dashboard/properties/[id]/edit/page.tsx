import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceSettingsForm } from "@/components/properties/service-settings-form";
import { EditPropertyForm } from "@/components/properties/edit-property-form";

async function getProperty(id: string, userId: string) {
    return prisma.property.findFirst({
        where: { id, userId },
    });
}

export default async function EditPropertyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const property = await getProperty(id, session.user.id);

    if (!property) notFound();

    // Cast the JSON type safely
    const services = (property.services as unknown as { name: string; price: number }[]) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/properties/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa tòa nhà</h1>
                    <p className="text-muted-foreground">{property.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin tòa nhà</CardTitle>
                    <CardDescription>Cập nhật thông tin tòa nhà của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditPropertyForm property={property} />
                </CardContent>
            </Card>

            <ServiceSettingsForm propertyId={property.id} initialServices={services} />
        </div>
    );
}
