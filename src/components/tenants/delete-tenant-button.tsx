"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface DeleteTenantButtonProps {
    tenantId: string;
    tenantName: string;
}

export function DeleteTenantButton({ tenantId, tenantName }: DeleteTenantButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleDelete() {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Không thể xóa khách thuê");
            }

            toast.success("Đã xóa khách thuê thành công");
            router.push("/dashboard/tenants");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ConfirmDialog
            trigger={
                <Button variant="destructive" size="sm" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Xóa
                </Button>
            }
            title="Xác nhận xóa khách thuê"
            description={`Bạn có chắc muốn xóa "${tenantName}"? Lịch sử thuê phòng và hóa đơn liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.`}
            confirmText="Xóa khách thuê"
            variant="destructive"
            onConfirm={handleDelete}
        />
    );
}
