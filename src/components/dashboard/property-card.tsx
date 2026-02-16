"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, MoreHorizontal, Plus, Users, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/billing";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
    property: {
        id: string;
        name: string;
        address: string;
        images: string[];
        _count: {
            rooms: number;
        };
        rooms: {
            status: string;
            baseRent: number;
        }[];
    };
}

export function PropertyCard({ property }: PropertyCardProps) {
    const totalRooms = property._count.rooms;
    const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Calculate potential and actual revenue
    const totalPotentialRevenue = property.rooms.reduce((sum, room) => sum + room.baseRent, 0);
    const currentRevenue = property.rooms
        .filter((r) => r.status === "OCCUPIED")
        .reduce((sum, room) => sum + room.baseRent, 0);

    // Fallback image if no images uploaded
    const coverImage = property.images.length > 0
        ? property.images[0]
        : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop";

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-400/50">
            {/* Cover Image Section */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                    src={coverImage}
                    alt={property.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Status Badge overlay */}
                <div className="absolute top-3 right-3">
                    <Badge variant={vacantRooms === 0 ? "default" : "secondary"} className={cn(
                        "backdrop-blur-md shadow-sm",
                        vacantRooms === 0 ? "bg-green-500/90 hover:bg-green-500" : "bg-white/90 text-black hover:bg-white"
                    )}>
                        {vacantRooms === 0 ? "Đã lấp đầy" : `Còn ${vacantRooms} phòng trống`}
                    </Badge>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-lg leading-tight truncate">{property.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-white/80 mt-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{property.address}</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-4 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Doanh thu tháng</p>
                        <p className="font-semibold text-sm">{formatCurrency(currentRevenue)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tỷ lệ lấp đầy</p>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{Math.round(occupancyRate)}%</span>
                            <Progress value={occupancyRate} className="h-2 w-12" />
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-3 bg-muted/20 flex items-center justify-between border-t gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <Link href={`/dashboard/properties/${property.id}`}>
                        Chi tiết
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/properties/${property.id}/rooms/new`}>
                                <Plus className="mr-2 h-4 w-4" /> Thêm phòng
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/properties/${property.id}/settings`}>
                                <Zap className="mr-2 h-4 w-4" /> Cấu hình điện nước
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}
