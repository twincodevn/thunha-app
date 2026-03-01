"use client";

import { Home, FileText, Wrench, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
    { name: "Tổng quan", href: "/portal/dashboard", icon: Home },
    { name: "Hóa đơn", href: "/portal/bills", icon: FileText },
    { name: "Sự cố", href: "/portal/incidents", icon: Wrench },
    { name: "Tài khoản", href: "/portal/profile", icon: User },
];

export function TenantBottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe pointer-events-none flex justify-center">
            <nav className="relative flex items-center justify-between pointer-events-auto bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-slate-200/50 dark:border-zinc-800/50 rounded-[32px] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] px-2 py-2 w-full max-w-[360px]">
                {/* Optional subtle glow behind the bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-[32px] opacity-50 blur-xl -z-10" />

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/portal/dashboard");

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active-pill"
                                    className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/10 rounded-[20px]"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}

                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="relative z-10 flex flex-col items-center justify-center"
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 mb-1 transition-all duration-300",
                                        isActive
                                            ? "text-indigo-600 dark:text-indigo-400 drop-shadow-sm scale-110"
                                            : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold transition-all duration-300",
                                        isActive
                                            ? "text-indigo-700 dark:text-indigo-300 opacity-100 translate-y-0"
                                            : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 opacity-80"
                                    )}
                                >
                                    {item.name}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
