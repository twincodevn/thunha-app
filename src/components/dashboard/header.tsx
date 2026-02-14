"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { MobileNav } from "./sidebar";
import { Fragment } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu } from "@/components/dashboard/command-menu";
import {
    PlusCircle, FileText, AlertTriangle, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getBreadcrumbName = (segment: string) => {
    switch (segment) {
        case "dashboard":
            return "Tổng quan";
        case "properties":
            return "Tòa nhà";
        case "tenants":
            return "Khách thuê";
        case "billing":
            return "Hóa đơn";
        case "analytics":
            return "Phân tích";
        case "settings":
            return "Cài đặt";
        case "new":
            return "Thêm mới";
        default:
            // Check if segment is a UUID (approximate check)
            if (segment.length > 20 && segment.includes("-")) {
                return "Chi tiết";
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
};

export function Header() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <MobileNav />

            <div className="flex-1 flex items-center">
                <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-foreground transition-colors"
                    >
                        <Home className="h-4 w-4 mr-2" />
                    </Link>

                    {segments.map((segment, index) => {
                        // Skip 'dashboard' in the list to avoid duplication with Home icon if preferred
                        // or customize behavior. Here we map it but display text.
                        if (segment === "dashboard" && index === 0) return null;

                        const path = `/${segments.slice(0, index + 1).join("/")}`;
                        const isLast = index === segments.length - 1;
                        const name = getBreadcrumbName(segment);

                        return (
                            <Fragment key={path}>
                                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                                {isLast ? (
                                    <span className="text-foreground font-semibold">
                                        {name}
                                    </span>
                                ) : (
                                    <Link
                                        href={path}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {name}
                                    </Link>
                                )}
                            </Fragment>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-2">
                <CommandMenu />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden lg:inline">Thao tác nhanh</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/billing/new">
                                <FileText className="mr-2 h-4 w-4" /> Tạo hóa đơn
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/incidents">
                                <AlertTriangle className="mr-2 h-4 w-4" /> Báo sự cố
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/tenants/new">
                                <UserPlus className="mr-2 h-4 w-4" /> Thêm khách thuê
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="sm:hidden">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/billing/new">
                            <PlusCircle className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}
