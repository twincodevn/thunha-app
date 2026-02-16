"use client";

import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Sparkles } from "lucide-react";

export function WelcomeHero() {
    const { data: session } = useSession();
    const today = new Date();
    const hour = today.getHours();

    let greeting = "Xin chào";
    if (hour < 12) greeting = "Chào buổi sáng";
    else if (hour < 18) greeting = "Chào buổi chiều";
    else greeting = "Chào buổi tối";

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-100 opacity-80 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">
                        Tổng quan quản lý
                    </span>
                </div>
                <h1 className="text-3xl font-bold md:text-4xl">
                    {greeting}, {session?.user?.name || "Bạn"}! 👋
                </h1>
                <p className="mt-2 text-lg text-blue-100 max-w-xl">
                    Hôm nay là {format(today, "EEEE, 'ngày' d 'tháng' M 'năm' yyyy", { locale: vi })}.
                    Chúc bạn một ngày làm việc hiệu quả.
                </p>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/20 blur-2xl" />
        </div>
    );
}
