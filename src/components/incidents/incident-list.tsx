"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { updateIncidentStatus, deleteIncident } from "@/app/actions/incident-actions";
import { toast } from "sonner";
import {
    MoreHorizontal,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    Trash2,
    DollarSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_CONFIG = {
    OPEN: { label: "Mới", color: "bg-blue-500", icon: AlertCircle },
    IN_PROGRESS: { label: "Đang xử lý", color: "bg-yellow-500", icon: Clock },
    RESOLVED: { label: "Đã xử lý", color: "bg-green-500", icon: CheckCircle2 },
    CANCELLED: { label: "Đã hủy", color: "bg-gray-500", icon: XCircle },
};

const PRIORITY_CONFIG = {
    LOW: { label: "Thấp", variant: "outline" },
    MEDIUM: { label: "T.Bình", variant: "secondary" },
    HIGH: { label: "Cao", variant: "destructive" },
    URGENT: { label: "Khẩn cấp", variant: "destructive" },
};

interface IncidentWithDetails {
    id: string;
    title: string;
    description: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    images: string[];
    cost: number | null;
    createdAt: Date;
    property: { name: string };
    roomTenant?: {
        room: { roomNumber: string };
        tenant: { name: string };
    } | null;
}

interface Props {
    incidents: IncidentWithDetails[];
}

export function IncidentList({ incidents }: Props) {
    const [selectedIncident, setSelectedIncident] = useState<IncidentWithDetails | null>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<IncidentWithDetails["status"] | "">("");
    const [repairCost, setRepairCost] = useState<string>("");

    const handleUpdateStatus = async () => {
        if (!selectedIncident || !newStatus) return;

        const costValue = repairCost ? parseFloat(repairCost) : undefined;

        try {
            const result = await updateIncidentStatus(selectedIncident.id, newStatus as any, costValue);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã cập nhật trạng thái sự cố");
                setIsStatusDialogOpen(false);
                setSelectedIncident(null);
                setNewStatus("");
                setRepairCost("");
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };

    const handleDelete = async () => {
        if (!selectedIncident) return;

        try {
            const result = await deleteIncident(selectedIncident.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã xóa sự cố");
                setIsDeleteDialogOpen(false);
                setSelectedIncident(null);
            }
        } catch (error) {
            toast.error("Lỗi khi xóa sự cố");
        }
    };

    if (incidents.length === 0) {
        return (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Tất cả đều ổn!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Hiện chưa có báo cáo sự cố nào cho các tòa nhà của bạn.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {incidents.map((incident) => {
                    const StatusIcon = STATUS_CONFIG[incident.status].icon;
                    return (
                        <Card key={incident.id} className="overflow-hidden flex flex-col">
                            <CardHeader className="pb-3 border-b bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge
                                            className={`${STATUS_CONFIG[incident.status].color} hover:${STATUS_CONFIG[incident.status].color} text-white mb-1`}
                                        >
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {STATUS_CONFIG[incident.status].label}
                                        </Badge>
                                        <CardTitle className="text-base line-clamp-1">{incident.title}</CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedIncident(incident);
                                                setNewStatus("IN_PROGRESS");
                                                setIsStatusDialogOpen(true);
                                            }}>
                                                <Clock className="h-4 w-4 mr-2" /> Đang xử lý
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedIncident(incident);
                                                setNewStatus("RESOLVED");
                                                setIsStatusDialogOpen(true);
                                            }}>
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Đã giải quyết
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => {
                                                    setSelectedIncident(incident);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Xóa báo cáo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 flex-1">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant={PRIORITY_CONFIG[incident.priority].variant as any}>
                                            {PRIORITY_CONFIG[incident.priority].label}
                                        </Badge>
                                        <span>·</span>
                                        <span>{incident.property.name}</span>
                                        {incident.roomTenant && (
                                            <>
                                                <span>·</span>
                                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                                    {incident.roomTenant.tenant.name}
                                                </span>
                                                <span>·</span>
                                                <span className="font-medium text-foreground">
                                                    P.{incident.roomTenant.room.roomNumber}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-sm line-clamp-2 text-muted-foreground">
                                        {incident.description}
                                    </p>

                                    {incident.images.length > 0 && (
                                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                            {incident.images.slice(0, 3).map((img, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded border overflow-hidden shrink-0">
                                                    <img src={img} alt="Incident" className="w-full h-full object-cover" />
                                                    {i === 2 && incident.images.length > 3 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-medium">
                                                            +{incident.images.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-2 flex items-center justify-between border-t mt-4 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: vi })}
                                        </div>
                                        {incident.cost && (
                                            <div className="flex items-center gap-1 text-green-600 font-medium">
                                                <DollarSign className="h-3 w-3" />
                                                {incident.cost.toLocaleString("vi-VN")} ₫
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Status Update Dialog */}
            <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cập nhật trạng thái sự cố</AlertDialogTitle>
                        <AlertDialogDescription>
                            Chuyển trạng thái sự cố sang **{newStatus && STATUS_CONFIG[newStatus].label}**.
                            {newStatus === "RESOLVED" && " Bạn có thể nhập chi phí sửa chữa để theo dõi."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {newStatus === "RESOLVED" && (
                        <div className="py-2 space-y-2">
                            <label className="text-sm font-medium">Chi phí sửa chữa (₫)</label>
                            <Input
                                type="number"
                                placeholder="Ví dụ: 200000"
                                value={repairCost}
                                onChange={(e) => setRepairCost(e.target.value)}
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedIncident(null)}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateStatus}>Xác nhận</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa báo cáo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Dữ liệu báo cáo sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedIncident(null)}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xác nhận xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
