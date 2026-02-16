"use client";

import { motion } from "framer-motion";
import { DollarSign, Receipt, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/billing";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
    month: number;
    collected: number;
    pendingAmount: number;
    pendingBills: number;
    totalRooms: number;
    occupiedRooms: number;
}

export function DashboardStats({
    month,
    collected,
    pendingAmount,
    pendingBills,
    totalRooms,
    occupiedRooms,
}: DashboardStatsProps) {
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const stats = [
        {
            title: "Doanh thu tháng",
            icon: DollarSign,
            value: formatCurrency(collected),
            description: `Thực thu tháng ${month}`,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "Tiền chờ thu",
            icon: Receipt,
            value: formatCurrency(pendingAmount),
            description: `${pendingBills} hóa đơn chưa thanh toán`,
            color: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/30",
            valColor: "text-orange-600",
        },
        {
            title: "Tỷ lệ lấp đầy",
            icon: Users,
            value: `${occupancyRate}%`,
            description: `${occupiedRooms}/${totalRooms} phòng đang thuê`,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/30",
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
            {stats.map((stat, i) => (
                <motion.div key={i} variants={item}>
                    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={cn("p-2 rounded-full", stat.bg)}>
                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", stat.valColor || "text-foreground")}>
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
