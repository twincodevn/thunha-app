"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
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
    Trash2,
    DollarSign,
    MapPin,
    User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_CONFIG = {
    OPEN: { label: "Mới", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: AlertCircle },
    IN_PROGRESS: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800", icon: Clock },
    RESOLVED: { label: "Đã xử lý", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800", icon: CheckCircle2 },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: XCircle },
};

const PRIORITY_CONFIG = {
    LOW: { label: "Thấp", color: "text-slate-600 bg-slate-100 border-slate-200" },
    MEDIUM: { label: "T.Bình", color: "text-blue-600 bg-blue-50 border-blue-100" },
    HIGH: { label: "Cao", color: "text-orange-600 bg-orange-50 border-orange-100" },
    URGENT: { label: "Khẩn cấp", color: "text-red-600 bg-red-50 border-red-100" },
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
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed">
                <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm ring-1 ring-slate-900/5">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tất cả đều ổn!</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                    Hiện chưa có báo cáo sự cố nào cần xử lý. Tuyệt vời!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {incidents.map((incident) => {
                    const StatusIcon = STATUS_CONFIG[incident.status].icon;
                    return (
                        <Card key={incident.id} className="group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-200 dark:border-slate-800">
                            <div className={`h-1.5 w-full ${incident.priority === 'URGENT' ? 'bg-red-500' :
                                incident.priority === 'HIGH' ? 'bg-orange-500' :
                                    incident.priority === 'MEDIUM' ? 'bg-blue-500' :
                                        'bg-slate-300'
                                }`} />
                            <CardHeader className="pb-3 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={`font-medium border ${STATUS_CONFIG[incident.status].color} hover:${STATUS_CONFIG[incident.status].color} transition-colors px-2 py-0.5 rounded-full`}>
                                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                                {STATUS_CONFIG[incident.status].label}
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] font-medium border px-1.5 py-0 rounded ${PRIORITY_CONFIG[incident.priority].color}`}>
                                                {PRIORITY_CONFIG[incident.priority].label}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                                            {incident.title}
                                        </CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 data-[state=open]:bg-slate-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
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
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
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

                            <CardContent className="pb-3 flex-1 space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {incident.property.name}
                                        </span>
                                        {incident.roomTenant && (
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                P.{incident.roomTenant.room.roomNumber}
                                            </span>
                                        )}
                                    </div>
                                    {incident.roomTenant && (
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                                            <User className="h-3.5 w-3.5" />
                                            {incident.roomTenant.tenant.name}
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                                    {incident.description}
                                </p>

                                {incident.images.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                                        {incident.images.slice(0, 3).map((img, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 snap-start shadow-sm group/img cursor-pointer transition-transform hover:scale-105">
                                                <img src={img} alt="Incident" className="w-full h-full object-cover" />
                                                {i === 2 && incident.images.length > 3 && (
                                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-xs text-white font-bold backdrop-blur-[1px]">
                                                        +{incident.images.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-3 pb-3 border-t bg-slate-50/50 dark:bg-slate-900/20 text-xs text-slate-500 flex justify-between items-center">
                                <div className="flex items-center gap-1.5" title={new Date(incident.createdAt).toLocaleString('vi-VN')}>
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: vi })}
                                </div>
                                {incident.cost && (
                                    <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-900/30">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        {incident.cost.toLocaleString("vi-VN")} ₫
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Status Update Dialog */}
            <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cập nhật trạng thái</AlertDialogTitle>
                        <AlertDialogDescription>
                            Chuyển trạng thái sự cố sang <span className="font-bold text-foreground">{newStatus === "IN_PROGRESS" ? "Đang xử lý" : "Đã giải quyết"}</span>.
                            {newStatus === "RESOLVED" && " Vui lòng nhập chi phí sửa chữa (nếu có) để hệ thống ghi nhận vào báo cáo tài chính."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {newStatus === "RESOLVED" && (
                        <div className="py-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chi phí sửa chữa (VNĐ)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="pl-9 font-mono"
                                    value={repairCost}
                                    onChange={(e) => setRepairCost(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedIncident(null)}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateStatus} className="bg-blue-600 hover:bg-blue-700">Xác nhận</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-md border-red-100 dark:border-red-900/30">
                    <AlertDialogHeader>
                        <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <AlertDialogTitle className="text-center text-red-600 dark:text-red-400">Xác nhận xóa báo cáo?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Hành động này không thể hoàn tác. Dữ liệu báo cáo và hình ảnh liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center gap-2">
                        <AlertDialogCancel onClick={() => setSelectedIncident(null)} className="w-full sm:w-auto">Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600">Xác nhận xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
