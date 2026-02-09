"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateTenant } from "@/app/actions/tenant-actions";

interface Tenant {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    idNumber: string | null;
    dateOfBirth: Date | null;
    notes: string | null;
}

interface EditTenantFormProps {
    tenant: Tenant;
}

export function EditTenantForm({ tenant }: EditTenantFormProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await updateTenant(formData);
            if (result && result.error) {
                toast.error(result.error);
            }
            // Success redirects automatically via server action
        } catch (_error) {
            toast.error("Đã xảy ra lỗi khi cập nhật");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={tenant.id} />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={tenant.name}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                        id="phone"
                        name="phone"
                        defaultValue={tenant.phone}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={tenant.email || ""}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="idNumber">CCCD/CMND</Label>
                    <Input
                        id="idNumber"
                        name="idNumber"
                        defaultValue={tenant.idNumber || ""}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={
                        tenant.dateOfBirth
                            ? new Date(tenant.dateOfBirth).toISOString().split("T")[0]
                            : ""
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={tenant.notes || ""}
                    rows={3}
                />
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu thay đổi
                </Button>
                <Button type="button" variant="outline" asChild>
                    <Link href={`/dashboard/tenants/${tenant.id}`}>Hủy</Link>
                </Button>
            </div>
        </form>
    );
}
