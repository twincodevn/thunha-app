"use client";

import { useState } from "react";
import { Plus, Trash2, Package, Check, X, Camera, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { createAsset, applyAssetTemplate, deleteAsset, updateAsset, AssetStatus } from "@/app/actions/asset-actions";
import { formatCurrency } from "@/lib/billing";

interface Asset {
    id: string;
    name: string;
    code: string | null;
    status: AssetStatus;
    value: number | null;
    notes: string | null;
    images: string[];
}

interface AssetManagerProps {
    roomId: string;
    initialAssets: Asset[];
}

const STATUS_LABELS: Record<AssetStatus, string> = {
    GOOD: "Tốt",
    REPAIR: "Cần sửa",
    BROKEN: "Hỏng",
    LOST: "Mất",
};

const STATUS_VARIANTS: Record<AssetStatus, "default" | "secondary" | "destructive" | "outline"> = {
    GOOD: "default",
    REPAIR: "secondary",
    BROKEN: "destructive",
    LOST: "outline",
};

export function AssetManager({ roomId, initialAssets }: AssetManagerProps) {
    const [assets, setAssets] = useState<Asset[]>(initialAssets);
    const [isAdding, setIsAdding] = useState(false);
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleEditAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        if (!editingAsset) return;

        const result = await updateAsset(editingAsset.id, {
            name: formData.get("name"),
            code: formData.get("code"),
            value: parseFloat(formData.get("value") as string) || 0,
            status: formData.get("status"),
            notes: formData.get("notes"),
        });

        setIsLoading(false);

        if (result.success) {
            toast.success("Đã cập nhật tài sản");
            setEditingAsset(null);
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    };

    const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("roomId", roomId);

        const result = await createAsset(formData);
        setIsLoading(false);

        if (result.success) {
            toast.success("Đã thêm tài sản");
            setIsAdding(false);
            window.location.reload(); // Simple sync for now as it's a server action
        } else {
            toast.error(result.error);
        }
    };

    const handleApplyTemplate = async (type: "BASIC" | "FULL") => {
        setIsLoading(true);
        const result = await applyAssetTemplate(roomId, type);
        setIsLoading(false);

        if (result.success) {
            toast.success("Đã áp dụng mẫu nội thất");
            setIsApplyingTemplate(false);
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa tài sản này?")) return;

        setIsLoading(true);
        const result = await deleteAsset(id);
        setIsLoading(false);

        if (result.success) {
            toast.success("Đã xóa tài sản");
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    };

    const handleStatusChange = async (id: string, status: AssetStatus) => {
        const result = await updateAsset(id, { status });
        if (result.success) {
            toast.success("Đã cập nhật trạng thái");
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Danh mục tài sản & Nội thất
                    </CardTitle>
                    <CardDescription>Quản lý trang thiết bị trong phòng</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isApplyingTemplate} onOpenChange={setIsApplyingTemplate}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Áp dụng mẫu
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Chọn mẫu nội thất</DialogTitle>
                                <DialogDescription>
                                    Thêm nhanh danh sách tài sản tiêu chuẩn cho phòng này.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Button
                                    variant="outline"
                                    className="justify-start h-auto py-4"
                                    onClick={() => handleApplyTemplate("BASIC")}
                                    disabled={isLoading}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-lg">Gói Cơ Bản</div>
                                        <div className="text-xs text-muted-foreground">Giường, Nệm, Tủ quần áo, Quạt</div>
                                    </div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start h-auto py-4"
                                    onClick={() => handleApplyTemplate("FULL")}
                                    disabled={isLoading}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-lg">Gói Đầy Đủ</div>
                                        <div className="text-xs text-muted-foreground">Máy lạnh, Tủ lạnh, Máy giặt, Giường, Tủ, Bàn làm việc</div>
                                    </div>
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm tài sản
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleAddAsset}>
                                <DialogHeader>
                                    <DialogTitle>Thêm tài sản mới</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Tên tài sản (VD: Máy lạnh Daikin)</Label>
                                        <Input id="name" name="name" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Mã/Seri (Không bắt buộc)</Label>
                                            <Input id="code" name="code" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="value">Giá trị ước tính</Label>
                                            <Input id="value" name="value" type="number" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Trạng thái hiện tại</Label>
                                        <Select name="status" defaultValue="GOOD">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GOOD">Tốt</SelectItem>
                                                <SelectItem value="REPAIR">Cần sửa chữa</SelectItem>
                                                <SelectItem value="BROKEN">Hỏng</SelectItem>
                                                <SelectItem value="LOST">Mất</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="images">Ảnh chụp hiện trạng</Label>
                                        <Input id="images" name="images" type="file" multiple accept="image/*" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Ghi chú</Label>
                                        <Textarea id="notes" name="notes" placeholder="VD: Mới mua tháng 1/2024" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Đang xử lý..." : "Lưu tài sản"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
                        <DialogContent>
                            <form onSubmit={handleEditAsset}>
                                <DialogHeader>
                                    <DialogTitle>Chỉnh sửa tài sản</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name">Tên tài sản</Label>
                                        <Input id="edit-name" name="name" defaultValue={editingAsset?.name} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-code">Mã/Seri</Label>
                                            <Input id="edit-code" name="code" defaultValue={editingAsset?.code || ""} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-value">Giá trị</Label>
                                            <Input id="edit-value" name="value" type="number" defaultValue={editingAsset?.value || 0} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-status">Trạng thái</Label>
                                        <Select name="status" defaultValue={editingAsset?.status}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GOOD">Tốt</SelectItem>
                                                <SelectItem value="REPAIR">Cần sửa chữa</SelectItem>
                                                <SelectItem value="BROKEN">Hỏng</SelectItem>
                                                <SelectItem value="LOST">Mất</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-notes">Ghi chú</Label>
                                        <Textarea id="edit-notes" name="notes" defaultValue={editingAsset?.notes || ""} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {assets.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-lg border-2 border-dashed">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <p className="text-muted-foreground">Chưa có tài sản nào được ghi nhận</p>
                        <p className="text-xs text-muted-foreground mt-1">Sử dụng mẫu nội thất để thêm nhanh</p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3">Tên tài sản</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Giá trị</th>
                                    <th className="px-4 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <div>
                                                {asset.name}
                                                {asset.code && (
                                                    <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                        {asset.code}
                                                    </span>
                                                )}
                                            </div>
                                            {asset.notes && (
                                                <p className="text-[11px] text-muted-foreground italic font-normal">
                                                    {asset.notes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Select
                                                defaultValue={asset.status}
                                                onValueChange={(val) => handleStatusChange(asset.id, val as AssetStatus)}
                                            >
                                                <SelectTrigger className="h-7 w-[100px] text-xs">
                                                    <Badge variant={STATUS_VARIANTS[asset.status]} className="h-5 px-1.5">
                                                        {STATUS_LABELS[asset.status]}
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GOOD">Tốt</SelectItem>
                                                    <SelectItem value="REPAIR">Cần sửa</SelectItem>
                                                    <SelectItem value="BROKEN">Hỏng</SelectItem>
                                                    <SelectItem value="LOST">Mất</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs">
                                            {asset.value ? formatCurrency(asset.value) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {asset.images.length > 0 && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Camera className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive"
                                                    onClick={() => handleDelete(asset.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
