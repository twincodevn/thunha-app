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
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-background/80 px-6 backdrop-blur-xl border-b transition-all">
            <div className="flex-1 flex items-center">
                <nav className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                    >
                        <Home className="h-4 w-4" />
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

            <div className="flex items-center gap-3">
                <div className="hidden md:flex relative group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="w-64">
                        <CommandMenu />
                    </div>
                </div>

                <div className="h-6 w-px bg-border mx-1" />

                <NotificationCenter />
                <ThemeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="hidden sm:flex gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-md">
                            <PlusCircle className="h-4 w-4" />
                            Tạo mới
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Thêm khách thuê
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm phòng
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Tạo hóa đơn
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Báo cáo sự cố
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
