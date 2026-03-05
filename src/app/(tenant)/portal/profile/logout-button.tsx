"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/portal/login" })}
            className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] border border-red-100 dark:border-red-500/20 shadow-sm p-4 flex items-center justify-center gap-2.5 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300"
        >
            <LogOut className="h-4.5 w-4.5" />
            Đăng xuất
        </button>
    );
}
