"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { ThemeToggle } from "@/components/theme-toggle";

export function TenantHeader() {
    const { data: session } = useSession();
    const user = session?.user;

    const firstName = user?.name ? user.name.split(" ").slice(-1)[0] : "bạn";

    return (
        <header className="sticky top-0 z-40 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl border-b border-slate-200/40 dark:border-zinc-800/40 pt-safe transition-all w-full">
            <div className="flex h-[72px] items-center justify-between px-5">
                {/* Left: Avatar & Greeting */}
                <div className="flex items-center gap-3.5">
                    <Avatar className="h-11 w-11 shadow-sm ring-2 ring-white/50 dark:ring-zinc-800/50 drop-shadow-md">
                        <AvatarImage src={(user as any)?.avatar || (user as any)?.image || ""} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                            {user?.name?.[0] || "T"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            Chào buổi sáng,
                        </span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                            {firstName} 👋
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5">
                    <div className="bg-slate-100/50 dark:bg-zinc-900/50 rounded-full p-0.5 backdrop-blur-md">
                        <ThemeToggle />
                    </div>
                    <div className="bg-slate-100/50 dark:bg-zinc-900/50 rounded-full p-0.5 backdrop-blur-md">
                        <NotificationCenter />
                    </div>
                </div>
            </div>
        </header>
    );
}
