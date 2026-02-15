"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Clock, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { RoomStatus } from "@prisma/client";
import { updateRoomStatus } from "@/app/(dashboard)/dashboard/properties/[id]/rooms/[roomId]/status-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface RoomStatusToggleProps {
    roomId: string;
    currentStatus: RoomStatus;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    VACANT: { label: "Trống", color: "bg-gray-100 text-gray-800 hover:bg-gray-200", icon: CheckCircle2 },
    OCCUPIED: { label: "Đang thuê", color: "bg-green-100 text-green-800 hover:bg-green-200", icon: UsersIcon },
    MAINTENANCE: { label: "Bảo trì", color: "bg-orange-100 text-orange-800 hover:bg-orange-200", icon: Wrench },
    COMING_SOON: { label: "Sắp trống", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", icon: Clock },
};

function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

export function RoomStatusToggle({ roomId, currentStatus }: RoomStatusToggleProps) {
    const [status, setStatus] = useState<RoomStatus>(currentStatus);
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: RoomStatus) => {
        if (newStatus === status) return;
        setLoading(true);
        try {
            await updateRoomStatus(roomId, newStatus);
            setStatus(newStatus);
            toast.success("Cập nhật trạng thái thành công!");
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        } finally {
            setLoading(false);
        }
    };

    const CurrentIcon = statusConfig[status]?.icon || CheckCircle2;
    const config = statusConfig[status] || statusConfig.VACANT;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`h-8 gap-2 ${config.color} border-0`}>
                    <CurrentIcon className="h-4 w-4" />
                    {config.label}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.keys(statusConfig).map((key) => {
                    const s = key as RoomStatus;
                    const itemConf = statusConfig[key];
                    const Icon = itemConf.icon;
                    return (
                        <DropdownMenuItem
                            key={key}
                            onClick={() => handleStatusChange(s)}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{itemConf.label}</span>
                            {status === s && <CheckCircle2 className="ml-auto h-4 w-4 text-teal-600" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
