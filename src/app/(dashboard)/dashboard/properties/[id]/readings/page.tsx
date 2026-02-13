import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MeterBatchForm } from "@/components/properties/meter-batch-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function getPropertyWithRooms(id: string, userId: string) {
    return prisma.property.findFirst({
        where: { id, userId },
        include: {
            rooms: {
                orderBy: { roomNumber: "asc" },
                select: {
                    id: true,
                    roomNumber: true,
                },
            },
        },
    });
}

export default async function MeterReadingsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;
    const property = await getPropertyWithRooms(id, session.user.id);

    if (!property) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/properties/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ghi chỉ số điện nước</h1>
                    <p className="text-muted-foreground">
                        {property.name} - {property.rooms.length} phòng
                    </p>
                </div>
            </div>

            <MeterBatchForm
                propertyId={property.id}
                rooms={property.rooms}
            />
        </div>
    );
}
