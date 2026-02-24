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
    Zap,
    GitCompareArrows,
    FileText,
    PiggyBank,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { User } from "@prisma/client";

const navigation = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tòa nhà", href: "/dashboard/properties", icon: Home },
    { name: "Khách thuê", href: "/dashboard/tenants", icon: Users },
    { name: "Điện nước", href: "/dashboard/utilities", icon: Zap },
    { name: "Hóa đơn", href: "/dashboard/billing", icon: Receipt },
    { name: "Tiền cọc", href: "/dashboard/billing/deposits", icon: PiggyBank },
    { name: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Phân tích", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "So sánh", href: "/dashboard/analytics/comparison", icon: GitCompareArrows },
    { name: "Báo cáo thuế", href: "/dashboard/analytics/tax-report", icon: FileText },
    { name: "Dự báo AI", href: "/dashboard/analytics/forecast", icon: BarChart3 },
];

const bottomNavigation = [
    { name: "Nhân viên", href: "/dashboard/settings/team", icon: Users },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
    { name: "Gói dịch vụ", href: "/dashboard/subscription", icon: Zap },
];

// 5 main tabs for mobile bottom nav
const mobileBottomTabs = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tòa nhà", href: "/dashboard/properties", icon: Home },
    { name: "Khách thuê", href: "/dashboard/tenants", icon: Users },
    { name: "Hóa đơn", href: "/dashboard/billing", icon: Receipt },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
    user?: User | null;
}

export function Sidebar({ user }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {/* Desktop Sidebar only */}
            <aside
                className={cn(
                    "peer fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r bg-background/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[70px]" : "w-64"
                )}
            >
                <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl group">
                            <BrandLogo variant="gradient" className="h-8 w-8 transition-transform group-hover:scale-110 duration-500" />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ThuNhà</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="flex h-8 w-8 items-center justify-center">
                            <BrandLogo variant="gradient" className="h-8 w-8" />
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="shrink-0"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <SidebarContent
                        user={user}
                        isCollapsed={isCollapsed}
                    />
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
        </>
    );
}

interface SidebarContentProps {
    user?: User | null;
    isCollapsed?: boolean;
    onClose?: () => void;
}

function SidebarContent({ user, isCollapsed = false, onClose }: SidebarContentProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const displayUser = user || session?.user;

    const renderLinks = (items: typeof navigation) => (
        <nav className="space-y-1 px-2">
            <TooltipProvider delayDuration={0}>
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    const LinkComponent = (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
                            )}
                            <item.icon className="shrink-0 h-5 w-5 transition-transform group-hover:scale-110" />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );

                    if (isCollapsed) {
                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>{LinkComponent}</TooltipTrigger>
                                <TooltipContent side="right">{item.name}</TooltipContent>
                            </Tooltip>
                        );
                    }

                    return LinkComponent;
                })}
            </TooltipProvider>
        </nav>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 py-4 space-y-6">
                {renderLinks(navigation)}

                <div className="my-2">
                    <Separator />
                    {!isCollapsed && <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cài đặt</p>}
                </div>

                {renderLinks(bottomNavigation)}
            </div>

            {/* User Profile */}
            <div className="border-t bg-background/50 p-3 backdrop-blur-xl">
                <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="h-9 w-9 border cursor-pointer transition-transform hover:scale-105">
                            <AvatarImage src={(displayUser as any)?.avatar || (displayUser as any)?.image || ""} />
                            <AvatarFallback>{displayUser?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex flex-col truncate">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{displayUser?.name}</span>
                                    {(displayUser as any)?.plan && (
                                        <span className={cn(
                                            "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold leading-none uppercase shrink-0",
                                            (displayUser as any).plan === "FREE" ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" :
                                                (displayUser as any).plan === "BASIC" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                                                    (displayUser as any).plan === "PRO" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                                                        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                        )}>
                                            {(displayUser as any).plan}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground truncate">{displayUser?.email}</span>
                                {(displayUser as any)?.plan === "FREE" && (
                                    <Link href="/dashboard/subscription" className="text-[10px] text-orange-500 hover:text-orange-600 font-medium mt-0.5">
                                        ✨ Nâng cấp gói Pro
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut()}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-xl border-t safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-1">
                {mobileBottomTabs.map((tab) => {
                    const isActive =
                        tab.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] px-2 py-1 rounded-xl transition-all duration-200 touch-manipulation",
                                isActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                                isActive && "bg-blue-100 dark:bg-blue-900/40"
                            )}>
                                <tab.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium leading-none",
                                isActive ? "font-semibold" : ""
                            )}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
