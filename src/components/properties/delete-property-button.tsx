"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface DeletePropertyButtonProps {
    propertyId: string;
    propertyName: string;
}

export function DeletePropertyButton({ propertyId, propertyName }: DeletePropertyButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleDelete() {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Không thể xóa tòa nhà");
            }

            toast.success("Đã xóa tòa nhà thành công");
            router.push("/dashboard/properties");
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
            title="Xác nhận xóa tòa nhà"
            description={`Bạn có chắc muốn xóa "${propertyName}"? Tất cả phòng, khách thuê và hóa đơn liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.`}
            confirmText="Xóa tòa nhà"
            variant="destructive"
            onConfirm={handleDelete}
        />
    );
}
