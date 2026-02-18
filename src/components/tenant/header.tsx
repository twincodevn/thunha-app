"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/dashboard/notification-center";

const getBreadcrumbName = (segment: string) => {
    switch (segment) {
        case "portal":
            return "Cổng Cư Dân";
        case "dashboard":
            return "Tổng quan";
        case "bills":
            return "Hóa đơn";
        case "incidents":
            return "Sự cố";
        case "settings":
            return "Cài đặt";
        case "profile":
            return "Tài khoản";
        case "new":
            return "Thêm mới";
        default:
            if (segment.length > 20 && segment.includes("-")) {
                return "Chi tiết";
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
};

export function TenantHeader() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-background/80 px-6 backdrop-blur-xl border-b transition-all hidden lg:flex">
            <div className="flex-1 flex items-center">
                <nav className="flex items-center text-sm font-medium text-muted-foreground">
                    <Link
                        href="/portal/dashboard"
                        className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                    >
                        <Home className="h-4 w-4" />
                    </Link>

                    {segments.map((segment, index) => {
                        // Skip 'portal' and 'dashboard' to avoid redundancy if needed, but let's show them for clarity or filter 'portal'
                        if (segment === "portal") return null;

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
                <div className="h-6 w-px bg-border mx-1" />
                <NotificationCenter />
                <ThemeToggle />
            </div>
        </header>
    );
}
