"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/billing";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, FileText, AlertTriangle, PenSquare } from "lucide-react";

interface Room {
    id: string;
    roomNumber: string;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
    baseRent: number;
    area?: number;
    floor?: number;
    roomTenants: {
        id: string;
        tenant: {
            id: string;
            name: string;
        };
    }[];
}

interface RoomGridProps {
    propertyId: string;
    rooms: Room[];
}

export function RoomGrid({ propertyId, rooms }: RoomGridProps) {
    if (rooms.length === 0) return null;

    const getStatusColor = (status: Room["status"]) => {
        switch (status) {
            case "OCCUPIED": return "border-green-500/50 bg-green-50 dark:bg-green-900/10";
            case "MAINTENANCE": return "border-orange-500/50 bg-orange-50 dark:bg-orange-900/10";
            default: return "border-muted/50 bg-card";
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
                const currentTenant = room.roomTenants[0]?.tenant;
                const statusColor = getStatusColor(room.status);

                return (
                    <Card key={room.id} className={`transition-all hover:shadow-md ${statusColor}`}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                            <div>
                                <CardTitle className="text-base font-bold">
                                    <Link href={`/dashboard/properties/${propertyId}/rooms/${room.id}`} className="hover:underline">
                                        Phòng {room.roomNumber}
                                    </Link>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {room.area ? `${room.area}m²` : "N/A"} · Tầng {room.floor || "Trệt"}
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Thao tác</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/properties/${propertyId}/rooms/${room.id}`}>
                                            Xem chi tiết
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/properties/${propertyId}/rooms/${room.id}/edit`}>
                                            <PenSquare className="mr-2 h-4 w-4" /> Chỉnh sửa
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {room.status === "OCCUPIED" && currentTenant && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/billing/new?roomId=${room.id}`}>
                                                    <FileText className="mr-2 h-4 w-4" /> Tạo hóa đơn
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/incidents?roomId=${room.id}`}>
                                                    <AlertTriangle className="mr-2 h-4 w-4" /> Báo sự cố
                                                </Link>
                                            </DropdownMenuItem>
                                            <Button variant="ghost" size="sm" className="w-full justify-start text-indigo-600 dark:text-indigo-400" asChild>
                                                <Link href={`/dashboard/billing/generate?roomId=${room.id}`}>
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                    Lập hóa đơn
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                    {room.status === "VACANT" && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/tenants/new?roomId=${room.id}`}>
                                                <User className="mr-2 h-4 w-4" /> Thêm khách
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <Badge
                                    variant={
                                        room.status === "OCCUPIED"
                                            ? "default"
                                            : room.status === "VACANT"
                                                ? "outline"
                                                : "secondary"
                                    }
                                    className="text-[10px]"
                                >
                                    {ROOM_STATUS_LABELS[room.status]}
                                </Badge>
                                <span className="font-semibold text-sm">
                                    {formatCurrency(room.baseRent)}
                                </span>
                            </div>

                            {currentTenant ? (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate">{currentTenant.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 text-sm text-muted-foreground">
                                    <User className="h-4 w-4 opacity-50" />
                                    <span className="italic">Chưa có khách</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
