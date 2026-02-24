"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, Search } from "lucide-react";
import { Fragment } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu } from "@/components/dashboard/command-menu";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import {
    PlusCircle, FileText, AlertTriangle, UserPlus, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "@/components/ui/brand-logo";

const PAGE_NAMES: Record<string, string> = {
    dashboard: "Tổng quan",
    properties: "Tòa nhà",
    tenants: "Khách thuê",
    billing: "Hóa đơn",
    analytics: "Phân tích",
    settings: "Cài đặt",
    utilities: "Điện nước",
    reports: "Báo cáo",
    deposits: "Tiền cọc",
    subscription: "Gói dịch vụ",
    incidents: "Sự cố",
    notifications: "Thông báo",
    new: "Thêm mới",
    comparison: "So sánh",
    forecast: "Dự báo",
};

const getBreadcrumbName = (segment: string) => {
    if (PAGE_NAMES[segment]) return PAGE_NAMES[segment];
    if (segment.length > 20 && segment.includes("-")) return "Chi tiết";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
};

const getMobilePageTitle = (pathname: string): string => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 1 && segments[0] === "dashboard") return "Tổng quan";
    const last = segments[segments.length - 1];
    return getBreadcrumbName(last);
};

export function Header() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");
    const mobileTitle = getMobilePageTitle(pathname);

    const openSearch = () => {
        const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
        document.dispatchEvent(event);
    };

    return (
        <>
            <header className="sticky top-0 z-40 flex h-14 lg:h-16 items-center gap-3 bg-background/90 px-4 lg:px-6 backdrop-blur-xl border-b transition-all">

                {/* Mobile: Logo + Page Title */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Link href="/dashboard" className="flex items-center gap-1.5">
                        <BrandLogo variant="gradient" className="h-7 w-7" />
                    </Link>
                    <span className="font-semibold text-base text-foreground">{mobileTitle}</span>
                </div>

                {/* Desktop: Breadcrumb */}
                <div className="hidden lg:flex flex-1 items-center">
                    <nav className="flex items-center text-sm font-medium text-muted-foreground">
                        <Link
                            href="/dashboard"
                            className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                        >
                            <Home className="h-4 w-4" />
                        </Link>

                        {segments.map((segment, index) => {
                            if (segment === "dashboard" && index === 0) return null;

                            const path = `/${segments.slice(0, index + 1).join("/")}`;
                            const isLast = index === segments.length - 1;
                            const name = getBreadcrumbName(segment);

                            return (
                                <Fragment key={path}>
                                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                                    {isLast ? (
                                        <span className="text-foreground font-semibold px-2 py-1 rounded-md bg-muted/50">
                                            {name}
                                        </span>
                                    ) : (
                                        <Link
                                            href={path}
                                            className="hover:text-foreground transition-colors hover:bg-muted px-2 py-1 rounded-md"
                                        >
                                            {name}
                                        </Link>
                                    )}
                                </Fragment>
                            );
                        })}
                    </nav>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                    {/* Desktop search */}
                    <div className="hidden lg:flex relative group">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="w-64">
                            <CommandMenu />
                        </div>
                    </div>

                    {/* Mobile search icon */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-9 w-9 touch-manipulation"
                        onClick={openSearch}
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    <div className="h-5 w-px bg-border mx-0.5 hidden lg:block" />

                    <NotificationCenter />
                    <ThemeToggle />

                    {/* Desktop: Create button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="hidden lg:flex gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md">
                                <PlusCircle className="h-4 w-4" />
                                Tạo mới
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/tenants/new">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Thêm khách thuê
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/properties/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm tòa nhà
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/billing/new">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Tạo hóa đơn
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/incidents/new">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Báo cáo sự cố
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </>
    );
}
