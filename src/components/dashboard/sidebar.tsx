"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    Building2,
    LayoutDashboard,
    Home,
    Users,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Zap,
    GitCompareArrows,
    FileText,
    PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tòa nhà", href: "/dashboard/properties", icon: Home },
    { name: "Khách thuê", href: "/dashboard/tenants", icon: Users },
    { name: "Điện nước", href: "/dashboard/utilities", icon: Zap },
    { name: "Hóa đơn", href: "/dashboard/billing", icon: Receipt },
    { name: "Tiền cọc", href: "/dashboard/billing/deposits", icon: PiggyBank },
    { name: "Phân tích", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "So sánh", href: "/dashboard/analytics/comparison", icon: GitCompareArrows },
    { name: "Báo cáo thuế", href: "/dashboard/analytics/tax-report", icon: FileText },
];

const bottomNavigation = [
    { name: "Nhân viên", href: "/dashboard/settings/team", icon: Users },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
    { name: "Gói dịch vụ", href: "/dashboard/subscription", icon: Zap },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
    const pathname = usePathname();

    return (
        <>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <Separator />
            <div className="px-3 py-4 space-y-1">
                {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
    const { data: session } = useSession();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-4 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ThuNhà
                </span>
            </div>

            {/* Navigation */}
            <NavLinks onClick={onClose} />

            {/* Upgrade banner - Only allow upgrade if not Business */}
            {session?.user?.plan !== "BUSINESS" && (
                <div className="mx-3 mb-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                    <div className="flex items-center gap-2 font-medium">
                        <Zap className="h-4 w-4" />
                        Nâng cấp Pro
                    </div>
                    <p className="mt-1 text-xs text-blue-100">
                        Mở khóa tính năng VNPay & báo cáo
                    </p>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3 w-full bg-white text-blue-600 hover:bg-blue-50"
                        asChild
                    >
                        <Link href="/dashboard/subscription">Xem các gói</Link>
                    </Button>
                </div>
            )}

            {/* User */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                        <Badge variant="secondary" className="text-xs">
                            {session?.user?.plan || "FREE"}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title="Đăng xuất"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-background">
            <SidebarContent />
        </aside>
    );
}

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onClose={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

// Header component moved to ./header.tsx
