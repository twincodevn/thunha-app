"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function MarketplaceHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="flex h-16 items-center px-4 md:px-8 max-w-[1920px] mx-auto justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-teal-600">
                    <span className="text-2xl">🏠</span>
                    <span>ThuNhà</span>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/login">
                        <Button variant="ghost" className="font-medium">
                            Đăng nhập
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6">
                            Đăng tin mới <span className="ml-1 hidden sm:inline">✨</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
