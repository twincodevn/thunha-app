"use client";

import { Home, FileText, Wrench, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TenantBottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed lg:absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t pb-safe pt-2 px-6 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <Link
                href="/portal/dashboard"
                className={cn(
                    "flex flex-col items-center gap-1 w-16 group",
                    isActive("/portal/dashboard") ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                )}
            >
                <div className={cn("h-0.5 w-8 rounded-full mb-1 transition-colors", isActive("/portal/dashboard") ? "bg-indigo-600" : "bg-transparent")}></div>
                <Home className={cn("h-6 w-6 transition-transform group-active:scale-95", isActive("/portal/dashboard") && "fill-current")} />
                <span className={cn("text-[10px] font-medium transition-colors", isActive("/portal/dashboard") && "font-bold")}>Trang chủ</span>
            </Link>
            <Link
                href="/portal/bills"
                className={cn(
                    "flex flex-col items-center gap-1 w-16 group",
                    isActive("/portal/bills") ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                )}
            >
                <div className={cn("h-0.5 w-8 rounded-full mb-1 transition-colors", isActive("/portal/bills") ? "bg-indigo-600" : "bg-transparent")}></div>
                <FileText className="h-6 w-6 transition-transform group-active:scale-95" />
                <span className={cn("text-[10px] font-medium transition-colors", isActive("/portal/bills") && "font-bold")}>Hóa đơn</span>
            </Link>
            <Link
                href="/portal/incidents"
                className={cn(
                    "flex flex-col items-center gap-1 w-16 group",
                    isActive("/portal/incidents") ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                )}
            >
                <div className={cn("h-0.5 w-8 rounded-full mb-1 transition-colors", isActive("/portal/incidents") ? "bg-indigo-600" : "bg-transparent")}></div>
                <Wrench className="h-6 w-6 transition-transform group-active:scale-95" />
                <span className={cn("text-[10px] font-medium transition-colors", isActive("/portal/incidents") && "font-bold")}>Sự cố</span>
            </Link>
            <Link
                href="/portal/profile"
                className={cn(
                    "flex flex-col items-center gap-1 w-16 group",
                    isActive("/portal/profile") ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                )}
            >
                <div className={cn("h-0.5 w-8 rounded-full mb-1 transition-colors", isActive("/portal/profile") ? "bg-indigo-600" : "bg-transparent")}></div>
                <User className="h-6 w-6 transition-transform group-active:scale-95" />
                <span className={cn("text-[10px] font-medium transition-colors", isActive("/portal/profile") && "font-bold")}>Tài khoản</span>
            </Link>
        </div>
    );
}
