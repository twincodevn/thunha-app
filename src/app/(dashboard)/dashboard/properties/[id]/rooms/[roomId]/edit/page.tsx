import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditRoomForm } from "@/components/properties/edit-room-form";

async function getRoom(propertyId: string, roomId: string, userId: string) {
    return prisma.room.findFirst({
        where: {
            id: roomId,
            propertyId,
            property: { userId },
        },
        include: { property: true },
    });
}

export default async function EditRoomPage({
    params,
}: {
    params: Promise<{ id: string; roomId: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id, roomId } = await params;
    const room = await getRoom(id, roomId, session.user.id);

    if (!room) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/properties/${id}/rooms/${roomId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa phòng</h1>
                    <p className="text-muted-foreground">
                        {room.property.name} - Phòng {room.roomNumber}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin phòng</CardTitle>
                    <CardDescription>Cập nhật thông tin và hình ảnh phòng</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditRoomForm propertyId={id} room={room} />
                </CardContent>
            </Card>
        </div>
    );
}
