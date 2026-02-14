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
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/50">
                <CardTitle className="text-sm font-medium">Tỷ lệ lấp đầy</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold">{Math.round(occupancyRate)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hiệu suất khai thác
                        </p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${occupancyRate >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : occupancyRate >= 50 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        <Users className="h-6 w-6" />
                    </div>
                </div>

                <Progress value={occupancyRate} className="h-2 mb-4" />

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{occupiedRooms}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Đang thuê</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{vacantRooms}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Còn trống</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
