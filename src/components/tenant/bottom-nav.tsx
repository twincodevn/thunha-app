"use client";

import { Home, FileText, Wrench, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TenantBottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around text-xs text-gray-500 z-50">
            <Link
                href="/portal/dashboard"
                className={cn(
                    "flex flex-col items-center p-2 min-w-[64px]",
                    isActive("/portal/dashboard") ? "text-blue-600 font-medium" : "hover:text-gray-900"
                )}
            >
                <Home className="h-6 w-6 mb-1" />
                <span>Trang chủ</span>
            </Link>
            <Link
                href="/portal/bills"
                className={cn(
                    "flex flex-col items-center p-2 min-w-[64px]",
                    isActive("/portal/bills") ? "text-blue-600 font-medium" : "hover:text-gray-900"
                )}
            >
                <FileText className="h-6 w-6 mb-1" />
                <span>Hóa đơn</span>
            </Link>
            <Link
                href="/portal/incidents"
                className={cn(
                    "flex flex-col items-center p-2 min-w-[64px]",
                    isActive("/portal/incidents") ? "text-blue-600 font-medium" : "hover:text-gray-900"
                )}
            >
                <Wrench className="h-6 w-6 mb-1" />
                <span>Sự cố</span>
            </Link>
            {/* Placeholder for Profile - likely will be added later or just logout */}
            <div className="flex flex-col items-center p-2 min-w-[64px] opacity-50 cursor-not-allowed">
                <User className="h-6 w-6 mb-1" />
                <span>Tài khoản</span>
            </div>
        </div>
    );
}
