import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { revalidatePath } from "next/cache";

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

async function updateRoom(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) return;

    const roomId = formData.get("roomId") as string;
    const propertyId = formData.get("propertyId") as string;
    const roomNumber = formData.get("roomNumber") as string;
    const floor = parseInt(formData.get("floor") as string) || 1;
    const area = parseFloat(formData.get("area") as string) || null;
    const baseRent = parseFloat(formData.get("baseRent") as string) || 0;
    const deposit = parseFloat(formData.get("deposit") as string) || null;
    const notes = formData.get("notes") as string;

    await prisma.room.update({
        where: { id: roomId, property: { userId: session.user.id } },
        data: { roomNumber, floor, area, baseRent, deposit, notes: notes || null },
    });

    revalidatePath(`/dashboard/properties/${propertyId}/rooms/${roomId}`);
    redirect(`/dashboard/properties/${propertyId}/rooms/${roomId}`);
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
                    <CardDescription>Cập nhật thông tin phòng</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateRoom} className="space-y-4">
                        <input type="hidden" name="roomId" value={room.id} />
                        <input type="hidden" name="propertyId" value={room.propertyId} />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="roomNumber">Số phòng *</Label>
                                <Input
                                    id="roomNumber"
                                    name="roomNumber"
                                    defaultValue={room.roomNumber}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="floor">Tầng *</Label>
                                <Input
                                    id="floor"
                                    name="floor"
                                    type="number"
                                    min={1}
                                    defaultValue={room.floor}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="area">Diện tích (m²)</Label>
                                <Input
                                    id="area"
                                    name="area"
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    defaultValue={room.area || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baseRent">Giá thuê (đ/tháng) *</Label>
                                <Input
                                    id="baseRent"
                                    name="baseRent"
                                    type="number"
                                    min={0}
                                    defaultValue={room.baseRent}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit">Tiền cọc (đ)</Label>
                            <Input
                                id="deposit"
                                name="deposit"
                                type="number"
                                min={0}
                                defaultValue={room.deposit || ""}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={room.notes || ""}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Lưu thay đổi</Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/dashboard/properties/${id}/rooms/${roomId}`}>Hủy</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
