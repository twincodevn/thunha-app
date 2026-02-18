"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    FileText,
    Wrench,
    User,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PortalLogo } from "@/components/tenant/portal-logo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { User as PrismaUser } from "@prisma/client";

const navigation = [
    { name: "Tổng quan", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Hóa đơn", href: "/portal/bills", icon: FileText },
    { name: "Sự cố", href: "/portal/incidents", icon: Wrench },
    { name: "Tài khoản", href: "/portal/profile", icon: User },
];

const bottomNavigation = [
    { name: "Cài đặt", href: "/portal/settings", icon: Settings },
];

interface SidebarProps {
    user?: PrismaUser | null;
}

export function TenantSidebar({ user }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Top Mobile Bar - Only visible on Mobile */}
            <div className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl lg:hidden">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <PortalLogo showText={false} className="scale-75 origin-left" />
                    <span className="text-slate-900 ml-2">ThuNhà Portal</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "peer fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[70px]" : "w-64",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <Link href="/portal/dashboard" className="flex items-center gap-2 font-bold text-xl group pl-2">
                            <PortalLogo showText={false} className="scale-75 origin-left" />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Portal</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="flex h-8 w-8 items-center justify-center">
                            <PortalLogo showText={false} className="scale-100" />
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex shrink-0 ml-auto"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <SidebarContent
                        user={user}
                        isCollapsed={isCollapsed}
                        onClose={() => setIsMobileOpen(false)}
                    />
                </div>
            </aside>
        </>
    );
}

interface SidebarContentProps {
    user?: PrismaUser | null;
    isCollapsed?: boolean;
    onClose?: () => void;
}

function SidebarContent({ user, isCollapsed = false, onClose }: SidebarContentProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Prioritize passed user data (fresh from DB) over session data
    const displayUser = user || session?.user;

    // Helper to render links
    const renderLinks = (items: typeof navigation) => (
        <nav className="space-y-1 px-2">
            <TooltipProvider delayDuration={0}>
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                            <item.icon className={cn("shrink-0 transition-transform group-hover:scale-110", isCollapsed ? "h-5 w-5" : "h-5 w-5")} />
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
            {/* Main Nav */}
            <div className="flex-1 py-4 space-y-6">
                {renderLinks(navigation)}

                <div className="my-2">
                    <Separator />
                    {!isCollapsed && <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Khác</p>}
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
                                <span className="text-sm font-medium truncate">{displayUser?.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{displayUser?.email}</span>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut({ callbackUrl: "/portal/login" })}
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
