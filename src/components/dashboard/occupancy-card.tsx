"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Home, Users } from "lucide-react";

interface OccupancyRateCardProps {
    totalRooms: number;
    occupiedRooms: number;
}

export function OccupancyRateCard({ totalRooms, occupiedRooms }: OccupancyRateCardProps) {
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const vacantRooms = totalRooms - occupiedRooms;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ lấp đầy</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{Math.round(occupancyRate)}%</div>
                <Progress value={occupancyRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                    {occupiedRooms} phòng đang thuê / {totalRooms} tổng phòng
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">Đang thuê: {occupiedRooms}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-muted" />
                        <span className="text-xs text-muted-foreground">Trống: {vacantRooms}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
