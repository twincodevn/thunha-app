"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { ThemeToggle } from "@/components/theme-toggle";

export function TenantHeader() {
    const { data: session } = useSession();
    const user = session?.user;

    // Lấy first name để chào hỏi cho thân thiện
    const firstName = user?.name ? user.name.split(" ").slice(-1)[0] : "bạn";

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50 pt-safe transition-all w-full">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8 max-w-5xl mx-auto">
                {/* Left: Avatar & Greeting */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-800 shadow-sm">
                        <AvatarImage src={(user as any)?.avatar || (user as any)?.image || ""} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold">
                            {user?.name?.[0] || "T"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Chào buổi sáng,</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {firstName} 👋
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <NotificationCenter />
                </div>
            </div>
        </header>
    );
}
