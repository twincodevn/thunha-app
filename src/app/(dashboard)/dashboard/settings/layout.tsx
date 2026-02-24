
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, CreditCard, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
    {
        title: "Hồ sơ",
        href: "/dashboard/settings/profile",
        icon: User,
    },
    {
        title: "Bảo mật",
        href: "/dashboard/settings/security",
        icon: Shield,
    },
    {
        title: "Thanh toán",
        href: "/dashboard/settings/billing",
        icon: CreditCard,
    },
    {
        title: "Zalo OA",
        href: "/dashboard/settings/zalo",
        icon: MessageSquare,
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Cài đặt</h2>
                <p className="text-muted-foreground text-sm">
                    Quản lý thông tin tài khoản và tùy chọn của bạn.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                {/* Mobile: horizontally scrollable tab bar */}
                <aside className="lg:w-1/5">
                    <nav className="flex overflow-x-auto lg:flex-col lg:overflow-x-visible gap-1 pb-2 lg:pb-0 lg:space-y-1 [&::-webkit-scrollbar]:hidden">
                        {sidebarNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    pathname === item.href
                                        ? "bg-muted hover:bg-muted"
                                        : "hover:bg-transparent hover:underline",
                                    "justify-start shrink-0 lg:shrink"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>
                {/* min-w-0 prevents flex child from overflowing */}
                <div className="flex-1 min-w-0 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}
