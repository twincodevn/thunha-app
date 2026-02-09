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

async function getProperty(id: string, userId: string) {
    return prisma.property.findFirst({
        where: { id, userId },
    });
}

async function updateProperty(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) return;

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const electricityRate = parseFloat(formData.get("electricityRate") as string) || 0;
    const waterRate = parseFloat(formData.get("waterRate") as string) || 0;
    const notes = formData.get("notes") as string;

    await prisma.property.update({
        where: { id, userId: session.user.id },
        data: { name, address, city, electricityRate, waterRate, notes },
    });

    revalidatePath(`/dashboard/properties/${id}`);
    redirect(`/dashboard/properties/${id}`);
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
                    <form action={updateProperty} className="space-y-4">
                        <input type="hidden" name="id" value={property.id} />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên tòa nhà *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={property.name}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Thành phố</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    defaultValue={property.city || ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ *</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={property.address}
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="electricityRate">Giá điện (đ/kWh)</Label>
                                <Input
                                    id="electricityRate"
                                    name="electricityRate"
                                    type="number"
                                    defaultValue={property.electricityRate}
                                />
                                <p className="text-xs text-muted-foreground">Để 0 để dùng giá bậc thang EVN</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waterRate">Giá nước (đ/m³)</Label>
                                <Input
                                    id="waterRate"
                                    name="waterRate"
                                    type="number"
                                    defaultValue={property.waterRate}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={property.notes || ""}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit">Lưu thay đổi</Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/dashboard/properties/${id}`}>Hủy</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
