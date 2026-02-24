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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe lg:hidden pointer-events-none">
            <nav className="mx-auto max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 px-2 py-2 flex items-center justify-between pointer-events-auto relative overflow-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/") && item.href !== "/portal/dashboard";

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active"
                                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <item.icon
                                className={cn(
                                    "h-5 w-5 mb-1.5 relative z-10 transition-colors duration-200",
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium relative z-10 transition-colors duration-200",
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
