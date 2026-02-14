"use client";

import * as React from "react";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    LayoutDashboard,
    Building2,
    Users,
    Receipt,
    BarChart3,
    Plus,
    Moon,
    Sun,
    Laptop,
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Calculator className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Tìm kiếm...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Nhập lệnh hoặc tìm kiếm..." />
                <CommandList>
                    <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                    <CommandGroup heading="Đi tới">
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Tổng quan</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/properties"))}>
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>Tòa nhà</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/tenants"))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Khách thuê</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/billing"))}>
                            <Receipt className="mr-2 h-4 w-4" />
                            <span>Hóa đơn</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Phân tích</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Hành động nhanh">
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/properties/new"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Thêm tòa nhà</span>
                            <CommandShortcut>⌘P</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/tenants/new"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Thêm khách thuê</span>
                            <CommandShortcut>⌘T</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/billing/generate"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Tạo hóa đơn mới</span>
                            <CommandShortcut>⌘B</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Giao diện">
                        <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Sáng</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Tối</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>Hệ thống</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
